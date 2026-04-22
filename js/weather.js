// Модуль погоды
const Weather = {
    cities: [],
    currentCity: null,
    forecast: null,         // массив прогнозов по дням
    currentWeather: null,   // первый день прогноза (сегодня)

    async loadCities() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/weather/cities`, {
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
                const city = this.cities.find(c => c.id === e.target.value);
                this.loadWeatherForCity(city);
            }
        });
    },

    async loadWeatherForCity(city) {
        this.currentCity = city;
        document.getElementById('current-weather').classList.add('hidden');
        document.getElementById('forecast').classList.add('hidden');
        try {
            const response = await fetch(
                `${CONFIG.API_BASE_URL}/weather/forecast?city=${encodeURIComponent(city.name)}`,
                { headers: Auth.getHeaders() }
            );
            if (!response.ok) throw new Error('Failed to load weather');
            const data = await response.json();
            // data = { city: "Москва", forecasts: [ { date, tempMax, tempMin, windSpeedMax, windGustMax, windDirection, cloudiness, rainMm, snowCm } ] }
            this.forecast = data.forecasts;
            if (this.forecast && this.forecast.length > 0) {
                this.currentWeather = this.forecast[0];   // первый день – сегодня/завтра
            } else {
                this.currentWeather = null;
            }
            this.displayWeather();
        } catch (error) {
            console.error('Error loading weather:', error);
            this.showError('Не удалось загрузить прогноз погоды');
        }
    },

    displayWeather() {
        const currentDiv = document.getElementById('current-weather');
        if (this.currentWeather) {
            // Вычисляем среднюю температуру за день
            const avgTemp = Math.round((this.currentWeather.tempMax + this.currentWeather.tempMin) / 2);
            const windSpeed = this.currentWeather.windSpeedMax;
            const description = `Облачность: ${this.currentWeather.cloudiness}%, ветер ${this.currentWeather.windDirection}`;
            currentDiv.innerHTML = `
                <div class="weather-icon">${this.getWeatherIconByClouds(this.currentWeather.cloudiness)}</div>
                <div class="temperature">${avgTemp}°C</div>
                <div class="description">${description}</div>
                <div class="details">
                    💧 Осадки: ${this.currentWeather.rainMm ? this.currentWeather.rainMm + ' мм' : '—'} | 
                    🌬 Ветер: ${windSpeed} м/с
                </div>
            `;
        } else {
            currentDiv.innerHTML = '<div class="error">Нет данных о погоде</div>';
        }
        currentDiv.classList.remove('hidden');

        // Отображаем прогноз на 3-5 дней
        const forecastList = document.getElementById('forecast-list');
        if (this.forecast && this.forecast.length > 0) {
            forecastList.innerHTML = this.forecast.map(day => `
                <div class="forecast-item">
                    <div class="forecast-date">${new Date(day.date).toLocaleDateString('ru-RU', {weekday: 'short', day: 'numeric'})}</div>
                    <div class="forecast-icon">${this.getWeatherIconByClouds(day.cloudiness)}</div>
                    <div class="forecast-temp">${Math.round(day.tempMax)}° / ${Math.round(day.tempMin)}°</div>
                    <div class="forecast-detail">💨 ${day.windSpeedMax} м/с</div>
                </div>
            `).join('');
        } else {
            forecastList.innerHTML = '<div class="error">Прогноз недоступен</div>';
        }
        document.getElementById('forecast').classList.remove('hidden');
    },

    // Простая иконка по облачности (можно улучшить)
    getWeatherIconByClouds(cloudiness, rainMm, snowCm) {
        if (snowCm > 0) return '❄️';
        if (rainMm > 0) return '🌧';
        if (cloudiness >= 80) return '☁️';
        if (cloudiness >= 30) return '⛅';
        return '☀️';
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