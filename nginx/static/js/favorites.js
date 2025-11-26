// Скрипт для работы с избранными товарами
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация функционала избранного
    initFavorites();
});

// Глобальная переменная для хранения избранных товаров
let favoriteProducts = [];

// Инициализация функционала избранного
function initFavorites() {
    // Загрузка избранных товаров при загрузке страницы
    loadFavorites();

    // Добавляем обработчики для кнопок избранного в карточках продуктов
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-favorites')) {
            const button = e.target.closest('.add-to-favorites');
            const productId = button.getAttribute('data-product-id');
            toggleFavorite(productId, button);
        }

        if (e.target.closest('.remove-from-favorites')) {
            const button = e.target.closest('.remove-from-favorites');
            const productId = button.getAttribute('data-product-id');
            removeFromFavorites(productId);
        }
    });
}

// Загрузка списка избранных товаров
async function loadFavorites() {
    try {
        const response = await fetch('http://localhost/api/main/get_favorites');

        if (!response.ok) {
            throw new Error('Ошибка загрузки избранного');
        }

        const favorites = await response.json();
        favoriteProducts = favorites.map(fav => fav.product_info);

        // Обновляем отображение избранных товаров
        updateFavoriteButtons();
        renderFavoritesPage();

    } catch (error) {
        console.error('Ошибка загрузки избранных товаров:', error);
        showFavoriteError();
    }
}

// Переключение состояния "в избранном"
async function toggleFavorite(productId, button) {
    try {
        const isCurrentlyFavorite = favoriteProducts.some(product => product.id == productId);

        if (isCurrentlyFavorite) {
            // Удаляем из избранного
            await removeFromFavorites(productId);
        } else {
            // Добавляем в избранное
            await addToFavorites(productId);
        }

        // Обновляем внешний вид кнопки
        updateFavoriteButton(button, !isCurrentlyFavorite);

    } catch (error) {
        console.error('Ошибка переключения избранного:', error);
        showFavoriteNotification('Ошибка при обновлении избранного', 'error');
    }
}

// Добавление товара в избранное
async function addToFavorites(productId) {
    try {
        const response = await fetch('http://localhost/api/main/favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: parseInt(productId)
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка добавления в избранное');
        }

        const result = await response.json();

        // Обновляем локальный список избранных
        await loadFavorites();

        showFavoriteNotification('Товар добавлен в избранное', 'success');
        return result;

    } catch (error) {
        console.error('Ошибка добавления в избранное:', error);
        throw error;
    }
}

// Добавьте в favorites.js
function updateFavoritesTab() {
    const favoritesTab = document.getElementById('favorites');
    if (!favoritesTab) return;

    // Если вкладка активна, перерисовываем её
    if (!favoritesTab.classList.contains('hidden')) {
        renderFavoritesTab();
    }
}

// Обновите функцию removeFromFavorites
async function removeFromFavorites(productId) {
    try {
        const response = await fetch('http://localhost/api/main/favorite', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: parseInt(productId)
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка удаления из избранного');
        }

        const result = await response.json();

        // Обновляем локальный список избранных
        favoriteProducts = favoriteProducts.filter(product => product.id != productId);

        // Обновляем отображение
        updateFavoriteButtons();
        updateFavoritesTab(); // Обновляем вкладку избранного
        renderFavoritesPage();

        showFavoriteNotification('Товар удален из избранного', 'success');
        return result;

    } catch (error) {
        console.error('Ошибка удаления из избранного:', error);
        throw error;
    }
}

// Обновление всех кнопок избранного на странице
function updateFavoriteButtons() {
    document.querySelectorAll('.add-to-favorites').forEach(button => {
        const productId = button.getAttribute('data-product-id');
        const isFavorite = favoriteProducts.some(product => product.id == productId);
        updateFavoriteButton(button, isFavorite);
    });
}

// Обновление внешнего вида кнопки избранного
function updateFavoriteButton(button, isFavorite) {
    if (isFavorite) {
        button.innerHTML = '<i class="fas fa-heart text-accent-red"></i>';
        button.classList.add('text-accent-red');
        button.classList.remove('text-gray-400');
        button.title = 'Удалить из избранного';
    } else {
        button.innerHTML = '<i class="far fa-heart"></i>';
        button.classList.remove('text-accent-red');
        button.classList.add('text-gray-400');
        button.title = 'Добавить в избранное';
    }
}

