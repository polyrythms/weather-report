// Модуль аутентификации
const Auth = {
    token: null,
    code: null,

    // Инициализация: получаем code из URL
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.code = urlParams.get('startapp');
        if (!this.code) {
            console.error('No startapp code found in URL');
            return false;
        }
        console.log('Code extracted from URL:', this.code);
        return true;
    },

    // Обмен кода на токен
    async exchangeCode() {
        if (!this.code) {
            throw new Error('No code to exchange');
        }

        // Получаем initData из Telegram WebApp (если есть)
        let initData = '';
        if (window.Telegram && window.Telegram.WebApp) {
            initData = window.Telegram.WebApp.initData;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/exchange`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: this.code,
                initData: initData
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Exchange failed: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        this.token = data.accessToken;
        localStorage.setItem('weather_token', this.token);
        return this.token;
    },

    getToken() {
        return this.token || localStorage.getItem('weather_token');
    },

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
        };
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    logout() {
        this.token = null;
        localStorage.removeItem('weather_token');
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.close();
        }
    }
};