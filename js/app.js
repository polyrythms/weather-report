document.addEventListener('DOMContentLoaded', async () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.enableClosingConfirmation();
    }

    // Получаем код из URL (для старых ссылок)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('startapp');
    Auth.code = code;

    let token = Auth.getToken();

    // Если токена нет, пытаемся получить
    if (!token) {
        showLoading(true);
        try {
            if (code) {
                // Старая схема: обмен кода
                token = await Auth.exchangeCode();
            } else {
                // Новая схема: прямая авторизация через initData
                token = await Auth.exchangeInitData();
            }
            showLoading(false);
        } catch (error) {
            showLoading(false);
            if (code) {
                showExpiredCodeError(error.message);
            } else {
                showAuthError(error.message);
            }
            console.error('Auth error:', error);
            return;
        }
    }

    // Если токена всё ещё нет, показываем ошибку
    if (!token) {
        showAuthError('Не удалось получить токен доступа.');
        return;
    }

    // Загружаем города и погоду
    showLoading(true);
    try {
        await Weather.loadCities();
        showLoading(false);
        document.getElementById('weather-container').classList.remove('hidden');

        const lastCityId = localStorage.getItem('last_city');
        if (lastCityId && Weather.cities.find(c => c.id == lastCityId)) {
            const city = Weather.cities.find(c => c.id == lastCityId);
            document.getElementById('city-select').value = lastCityId;
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

// Специальная обработка для просроченного/использованного кода (старая схема)
function showExpiredCodeError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `
        <strong>❌ ${message}</strong><br><br>
        <button onclick="window.location.href='https://t.me/DenisJavaStudyBOT'"
                style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 10px; cursor: pointer;">
            📱 Открыть бота
        </button>
        <button onclick="navigator.clipboard.writeText('/weather')"
                style="background: #764ba2; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 10px; margin-left: 10px; cursor: pointer;">
            📋 Скопировать команду /weather
        </button>
    `;
    errorDiv.classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
}

window.addEventListener('beforeunload', () => {
    const select = document.getElementById('city-select');
    if (select && select.value) {
        localStorage.setItem('last_city', select.value);
    }
});