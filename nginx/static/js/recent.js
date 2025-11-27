// Скрипт для работы с недавними/популярными товарами
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация функционала недавних товаров
    initRecent();
});

// Глобальная переменная для хранения недавних товаров
let recentProducts = [];

// Инициализация функционала недавних товаров
function initRecent() {
    // Загрузка недавних товаров при загрузке страницы
    loadRecentProducts();
}

// Загрузка списка недавних товаров
async function loadRecentProducts() {
    try {
        const response = await fetch('http://localhost/api/main/get_recent');

        if (!response.ok) {
            throw new Error('Ошибка загрузки недавних товаров');
        }

        const data = await response.json();

        // Проверяем структуру ответа
        if (data.count === 0 || !data.products || data.products.length === 0) {
            recentProducts = [];
            showRecentEmptyState();
        } else {
            recentProducts = data.products || [];
            // Обновляем отображение недавних товаров
            renderRecentPage();
        }

    } catch (error) {
        console.error('Ошибка загрузки недавних товаров:', error);
        showRecentError();
    }
}

// Показать состояние "нет недавних заказов"
function showRecentEmptyState() {
    const recentContainer = document.getElementById('recent');
    if (recentContainer) {
        recentContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-history text-6xl text-stone-700 mb-4"></i>
                <h3 class="text-2xl font-bold mb-2">Пока нет недавних заказов</h3>
                <p class="text-stone-400">Здесь будут отображаться ваши недавние заказы</p>
            </div>
        `;
    }
}

// Рендер страницы недавних товаров
function renderRecentPage() {
    const recentContainer = document.getElementById('recent');
    if (!recentContainer) return;

    if (recentProducts.length === 0) {
        showRecentEmptyState();
        return;
    }

    const recentHTML = recentProducts.map(product => createRecentCard(product)).join('');
    recentContainer.innerHTML = `
        <div class="mb-6">
            <h3 class="text-2xl font-bold mb-4">Часто заказывают</h3>
            <p class="text-stone-400">Товары, которые популярны среди наших клиентов</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${recentHTML}
        </div>
    `;
}

// Создание карточки для недавнего товара
function createRecentCard(product) {
    const productInfo = product.product_info || product;
    const characteristics = productInfo.characteristics || {};
    const ingredients = productInfo.ingredients || [];
    const additions = productInfo.additions || [];
    const score = product.score || 0;

    return `
        <div class="bg-card-bg rounded-2xl overflow-hidden border border-stone-800 hover:border-stone-600 transition-all duration-300 hover:shadow-xl group flex flex-col relative">
            <!-- Бейдж популярности -->
            <div class="absolute top-3 left-3 z-10">
                <div class="flex items-center space-x-1 bg-accent-red/90 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    <i class="fas fa-fire"></i>
                    <span>${score}</span>
                </div>
            </div>

            <div class="h-48 bg-gradient-to-br from-stone-900 to-stone-800 flex items-center justify-center relative overflow-hidden">
                <div class="w-32 h-32 rounded-full bg-accent-yellow/10 absolute -top-10 -right-10"></div>
                <div class="w-24 h-24 rounded-full bg-accent-red/10 absolute -bottom-10 -left-10"></div>
                <img src="/images/products/${productInfo.preview_link}" alt="${productInfo.name}" class="w-full h-full object-contain p-4">
            </div>

            <div class="p-5 flex-grow flex flex-col">
                <div class="mb-3 flex-grow">
                    <h3 class="text-xl font-bold mb-2">${productInfo.name}</h3>
                    <p class="text-stone-400 text-sm mb-3">${productInfo.description}</p>

                    <!-- БЖУ -->
                    <div class="mb-3">
                        <div class="flex justify-between text-xs text-stone-500">
                            <span>Б: ${characteristics.protein || 0}g</span>
                            <span>Ж: ${characteristics.fat || 0}g</span>
                            <span>У: ${characteristics.carbohydrates || 0}g</span>
                            <span>${characteristics.calories || 0} ккал</span>
                        </div>
                    </div>

                    <!-- Состав -->
                    ${ingredients.length > 0 ? `
                        <div class="mb-3">
                            <p class="text-xs text-stone-500 mb-1">Состав:</p>
                            <div class="flex flex-wrap gap-1">
                                ${ingredients.map(ingredient => `
                                    <span class="text-xs bg-stone-800 text-stone-300 px-2 py-1 rounded-full">${ingredient}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="flex justify-between items-center mt-auto">
                    <span class="text-accent-yellow font-bold text-lg">${productInfo.cost} Ł</span>
                    <div class="flex space-x-2">
                        <button class="add-to-favorites w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-all duration-300" data-product-id="${productInfo.id}" title="Добавить в избранное">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="add-to-cart w-10 h-10 rounded-full bg-gradient-to-r from-accent-red to-red-700 hover:from-red-700 hover:to-accent-red text-white flex items-center justify-center transition-all duration-300" data-product-id="${productInfo.id}" title="Добавить в корзину">
                            <i class="fas fa-shopping-basket"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Обновление вкладки недавних товаров
function updateRecentTab() {
    const recentTab = document.getElementById('recent');
    if (!recentTab) return;

    // Если вкладка активна, перерисовываем её
    if (!recentTab.classList.contains('hidden')) {
        renderRecentTab();
    }
}

// Функция для рендера вкладки недавних товаров
async function renderRecentTab() {
    const recentContainer = document.getElementById('recent');

    try {
        const response = await fetch('http://localhost/api/main/get_recent');

        if (!response.ok) {
            throw new Error('Ошибка загрузки недавних товаров');
        }

        const data = await response.json();

        // Проверяем, есть ли недавние заказы
        if (data.count === 0 || !data.products || data.products.length === 0) {
            recentContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-history text-6xl text-stone-700 mb-4"></i>
                    <h3 class="text-2xl font-bold mb-2">Пока нет недавних заказов</h3>
                    <p class="text-stone-400">Здесь будут отображаться ваши недавние заказы</p>
                </div>
            `;
            return;
        }

        const recentProducts = data.products || [];

        // Создаем HTML для недавних товаров
        const recentHTML = recentProducts.map(product => createRecentCard(product)).join('');

        recentContainer.innerHTML = `
            <div class="mb-6">
                <h3 class="text-2xl font-bold mb-4">Часто заказывают</h3>
                <p class="text-stone-400">Товары, которые популярны среди наших клиентов</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${recentHTML}
            </div>
        `;

        // Обновляем кнопки избранного
        if (typeof updateFavoriteButtons === 'function') {
            updateFavoriteButtons();
        }

        // Добавляем обработчики для кнопок
        if (typeof addCartEventListeners === 'function') {
            addCartEventListeners();
        }

    } catch (error) {
        console.error('Ошибка загрузки недавних товаров:', error);
        recentContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-stone-700 mb-4"></i>
                <h3 class="text-2xl font-bold mb-2">Ошибка загрузки</h3>
                <p class="text-stone-400">Попробуйте обновить страницу позже</p>
            </div>
        `;
    }
}

// Показать состояние ошибки в недавних товарах
function showRecentError() {
    const recentContainer = document.getElementById('recent');
    if (recentContainer) {
        recentContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-stone-700 mb-4"></i>
                <h3 class="text-2xl font-bold mb-2">Ошибка загрузки истории</h3>
                <p class="text-stone-400">Попробуйте обновить страницу позже</p>
            </div>
        `;
    }
}