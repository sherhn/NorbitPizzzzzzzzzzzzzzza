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

    // Обработчик для кнопок добавления в корзину (делегирование)
    document.addEventListener('click', function(e) {
        const addBtn = e.target.closest('.add-to-cart');
        if (addBtn) {
            const button = addBtn;
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
        const response = await fetch('/api/orders/cart');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const cartData = await response.json();
        // Обрабатываем разные форматы ответа
        if (cartData && Array.isArray(cartData)) {
            cartItems = cartData;
            cartTotal = calculateTotal(cartData);
        } else if (cartData && cartData.cart && Array.isArray(cartData.cart)) {
            cartItems = cartData.cart;
            cartTotal = cartData.total || calculateTotal(cartData.cart);
        } else if (cartData && Array.isArray(cartData.products)) {
            cartItems = cartData.products;
            cartTotal = cartData.total || calculateTotal(cartData.products);
        } else {
            console.warn('Неожиданный формат данных корзины:', cartData);
            cartItems = [];
            cartTotal = 0;
        }

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

    // сразу увеличиваем счетчик (оптимистично)
    optimisticallyUpdateCartCount(1);

    // Блокируем кнопку
    if (button) {
        button.disabled = true;
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-plus"></i>';
    }

    try {
        const response = await fetch('/api/orders/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: parseInt(productId) })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const result = await response.json();

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
        if (button) {
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-shopping-basket"></i>';
            }, 800);
        }
    }
}

// Оптимистичное обновление счетчика корзины
function optimisticallyUpdateCartCount(change) {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) return;
    let currentCount = parseInt(cartCount.textContent) || 0;
    currentCount = Math.max(0, currentCount + change);
    cartCount.textContent = currentCount;
    updateCartCountVisibility(currentCount);
}

// Обновление видимости счетчика корзины
function updateCartCountVisibility(count) {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) return;
    if (count > 0) cartCount.classList.remove('hidden'); else cartCount.classList.add('hidden');
}

