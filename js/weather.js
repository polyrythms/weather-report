// Модуль погоды
const Weather = {
    cities: [],
    currentCity: null,
    currentWeather: null,
    forecast: null,

    async loadCities() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/weather/cities`, {
                headers: Auth.getHeaders(),
                signal: AbortSignal.timeout(CONFIG.TIMEOUT)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.cities = await response.json();
            this.updateCitySelector();
            return this.cities;

        } catch (error) {
            console.error('Error loading cities:', error);
            throw new Error('Не удалось загрузить список городов. Проверьте подключение к серверу.');
        }
    },

    updateCitySelector() {
        const select = document.getElementById('city-select');
        select.innerHTML = '<option value="">Выберите город</option>';

        this.cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.name;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            if (e.target.value) {
                const city = this.cities.find(c => c.id == e.target.value);
                this.loadWeatherForCity(city);
            }
        });
    },

    async loadWeatherForCity(city) {
        this.currentCity = city;
        document.getElementById('current-weather').classList.add('hidden');
        document.getElementById('forecast').classList.add('hidden');

        try {
            // Загружаем текущую погоду
            const weatherResponse = await fetch(
                `${CONFIG.API_BASE_URL}/api/weather/current?city=${city.id}`,
                { headers: Auth.getHeaders() }
            );

            if (!weatherResponse.ok) throw new Error('Failed to load weather');
            this.currentWeather = await weatherResponse.json();

            // Загружаем прогноз
            const forecastResponse = await fetch(
                `${CONFIG.API_BASE_URL}/api/weather/forecast?city=${city.id}`,
                { headers: Auth.getHeaders() }
            );

            if (!forecastResponse.ok) throw new Error('Failed to load forecast');
            this.forecast = await forecastResponse.json();

            this.displayWeather();

        } catch (error) {
            console.error('Error loading weather:', error);
            this.showError('Не удалось загрузить прогноз погоды');
        }
    },

    displayWeather() {
        // Отображаем текущую погоду
        const currentDiv = document.getElementById('current-weather');
        currentDiv.innerHTML = `
            <div class="weather-icon">${this.getWeatherIcon(this.currentWeather.icon)}</div>
            <div class="temperature">${Math.round(this.currentWeather.temp)}°C</div>
            <div class="description">${this.currentWeather.description}</div>
            <div class="details">
                Влажность: ${this.currentWeather.humidity}% | 
                Ветер: ${this.currentWeather.wind_speed} м/с
            </div>
        `;
        currentDiv.classList.remove('hidden');

        // Отображаем прогноз
        const forecastList = document.getElementById('forecast-list');
        forecastList.innerHTML = this.forecast.map(day => `
            <div class="forecast-item">
                <div class="forecast-date">${new Date(day.date).toLocaleDateString('ru-RU', {weekday: 'short'})}</div>
                <div class="forecast-icon">${this.getWeatherIcon(day.icon)}</div>
                <div class="forecast-temp">${Math.round(day.temp_max)}°/${Math.round(day.temp_min)}°</div>
            </div>
        `).join('');

        document.getElementById('forecast').classList.remove('hidden');
    },

    getWeatherIcon(iconCode) {
        const icons = {
            '01d': '☀️', '01n': '🌙',
            '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧', '09n': '🌧',
            '10d': '🌦', '10n': '🌧',
            '11d': '⛈', '11n': '⛈',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫', '50n': '🌫'
        };
        return icons[iconCode] || '🌡️';
    },

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }
};