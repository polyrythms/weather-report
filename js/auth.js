// Модуль аутентификации
const Auth = {
    token: null,

    init() {
        // Пытаемся получить токен из Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            this.token = tg.initDataUnsafe?.auth_token || tg.initData;
            console.log('Token from Telegram WebApp:', !!this.token);
        }

        // Или из URL параметра
        if (!this.token) {
            const urlParams = new URLSearchParams(window.location.search);
            this.token = urlParams.get('token');
            console.log('Token from URL:', !!this.token);
        }

        // Сохраняем в localStorage для последующих запросов
        if (this.token) {
            localStorage.setItem('weather_token', this.token);
        } else {
            this.token = localStorage.getItem('weather_token');
        }

        return !!this.token;
    },

    getToken() {
        return this.token;
    },

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    },

    isAuthenticated() {
        return !!this.token;
    },

    logout() {
        this.token = null;
        localStorage.removeItem('weather_token');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.close();
        }
    }
};