"""
Модуль инициализации Flask приложения заказов.
"""

import logging
from flask import Flask, jsonify
from .config import Config
from .models import db
from .logging_config import setup_logging


def create_app() -> Flask:
    """Создает и настраивает экземпляр Flask приложения."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Инициализация БД
    db.init_app(app)

    # Настройка логирования
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("Flask application created")

    # Регистрация blueprint'ов
    from .routes import bp as orders_bp

    app.register_blueprint(orders_bp, url_prefix='/api/main')

    logger.info("Blueprints registered successfully")
    return app