import json
import redis
from flask import current_app


def get_redis_connection():
    return redis.from_url(current_app.config['CACHE_REDIS_URL'], decode_responses=True)


def cache_products(products_data):
    """Кэшировать список продуктов"""
    redis_conn = get_redis_connection()
    key = "cache:products"
    redis_conn.setex(key, current_app.config['PRODUCTS_CACHE_TTL'],
                    json.dumps(products_data))
    return True


def get_cached_products():
    """Получить продукты из кэша"""
    redis_conn = get_redis_connection()
    key = "cache:products"
    cached = redis_conn.get(key)
    if cached:
        return json.loads(cached)
    return None