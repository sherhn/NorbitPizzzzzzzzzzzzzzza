"""
Модель заказа.
"""

from typing import Any, Dict
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Numeric
from datetime import datetime

db = SQLAlchemy()


class UserOrders(db.Model):
    """Модель для хранения заказов пользователей."""

    __tablename__ = 'user_orders'

    id = db.Column(db.Integer, primary_key=True)
    order_time = db.Column(db.DateTime, nullable=False, default=datetime.now)  # Время заказа
    payment_sum = db.Column(Numeric(12, 6), nullable=False)  # Итоговая сумма с 6 знаками после запятой
    payment_currency = db.Column(db.String(32), nullable=True, default='LTC')   # Валюта, LTC по дефолту
    positions = db.Column(JSONB, nullable=False)  # Все позиции
    address = db.Column(JSONB, nullable=False)  # Адрес
    paid = db.Column(db.Boolean, nullable=False, default=False)  # Статус оплаты

    def to_dict(self) -> dict[str, Any]:
        """Преобразование в словарь."""
        return {
            "id": self.id,
            "order_time": self.order_time.isoformat() if self.order_time else None,
            "payment_sum": float(self.payment_sum),
            "payment_currency": self.payment_currency,
            "positions": self.positions,
            "address": self.address,
            "paid": self.paid
        }