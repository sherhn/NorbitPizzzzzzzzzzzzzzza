// Скрипт для работы с корзиной
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initCart, 100);
});

// Глобальная переменная для хранения товаров в корзине
let cartItems = [];
let cartTotal = 0;
let isCartLoading = false;

// Аудио-объект для звука успеха
const successSound = new Audio('/audio/success.mp3');

// Инициализация корзины
function initCart() {
    const cartButton = document.getElementById('cart-button');

    if (!cartButton) {
        console.error('Элемент cart-button не найден');
        return;
    }

    // Загрузка корзины при загрузке страницы
    loadCart();

    // Обработчики событий
    cartButton.addEventListener('click', openCart);

    // Обработчик для кнопок добавления в корзину
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-cart')) {
            const button = e.target.closest('.add-to-cart');
            const productId = button.getAttribute('data-product-id');

            // Защита от множественных нажатий
            if (button.disabled) return;

            if (productId) {
                addToCart(productId, button);
            }
        }
    });
}

// Загрузка корзины из API
async function loadCart() {
    if (isCartLoading) return;

    isCartLoading = true;
    try {
        const response = await fetch('http://localhost/api/orders/cart');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const cartData = await response.json();
        console.log('Данные корзины при загрузке:', cartData);

        // Обрабатываем разные форматы ответа
        if (cartData && Array.isArray(cartData)) {
            // Формат: массив товаров
            cartItems = cartData;
            cartTotal = calculateTotal(cartData);
        } else if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
            // Формат: { cart: [...], total: ... }
            cartItems = cartData.cart;
            cartTotal = cartData.total || calculateTotal(cartData.cart);
        } else if (cartData && Array.isArray(cartData.products)) {
            // Формат: { products: [...] }
            cartItems = cartData.products;
            cartTotal = cartData.total || calculateTotal(cartData.products);
        } else {
            console.warn('Неожиданный формат данных корзины:', cartData);
            cartItems = [];
            cartTotal = 0;
        }

        console.log('Обработанные данные корзины:', cartItems);

        // Обновляем отображение корзины
        updateCartUI();

    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        cartItems = [];
        cartTotal = 0;
        updateCartUI();
    } finally {
        isCartLoading = false;
    }
}

// Расчет общей суммы
function calculateTotal(items) {
    return items.reduce((sum, item) => {
        const product = item.product_info || item;
        const quantity = item.quantity || 1;
        const productCost = product.cost || 0;
        return sum + (productCost * quantity);
    }, 0);
}

// Добавление товара в корзину
async function addToCart(productId, button = null) {
    if (isCartLoading) return;

    isCartLoading = true;

    // сразу увеличиваем счетчик
    optimisticallyUpdateCartCount(1);

    // Блокируем кнопку
    if (button) {
        button.disabled = true;
        // Визуальная обратная связь
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-plus"></i>';
    }

    try {
        const response = await fetch('http://localhost/api/orders/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: parseInt(productId)
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const result = await response.json();
        console.log('Результат добавления в корзину:', result);

        // Перезагружаем корзину для синхронизации
        await loadCart();

        showCartNotification('Товар добавлен в корзину', 'success');
        return result;

    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        // ОТКАТ: уменьшаем счетчик при ошибке
        optimisticallyUpdateCartCount(-1);
        showCartNotification('Ошибка при добавлении в корзину', 'error');
        throw error;
    } finally {
        isCartLoading = false;

        // Восстанавливаем кнопку
        if (button) {
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-shopping-basket"></i>';
            }, 1000);
        }
    }
}

// Оптимистичное обновление счетчика корзины
function optimisticallyUpdateCartCount(change) {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) {
        console.warn('Элемент cart-count не найден');
        return;
    }

    let currentCount = parseInt(cartCount.textContent) || 0;
    currentCount = Math.max(0, currentCount + change); // Не даем уйти ниже 0

    cartCount.textContent = currentCount;

    // Обновляем видимость счетчика
    updateCartCountVisibility(currentCount);

    console.log('Оптимистичное обновление счетчика:', currentCount, 'изменение:', change);
}

// Обновление видимости счетчика корзины
function updateCartCountVisibility(count) {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) return;

    if (count > 0) {
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
}

