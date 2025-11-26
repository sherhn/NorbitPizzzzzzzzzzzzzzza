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