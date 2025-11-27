"""
Утилиты для работы с корзиной.
"""

import json
import redis
from decimal import Decimal
from flask import current_app


def get_redis_connection():
    """Соединение с Redis."""
    return redis.from_url(current_app.config['REDIS_URL'], decode_responses=True)


def get_cart_key():
    """Получить ключ корзины."""
    return "cart:default_user"


def update_cart_ttl(cart_key):
    """Обновить TTL корзины."""
    redis_conn = get_redis_connection()
    ttl_seconds = current_app.config.get('CART_TTL_SECONDS', 172800)  # 48 часов по умолчанию
    redis_conn.expire(cart_key, ttl_seconds)


def add_to_cart(product_id, product_info):
    """Добавить товар в корзину или увеличить количество на 1 если уже есть."""
    redis_conn = get_redis_connection()
    cart_key = get_cart_key()

    # Преобразуем cost в Decimal если он пришел как float
    if 'cost' in product_info and isinstance(product_info['cost'], float):
        product_info['cost'] = float(Decimal(str(product_info['cost'])).quantize(Decimal('0.000001')))

    # Преобразуем additions из списка в словарь если нужно
    if 'additions' in product_info and isinstance(product_info['additions'], list):
        product_info['additions'] = {addition: False for addition in product_info['additions']}

    # Проверяем, есть ли уже товар в корзине
    existing_item_json = redis_conn.hget(cart_key, product_id)

    if existing_item_json:
        # Товар уже есть - увеличиваем количество на 1
        existing_item = json.loads(existing_item_json)
        existing_item['quantity'] += 1
        redis_conn.hset(cart_key, product_id, json.dumps(existing_item))
        result = 'incremented'
    else:
        # Товара нет - добавляем новый с количеством 1
        cart_item = {
            'product_id': product_id,
            'quantity': 1,
            'product_info': product_info
        }
        redis_conn.hset(cart_key, product_id, json.dumps(cart_item))
        result = 'added'

    # Обновляем TTL при любом изменении корзины
    update_cart_ttl(cart_key)
    return result


def remove_from_cart(product_id):
    """Удалить товар из корзины (полностью)."""
    redis_conn = get_redis_connection()
    cart_key = get_cart_key()

    result = redis_conn.hdel(cart_key, product_id)

    # Если в корзине еще остались товары, обновляем TTL
    if redis_conn.hlen(cart_key) > 0:
        update_cart_ttl(cart_key)

    return result > 0


def decrement_from_cart(product_id):
    """Уменьшить количество товара в корзине на 1 или удалить если количество станет 0."""
    redis_conn = get_redis_connection()
    cart_key = get_cart_key()

    # Проверяем, есть ли товар в корзине
    existing_item_json = redis_conn.hget(cart_key, product_id)

    if not existing_item_json:
        return 'not_found'

    existing_item = json.loads(existing_item_json)

    if existing_item['quantity'] > 1:
        # Уменьшаем количество на 1
        existing_item['quantity'] -= 1
        redis_conn.hset(cart_key, product_id, json.dumps(existing_item))
        result = 'decremented'
    else:
        # Если количество было 1 - удаляем товар из корзины
        redis_conn.hdel(cart_key, product_id)
        result = 'removed'

    # Обновляем TTL при любом изменении корзины
    if redis_conn.hlen(cart_key) > 0:
        update_cart_ttl(cart_key)

    return result


def get_cart():
    """Получить всю корзину."""
    redis_conn = get_redis_connection()
    cart_key = get_cart_key()
    
    cart_data = redis_conn.hgetall(cart_key)
    cart_items = []
    
    for product_id, item_json in cart_data.items():
        item = json.loads(item_json)
        cart_items.append(item)
    
    return cart_items


def clear_cart():
    """Очистить корзину."""
    redis_conn = get_redis_connection()
    cart_key = get_cart_key()
    
    redis_conn.delete(cart_key)


def get_cart_total():
    """Получить общую сумму корзины."""
    cart_items = get_cart()
    total = Decimal('0')
    
    for item in cart_items:
        product_info = item['product_info']
        quantity = item['quantity']
        cost = Decimal(str(product_info.get('cost', 0)))
        total += cost * quantity
    
    # Округляем до 6 знаков после запятой
    return float(total.quantize(Decimal('0.000001')))