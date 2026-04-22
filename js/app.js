document.addEventListener('DOMContentLoaded', async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.enableClosingConfirmation();
    }

    if (!Auth.init()) {
        showAuthError();
        return;
    }

    showLoading(true);
    try {
        // Обмениваем код на токен
        await Auth.exchangeCode();

        // Загружаем города и погоду
        await Weather.loadCities();
        showLoading(false);
        document.getElementById('weather-container').classList.remove('hidden');

        const lastCity = localStorage.getItem('last_city');
        if (lastCity && Weather.cities.find(c => c.id == lastCity)) {
            const city = Weather.cities.find(c => c.id == lastCity);
            document.getElementById('city-select').value = lastCity;
            await Weather.loadWeatherForCity(city);
        }
    } catch (error) {
        showLoading(false);
        showAuthError(error.message);
        console.error('Initialization error:', error);
    }
});

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

function showAuthError(message = 'Ошибка авторизации. Пожалуйста, используйте команду /weather в Telegram боте для доступа к прогнозу погоды.') {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `<strong>❌ ${message}</strong>`;
    errorDiv.classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
}

window.addEventListener('beforeunload', () => {
    const select = document.getElementById('city-select');
    if (select && select.value) {
        localStorage.setItem('last_city', select.value);
    }
});