// Удаление товара из корзины
async function removeFromCart(productId) {
    if (isCartLoading) return;

    isCartLoading = true;
    const previousCartItems = JSON.parse(JSON.stringify(cartItems));
    const previousCartTotal = cartTotal;

    const productIdNum = parseInt(productId);
    const itemIndex = cartItems.findIndex(item => {
        const itemId = item.product_id || (item.product_info && item.product_info.id);
        return itemId === productIdNum;
    });

    if (itemIndex !== -1) {
        cartItems.splice(itemIndex, 1);
        cartTotal = calculateTotal(cartItems);
        updateCartUI();
    }

    try {
        const response = await fetch(`/api/orders/cart/${productId}`, { method: 'DELETE' });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        await loadCart();
        showCartNotification('Товар удален из корзины', 'success');
        return result;
    } catch (error) {
        console.error('Ошибка удаления из корзины:', error);
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

    const previousCartItems = JSON.parse(JSON.stringify(cartItems));
    const previousCartTotal = cartTotal;

    function resetLocalCart() {
        cartItems = [];
        cartTotal = 0;
        updateCartUI();
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) { cartCountElement.textContent = '0'; updateCartCountVisibility(0); }
    }

    if (skipServer) {
        resetLocalCart();
        return { ok: true, skipped: true };
    }

    isCartLoading = true;
    resetLocalCart();

    try {
        const response = await fetch('/api/orders/cart', { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        showCartNotification('Корзина очищена', 'success');
        return result;
    } catch (error) {
        console.error('Ошибка очистки корзины:', error);
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
    updateCartCount();
    updateCartContent();
    updateCartTotal();
    updateAddressFormVisibility();
}

// Обновление счетчика товаров
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) return;
    let totalItems = 0;
    if (Array.isArray(cartItems)) {
        totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
    cartCount.textContent = totalItems;
    updateCartCountVisibility(totalItems);
}

// Обновление содержимого корзины
function updateCartContent() {
    const cartContent = document.getElementById('cart-content');
    const checkoutButton = document.getElementById('checkout-button');
    if (!cartContent) return;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        cartContent.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-shopping-basket text-6xl text-stone-700 mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Корзина пуста</h3>
                <p class="text-stone-400">Добавьте товары из меню</p>
            </div>
        `;
        if (checkoutButton) checkoutButton.disabled = true;
        return;
    }

    if (checkoutButton) checkoutButton.disabled = false;

    const cartHTML = cartItems.map(item => createCartItemHTML(item)).join('');
    cartContent.innerHTML = cartHTML;

    // Навешиваем обработчики на кнопки дополнений
    addAdditionButtonsListeners();
}

// Создание HTML для элемента корзины с превью (и кнопками дополнений)
function createCartItemHTML(item) {
    const product = item.product_info || item;
    const quantity = item.quantity || 1;
    const productId = item.product_id || product.id;

    if (!product || !productId) return '';

    const productName = product.name || 'Неизвестный товар';
    const productCost = product.cost || 0;
    const totalCost = (productCost * quantity).toFixed(6);
    const previewImage = product.preview_link || 'default_product.png';

    // Формируем кнопки дополнений (если есть)
    let additionsHTML = '';
    if (product.additions && typeof product.additions === 'object') {
        const additionsObj = (Array.isArray(product.additions))
            ? product.additions.reduce((acc, a) => { acc[a] = false; return acc; }, {})
            : product.additions;

        const additionsButtons = Object.keys(additionsObj).map(addName => {
            const isActive = !!additionsObj[addName];
            const safeName = addName.replace(/"/g, '&quot;');
            const btnClasses = isActive
                ? 'addition-btn px-3 py-1 rounded-full text-sm font-medium transition-colors bg-red-600 text-white'
                : 'addition-btn px-3 py-1 rounded-full text-sm font-medium transition-colors bg-stone-700 text-stone-300';

            return `<button
                        type="button"
                        data-product-id="${productId}"
                        data-addition-name="${safeName}"
                        class="${btnClasses} mr-2 mb-2"
                        aria-pressed="${isActive ? 'true' : 'false'}"
                    >${addName}</button>`;
        }).join('');
        additionsHTML = `
            <div class="mt-3">
                <p class="text-xs text-stone-500 mb-2">Дополнительно:</p>
                <div class="flex flex-wrap items-center">
                    ${additionsButtons}
                </div>
            </div>
        `;
    }

    return `
        <div class="bg-stone-800/50 rounded-xl p-4 mb-3">
            <div class="flex items-start space-x-3 mb-3">
                <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-stone-700 to-stone-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <img src="/images/products/${previewImage}"
                         alt="${productName}"
                         class="w-full h-full object-cover"
                         onerror="this.src='/images/default_product.png'">
                </div>

                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm mb-1 truncate">${productName}</h4>
                    <p class="text-xs text-stone-400">${(productCost || 0).toFixed(6)} Ł × ${quantity}</p>
                    <p class="text-accent-yellow font-bold text-sm mt-1">${totalCost} Ł</p>
                </div>

                <button onclick="removeFromCart(${productId})"
                        class="flex-shrink-0 w-6 h-6 rounded-full bg-stone-700 hover:bg-red-600 flex items-center justify-center text-xs transition-colors ml-2"
                        title="Удалить">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>

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

            ${additionsHTML}
        </div>
    `;
}

// Навешиваем слушатели на кнопки дополнений
function addAdditionButtonsListeners() {
    const additionButtons = document.querySelectorAll('.addition-btn');
    additionButtons.forEach(btn => {
        // избегаем двойного навешивания — если у элемента есть data-listener, пропускаем
        if (btn.dataset.listenerAttached) return;
        btn.dataset.listenerAttached = '1';

        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const productIdAttr = this.getAttribute('data-product-id');
            const additionName = this.getAttribute('data-addition-name');
            if (!productIdAttr || !additionName) return;
            const productId = parseInt(productIdAttr);

            // Заблокировать кнопку на время одного действия
            if (this.disabled) return;
            this.disabled = true;

            const currentlyActive = this.getAttribute('aria-pressed') === 'true';
            // оптимистично переключаем визуал
            setAdditionButtonState(this, !currentlyActive);
            // обновляем локально
            applyLocalAdditionState(productId, additionName, !currentlyActive);

            try {
                await toggleAddition(productId, additionName);
                // синхронизируем с сервером
                await loadCart();
            } catch (error) {
                console.error('Ошибка toggleAddition:', error);
                // откат
                setAdditionButtonState(this, currentlyActive);
                applyLocalAdditionState(productId, additionName, currentlyActive);
                showCartNotification('Ошибка при изменении дополнения', 'error');
            } finally {
                // разблокируем кнопку
                setTimeout(() => { this.disabled = false; }, 300);
            }
        });
    });
}

// Визуальное состояние кнопки дополнения
function setAdditionButtonState(buttonElem, active) {
    if (!buttonElem) return;
    if (active) {
        buttonElem.classList.remove('bg-stone-700', 'text-stone-300');
        buttonElem.classList.add('bg-red-600', 'text-white');
        buttonElem.setAttribute('aria-pressed', 'true');
    } else {
        buttonElem.classList.remove('bg-red-600', 'text-white');
        buttonElem.classList.add('bg-stone-700', 'text-stone-300');
        buttonElem.setAttribute('aria-pressed', 'false');
    }
}

// Локальное обновление additions внутри cartItems (оптимистично)
function applyLocalAdditionState(productId, additionName, value) {
    const item = cartItems.find(it => {
        const product = it.product_info || it;
        const id = it.product_id || product.id;
        return id === productId;
    });
    if (!item) return;
    const product = item.product_info || item;
    if (!product.additions) {
        if (Array.isArray(product.additions)) {
            const obj = {};
            product.additions.forEach(a => obj[a] = false);
            product.additions = obj;
        } else {
            product.additions = {};
        }
    }
    product.additions[additionName] = !!value;
}

// Отправка запроса переключения дополнения
async function toggleAddition(productId, additionName) {
    const payload = { addition_name: additionName };
    const urlsToTry = [
        `/api/orders/cart/${productId}/toggle_addition`,
        `/api/orders/cart/${productId}/toggle`
    ];

    let lastError = null;
    for (let url of urlsToTry) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 404) {
                lastError = new Error('Endpoint not found: ' + url);
                continue;
            }

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            return await response.json();
        } catch (err) {
            lastError = err;
            if (url === urlsToTry[urlsToTry.length - 1]) throw lastError;
            // иначе — пробуем следующий URL
        }
    }
    throw lastError || new Error('Неизвестная ошибка toggleAddition');
}

// Обновление общей суммы
function updateCartTotal() {
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartTotalElement) return;
    let total = cartTotal;
    if ((!total || total === 0) && Array.isArray(cartItems)) total = calculateTotal(cartItems);
    cartTotalElement.textContent = `${(total || 0).toFixed(6)} Ł`;
}

// Обновление видимости формы адреса
function updateAddressFormVisibility() {
    const addressForm = document.getElementById('address-form');
    const checkoutButton = document.getElementById('checkout-button');
    if (!addressForm || !checkoutButton) return;
    if (cartItems.length > 0) {
        addressForm.classList.remove('hidden');
        updateDeliveryCity();
    } else {
        addressForm.classList.add('hidden');
        checkoutButton.disabled = true;
    }
}

function updateDeliveryCity() {
    const deliveryCityElement = document.getElementById('delivery-city');
    const currentCityElement = document.getElementById('current-city');
    if (deliveryCityElement && currentCityElement) deliveryCityElement.textContent = currentCityElement.textContent;
}

// Увеличение/уменьшение количества
async function increaseQuantity(productId) {
    if (isCartLoading) return;
    optimisticallyUpdateCartCount(1);

    const itemIndex = cartItems.findIndex(item => {
        const product = item.product_info || item;
        return (item.product_id === productId) || (product.id === productId);
    });
    if (itemIndex === -1) return;

    const item = cartItems[itemIndex];
    const currentQuantity = item.quantity || 1;
    const newQuantity = currentQuantity + 1;
    item.quantity = newQuantity;
    updateCartItemDisplay(productId, newQuantity);
    updateCartTotal();

    try {
        const response = await fetch('/api/orders/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: parseInt(productId) })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        await loadCart();
        return result;
    } catch (error) {
        console.error('Ошибка увеличения количества:', error);
        await loadCart();
        showCartNotification('Ошибка при увеличении количества', 'error');
    }
}

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
        optimisticallyUpdateCartCount(-1);
        const newQuantity = currentQuantity - 1;
        item.quantity = newQuantity;
        updateCartItemDisplay(productId, newQuantity);
        updateCartTotal();

        try {
            const response = await fetch(`/api/orders/cart/${productId}/decrement`, { method: 'POST' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            await loadCart();
            return result;
        } catch (error) {
            console.error('Ошибка уменьшения количества:', error);
            await loadCart();
            showCartNotification('Ошибка при уменьшении количества', 'error');
        }
    } else {
        await removeFromCart(productId);
    }
}

// Обновление отображения количества и суммы для конкретного товара
function updateCartItemDisplay(productId, quantity) {
    const quantityElement = document.getElementById(`quantity-${productId}`);
    if (quantityElement) quantityElement.textContent = quantity;

    const item = cartItems.find(it => {
        const product = it.product_info || it;
        return (it.product_id === productId) || (product.id === productId);
    });
    if (item) {
        const product = item.product_info || item;
        const productCost = product.cost || 0;
        const totalCost = (productCost * quantity).toFixed(6);
        const totalElement = document.getElementById(`total-${productId}`);
        if (totalElement) totalElement.textContent = `${totalCost} Ł`;
    }
}

// Открытие/закрытие модального окна корзины
function openCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadCart();
}
function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
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

    if (!streetInput || !apartmentInput) throw new Error('Поля адреса не найдены');

    if (!streetInput.value.trim()) throw new Error('Укажите улицу и дом');
    if (!apartmentInput.value.trim()) throw new Error('Укажите номер квартиры или офиса');

    const streetAddress = `${streetInput.value.trim()}`;
    const address = { street: streetAddress, city: currentCityElement ? currentCityElement.textContent : 'Неизвестный город' };

    if (apartmentInput.value.trim()) address.apartment = apartmentInput.value.trim();
    if (entranceInput.value.trim()) address.entrance = entranceInput.value.trim();
    if (floorInput.value.trim()) address.floor = floorInput.value.trim();
    if (commentInput.value.trim()) address.comment = commentInput.value.trim();

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
        let addressData;
        try { addressData = getAddressData(); } catch (addressError) {
            showCartNotification(addressError.message, 'error');
            isCartLoading = false;
            return;
        }

        const orderData = { address: addressData };

        const response = await fetch('/api/orders/make_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const result = await response.json();

        await clearCart(true);
        clearAddressForm();
        closeCart();

        try { successSound.currentTime = 0; await successSound.play(); } catch (soundError) { /* ignore */ }

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

// Показываем уведомление
function showCartNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white font-semibold`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => { if (document.body.contains(notification)) document.body.removeChild(notification); }, 300);
    }, 3000);
}

// Закрытие корзины по ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeCart();
});

// Экспорт функций в глобальную область (если HTML вызывает их напрямую)
window.removeFromCart = removeFromCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.closeCart = closeCart;
window.checkout = checkout;
