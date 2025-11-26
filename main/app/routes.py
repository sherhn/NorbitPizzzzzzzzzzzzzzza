"""Основные маршруты."""

from flask import Blueprint, request, jsonify, current_app, Response, session
from .cache import get_redis_connection, get_cached_products, cache_products
from .models import MenuPosition, FavoritesProducts, db
import json

bp = Blueprint('main', __name__)


@bp.route('/get_products', methods=['GET'])
def get_products():
    """Получение всех позиций из базы данных."""
    try:
        # Пробуем получить из кэша
        cached_products = get_cached_products()
        if cached_products:
            current_app.logger.info("Returning products from cache")
            return jsonify({
                'products': cached_products,
                'count': len(cached_products),
                'cached': True
            }), 200

        # Если нет в кэше - идем в БД
        products = MenuPosition.query.all()

        # Преобразуем в список словарей
        products_data = [product.to_dict() for product in products]

        # Кэшируем результат
        cache_products(products_data)

        return jsonify({
            'products': products_data,
            'count': len(products_data),
            'cached': False
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_products: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/get_product/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Получение продукта по ID."""
    try:
        # Для отдельных продуктов тоже можно кэшировать
        cache_key = f"cache:product:{product_id}"
        redis_conn = get_redis_connection()
        cached = redis_conn.get(cache_key)

        if cached:
            return jsonify({
                'product': json.loads(cached),
                'cached': True
            }), 200

        product = MenuPosition.query.get(product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        product_data = product.to_dict()

        # Кэшируем отдельный продукт
        redis_conn.setex(cache_key, current_app.config['PRODUCTS_CACHE_TTL'],
                         json.dumps(product_data))

        return jsonify({
            'product': product_data,
            'cached': False
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_product: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/favorite', methods=['POST'])
def make_favorite():
    """Добавить в избранное."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400

        product_id = data['product_id']

        # Проверяем существование продукта
        product = MenuPosition.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product does not exist'}), 404

        # Проверяем, не добавлен ли уже продукт в избранное
        exists = db.session.query(db.exists().where(FavoritesProducts.product_id == product_id)).scalar()
        if not exists:
            fav_product = FavoritesProducts(product_id=product_id, product_info=product.to_dict())

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
    """Удалить из избранного."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400

        product_id = data.get('product_id')

        exists = db.session.query(db.exists().where(FavoritesProducts.product_id == product_id)).scalar()

        if not exists:
            return jsonify({'error': 'Product does not exist in favorites'}), 404

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
    """Получить избранное."""
    try:
        products = FavoritesProducts.query.all()

        # Преобразуем каждый объект в словарь
        products_list = [product.to_dict() for product in products]

        return jsonify(products_list), 200

    except Exception as e:
        current_app.logger.error(f'Unexpected error in get_favorites: {e}', exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@bp.route('/health')
def health_check():
    """Health check с минимальной задержкой."""
    return Response('OK', mimetype='text/plain')