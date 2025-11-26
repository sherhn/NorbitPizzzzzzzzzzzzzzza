"""
Модуль конфигурации Flask приложения.
"""

import os


class Config:
    """Класс конфигурации Flask приложения подписок."""

    # Базовые настройки Flask
    SQLALCHEMY_DATABASE_URI = os.environ.get('ORDERS_DATABASE_URL')

    # Ссылка на main микросервис
    MAIN_SERVICE_URI = os.environ.get('MAIN_SERVICE_URI')
    
    # Redis конфигурация
    REDIS_URL = os.environ.get('REDIS_URL')

    # TTL корзины в секундах (48 часов по умолчанию)
    CART_TTL_SECONDS = int(os.environ.get('CART_TTL_SECONDS', 172800))