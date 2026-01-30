/**
 * Weather Module for Lake Champlain & Hudson River Guide
 * Integrates NOAA marine weather data with map visualization
 *
 * Features:
 * - Current conditions from nearby weather stations
 * - Marine forecasts for Lake Champlain zones
 * - Active weather alerts and advisories
 * - Wind overlay with directional arrows
 * - 15-minute caching with localStorage
 * - Automatic refresh and error handling
 */

const WeatherModule = (function() {
    'use strict';

    // Configuration
    const CONFIG = {
        CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
        CACHE_KEY_PREFIX: 'weather_cache_',
        RETRY_DELAY: 5000, // 5 seconds
        MAX_RETRIES: 3,
        USER_AGENT: 'Lake-Champlain-Guide/1.0'
    };

    // Lake Champlain weather zones and stations
    const ZONES = {
        northern: {
            name: 'Northern Lake Champlain',
            description: 'Rouses Point to Burlington',
            stations: ['KBTV'], // Burlington VT Airport
            center: { lat: 44.8, lng: -73.25 }
        },
        southern: {
            name: 'Southern Lake Champlain',
            description: 'Burlington to Whitehall',
            stations: ['KSLK'], // Saranac Lake (nearby)
            center: { lat: 43.8, lng: -73.35 }
        }
    };

    // State
    let currentZone = 'northern';
    let weatherData = {
        current: null,
        forecast: null,
        alerts: null,
        winds: null,
        lastUpdate: null
    };
    let map = null;
    let windOverlayLayer = null;
    let refreshInterval = null;
    let isWindOverlayVisible = false;

    /**
     * Initialize weather module
     */
    function init(leafletMap, zone = 'northern') {
        map = leafletMap;
        currentZone = zone;

        console.log('=== Weather Module v2 Initialized ===');
        console.log('Zone:', currentZone);

        // Clear old cached data to force fresh fetch
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(CONFIG.CACHE_KEY_PREFIX)) {
                    localStorage.removeItem(key);
                    console.log('Cleared old cache:', key);
                }
            });
        } catch (e) {
            console.error('Error clearing cache:', e);
        }

        // Fetch fresh weather data (skip cache on init)
        refresh();

        // Set up auto-refresh
        refreshInterval = setInterval(refresh, CONFIG.CACHE_DURATION);

        console.log('Weather module initialized for zone:', currentZone);
    }

    /**
     * Refresh all weather data
     */
    async function refresh() {
        try {
            const zone = ZONES[currentZone];
            if (!zone) {
                console.error('Invalid weather zone:', currentZone);
                return;
            }

            // Show loading indicator
            updateLoadingState(true);

            // Fetch all data in parallel
            const [current, forecast, alerts, winds] = await Promise.all([
                fetchCurrentConditions(zone.stations[0]),
                fetchPointForecast(zone.center.lat, zone.center.lng),
                fetchAlerts(zone.center.lat, zone.center.lng),
                fetchWindData(zone.center.lat, zone.center.lng)
            ]);

            // Update state
            weatherData = {
                current,
                forecast,
                alerts,
                winds,
                lastUpdate: new Date()
            };

            // Cache the data
            cacheWeatherData();

            // Update UI
            renderWeatherWidget();

            // Update wind overlay if visible
            if (isWindOverlayVisible) {
                updateWindOverlay();
            }

            updateLoadingState(false);

        } catch (error) {
            console.error('Error refreshing weather:', error);
            updateLoadingState(false);
            showError('Failed to load weather data. Using cached data if available.');
        }
    }

    /**
     * Fetch current conditions from NOAA weather station
     */
    async function fetchCurrentConditions(stationId) {
        const url = `https://api.weather.gov/stations/${stationId}/observations/latest`;

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': CONFIG.USER_AGENT }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const props = data.properties;

            return {
                temperature: convertToFahrenheit(props.temperature),
                windSpeed: convertToKnots(props.windSpeed),
                windDirection: props.windDirection?.value || 0,
                windGust: convertToKnots(props.windGust),
                waveHeight: props.waveHeight?.value || null,
                visibility: props.visibility?.value || null,
                description: props.textDescription || 'N/A',
                timestamp: props.timestamp
            };
        } catch (error) {
            console.error('Error fetching current conditions:', error);
            return null;
        }
    }

    /**
     * Fetch point forecast for specific coordinates
     */
    async function fetchPointForecast(lat, lon) {
        try {
            // First, get the forecast grid endpoint for this location
            const pointUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
            const pointResponse = await fetch(pointUrl, {
                headers: { 'User-Agent': CONFIG.USER_AGENT }
            });

            if (!pointResponse.ok) {
                throw new Error(`HTTP ${pointResponse.status}`);
            }

            const pointData = await pointResponse.json();
            const forecastUrl = pointData.properties.forecast;

            // Now get the actual forecast
            const forecastResponse = await fetch(forecastUrl, {
                headers: { 'User-Agent': CONFIG.USER_AGENT }
            });

            if (!forecastResponse.ok) {
                throw new Error(`HTTP ${forecastResponse.status}`);
            }

            const data = await forecastResponse.json();
            const periods = data.properties.periods || [];

            // Return first 6 periods (typically 3 days with day/night)
            return periods.slice(0, 6).map(period => ({
                name: period.name,
                temperature: period.temperature,
                temperatureUnit: period.temperatureUnit,
                windSpeed: period.windSpeed,
                windDirection: period.windDirection,
                shortForecast: period.shortForecast,
                detailedForecast: period.detailedForecast,
                icon: period.icon,
                isDaytime: period.isDaytime
            }));
        } catch (error) {
            console.error('Error fetching point forecast:', error);
            return [];
        }
    }

    /**
     * Fetch active weather alerts for location
     */
    async function fetchAlerts(lat, lon) {
        const url = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': CONFIG.USER_AGENT }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const features = data.features || [];

            return features.map(alert => ({
                event: alert.properties.event,
                headline: alert.properties.headline,
                description: alert.properties.description,
                severity: alert.properties.severity,
                urgency: alert.properties.urgency,
                onset: alert.properties.onset,
                expires: alert.properties.expires
            }));
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }
    }

    /**
     * Fetch wind data for specific coordinates
     */
    async function fetchWindData(lat, lon) {
        try {
            // First get the gridpoint
            const pointUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
            const pointResponse = await fetch(pointUrl, {
                headers: { 'User-Agent': CONFIG.USER_AGENT }
            });

            if (!pointResponse.ok) {
                throw new Error(`HTTP ${pointResponse.status}`);
            }

            const pointData = await pointResponse.json();
            const forecastGridUrl = pointData.properties.forecastGridData;

            // Get gridpoint forecast data
            const gridResponse = await fetch(forecastGridUrl, {
                headers: { 'User-Agent': CONFIG.USER_AGENT }
            });

            if (!gridResponse.ok) {
                throw new Error(`HTTP ${gridResponse.status}`);
            }

            const gridData = await gridResponse.json();
            const windSpeed = gridData.properties.windSpeed?.values[0] || {};
            const windDirection = gridData.properties.windDirection?.values[0] || {};

            return {
                speed: convertToKnots({ value: windSpeed.value, unitCode: 'unit:km_h-1' }),
                direction: windDirection.value || 0,
                timestamp: windSpeed.validTime
            };
        } catch (error) {
            console.error('Error fetching wind data:', error);
            return null;
        }
    }

    /**
     * Render weather widget in side panel
     */
    function renderWeatherWidget() {
        const container = document.getElementById('weatherWidget');
        if (!container) {
            console.warn('Weather widget container not found');
            return;
        }

        let html = '';

        // Current Forecast (find the current or most relevant period)
        if (weatherData.forecast && weatherData.forecast.length > 0) {
            // Try to find the current period (not a future period)
            // Prefer daytime periods, or use the first period if none match
            let currentPeriod = weatherData.forecast[0];

            // If first period is "Tonight" or "Overnight", and there's a daytime period available, use that
            if ((currentPeriod.name.includes('Tonight') || currentPeriod.name.includes('Overnight')) &&
                weatherData.forecast.length > 1 && weatherData.forecast[1].isDaytime) {
                // Skip to next daytime period
                currentPeriod = weatherData.forecast.find(p => p.isDaytime) || weatherData.forecast[0];
            }

            const curr = weatherData.current;

            // Debug logging
            console.log('Available forecast periods:', weatherData.forecast.map(p => ({
                name: p.name,
                temp: p.temperature,
                isDaytime: p.isDaytime
            })));
            console.log('Displaying forecast temperature:', {
                temp: currentPeriod.temperature,
                unit: currentPeriod.temperatureUnit,
                period: currentPeriod.name,
                isDaytime: currentPeriod.isDaytime
            });

            html += `
                <div class="weather-current">
                    <div class="weather-temp">${currentPeriod.temperature}°${currentPeriod.temperatureUnit}</div>
                    <div class="weather-period">${currentPeriod.name}</div>
                    ${curr ? `
                        <div class="weather-wind">
                            Wind: ${formatWindDirection(curr.windDirection)} ${curr.windSpeed !== null ? Math.round(curr.windSpeed) + ' kts' : 'N/A'}
                            ${curr.windGust ? `, Gusts ${Math.round(curr.windGust)} kts` : ''}
                        </div>
                        <div class="weather-condition">${curr.description}</div>
                    ` : `
                        <div class="weather-wind">
                            Wind: ${currentPeriod.windSpeed} ${currentPeriod.windDirection}
                        </div>
                        <div class="weather-condition">${currentPeriod.shortForecast}</div>
                    `}
                </div>
            `;
        } else if (weatherData.current) {
            // Fallback to observation if no forecast available
            const curr = weatherData.current;
            html += `
                <div class="weather-current">
                    <div class="weather-temp">${curr.temperature !== null ? Math.round(curr.temperature) + '°F' : 'N/A'}</div>
                    <div class="weather-wind">
                        Wind: ${formatWindDirection(curr.windDirection)} ${curr.windSpeed !== null ? Math.round(curr.windSpeed) + ' kts' : 'N/A'}
                        ${curr.windGust ? `, Gusts ${Math.round(curr.windGust)} kts` : ''}
                    </div>
                    <div class="weather-condition">${curr.description}</div>
                </div>
            `;
        }

        // Forecast
        if (weatherData.forecast && weatherData.forecast.length > 0) {
            html += '<div class="weather-forecast">';

            // Group by day (combine day/night)
            const days = {};
            weatherData.forecast.forEach(period => {
                const day = period.name.includes('Night') ? period.name.replace(' Night', '') : period.name;
                if (!days[day]) days[day] = [];
                days[day].push(period);
            });

            // Display first 3 days
            Object.entries(days).slice(0, 3).forEach(([day, periods]) => {
                const dayPeriod = periods.find(p => p.isDaytime) || periods[0];
                html += `
                    <div class="forecast-day">
                        <div class="forecast-name">${day}</div>
                        <div class="forecast-temp">${dayPeriod.temperature}°${dayPeriod.temperatureUnit}</div>
                        <div class="forecast-wind">${dayPeriod.windSpeed}</div>
                        <div class="forecast-desc">${dayPeriod.shortForecast}</div>
                    </div>
                `;
            });

            html += '</div>';
        }

        // Active Alerts
        if (weatherData.alerts && weatherData.alerts.length > 0) {
            html += '<div class="weather-alerts">';
            weatherData.alerts.forEach(alert => {
                const severityClass = alert.severity.toLowerCase();
                html += `
                    <div class="weather-alert alert-${severityClass}">
                        <div class="alert-event">⚠️ ${alert.event}</div>
                        <div class="alert-headline">${alert.headline}</div>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Last Updated
        if (weatherData.lastUpdate) {
            const time = weatherData.lastUpdate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            html += `<div class="weather-updated">Last updated: ${time}</div>`;
        }

        // Weather Source Attribution
        const zoneName = ZONES[currentZone]?.name || 'Lake Champlain';
        const zoneCenter = ZONES[currentZone]?.center || { lat: 44.3, lng: -73.3 };
        const forecastUrl = `https://forecast.weather.gov/MapClick.php?lat=${zoneCenter.lat}&lon=${zoneCenter.lng}`;
        html += `
            <div class="weather-attribution">
                <p class="weather-source">
                    <strong>Forecast Area:</strong> ${zoneName}
                </p>
                <p class="weather-source">
                    Weather data provided by
                    <a href="${forecastUrl}" target="_blank" rel="noopener noreferrer">
                        NOAA
                    </a>
                </p>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Toggle wind overlay on map
     */
    function toggleWindOverlay(show) {
        isWindOverlayVisible = show;

        if (show) {
            updateWindOverlay();
        } else {
            removeWindOverlay();
        }
    }

    /**
     * Update wind overlay with current wind data
     */
    function updateWindOverlay() {
        if (!map || !weatherData.winds) return;

        // Remove existing overlay
        removeWindOverlay();

        // Create SVG overlay layer
        const bounds = map.getBounds();
        const windData = weatherData.winds;

        // Create grid of wind arrows across the visible map
        const arrows = [];
        const gridSize = 0.15; // degrees spacing

        for (let lat = bounds.getSouth(); lat <= bounds.getNorth(); lat += gridSize) {
            for (let lng = bounds.getWest(); lng <= bounds.getEast(); lng += gridSize) {
                arrows.push(createWindArrow(lat, lng, windData.speed, windData.direction));
            }
        }

        // Add arrows to map as SVG overlay
        windOverlayLayer = L.layerGroup(arrows).addTo(map);
    }

    /**
     * Create a single wind arrow marker
     */
    function createWindArrow(lat, lng, speed, direction) {
        // Determine color based on wind speed
        let color = '#4285f4'; // blue <10kts
        if (speed >= 30) color = '#ea4335'; // red >30kts
        else if (speed >= 20) color = '#fbbc04'; // yellow 20-30kts
        else if (speed >= 10) color = '#34a853'; // green 10-20kts

        // Create SVG arrow
        const size = Math.min(20 + speed / 2, 40); // Arrow size scales with wind speed
        const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="transform: rotate(${direction}deg);">
                <path d="M12 2 L12 18 M12 18 L8 14 M12 18 L16 14"
                      stroke="${color}"
                      stroke-width="2"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
            </svg>
        `;

        const icon = L.divIcon({
            html: svg,
            className: 'wind-arrow-icon',
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });

        const marker = L.marker([lat, lng], { icon, interactive: false });
        marker.bindTooltip(`${Math.round(speed)} kts ${formatWindDirection(direction)}`, {
            permanent: false,
            direction: 'top'
        });

        return marker;
    }

    /**
     * Remove wind overlay from map
     */
    function removeWindOverlay() {
        if (windOverlayLayer && map) {
            map.removeLayer(windOverlayLayer);
            windOverlayLayer = null;
        }
    }

    /**
     * Change weather zone
     */
    function setZone(zoneId) {
        if (ZONES[zoneId]) {
            currentZone = zoneId;
            refresh();
        }
    }

    /**
     * Cache weather data to localStorage
     */
    function cacheWeatherData() {
        try {
            const cacheData = {
                zone: currentZone,
                data: weatherData,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.CACHE_KEY_PREFIX + currentZone, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching weather data:', error);
        }
    }

    /**
     * Load cached weather data from localStorage
     */
    function loadCachedData() {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY_PREFIX + currentZone);
            if (!cached) return;

            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            // Use cache if less than cache duration old
            if (age < CONFIG.CACHE_DURATION) {
                weatherData = cacheData.data;
                renderWeatherWidget();
                console.log('Loaded weather from cache (age:', Math.round(age / 1000 / 60), 'minutes)');
            }
        } catch (error) {
            console.error('Error loading cached weather:', error);
        }
    }

    /**
     * Update loading state
     */
    function updateLoadingState(loading) {
        const refreshBtn = document.getElementById('refreshWeather');
        if (refreshBtn) {
            refreshBtn.disabled = loading;
            refreshBtn.textContent = loading ? 'Loading...' : 'Refresh';
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        // Use existing toast notification system if available
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            console.error('Weather error:', message);
        }
    }

    /**
     * Utility: Convert Celsius to Fahrenheit
     */
    function convertToFahrenheit(temp) {
        if (!temp || temp.value === null) return null;

        // Log for debugging
        console.log('Temperature conversion:', { value: temp.value, unitCode: temp.unitCode });

        // Check for Celsius unit codes (NOAA uses different formats)
        if (temp.unitCode === 'wmoUnit:degC' ||
            temp.unitCode === 'unit:degC' ||
            temp.unitCode === 'degC') {
            const converted = (temp.value * 9/5) + 32;
            console.log('Converting from Celsius:', temp.value, '°C →', converted, '°F');
            return converted;
        }

        // Already in Fahrenheit
        if (temp.unitCode === 'wmoUnit:degF' ||
            temp.unitCode === 'unit:degF' ||
            temp.unitCode === 'degF') {
            console.log('Already in Fahrenheit:', temp.value, '°F');
            return temp.value;
        }

        // Unknown unit code - log warning and return as-is
        console.warn('Unknown temperature unit code:', temp.unitCode, '- returning value as-is:', temp.value);
        return temp.value;
    }

    /**
     * Utility: Convert wind speed to knots
     */
    function convertToKnots(speed) {
        if (!speed || speed.value === null) return null;

        // km/h to knots
        if (speed.unitCode === 'unit:km_h-1') {
            return speed.value * 0.539957;
        }
        // m/s to knots
        if (speed.unitCode === 'unit:m_s-1') {
            return speed.value * 1.94384;
        }

        return speed.value;
    }

    /**
     * Utility: Format wind direction from degrees to compass heading
     */
    function formatWindDirection(degrees) {
        if (degrees === null || degrees === undefined) return 'N/A';

        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                          'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    /**
     * Cleanup on module unload
     */
    function destroy() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        removeWindOverlay();
    }

    // Public API
    return {
        init,
        refresh,
        toggleWindOverlay,
        setZone,
        destroy
    };
})();

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherModule;
}
