"""Основные маршруты."""

from flask import Blueprint, request, jsonify, current_app, Response, session
from .models import db, UserOrders
from datetime import datetime
import requests
from .utils import add_to_cart, remove_from_cart, get_cart, clear_cart, get_cart_total, decrement_from_cart

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
        total = get_cart_total()

        # Получаем данные адреса из JSON
        data = request.get_json() or {}
        address = data.get('address')

        # Проверка обязательного поля адреса
        if not address:
            return jsonify({'error': 'Missing address'}), 400

        if not isinstance(address, dict):
            return jsonify({'error': 'Invalid address'}), 400

        # Преобразуем корзину в формат positions
        positions = []
        for item in cart_items:
            product_info = item.get('product_info', {})
            quantity = item.get('quantity', 0)
            price = product_info.get('cost', 0)

            positions.append({
                'product_id': item.get('product_id'),
                'name': product_info.get('name', ''),
                'price': price,
                'quantity': quantity,
                'total': price * quantity
            })

        # Создание заказа
        order = UserOrders(
            order_time=datetime.now(),
            payment_sum=total,
            payment_currency=data.get('payment_currency', 'LTC'),
            positions=positions,
            additions=data.get('additions', []),
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
            "payment_sum": order.payment_sum,
            "payment_currency": order.payment_currency,
            "paid": order.paid,
            "positions_count": len(positions)
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