// Рендер страницы избранного
function renderFavoritesPage() {
    const favoritesContainer = document.getElementById('favorites-container');
    if (!favoritesContainer) return;

    if (favoriteProducts.length === 0) {
        favoritesContainer.innerHTML = `
            <div class="text-center py-16">
                <i class="far fa-heart text-8xl text-gray-700 mb-6"></i>
                <h3 class="text-3xl font-bold mb-4">В избранном пока пусто</h3>
                <p class="text-gray-400 text-lg mb-8">Добавляйте товары в избранное, чтобы не потерять</p>
                <button onclick="window.location.href='#menu-content'" class="bg-gradient-to-r from-accent-red to-red-700 hover:from-red-700 hover:to-accent-red text-white px-8 py-3 rounded-full font-semibold transition-all duration-300">
                    Перейти к меню
                </button>
            </div>
        `;
        return;
    }

    const favoritesHTML = favoriteProducts.map(product => createFavoriteCard(product)).join('');
    favoritesContainer.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            ${favoritesHTML}
        </div>
    `;
}

// Создание карточки для избранного товара
function createFavoriteCard(product) {
    const characteristics = product.characteristics || {};
    const ingredients = product.ingredients || [];
    const additions = product.additions || [];

    return `
        <div class="bg-card-bg rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 hover:shadow-xl group flex flex-col">
            <div class="h-48 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative overflow-hidden">
                <div class="w-32 h-32 rounded-full bg-accent-yellow/10 absolute -top-10 -right-10"></div>
                <div class="w-24 h-24 rounded-full bg-accent-red/10 absolute -bottom-10 -left-10"></div>
                <img src="/images/products/${product.preview_link}" alt="${product.name}" class="w-full h-full object-contain p-4">

                <!-- Кнопка удаления из избранного -->
                <button class="remove-from-favorites absolute top-3 right-3 w-10 h-10 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center text-accent-red transition-all duration-300" data-product-id="${product.id}" title="Удалить из избранного">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="p-5 flex-grow flex flex-col">
                <div class="mb-3 flex-grow">
                    <h3 class="text-xl font-bold mb-2">${product.name}</h3>
                    <p class="text-gray-400 text-sm mb-3">${product.description}</p>

                    <!-- БЖУ -->
                    <div class="mb-3">
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Б: ${characteristics.protein || 0}g</span>
                            <span>Ж: ${characteristics.fat || 0}g</span>
                            <span>У: ${characteristics.carbohydrates || 0}g</span>
                            <span>${characteristics.calories || 0} ккал</span>
                        </div>
                    </div>

                    <!-- Состав -->
                    ${ingredients.length > 0 ? `
                        <div class="mb-3">
                            <p class="text-xs text-gray-500 mb-1">Состав:</p>
                            <div class="flex flex-wrap gap-1">
                                ${ingredients.map(ingredient => `
                                    <span class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">${ingredient}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="flex justify-between items-center mt-auto">
                    <span class="text-accent-yellow font-bold text-lg">${product.cost} Ł</span>
                    <div class="flex space-x-2">
                        <button class="add-to-favorites w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all duration-300" data-product-id="${product.id}" title="В избранном">
                            <i class="fas fa-heart text-accent-red"></i>
                        </button>
                        <button class="add-to-cart w-10 h-10 rounded-full bg-gradient-to-r from-accent-red to-red-700 hover:from-red-700 hover:to-accent-red text-white flex items-center justify-center transition-all duration-300" data-product-id="${product.id}" title="Добавить в корзину">
                            <i class="fas fa-shopping-basket"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Показать уведомление об избранном
function showFavoriteNotification(message, type = 'success') {
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Показать состояние ошибки избранного
function showFavoriteError() {
    const favoritesContainer = document.getElementById('favorites-container');
    if (favoritesContainer) {
        favoritesContainer.innerHTML = `
            <div class="text-center py-16">
                <i class="fas fa-exclamation-triangle text-8xl text-gray-700 mb-6"></i>
                <h3 class="text-3xl font-bold mb-4">Ошибка загрузки избранного</h3>
                <p class="text-gray-400 text-lg mb-8">Попробуйте обновить страницу</p>
                <button onclick="location.reload()" class="bg-gradient-to-r from-accent-red to-red-700 hover:from-red-700 hover:to-accent-red text-white px-8 py-3 rounded-full font-semibold transition-all duration-300">
                    Обновить страницу
                </button>
            </div>
        `;
    }
}

// Проверка, находится ли товар в избранном
function isProductFavorite(productId) {
    return favoriteProducts.some(product => product.id == productId);
}

// Получить количество избранных товаров
function getFavoritesCount() {
    return favoriteProducts.length;
}

// Обновить счетчик избранного в шапке
function updateFavoritesCounter() {
    const counter = document.getElementById('favorites-counter');
    if (counter) {
        const count = getFavoritesCount();
        counter.textContent = count;
        counter.classList.toggle('hidden', count === 0);
    }
}