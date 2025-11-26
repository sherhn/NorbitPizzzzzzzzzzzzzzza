// Простая версия переключения городов
document.addEventListener('DOMContentLoaded', function() {
    const cityButton = document.querySelector('.group:first-child button');
    const cityText = cityButton.querySelector('span');
    const cityDropdown = document.querySelector('.group:first-child .absolute');
    const cityItems = document.querySelectorAll('.group:first-child li');

    // Показываем/скрываем dropdown при клике на кнопку
    cityButton.addEventListener('click', function(event) {
        event.stopPropagation();
        cityDropdown.classList.toggle('hidden');
    });

    // Обработчики для элементов списка городов
    cityItems.forEach(item => {
        item.addEventListener('click', function() {
            const selectedCity = this.textContent.trim();
            cityText.textContent = selectedCity;
            cityDropdown.classList.add('hidden');
            console.log(`Выбран город: ${selectedCity}`);
        });
    });

    // Закрываем dropdown при клике в любом месте страницы
    document.addEventListener('click', function() {
        cityDropdown.classList.add('hidden');
    });

    // Предотвращаем закрытие при клике внутри dropdown
    cityDropdown.addEventListener('click', function(event) {
        event.stopPropagation();
    });
});