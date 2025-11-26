# Микросервис Main

Микросервис Main отвечает за управление продуктами (позициями меню) в системе пиццерии. Он предоставляет API для получения информации о продуктах из меню.

## База данных

Сервис использует PostgreSQL для хранения данных о продуктах. Основная таблица:

### Таблица `menu_positions`

| Поле | Тип | Описание |
|------|-----|-----------|
| id | Integer | Уникальный идентификатор продукта (первичный ключ) |
| name | String(32) | Название продукта |
| cost | Double | Цена продукта |
| type | String(32) | Тип продукта: пицца, закуска, напиток |
| preview_link | String(32) | Ссылка на изображение продукта |
| description | String(256) | Описание продукта |
| characteristics | JSONB | Характеристики продукта (БЖУ) |
| ingredients | JSONB | Ингредиенты продукта |
| additions | JSONB | Дополнительные ингредиенты |

## API Endpoints

### 1. Получение всех продуктов

**Endpoint:** `GET /api/main/get_products`

Возвращает список всех продуктов из меню.

#### Ответы:

**Успех (200 OK):**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Пепперони",
      "cost": 19.99,
      "type": "pizza",
      "preview_link": "/pepperoni.png",
      "description": "Острая пицца с пепперони",
      "characteristics": {
        "calories": 280,
        "protein": 12,
        "fat": 10,
        "carbs": 32
      },
      "ingredients": ["тесто", "томатный соус", "пепперони", "сыр"],
      "additions": ["острый соус", "оливки"]
    }
  ],
  "count": 1
}
```

**Ошибки:**
- `500 Internal Server Error` - внутренняя ошибка сервера

### 2. Получение продукта по ID

**Endpoint:** `GET /api/main/get_product/<int:product_id>`

Возвращает информацию о конкретном продукте по его идентификатору.

#### Параметры URL:

- `product_id` (обязательный) - идентификатор продукта

#### Ответы:

**Успех (200 OK):**
```json
{
  "product": {
    "id": 1,
    "name": "Пепперони",
    "cost": 19.99,
    "type": "pizza",
    "preview_link": "/pepperoni.png",
    "description": "Острая пицца с пепперони",
    "characteristics": {
      "calories": 280,
      "protein": 12,
      "fat": 10,
      "carbs": 32
    },
    "ingredients": ["тесто", "томатный соус", "пепперони", "сыр"],
    "additions": ["острый соус", "оливки"]
  }
}
```

### 3. Добавление товара в избранное

**Endpoint:** `POST /api/orders/favorite`

Добавляет товар в список избранных.

#### Тело запроса (JSON):

```json
{
  "product_id": 123
}
```

#### Параметры:

- `product_id` (обязательный) - идентификатор товара

#### Ответы:

**Успех (201 Created):**
```json
{
  "success": "Favorite product created"
}
```

**Товар уже в избранном (208 Already Reported):**
```json
{
  "success": "Favorite product already created"
}
```

**Ошибки:**
- `400 Bad Request` - неверные данные запроса
- `404 Not Found` - товар не существует
- `500 Internal Server Error` - внутренняя ошибка сервера

### 4. Удаление товара из избранного

**Endpoint:** `DELETE /api/orders/favorite`

Удаляет товар из списка избранных.

#### Тело запроса (JSON):

```json
{
  "product_id": 123
}
```

#### Параметры:

- `product_id` (обязательный) - идентификатор товара

#### Ответы:

**Успех (200 OK):**
```json
{
  "success": "Favorite product deleted"
}
```

**Ошибки:**
- `400 Bad Request` - неверные данные запроса
- `404 Not Found` - товар не найден в избранном
- `500 Internal Server Error` - внутренняя ошибка сервера

### 5. Получение списка избранных товаров

**Endpoint:** `GET /api/orders/get_favorites`

Возвращает список всех избранных товаров.

#### Ответы:

**Успех (200 OK):**
```json
[
    {
        "id": 1,
        "product_id": 1,
        "product_info": {
            "additions": [
                "сырный бортик",
                "острый перец",
                "чесночный соус"
            ],
            "characteristics": {
                "calories": 250,
                "carbohydrates": 35,
                "fat": 8,
                "protein": 12
            },
            "cost": 0.067683,
            "description": "Моцарелла, сыры чеддер и пармезан, фирменный соус альфредо",
            "id": 1,
            "ingredients": [
                "фирменный соус альфредо",
                "моцарелла",
                "сыры чеддер",
                "пармезан"
            ],
            "name": "Сырная",
            "preview_link": "/cheese.avif",
            "type": "pizza"
        }
    }
]
```

**Ошибки:**
- `404 Not Found` - продукт не найден
- `500 Internal Server Error` - внутренняя ошибка сервера

### 6. Health Check

**Endpoint:** `GET /api/main/health`

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

- `MAIN_POSTGRES_USER` - пользователь PostgreSQL
- `MAIN_POSTGRES_PASSWORD` - пароль PostgreSQL  
- `MAIN_POSTGRES_DB` - имя базы данных
- `MAIN_DATABASE_URL` - хост базы данных