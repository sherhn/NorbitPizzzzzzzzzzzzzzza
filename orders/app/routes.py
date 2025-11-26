"""Основные маршруты."""

from flask import Blueprint, request, jsonify, current_app, Response, session
from .models import db, UserOrders
from datetime import datetime
import requests
from .utils import add_to_cart, remove_from_cart, get_cart, clear_cart, get_cart_total


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
    """Создание нового заказа."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400

        # Базовые проверки наличия обязательных полей
        payment_sum = data.get('payment_sum')
        positions = data.get('positions')
        additions = data.get('additions')
        address = data.get('address')

        # Проверка обязательных полей
        if payment_sum is None:
            return jsonify({'error': 'Missing payment sum'}), 400

        if not positions:
            return jsonify({'error': 'Missing positions'}), 400

        if not address:
            return jsonify({'error': 'Missing address'}), 400

        # Проверка типов данных
        if not isinstance(payment_sum, (int, float)) or payment_sum <= 0:
            return jsonify({'error': 'Invalid payment sum'}), 400

        if not isinstance(positions, list) or len(positions) == 0:
            return jsonify({'error': 'Invalid positions'}), 400

        if not isinstance(additions, list):
            return jsonify({'error': 'Invalid additions'}), 400

        if not isinstance(address, dict):
            return jsonify({'error': 'Invalid address'}), 400

        # Создание заказа
        order = UserOrders(
            order_time=datetime.now(),
            payment_sum=payment_sum,
            payment_currency=data.get('payment_currency', 'LTC'),
            positions=positions,
            additions=additions,
            address=address,
            paid=True
        )

        db.session.add(order)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Order creation failed: {e}", exc_info=True)
            return jsonify({'error': 'Internal server error'}), 500

        response_data = {
            "order_id": order.id,
            "order_time": order.order_time.isoformat(),
            "payment_sum": order.payment_sum,
            "payment_currency": order.payment_currency,
            "paid": order.paid
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