// Удаление товара из корзины
async function removeFromCart(productId) {
    if (isCartLoading) return;

    isCartLoading = true;

    // Сохраняем предыдущее состояние для отката
    const previousCartItems = [...cartItems];
    const previousCartTotal = cartTotal;

    // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: сразу удаляем товар из локального состояния
    const productIdNum = parseInt(productId);
    const itemIndex = cartItems.findIndex(item => {
        const itemId = item.product_id || (item.product_info && item.product_info.id);
        return itemId === productIdNum;
    });

    let removedItem = null;
    let quantityToRemove = 0;

    if (itemIndex !== -1) {
        removedItem = cartItems[itemIndex];
        quantityToRemove = removedItem.quantity || 1;
        cartItems.splice(itemIndex, 1);
        cartTotal = calculateTotal(cartItems);

        // Немедленно обновляем UI
        updateCartUI();
    }

    try {
        const response = await fetch(`http://localhost/api/orders/cart/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Результат удаления из корзины:', result);

        // Перезагружаем корзину для полной синхронизации
        await loadCart();

        showCartNotification('Товар удален из корзины', 'success');
        return result;

    } catch (error) {
        console.error('Ошибка удаления из корзины:', error);

        // ОТКАТ: в случае ошибки возвращаем предыдущее состояние
        cartItems = previousCartItems;
        cartTotal = previousCartTotal;
        updateCartUI();

        showCartNotification('Ошибка при удалении из корзины', 'error');
        throw error;
    } finally {
        isCartLoading = false;
    }
}

// Очистка корзины
async function clearCart(skipServer = false) {
    if (!skipServer && isCartLoading) return;

    // Сохраняем состояние для отката
    const previousCartItems = [...cartItems];
    const previousCartTotal = cartTotal;

    //Локальный сборос корзины
    function resetLocalCart() {
    
    cartItems = [];
    cartTotal = 0;
    updateCartUI();

    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = '0';
        updateCartCountVisibility(0);
    }
}

    if (skipServer) {
        resetLocalCart();
        return {ok: true, skipped: true};
    }

    isCartLoading = true;

    resetLocalCart();


    try {
        const response = await fetch('http://localhost/api/orders/cart', {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        showCartNotification('Корзина очищена', 'success');
        return result;

    } catch (error) {
        console.error('Ошибка очистки корзины:', error);

        // Откат в случае ошибки
        cartItems = previousCartItems;
        cartTotal = previousCartTotal;
        updateCartUI();

        showCartNotification('Ошибка при очистки корзины', 'error');
        throw error;
    } finally {
        isCartLoading = false;
    }
}

// Обновление интерфейса корзины
function updateCartUI() {
    console.log('Обновление UI корзины, товаров:', cartItems.length);
    updateCartCount();
    updateCartContent();
    updateCartTotal();
    updateAddressFormVisibility();
}

// Обновление счетчика товаров
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) {
        console.warn('Элемент cart-count не найден');
        return;
    }

    // Считаем общее количество товаров (сумма quantity всех позиций)
    let totalItems = 0;
    if (Array.isArray(cartItems)) {
        totalItems = cartItems.reduce((sum, item) => {
            return sum + (item.quantity || 1);
        }, 0);
    }

    cartCount.textContent = totalItems;
    console.log('Обновление счетчика:', totalItems);

    // Обновляем видимость счетчика
    updateCartCountVisibility(totalItems);
}

// Обновление содержимого корзины
function updateCartContent() {
    const cartContent = document.getElementById('cart-content');
    const checkoutButton = document.getElementById('checkout-button');

    if (!cartContent) {
        console.warn('Элемент cart-content не найден');
        return;
    }

    console.log('Обновление содержимого корзины, товаров:', cartItems.length);

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        cartContent.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-shopping-basket text-6xl text-stone-700 mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Корзина пуста</h3>
                <p class="text-stone-400">Добавьте товары из меню</p>
            </div>
        `;
        if (checkoutButton) {
            checkoutButton.disabled = true;
        }
        return;
    }

    if (checkoutButton) {
        checkoutButton.disabled = false;
    }

    const cartHTML = cartItems.map(item => createCartItemHTML(item)).join('');
    cartContent.innerHTML = cartHTML;
}

// Создание HTML для элемента корзины с превью
function createCartItemHTML(item) {
    console.log('Создание HTML для товара:', item);

    // Поддерживаем разные форматы данных
    const product = item.product_info || item;
    const quantity = item.quantity || 1;
    const productId = item.product_id || product.id;

    if (!product || !productId) {
        console.warn('Некорректный товар в корзине:', item);
        return '';
    }

    const productName = product.name || 'Неизвестный товар';
    const productCost = product.cost || 0;
    const totalCost = (productCost * quantity).toFixed(6);
    const previewImage = product.preview_link || 'default_product.png';

    return `
        <div class="bg-stone-800/50 rounded-xl p-4 mb-3">
            <div class="flex items-start space-x-3 mb-3">
                <!-- Превью продукта -->
                <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-stone-700 to-stone-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <img src="/images/products/${previewImage}"
                         alt="${productName}"
                         class="w-full h-full object-cover"
                         onerror="this.src='/images/default_product.png'">
                </div>

                <!-- Информация о продукте -->
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm mb-1 truncate">${productName}</h4>
                    <p class="text-xs text-stone-400">${(productCost || 0).toFixed(6)} Ł × ${quantity}</p>
                    <p class="text-accent-yellow font-bold text-sm mt-1">${totalCost} Ł</p>
                </div>

                <!-- Кнопка удаления -->
                <button onclick="removeFromCart(${productId})"
                        class="flex-shrink-0 w-6 h-6 rounded-full bg-stone-700 hover:bg-red-600 flex items-center justify-center text-xs transition-colors ml-2"
                        title="Удалить">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>

            <!-- Управление количеством -->
            <div class="flex justify-between items-center border-t border-stone-700 pt-3">
                <div class="flex items-center space-x-2">
                    <button onclick="decreaseQuantity(${productId})"
                            class="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-sm transition-colors">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="text-sm font-medium min-w-8 text-center" id="quantity-${productId}">${quantity}</span>
                    <button onclick="increaseQuantity(${productId})"
                            class="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-sm transition-colors">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <span class="text-accent-yellow font-bold text-sm" id="total-${productId}">${totalCost} Ł</span>
            </div>
        </div>
    `;
}

// Обновление общей суммы
function updateCartTotal() {
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartTotalElement) {
        console.warn('Элемент cart-total не найден');
        return;
    }

    // Используем total из ответа API или пересчитываем
    let total = cartTotal;
    if (total === 0 && Array.isArray(cartItems)) {
        total = calculateTotal(cartItems);
    }

    cartTotalElement.textContent = `${total.toFixed(6)} Ł`;
    console.log('Обновление общей суммы:', total);
}

