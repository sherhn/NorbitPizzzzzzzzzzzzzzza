import json
import redis
import time
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


def update_recent_products(products_data):
    """
    Обновить счетчики популярности продуктов.
    """
    redis_conn = get_redis_connection()
    current_time = time.time()
    ttl_hours = 1  # TTL 1 час
    ttl_seconds = ttl_hours * 3600

    pipe = redis_conn.pipeline()

    for product in products_data:
        product_id = str(product['product_id'])
        product_key = f"recent_product:{product_id}"

        # Обновляем счетчик и TTL
        pipe.zincrby("recent_products:score", 1, product_id)
        pipe.hset(product_key, "product_info", json.dumps(product['product_info']))
        pipe.hset(product_key, "last_updated", current_time)
        pipe.expire(product_key, ttl_seconds)

    pipe.execute()
    return True


def get_recent_products(limit=20):
    """
    Получить популярные продукты, отсортированные по score
    """
    redis_conn = get_redis_connection()
    current_time = time.time()
    ttl_hours = 1
    ttl_seconds = ttl_hours * 3600

    # Получаем product_id и score из sorted set
    product_scores = redis_conn.zrevrange("recent_products:score", 0, limit - 1, withscores=True)

    recent_products = []

    for product_id, score in product_scores:
        product_key = f"recent_product:{product_id}"

        # Проверяем, не истек ли TTL
        product_data = redis_conn.hgetall(product_key)
        if product_data:
            last_updated = float(product_data.get('last_updated', 0))

            # Если данные устарели, удаляем их
            if current_time - last_updated > ttl_seconds:
                redis_conn.zrem("recent_products:score", product_id)
                redis_conn.delete(product_key)
                continue

            # Обновляем TTL при каждом обращении
            redis_conn.expire(product_key, ttl_seconds)

            product_info = json.loads(product_data['product_info'])
            recent_products.append({
                'product_id': int(product_id),
                'score': int(score),
                'product_info': product_info
            })
        else:
            # Если данных о продукте нет, удаляем из sorted set
            redis_conn.zrem("recent_products:score", product_id)

    return recent_products


def cleanup_expired_recent_products():
    """
    Очистка устаревших записей о продуктах
    """
    redis_conn = get_redis_connection()
    current_time = time.time()
    ttl_seconds = 3600  # 1 час

    # Получаем все product_id из sorted set
    all_products = redis_conn.zrange("recent_products:score", 0, -1)

    pipe = redis_conn.pipeline()

    for product_id in all_products:
        product_key = f"recent_product:{product_id}"
        last_updated = redis_conn.hget(product_key, "last_updated")

        if last_updated and (current_time - float(last_updated) > ttl_seconds):
            pipe.zrem("recent_products:score", product_id)
            pipe.delete(product_key)

    pipe.execute()
    return True