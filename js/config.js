const CONFIG = {
    // API URL вашего VPS сервера
    API_BASE_URL: 'https://2.27.20.149',

    // Версия API
    API_VERSION: 'v1',

    // Таймаут запросов (мс)
    TIMEOUT: 30000
};

// Определяем окружение
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.API_BASE_URL = 'https://localhost:443';
} else if (window.location.hostname === 'polyrythms.github.io') {
    // Для GitHub Pages - используем IP сервера из переменной окружения
    // Это значение будет заменено при деплое
    console.log('Running on GitHub Pages');
}