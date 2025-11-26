// Переключение вкладок меню
document.addEventListener('DOMContentLoaded', function() {
    const menuTabs = document.querySelectorAll('.menu-tab');
    const menuContents = document.querySelectorAll('.menu-tab-content');

    // В функции переключения вкладок в menu.js
    menuTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Убираем активный класс у всех вкладок
            menuTabs.forEach(t => {
                t.classList.remove('active', 'bg-gradient-to-r', 'from-accent-red', 'to-red-700');
            });

            // Добавляем активный класс текущей вкладке
            this.classList.add('active', 'bg-gradient-to-r', 'from-accent-red', 'to-red-700');

            // Скрываем все контенты
            menuContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });

            // Особый случай для вкладки "Избранное"
            if (targetTab === 'favorites') {
                renderFavoritesTab(); // Новая функция для рендера избранного
            }

            // Показываем нужный контент
            document.getElementById(targetTab).classList.remove('hidden');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Прокрутка к меню при нажатии на кнопку
    document.getElementById('menu-button').addEventListener('click', function() {
        document.querySelector('#menu-content').scrollIntoView({
            behavior: 'smooth'
        });
    });

    // Инициализация фильтров
    initFilters();

    // Загрузка продуктов из API
    loadProducts();

    // Анимация появления элементов при загрузке
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Применяем анимацию к карточкам
    document.querySelectorAll('.bg-card-bg').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
});

// Глобальные переменные для фильтров
let allProducts = [];
let currentFilters = {
    ingredients: []
};

// Инициализация фильтров
function initFilters() {
    const filtersToggle = document.getElementById('filters-toggle');
    const filtersPanel = document.getElementById('filters-panel');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');

    // Переключение видимости панели фильтров
    filtersToggle.addEventListener('click', function() {
        filtersPanel.classList.toggle('hidden');
    });

    // Применение фильтров
    applyFiltersBtn.addEventListener('click', function() {
        applyFilters();
    });

    // Сброс фильтров
    resetFiltersBtn.addEventListener('click', function() {
        resetFilters();
    });
}

// Применение фильтров
function applyFilters() {
    // Получаем выбранные ингредиенты
    const selectedIngredients = [];
    document.querySelectorAll('#filters-panel input[type="checkbox"]:checked').forEach(checkbox => {
        selectedIngredients.push(checkbox.value);
    });
    currentFilters.ingredients = selectedIngredients;

    // Фильтруем и перерисовываем продукты
    filterAndRenderProducts();

    // Скрываем панель фильтров
    document.getElementById('filters-panel').classList.add('hidden');
}

