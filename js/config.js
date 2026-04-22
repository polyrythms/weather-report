const CONFIG = {
    API_BASE_URL: 'https://polyrythms.duckdns.org',  // ← замените IP на домен
    API_VERSION: 'v1',
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