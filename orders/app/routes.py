"""Основные маршруты."""

from flask import Blueprint, request, jsonify, current_app, Response
from decimal import Decimal
from .models import db, UserOrders
from datetime import datetime
import requests
from .utils import add_to_cart, remove_from_cart, get_cart, clear_cart, get_cart_total, decrement_from_cart, get_redis_connection, get_cart_key, update_cart_ttl
import json

bp = Blueprint('orders', __name__)


@bp.route('/cart', methods=['POST'])
def add_to_cart_route():
    """Добавить товар в корзину или увеличить количество на 1 если уже есть."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400

        product_id = data.get('product_id')

        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400

        # Получаем информацию о продукте из main сервиса
        response = requests.get(f'{current_app.config.get("MAIN_SERVICE_URI")}/get_product/{product_id}')

        if response.status_code == 404:
            return jsonify({'error': 'Product does not exist'}), 404

        if response.status_code == 200:
            product_info = response.json()['product']

            # Добавляем в корзину (увеличиваем количество если уже есть)
            result = add_to_cart(product_id, product_info)

            if result == 'added':
                return jsonify({'success': 'Product added to cart'}), 200
            else:
                return jsonify({'success': 'Product quantity increased in cart'}), 200

    except Exception as e:
        current_app.logger.error(f"Unexpected error in add_to_cart_route: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/cart/<int:product_id>', methods=['DELETE'])
def remove_from_cart_route(product_id):
    """Удалить товар из корзины (полностью)."""
    try:
        if remove_from_cart(product_id):
            return jsonify({'success': 'Product removed from cart'}), 200
        else:
            return jsonify({'error': 'Product not found in cart'}), 404

    except Exception as e:
        current_app.logger.error(f"Unexpected error in remove_from_cart_route: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/cart/<int:product_id>/decrement', methods=['POST'])
def decrement_from_cart_route(product_id):
    """Уменьшить количество товара в корзине на 1 или удалить если количество станет 0."""
    try:
        result = decrement_from_cart(product_id)

        if result == 'not_found':
            return jsonify({'error': 'Product not found in cart'}), 404
        elif result == 'decremented':
            return jsonify({'success': 'Product quantity decreased in cart'}), 200
        elif result == 'removed':
            return jsonify({'success': 'Product removed from cart (quantity was 1)'}), 200
        else:
            return jsonify({'error': 'Unexpected result'}), 500

    except Exception as e:
        current_app.logger.error(f"Unexpected error in decrement_from_cart_route: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/cart', methods=['GET'])
def get_cart_route():
    """Получить содержимое корзины."""
    try:
        cart_items = get_cart()
        total = get_cart_total()

        return jsonify({
            'cart': cart_items,
            'total': total,
            'count': len(cart_items)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Unexpected error in get_cart_route: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/cart', methods=['DELETE'])
def clear_cart_route():
    """Очистить корзину."""
    try:
        clear_cart()
        return jsonify({'success': 'Cart cleared'}), 200

    except Exception as e:
        current_app.logger.error(f"Unexpected error in clear_cart_route: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/cart/<int:product_id>/toggle_addition', methods=['POST'])
def toggle_addition_route(product_id):
    """Переключить состояние дополнения для товара в корзине."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400

        addition_name = data.get('addition_name')
        if not addition_name:
            return jsonify({'error': 'Addition name is required'}), 400

        redis_conn = get_redis_connection()
        cart_key = get_cart_key()

        # Получаем товар из корзины
        existing_item_json = redis_conn.hget(cart_key, product_id)
        if not existing_item_json:
            return jsonify({'error': 'Product not found in cart'}), 404

        existing_item = json.loads(existing_item_json)
        product_info = existing_item.get('product_info', {})

        # Получаем текущие дополнения из продукта
        additions = product_info.get('additions', {})

        # Если additions это список - преобразуем в словарь
        if isinstance(additions, list):
            additions_dict = {addition: False for addition in additions}
            product_info['additions'] = additions_dict
            additions = additions_dict

        # Проверяем, существует ли такое дополнение
        if addition_name not in additions:
            return jsonify({'error': f'Addition "{addition_name}" not available for this product'}), 400

        # Переключаем состояние дополнения
        current_state = additions.get(addition_name, False)
        additions[addition_name] = not current_state

        # Обновляем информацию о продукте в корзине
        product_info['additions'] = additions
        existing_item['product_info'] = product_info

        # Сохраняем обратно в Redis
        redis_conn.hset(cart_key, product_id, json.dumps(existing_item))

        # Обновляем TTL
        update_cart_ttl(cart_key)

        return jsonify({
            'success': f'Addition "{addition_name}" toggled',
            'addition_name': addition_name,
            'new_state': not current_state,
            'product_id': product_id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Unexpected error in toggle_addition_route: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/make_order', methods=['POST'])
def make_order():
    """Создание нового заказа на основе корзины пользователя."""
    try:
        # Получаем корзину из сессии
        cart_items = get_cart()

        # Проверяем, что корзина не пуста
        if not cart_items:
            return jsonify({'error': 'Cart is empty'}), 400

        # Получаем общую сумму корзины
        total = Decimal(str(get_cart_total()))

        # Получаем данные адреса из JSON
        data = request.get_json() or {}
        address = data.get('address')

        # Проверка обязательного поля адреса
        if not address:
            return jsonify({'error': 'Missing address'}), 400

        if not isinstance(address, dict):
            return jsonify({'error': 'Invalid address'}), 400

        # Преобразуем корзину в формат positions с полной информацией
        positions = []
        for item in cart_items:
            product_info = item.get('product_info', {})
            quantity = item.get('quantity', 0)
            price = Decimal(str(product_info.get('cost', 0)))

            # Получаем дополнения из product_info
            additions = product_info.get('additions', {})

            # Формируем список активных дополнений
            active_additions = []
            if isinstance(additions, dict):
                active_additions = [name for name, active in additions.items() if active]
            elif isinstance(additions, list):
                active_additions = additions  # если дополнения уже в виде списка

            positions.append({
                'product_id': item.get('product_id'),
                'name': product_info.get('name', ''),
                'type': product_info.get('type', ''),
                'price': float(price),
                'quantity': quantity,
                'total': float(price * quantity),
                'additions': active_additions,  # сохраняем только активные дополнения
                'image_url': product_info.get('image_url', ''),
                'description': product_info.get('description', '')
            })

        # Создание заказа
        order = UserOrders(
            order_time=datetime.now(),
            payment_sum=total,
            payment_currency=data.get('payment_currency', 'LTC'),
            positions=positions,
            address=address,
            paid=True
        )

        db.session.add(order)

        try:
            db.session.commit()
            # Очищаем корзину после успешного создания заказа
            clear_cart()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Order creation failed: {e}", exc_info=True)
            return jsonify({'error': 'Internal server error'}), 500

        response_data = {
            "order_id": order.id,
            "order_time": order.order_time.isoformat(),
            "payment_sum": float(order.payment_sum),
            "payment_currency": order.payment_currency,
            "paid": order.paid,
            "positions_count": len(positions),
            "positions": positions  # возвращаем полную информацию о позициях
        }

        return jsonify({
            'message': 'Order created successfully',
            'data': response_data
        }), 201

    except Exception as e:
        current_app.logger.error(f"Unexpected error in make_order: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/health')
def health_check():
    """Health check с минимальной задержкой."""
    return Response('OK', mimetype='text/plain')