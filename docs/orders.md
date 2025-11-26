# Микросервис Orders

Микросервис Orders отвечает за обработку заказов в системе пиццерии. Он предоставляет API для создания новых заказов и управления ими.

## База данных

Сервис использует PostgreSQL для хранения данных о заказах. Основная таблица:

### Таблица `user_orders`

| Поле | Тип | Описание |
|------|-----|-----------|
| id | Integer | Уникальный идентификатор заказа (первичный ключ) |
| order_time | DateTime | Время создания заказа |
| payment_sum | Double | Итоговая сумма заказа |
| payment_currency | String(32) | Валюта оплаты (по умолчанию 'LTC') |
| positions | JSONB | Список позиций в заказе |
| additions | JSONB | Дополнения к позициям |
| address | JSONB | Адрес доставки |
| paid | Boolean | Статус оплаты |

## API Endpoints

### 1. Создание заказа

**Endpoint:** `POST /api/orders/make_order`

Создает новый заказ в системе.

#### Тело запроса (JSON):

```json
{
  "payment_sum": 25.99,
  "payment_currency": "LTC",
  "positions": [
    {
      "id": 1,
      "name": "Пепперони",
      "quantity": 1,
      "price": 19.99
    }
  ],
  "additions": [
    {
      "id": 1,
      "name": "Соус",
      "quantity": 2,
      "price": 1.50
    }
  ],
  "address": {
    "street": "ул. Примерная, д. 123",
    "apartment": "45",
    "entrance": "2",
    "floor": "4",
    "comment": "Домофон не работает"
  }
}
```

#### Параметры:

- `payment_sum` (обязательный) - общая сумма заказа (число > 0)
- `payment_currency` (опциональный) - валюта оплаты (по умолчанию 'LTC')
- `positions` (обязательный) - массив объектов с позициями заказа
- `additions` (обязательный) - массив объектов с дополнениями
- `address` (обязательный) - объект с адресом доставки

#### Ответы:

**Успех (201 Created):**
```json
{
  "message": "Order created successfully",
  "data": {
    "order_id": 123,
    "order_time": "2024-01-15T14:30:00.000000",
    "payment_sum": 25.99,
    "payment_currency": "LTC",
    "paid": true
  }
}
```

**Ошибки:**
- `400 Bad Request` - неверные данные запроса
- `500 Internal Server Error` - внутренняя ошибка сервера

**Ошибки:**
- `500 Internal Server Error` - внутренняя ошибка сервера

### 5. Health Check

**Endpoint:** `GET /api/orders/health`

Проверка работоспособности сервиса.

#### Ответ:

```
OK
```

Статус: 200 OK

## Обработка ошибок

Сервис возвращает стандартные HTTP статусы и JSON-ответы с описанием ошибки:

```json
{
  "error": "Описание ошибки"
}
```

## Логирование

Сервис использует структурированное JSON-логирование с включением:
- временных меток
- уровня логирования
- информации о запросе (IP, метод, путь)
- контекстной информации сервиса

## Зависимости

- PostgreSQL 16 - база данных
- Flask - веб-фреймворк
- SQLAlchemy - ORM

## Переменные окружения

- `ORDERS_POSTGRES_USER` - пользователь PostgreSQL
- `ORDERS_POSTGRES_PASSWORD` - пароль PostgreSQL  
- `ORDERS_POSTGRES_DB` - имя базы данных
- `ORDERS_DATABASE_URL` - хост базы данных
- `REDIS_URL` - БД для корзины
- `MAIN_SERVICE_URI` - хост основного сервиса