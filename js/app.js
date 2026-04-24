document.addEventListener('DOMContentLoaded', async () => {
// Логируем initData при загрузке (только в консоль браузера)
    if (window.Telegram && window.Telegram.WebApp) {
        const initData = window.Telegram.WebApp.initData;
        const webApp = window.Telegram.WebApp;

        console.group('🔍 Telegram WebApp Debug Info');
        console.log('✓ WebApp object exists:', !!webApp);
        console.log('✓ initData length:', initData?.length || 0);
        console.log('✓ initData present:', !!initData);

        if (initData && initData.length > 0) {
            // Разбираем initData на параметры для анализа
            const params = {};
            initData.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    params[key] = decodeURIComponent(value);
                }
            });

            console.log('📋 Parsed parameters:', Object.keys(params));
            console.log('✓ hash present:', !!params.hash);
            console.log('✓ auth_date present:', !!params.auth_date);
            console.log('✓ user present:', !!params.user);
            console.log('✓ signature present:', !!params.signature);

            if (params.user) {
                try {
                    const user = JSON.parse(params.user);
                    console.log('👤 User info:', {
                        id: user.id,
                        username: user.username,
                        first_name: user.first_name,
                        language_code: user.language_code
                    });
                } catch (e) {
                    console.warn('Failed to parse user JSON');
                }
            }

            console.log('📝 Full initData (first 300 chars):', initData.substring(0, 300) + '...');
            console.log('🔑 Hash value:', params.hash);
            console.log('⏰ Auth date:', params.auth_date ? new Date(parseInt(params.auth_date) * 1000).toLocaleString() : 'missing');
        } else {
            console.warn('⚠️ initData is empty or missing!');
            console.log('Possible reasons:');
            console.log('  - Not opened from Telegram WebView');
            console.log('  - Telegram WebApp script not loaded properly');
            console.log('  - Mini App URL not configured correctly in BotFather');
        }

        console.groupEnd();
    }

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