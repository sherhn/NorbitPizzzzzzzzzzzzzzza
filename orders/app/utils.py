"""
Утилиты для работы с корзиной.
"""

import json
import redis
from flask import current_app


def get_redis_connection():
    """Соединение с Redis."""
    return redis.from_url(current_app.config['REDIS_URL'], decode_responses=True)


def get_cart_key():
    """Получить ключ корзины."""
    return "cart:default_user"


def add_to_cart(product_id, product_info):
    """Добавить товар в корзину или увеличить количество на 1 если уже есть."""
    redis_conn = get_redis_connection()
    cart_key = get_cart_key()
    
    # Проверяем, есть ли уже товар в корзине
    existing_item_json = redis_conn.hget(cart_key, product_id)
    
    if existing_item_json:
        # Товар уже есть - увеличиваем количество на 1
        existing_item = json.loads(existing_item_json)
        existing_item['quantity'] += 1
        redis_conn.hset(cart_key, product_id, json.dumps(existing_item))
        return 'incremented'
    else:
        # Товара нет - добавляем новый с количеством 1
        cart_item = {
            'product_id': product_id,
            'quantity': 1,
            'product_info': product_info
        }
        redis_conn.hset(cart_key, product_id, json.dumps(cart_item))
        return 'added'


def remove_from_cart(product_id):
    """Удалить товар из корзины (полностью)."""
    redis_conn = get_redis_connection()
    cart_key = get_cart_key()
    
    result = redis_conn.hdel(cart_key, product_id)
    return result > 0


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
    total = 0
    
    for item in cart_items:
        product_info = item['product_info']
        quantity = item['quantity']
        cost = product_info.get('cost', 0)
        total += cost * quantity
    
    return total