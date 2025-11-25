"""
Модуль конфигурации Flask приложения.
"""

import os


class Config:
    """Класс конфигурации Flask приложения подписок."""

    # Базовые настройки Flask
    SQLALCHEMY_DATABASE_URI = os.environ.get('ORDERS_DATABASE_URL')