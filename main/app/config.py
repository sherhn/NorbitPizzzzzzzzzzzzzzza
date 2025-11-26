"""
Модуль конфигурации Flask приложения.
"""

import os


class Config:
    """Класс конфигурации Flask приложения подписок."""

    # Базовые настройки Flask
    SQLALCHEMY_DATABASE_URI = os.environ.get('MAIN_DATABASE_URL')

    CACHE_REDIS_URL = os.environ.get('CACHE_REDIS_URL')
    PRODUCTS_CACHE_TTL = int(os.environ.get('PRODUCTS_CACHE_TTL', 21600))  # 6 часов