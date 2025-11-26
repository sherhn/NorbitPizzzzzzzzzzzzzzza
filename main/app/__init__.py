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

    # Создание таблиц в контексте приложения
    with app.app_context():
        try:
            db.create_all()
            app.logger.info("Database tables created/verified")
        except Exception as e:
            app.logger.warning(f"Tables already exist or error: {e}", exc_info=True)

    # Настройка логирования
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("Flask application created")

    # Регистрация blueprint'ов
    from .routes import bp as orders_bp

    app.register_blueprint(orders_bp, url_prefix='/api/main')

    logger.info("Blueprints registered successfully")
    return app