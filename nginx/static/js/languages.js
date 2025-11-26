// Скрипт для переключения языков
document.addEventListener('DOMContentLoaded', function() {
    const languageButton = document.querySelectorAll('.group')[1].querySelector('button');
    const languageText = languageButton.querySelector('span');
    const languageDropdown = document.querySelectorAll('.group')[1].querySelector('.absolute');
    const languageItems = document.querySelectorAll('.group:nth-child(2) li');

    // Показываем/скрываем dropdown при клике на кнопку
    languageButton.addEventListener('click', function(event) {
        event.stopPropagation();
        languageDropdown.classList.toggle('hidden');
    });

    // Обработчики для элементов списка языков
    languageItems.forEach(item => {
        item.addEventListener('click', function() {
            const selectedLanguage = this.textContent.trim();
            languageText.textContent = selectedLanguage;
            languageDropdown.classList.add('hidden');
            console.log(`Выбран язык: ${selectedLanguage}`);
        });
    });

    // Закрываем dropdown при клике в любом месте страницы
    document.addEventListener('click', function() {
        languageDropdown.classList.add('hidden');
    });

    // Предотвращаем закрытие при клике внутри dropdown
    languageDropdown.addEventListener('click', function(event) {
        event.stopPropagation();
    });
});