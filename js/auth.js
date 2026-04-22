// Модуль аутентификации
const Auth = {
    token: null,
    code: null,

    // Инициализация: получаем code из URL
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.code = urlParams.get('startapp');
        if (this.code) {
            console.log('Code extracted from URL:', this.code);
        }
        return !!this.code;
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

        // Обработка ошибок с понятными сообщениями
        if (!response.ok) {
            let errorMessage = 'Ошибка авторизации';
            try {
                const errorData = await response.json();
                if (response.status === 500 && errorData.message && errorData.message.includes('Неверный или просроченный код')) {
                    errorMessage = 'Эта ссылка уже была использована или устарела. Пожалуйста, получите новую ссылку, отправив команду /weather в Telegram боте.';
                } else if (response.status === 401) {
                    errorMessage = 'Не авторизован. Пожалуйста, используйте команду /weather в Telegram боте.';
                } else {
                    errorMessage = `Ошибка сервера (${response.status})`;
                }
            } catch (e) {
                const errorText = await response.text();
                errorMessage = `Ошибка: ${response.status} ${errorText.substring(0, 100)}`;
            }
            throw new Error(errorMessage);
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