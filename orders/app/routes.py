"""Основные маршруты."""

from flask import Blueprint, request, jsonify, current_app, Response, session
from .models import db, UserOrders, FavoritesProducts
from datetime import datetime
import requests


bp = Blueprint('orders', __name__)


@bp.route('/favorite', methods=['POST'])
def make_favorite():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400

        product_id = data['product_id']

        response = requests.get(f'{current_app.config.get('MAIN_SERVICE_URI')}/get_product/{product_id}')

        if response.status_code == 404:
            return jsonify({'error': 'Product does not exist'}), 404

        if response.status_code == 200:
            product_info = response.json()['product']
            exists = db.session.query(db.exists().where(FavoritesProducts.product_id == product_id)).scalar()
            if not exists:
                fav_product = FavoritesProducts(product_id=product_id, product_info=product_info)

                db.session.add(fav_product)

                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    current_app.logger.error(f"Favorite product creation failed: {e}", exc_info=True)
                    return jsonify({'error': 'Internal server error'}), 500

                return jsonify({'success': 'Favorite product created'}), 201

            return jsonify({'success': 'Favorite product already created'}), 208

    except Exception as e:
        current_app.logger.error(f"Unexpected error in make_favorite: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/favorite', methods=['DELETE'])
def delete_favorite():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400

        product_id = data.get('product_id')

        exists = db.session.query(db.exists().where(FavoritesProducts.product_id == product_id)).scalar()

        if not exists:
            return jsonify({'error': 'Product does not exist'}), 404

        fav_product = FavoritesProducts.query.filter_by(product_id=product_id).first()
        if fav_product:
            db.session.delete(fav_product)

        db.session.commit()

        return jsonify({'success': 'Favorite product deleted'}), 200

    except Exception as e:
        current_app.logger.error(f'Unexpected error in delete_favorite: {e}', exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/get_favorites', methods=['GET'])
def get_favorites():
    try:
        products = FavoritesProducts.query.all()

        # Преобразуем каждый объект в словарь
        products_list = [product.to_dict() for product in products]

        return jsonify(products_list), 200

    except Exception as e:
        current_app.logger.error(f'Unexpected error in get_favorites: {e}', exc_info=True)
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