// Модуль аутентификации
const Auth = {
    token: null,
    code: null,

    // Инициализация: получаем code из URL (для старых ссылок)
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.code = urlParams.get('startapp');
        if (this.code) {
            console.log('Code extracted from URL:', this.code);
        }
        return !!this.code;
    },


    async exchangeInitData() {
        let initData = '';
        if (window.Telegram && window.Telegram.WebApp) {
            initData = window.Telegram.WebApp.initData;
        }
        if (!initData) {
            throw new Error('No initData available. Please open this app from Telegram.');
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData: initData })
        });

        if (!response.ok) {
            let errorMessage = 'Ошибка авторизации';
            if (response.status === 403) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.accessToken || 'Доступ запрещён. Возможно, вы не состоите в разрешённой группе.';
                } catch (e) {
                    errorMessage = 'Доступ запрещён. Пожалуйста, убедитесь, что вы участник разрешённой группы.';
                }
            } else if (response.status === 400) {
                errorMessage = 'Неверный запрос. Попробуйте позже.';
            } else {
                errorMessage = `Ошибка сервера (${response.status})`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        this.token = data.accessToken;
        localStorage.setItem('weather_token', this.token);
        return this.token;
    },

    // Старый метод (оставлен для совместимости со старыми ссылками)
    async exchangeCode() {
        if (!this.code) {
            throw new Error('No code to exchange');
        }

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
            let errorMessage = 'Ошибка авторизации';
            if (response.status === 400 || response.status === 401) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || 'Ссылка устарела или уже использована. Получите новую командой /weather';
                } catch (e) {
                    errorMessage = 'Ссылка недействительна. Используйте команду /weather для получения новой ссылки.';
                }
            } else {
                errorMessage = `Ошибка сервера (${response.status})`;
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