// Обновление видимости формы адреса
function updateAddressFormVisibility() {
    const addressForm = document.getElementById('address-form');
    const checkoutButton = document.getElementById('checkout-button');

    if (!addressForm || !checkoutButton) return;

    if (cartItems.length > 0) {
        addressForm.classList.remove('hidden');
        // Обновляем город в форме доставки
        updateDeliveryCity();
    } else {
        addressForm.classList.add('hidden');
        checkoutButton.disabled = true;
    }
}

// Обновление города доставки в форме
function updateDeliveryCity() {
    const deliveryCityElement = document.getElementById('delivery-city');
    const currentCityElement = document.getElementById('current-city');

    if (deliveryCityElement && currentCityElement) {
        deliveryCityElement.textContent = currentCityElement.textContent;
    }
}

// Увеличение количества товара
async function increaseQuantity(productId) {
    if (isCartLoading) return;

    // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ
    optimisticallyUpdateCartCount(1);

    // Находим товар в корзине
    const itemIndex = cartItems.findIndex(item => {
        const product = item.product_info || item;
        return (item.product_id === productId) || (product.id === productId);
    });

    if (itemIndex === -1) return;

    // Локально обновляем количество и сумму
    const item = cartItems[itemIndex];
    const currentQuantity = item.quantity || 1;
    const newQuantity = currentQuantity + 1;
    item.quantity = newQuantity;

    // Обновляем отображение количества и суммы для этого товара
    updateCartItemDisplay(productId, newQuantity);

    // Обновляем общую сумму корзины
    updateCartTotal();

    // Отправляем запрос на сервер
    try {
        const response = await fetch('http://localhost/api/orders/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: parseInt(productId)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Обновляем данные корзины с сервера для синхронизации
        await loadCart();

        return result;

    } catch (error) {
        console.error('Ошибка увеличения количества:', error);
        // В случае ошибки откатываем локальные изменения
        await loadCart();
        showCartNotification('Ошибка при увеличении количества', 'error');
    }
}

// Уменьшение количества товара
async function decreaseQuantity(productId) {
    if (isCartLoading) return;

    const itemIndex = cartItems.findIndex(item => {
        const product = item.product_info || item;
        return (item.product_id === productId) || (product.id === productId);
    });

    if (itemIndex === -1) return;

    const item = cartItems[itemIndex];
    const currentQuantity = item.quantity || 1;

    if (currentQuantity > 1) {
        // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ
        optimisticallyUpdateCartCount(-1);

        // Локально обновляем количество и сумму
        const newQuantity = currentQuantity - 1;
        item.quantity = newQuantity;

        // Обновляем отображение количества и суммы для этого товара
        updateCartItemDisplay(productId, newQuantity);

        // Обновляем общую сумму корзины
        updateCartTotal();

        // Отправляем запрос на уменьшение количества
        try {
            const response = await fetch(`http://localhost/api/orders/cart/${productId}/decrement`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                // Обновляем данные корзины с сервера для синхронизации
                await loadCart();
                return result;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

        } catch (error) {
            console.error('Ошибка уменьшения количества:', error);
            // В случае ошибки откатываем локальные изменения
            await loadCart();
            showCartNotification('Ошибка при уменьшении количества', 'error');
        }
    } else {
        // Если количество 1, просто удаляем
        await removeFromCart(productId);
    }
}

// Обновление отображения количества и суммы для конкретного товара
function updateCartItemDisplay(productId, quantity) {
    // Обновляем отображение количества
    const quantityElement = document.getElementById(`quantity-${productId}`);
    if (quantityElement) {
        quantityElement.textContent = quantity;
    }

    // Находим товар для расчета новой суммы
    const item = cartItems.find(item => {
        const product = item.product_info || item;
        return (item.product_id === productId) || (product.id === productId);
    });

    if (item) {
        const product = item.product_info || item;
        const productCost = product.cost || 0;
        const totalCost = (productCost * quantity).toFixed(6);

        // Обновляем отображение суммы для этого товара
        const totalElement = document.getElementById(`total-${productId}`);
        if (totalElement) {
            totalElement.textContent = `${totalCost} Ł`;
        }
    }
}

// Открытие модального окна корзины
function openCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) {
        console.error('Элемент cart-modal не найден');
        return;
    }
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Обновляем корзину при открытии
    loadCart();
}

