"""Основные маршруты."""

from flask import Blueprint, request, jsonify, current_app, Response, session
from .models import MenuPosition

bp = Blueprint('main', __name__)


@bp.route('/get_products', methods=['GET'])
def get_products():
    """Получение всех позиций из базы данных."""
    try:
        # Получаем все продукты из базы данных
        products = MenuPosition.query.all()

        # Преобразуем в список словарей
        products_data = [product.to_dict() for product in products]

        return jsonify({
            'products': products_data,
            'count': len(products_data)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_products: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/get_product/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Получение продукта по ID."""
    try:
        # Ищем продукт по ID
        product = MenuPosition.query.get(product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Возвращаем все поля продукта
        return jsonify({
            'product': product.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_product: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/health')
def health_check():
    """Health check с минимальной задержкой."""
    return Response('OK', mimetype='text/plain')