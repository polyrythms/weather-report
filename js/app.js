// Главный модуль приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.enableClosingConfirmation();
    }

    // Проверка аутентификации
    if (!Auth.init()) {
        showAuthError();
        return;
    }

    // Загрузка данных
    await loadInitialData();
});

async function loadInitialData() {
    showLoading(true);

    try {
        await Weather.loadCities();
        showLoading(false);
        document.getElementById('weather-container').classList.remove('hidden');

        // Если есть сохраненный город, загружаем его
        const lastCity = localStorage.getItem('last_city');
        if (lastCity && Weather.cities.find(c => c.id == lastCity)) {
            const city = Weather.cities.find(c => c.id == lastCity);
            document.getElementById('city-select').value = lastCity;
            await Weather.loadWeatherForCity(city);
        }

    } catch (error) {
        showLoading(false);
        Weather.showError(error.message);
        console.error('Initialization error:', error);
    }
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    const container = document.getElementById('weather-container');

    if (show) {
        loadingDiv.classList.remove('hidden');
        container.classList.add('hidden');
    } else {
        loadingDiv.classList.add('hidden');
    }
}

function showAuthError() {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `
        <strong>❌ Ошибка авторизации</strong><br>
        Пожалуйста, используйте команду <strong>/weather</strong> в Telegram боте для доступа к прогнозу погоды.
    `;
    errorDiv.classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
}

// Сохраняем выбранный город
window.addEventListener('beforeunload', () => {
    const select = document.getElementById('city-select');
    if (select && select.value) {
        localStorage.setItem('last_city', select.value);
    }
});