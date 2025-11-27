"""
Модель заказа.
"""

from typing import Any, Dict
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Numeric

db = SQLAlchemy()


class MenuPosition(db.Model):
    """Модель для хранения продукции."""

    __tablename__ = 'menu_positions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(32), nullable=False, default='Unknown')  # Название
    cost = db.Column(Numeric(12, 6), nullable=False)  # Цена с 6 знаками после запятой
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
            "cost": float(self.cost),
            "type": self.type,
            "preview_link": self.preview_link,
            "description": self.description,
            "characteristics": self.characteristics,
            "ingredients": self.ingredients,
            "additions": self.additions
        }


class FavoritesProducts(db.Model):
    """Модель для хранения избранных продуктов."""

    __tablename__ = 'favorites_products'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, nullable=False)
    product_info = db.Column(JSONB, nullable=False)

    def to_dict(self) -> dict[str, Any]:
        """Преобразование в словарь."""
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_info": self.product_info
        }