// Сброс фильтров
function resetFilters() {
    // Снимаем все чекбоксы ингредиентов
    document.querySelectorAll('#filters-panel input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Сбрасываем фильтры
    currentFilters = {
        ingredients: []
    };

    // Перерисовываем продукты без фильтров
    renderProducts(allProducts);

    // Скрываем панель фильтров
    document.getElementById('filters-panel').classList.add('hidden');
}

// Фильтрация и отрисовка продуктов
function filterAndRenderProducts() {
    const filteredProducts = {
        pizza: [],
        snack: [],
        drink: []
    };

    // Фильтруем продукты по категориям
    allProducts.forEach(product => {
        if (passesFilters(product)) {
            filteredProducts[product.type].push(product);
        }
    });

    // Перерисовываем каждую категорию
    renderProductCategory('pizzas', filteredProducts.pizza);
    renderProductCategory('snacks', filteredProducts.snack);
    renderProductCategory('drinks', filteredProducts.drink);
}

// Проверка продукта на соответствие фильтрам
function passesFilters(product) {
    // Фильтр по ингредиентам (логика ИЛИ - показываем если есть хотя бы один из выбранных)
    if (currentFilters.ingredients.length > 0) {
        const productIngredients = getProductIngredients(product);
        const hasAnySelectedIngredient = currentFilters.ingredients.some(ingredient =>
            productIngredients.includes(ingredient)
        );

        if (!hasAnySelectedIngredient) {
            return false;
        }
    }

    return true;
}

// Получение списка ингредиентов продукта
function getProductIngredients(product) {
    const ingredients = [];

    // Добавляем ингредиенты из состава
    if (product.ingredients && Array.isArray(product.ingredients)) {
        product.ingredients.forEach(ingredient => {
            ingredients.push(ingredient.toLowerCase());
        });
    }

    // Добавляем дополнительные ингредиенты
    if (product.additions && Array.isArray(product.additions)) {
        product.additions.forEach(addition => {
            ingredients.push(addition.toLowerCase());
        });
    }

    return [...new Set(ingredients)]; // Убираем дубликаты
}

// Создание чекбоксов для ингредиентов
function createIngredientFilters(products) {
    const ingredientsContainer = document.querySelector('#filters-panel .grid');
    const allIngredients = new Set();

    // Собираем все уникальные ингредиенты из всех продуктов
    products.forEach(product => {
        const productIngredients = getProductIngredients(product);
        productIngredients.forEach(ingredient => {
            allIngredients.add(ingredient);
        });
    });

    // Создаем чекбоксы для каждого ингредиента
    const ingredientsHTML = Array.from(allIngredients).sort().map(ingredient => `
        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors border border-gray-700 rounded-xl">
            <input type="checkbox" value="${ingredient}" class="rounded border-gray-600 bg-gray-700 text-accent-yellow focus:ring-accent-yellow">
            <span class="text-sm capitalize">${ingredient}</span>
        </label>
    `).join('');

    ingredientsContainer.innerHTML = ingredientsHTML;
}

// Загрузка продуктов из API
async function loadProducts() {
    try {
        const response = await fetch('http://localhost/api/main/get_products');
        const data = await response.json();

        if (data.products && data.products.length > 0) {
            allProducts = data.products;
            createIngredientFilters(data.products);
            renderProducts(data.products);
            if (typeof updateFavoriteButtons === 'function') {
                updateFavoriteButtons();
            }
        } else {
            // Если API вернуло пустой ответ
            showEmptyState();
        }
    } catch (error) {
        console.error('Ошибка загрузки продуктов:', error);
        // Просто показываем пустое состояние при ошибке
        showEmptyState();
    }
}

// Показать состояние "нет продуктов"
function showEmptyState() {
    const containers = ['pizzas', 'snacks', 'drinks'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-pizza-slice text-6xl text-gray-700 mb-4"></i>
                    <h3 class="text-2xl font-bold mb-2">Продукты временно недоступны</h3>
                    <p class="text-gray-400">Попробуйте обновить страницу позже</p>
                </div>
            `;
        }
    });
}

// Рендер продуктов по категориям
function renderProducts(products) {
    const pizzas = products.filter(product => product.type === 'pizza');
    const snacks = products.filter(product => product.type === 'snack');
    const drinks = products.filter(product => product.type === 'drink');

    renderProductCategory('pizzas', pizzas);
    renderProductCategory('snacks', snacks);
    renderProductCategory('drinks', drinks);
}

// Рендер продуктов для конкретной категории
function renderProductCategory(categoryId, products) {
    const container = document.getElementById(categoryId);
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-search text-6xl text-gray-700 mb-4"></i>
                <h3 class="text-2xl font-bold mb-2">Ничего не найдено</h3>
                <p class="text-gray-400">Попробуйте изменить параметры фильтров</p>
            </div>
        `;
        return;
    }

    const productsHTML = products.map(product => createProductCard(product)).join('');
    container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">${productsHTML}</div>`;

    // Добавляем обработчики для кнопок добавления в корзину
    addCartEventListeners();
}

// Создание карточки продукта
function createProductCard(product) {
    const characteristics = product.characteristics || {};
    const ingredients = product.ingredients || [];
    const additions = product.additions || [];

    return `
        <div class="bg-card-bg rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 hover:shadow-xl group flex flex-col">
            <div class="h-48 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative overflow-hidden">
                <div class="w-32 h-32 rounded-full bg-accent-yellow/10 absolute -top-10 -right-10"></div>
                <div class="w-24 h-24 rounded-full bg-accent-red/10 absolute -bottom-10 -left-10"></div>
                <img src="/images/products/${product.preview_link}" alt="${product.name}" class="w-full h-full object-contain p-4">
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

                    <!-- Дополнительные ингредиенты -->
                    ${additions.length > 0 ? `
                        <div class="mb-3">
                            <p class="text-xs text-gray-500 mb-1">Дополнительно:</p>
                            <div class="flex flex-wrap gap-1">
                                ${additions.map(addition => `
                                    <span class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">${addition}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="flex justify-between items-center mt-auto">
                    <span class="text-accent-yellow font-bold text-lg">${product.cost} Ł</span>
                    <div class="flex space-x-2">
                        <button class="add-to-favorites w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all duration-300" data-product-id="${product.id}" title="Добавить в избранное">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="add-to-cart w-10 h-10 rounded-full bg-gradient-to-r from-accent-red to-red-700 hover:from-red-700 hover:to-accent-red text-white flex items-center justify-center transition-all duration-300 group" data-product-id="${product.id}">
                            <i class="fas fa-shopping-basket group-hover:scale-110 transition-transform"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Добавление обработчиков для кнопок добавления в корзину и избранное
function addCartEventListeners() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            const originalHTML = this.innerHTML;

            // Временное уведомление
            this.innerHTML = '<i class="fas fa-check"></i>';
            this.classList.remove('bg-gradient-to-r', 'from-accent-red', 'to-red-700', 'hover:from-red-700', 'hover:to-accent-red');
            this.classList.add('bg-green-600');

            setTimeout(() => {
                this.innerHTML = originalHTML;
                this.classList.remove('bg-green-600');
                this.classList.add('bg-gradient-to-r', 'from-accent-red', 'to-red-700', 'hover:from-red-700', 'hover:to-accent-red');
            }, 1500);
        });
    });
}

// Функция для рендера вкладки избранного
async function renderFavoritesTab() {
    const favoritesContainer = document.getElementById('favorites');

    try {
        const response = await fetch('http://localhost/api/orders/get_favorites');

        if (!response.ok) {
            throw new Error('Ошибка загрузки избранного');
        }

        const favorites = await response.json();

        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="far fa-heart text-6xl text-gray-700 mb-4"></i>
                    <h3 class="text-2xl font-bold mb-2">В избранном пока пусто</h3>
                    <p class="text-gray-400">Добавляйте товары в избранное, чтобы не потерять</p>
                </div>
            `;
            return;
        }

        // Преобразуем данные для использования существующей функции createProductCard
        const favoriteProducts = favorites.map(fav => fav.product_info);
        const productsHTML = favoriteProducts.map(product => createProductCard(product)).join('');

        favoritesContainer.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${productsHTML}
            </div>
        `;

        // Обновляем кнопки избранного
        if (typeof updateFavoriteButtons === 'function') {
            updateFavoriteButtons();
        }

        // Добавляем обработчики для кнопок
        addCartEventListeners();

    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        favoritesContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-gray-700 mb-4"></i>
                <h3 class="text-2xl font-bold mb-2">Ошибка загрузки избранного</h3>
                <p class="text-gray-400">Попробуйте обновить страницу позже</p>
            </div>
        `;
    }
}