// Закрытие модального окна корзины
function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) {
        console.error('Элемент cart-modal не найден');
        return;
    }
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Получение данных адреса из формы
function getAddressData() {
    const currentCityElement = document.getElementById('current-city');
    const streetInput = document.getElementById('street-input');
    const apartmentInput = document.getElementById('apartment-input');
    const entranceInput = document.getElementById('entrance-input');
    const floorInput = document.getElementById('floor-input');
    const commentInput = document.getElementById('comment-input');

    // Проверяем обязательные поля
    if (!streetInput.value.trim()) {
        throw new Error('Укажите улицу и дом');
    }

    if (!apartmentInput.value.trim()) {
        throw new Error('Укажите номер квартиры или офиса');
    }

    // Формируем полный адрес улицы
    const streetAddress = `${streetInput.value.trim()}`;
    
    // Формируем объект адреса согласно требованиям
    const address = {
        street: streetAddress,
        city: currentCityElement ? currentCityElement.textContent : 'Неизвестный город'
    };

    // Добавляем опциональные поля, если они заполнены
    if (apartmentInput.value.trim()) {
        address.apartment = apartmentInput.value.trim();
    }
    
    if (entranceInput.value.trim()) {
        address.entrance = entranceInput.value.trim();
    }
    
    if (floorInput.value.trim()) {
        address.floor = floorInput.value.trim();
    }
    
    if (commentInput.value.trim()) {
        address.comment = commentInput.value.trim();
    }

    return address;
}

// Оформление заказа
async function checkout() {
    if (isCartLoading) return;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        showCartNotification('Корзина пуста', 'error');
        return;
    }

    isCartLoading = true;

    try {
        // Получаем данные адреса
        let addressData;
        try {
            addressData = getAddressData();
        } catch (addressError) {
            showCartNotification(addressError.message, 'error');
            isCartLoading = false;
            return;
        }

        // Подготавливаем данные заказа в новом формате
        const orderData = {
            address: addressData
        };

        console.log('Отправка заказа:', orderData);

        const response = await fetch('http://localhost/api/orders/make_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const result = await response.json();
        console.log('Результат оформления заказа:', result);

        // Очищаем корзину после успешного заказа
        await clearCart(true);

        // Очищаем форму адреса
        clearAddressForm();

        closeCart();

        // ВОСПРОИЗВЕДЕНИЕ ЗВУКА УСПЕХА, я снова добавляю спорт
        try {
            successSound.currentTime = 0;
            await successSound.play();
        } catch (soundError) {
            console.warn('Не удалось воспроизвести звук:', soundError);
        }

        showCartNotification('Заказ успешно оформлен! Ожидайте доставку.', 'success');

        return result;

    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        showCartNotification('Ошибка при оформлении заказа: ' + error.message, 'error');
    } finally {
        isCartLoading = false;
    }
}

// Очистка формы адреса
function clearAddressForm() {
    const streetInput = document.getElementById('street-input');
    const apartmentInput = document.getElementById('apartment-input');
    const entranceInput = document.getElementById('entrance-input');
    const floorInput = document.getElementById('floor-input');
    const commentInput = document.getElementById('comment-input');

    if (streetInput) streetInput.value = '';
    if (apartmentInput) apartmentInput.value = '';
    if (entranceInput) entranceInput.value = '';
    if (floorInput) floorInput.value = '';
    if (commentInput) commentInput.value = '';
}

// Показать уведомление
function showCartNotification(message, type = 'success') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white font-semibold`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Закрытие корзины по ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCart();
    }
});

// Делаем функции глобальными для обработки событий из HTML
window.removeFromCart = removeFromCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.closeCart = closeCart;
window.checkout = checkout;