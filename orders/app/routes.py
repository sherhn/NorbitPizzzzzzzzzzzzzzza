"""Основные маршруты."""

from flask import Blueprint, request, jsonify, current_app, Response, session
from .models import db, UserOrders
from datetime import datetime


bp = Blueprint('orders', __name__)


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