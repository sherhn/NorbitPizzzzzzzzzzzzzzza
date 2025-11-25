"""
Модель заказа.
"""

from typing import Any, Dict
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

db = SQLAlchemy()


class MenuPosition(db.Model):
    """Модель для хранения продукции."""

    __tablename__ = 'menu_positions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(32), nullable=False, default='Unknown')  # Название
    cost = db.Column(db.Double, nullable=False)  # Цена
    type = db.Column(db.String(32), nullable=False) # Тип продукта: пицца, закуска, напиток
    preview_link = db.Column(db.String(32), nullable=True, default='/unknown.png')   # Ссылка на превью
    description = db.Column(db.String(256), nullable=True)   # Описание позиции
    characteristics = db.Column(JSONB, nullable=False)  # БЖУ
    ingredients = db.Column(JSONB, nullable=False)  # Ингредиенты
    additions = db.Column(JSONB, nullable=False)  # Дополнительные ингредиенты

    def to_dict(self) -> dict[str, Any]:
        """Преобразование в словарь."""
        return {
            "id": self.id,
            "name": self.name,
            "cost": self.cost,
            "type": self.type,
            "preview_link": self.preview_link,
            "description": self.description,
            "characteristics": self.characteristics,
            "ingredients": self.ingredients,
            "additions": self.additions
        }