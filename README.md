# Документация проекта NorbitPizza (старая, ждет обнову)

## Обзор проекта

NorbitPizza - это веб-приложение для заказа пиццы с микросервисной архитектурой. Проект включает фронтенд на HTML/CSS/JavaScript и бэкенд на Flask с разделением на микросервисы.

## Архитектура

### Микросервисы

#### 1. Микросервис Main
**Назначение:** Управление продуктами (позициями меню)

**База данных:** PostgreSQL
- Таблица `menu_positions`

**API Endpoints:**
- `GET /api/main/get_products` - получение всех продуктов
- `GET /api/main/get_product/<int:product_id>` - получение продукта по ID
- `GET /api/main/health` - проверка работоспособности

#### 2. Микросервис Orders
**Назначение:** Обработка заказов

**База данных:** PostgreSQL
- Таблица `user_orders`

**API Endpoints:**
- `POST /api/orders/make_order` - создание нового заказа
- `POST /api/orders/favorite` - добавление товара в избранное
- `DELETE /api/orders/favorite` - удаление товара из избранного
- `GET /api/orders/get_favorites` - получение списка избранных товаров
- `GET /api/orders/health` - проверка работоспособности

## Фронтенд

### Структура файлов

#### index.html
Главная страница приложения с меню пиццерии.

**Основные секции:**
- Шапка с логотипом, выбором города и языка
- Приветственная секция с кнопкой перехода к меню
- Система фильтров по ингредиентам
- Вкладки меню (Пиццы, Закуски, Напитки, Избранное, История)
- Футер

#### JavaScript модули

##### menu.js
Основной функционал меню:
- Переключение между вкладками меню
- Фильтрация продуктов по ингредиентам
- Загрузка продуктов из API
- Анимации появления элементов
- Управление состоянием фильтров

**Основные функции:**
- `loadProducts()` - загрузка продуктов из API
- `initFilters()` - инициализация системы фильтров
- `applyFilters()` / `resetFilters()` - управление фильтрами
- `renderProducts()` - отрисовка продуктов по категориям
- `createProductCard()` - создание карточки продукта
- `renderFavoritesTab()` - рендер вкладки избранного

##### favorites.js
Управление избранными товарами:
- Добавление/удаление товаров в избранное
- Отображение списка избранного
- Обновление состояния кнопок

**Основные функции:**
- `toggleFavorite()` - переключение состояния избранного
- `addToFavorites()` / `removeFromFavorites()` - API взаимодействие
- `updateFavoriteButtons()` - обновление визуального состояния
- `renderFavoritesPage()` - отрисовка страницы избранного

##### cities.js / languages.js
Утилиты для переключения города и языка интерфейса.

### Стили и дизайн

**Фреймворк:** Tailwind CSS
**Цветовая схема:**
- `primary`: #000000
- `accent-red`: #e11d48
- `accent-yellow`: #fbbf24
- `dark-bg`: #0f0f0f
- `card-bg`: #1a1a1a

## Функциональность

### Система фильтрации

- Фильтрация по ингредиентам (логика ИЛИ)
- Динамическое создание чекбоксов на основе доступных ингредиентов
- Сброс и применение фильтров
- Адаптивный интерфейс фильтров

### Управление избранным

- Добавление/удаление товаров в избранное
- Синхронизация с бэкендом
- Визуальные уведомления о действиях
- Отдельная вкладка для просмотра избранного

### Анимации и UX

- Плавные переходы между вкладками
- Анимация появления карточек при скролле
- Визуальный фидбек при взаимодействии
- Адаптивный дизайн для мобильных устройств

## API взаимодействие

### Получение продуктов
```javascript
GET http://localhost/api/main/get_products
```

### Управление избранным
```javascript
// Добавление
POST http://localhost/api/orders/favorite
{
  "product_id": 123
}

// Удаление
DELETE http://localhost/api/orders/favorite
{
  "product_id": 123
}

// Получение списка
GET http://localhost/api/orders/get_favorites
```

### Создание заказа
```javascript
POST http://localhost/api/orders/make_order
{
  "payment_sum": 25.99,
  "positions": [...],
  "additions": [...],
  "address": {...}
}
```

## Запуск проекта

### Скрипты сборки

#### rebuild.ps1
```powershell
.\make\rebuild.ps1
```
- Останавливает контейнеры
- Пересобирает образы без кеша
- Запускает контейнеры в фоне

#### rebuild_image.ps1
```powershell
.\make\rebuild_image.ps1
# Или с указанием суффикса
.\make\rebuild_image.ps1 -s "db"
```
- Останавливает контейнеры с удалением volumes
- Удаляет указанный образ
- Пересобирает все образы без кеша
- Запускает контейнеры

## Структура данных

### Продукт (Product)
```typescript
interface Product {
  id: number;
  name: string;
  cost: number;
  type: 'pizza' | 'snack' | 'drink';
  preview_link: string;
  description: string;
  characteristics: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  ingredients: string[];
  additions: string[];
}
```

### Заказ (Order)
```typescript
interface Order {
  payment_sum: number;
  payment_currency: string; // default 'LTC'
  positions: OrderPosition[];
  additions: OrderAddition[];
  address: DeliveryAddress;
}

interface OrderPosition {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface DeliveryAddress {
  street: string;
  apartment: string;
  entrance: string;
  floor: string;
  comment: string;
}
```

## Обработка ошибок

- Единый формат ошибок JSON: `{"error": "Описание ошибки"}`
- Структурированное логирование с временными метками
- Graceful degradation при недоступности API
- Пользовательские уведомления об ошибках

## Зависимости

### Бэкенд
- Flask (веб-фреймворк)
- PostgreSQL 16 (база данных)
- SQLAlchemy (ORM)
- Redis (для корзины)

### Фронтенд
- Tailwind CSS (стилизация)
- Font Awesome (иконки)
- Нативный JavaScript (логика)

Эта документация охватывает основные аспекты проекта NorbitPizza, включая архитектуру, функциональность и процессы разработки.