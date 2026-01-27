/**
 * Lake Champlain & Hudson River Boater's Guide
 * Main Application JavaScript
 *
 * Features:
 * - Interactive Leaflet map with custom markers
 * - Distance calculation using Haversine formula
 * - Unit conversion (nautical miles, miles, km)
 * - Travel time estimation based on vessel speed
 * - Touch-friendly UI for tablets and large screens
 * - Offline-capable calculations (no server needed)
 */

(function() {
    'use strict';

    // ============================================
    // Application State
    // ============================================
    const state = {
        map: null,
        markers: {},
        routeLine: null,
        startPoint: null,
        endPoint: null,
        currentUnit: 'nm',
        vesselSpeed: 15,
        currentFilter: 'all',
        searchQuery: '',
        isMobile: window.innerWidth <= 900
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        map: document.getElementById('map'),
        sidePanel: document.getElementById('sidePanel'),
        menuToggle: document.getElementById('menuToggle'),
        startPoint: document.getElementById('startPoint'),
        endPoint: document.getElementById('endPoint'),
        swapPoints: document.getElementById('swapPoints'),
        unitSelect: document.getElementById('unitSelect'),
        vesselSpeed: document.getElementById('vesselSpeed'),
        speedUnit: document.getElementById('speedUnit'),
        tripResults: document.getElementById('tripResults'),
        distanceValue: document.getElementById('distanceValue'),
        timeValue: document.getElementById('timeValue'),
        calculateBtn: document.getElementById('calculateBtn'),
        clearBtn: document.getElementById('clearBtn'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        locationSearch: document.getElementById('locationSearch'),
        locationList: document.getElementById('locationList'),
        locationCount: document.getElementById('locationCount'),
        quickInfo: document.getElementById('quickInfo'),
        quickInfoTitle: document.getElementById('quickInfoTitle'),
        quickInfoType: document.getElementById('quickInfoType'),
        quickInfoDesc: document.getElementById('quickInfoDesc'),
        closeQuickInfo: document.getElementById('closeQuickInfo'),
        setAsStart: document.getElementById('setAsStart'),
        setAsEnd: document.getElementById('setAsEnd'),
        legendToggle: document.getElementById('legendToggle'),
        legendContent: document.getElementById('legendContent'),
        loadingOverlay: document.getElementById('loadingOverlay')
    };

    // ============================================
    // Haversine Distance Calculation
    // ============================================
    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lng1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lng2 - Longitude of point 2
     * @returns {number} Distance in kilometers
     */
    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // ============================================
    // Unit Conversion
    // ============================================
    /**
     * Convert distance from kilometers to selected unit
     * @param {number} km - Distance in kilometers
     * @param {string} unit - Target unit (nm, mi, km)
     * @returns {number} Converted distance
     */
    function convertDistance(km, unit) {
        return km * UNIT_CONVERSIONS[unit].factor;
    }

    /**
     * Format distance with appropriate precision
     * @param {number} distance - Distance value
     * @param {string} unit - Unit abbreviation
     * @returns {string} Formatted distance string
     */
    function formatDistance(distance, unit) {
        if (distance < 1) {
            return distance.toFixed(2) + ' ' + unit;
        } else if (distance < 10) {
            return distance.toFixed(1) + ' ' + unit;
        } else {
            return Math.round(distance) + ' ' + unit;
        }
    }

    // ============================================
    // Travel Time Calculation
    // ============================================
    /**
     * Calculate travel time based on distance and speed
     * @param {number} distanceKm - Distance in kilometers
     * @param {number} speed - Vessel speed in current unit
     * @param {string} unit - Current unit system
     * @returns {number} Time in hours
     */
    function calculateTravelTime(distanceKm, speed, unit) {
        // Convert distance to current unit
        const distance = convertDistance(distanceKm, unit);
        // Time = Distance / Speed
        return distance / speed;
    }

    /**
     * Format time in hours and minutes
     * @param {number} hours - Time in hours
     * @returns {string} Formatted time string
     */
    function formatTime(hours) {
        if (hours < 0.0167) { // Less than 1 minute
            return '< 1 min';
        }

        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;

        if (h === 0) {
            return m + ' min';
        } else if (m === 0) {
            return h + (h === 1 ? ' hour' : ' hours');
        } else {
            return h + 'h ' + m + 'm';
        }
    }

    // ============================================
    // Map Initialization
    // ============================================
    function initMap() {
        // Create map instance
        state.map = L.map('map', {
            center: [MAP_CENTER.lat, MAP_CENTER.lng],
            zoom: MAP_CENTER.zoom,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            touchZoom: true,
            dragging: true,
            tap: true,
            maxBounds: [
                [MAP_BOUNDS.south, MAP_BOUNDS.west],
                [MAP_BOUNDS.north, MAP_BOUNDS.east]
            ],
            maxBoundsViscosity: 0.8
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
            minZoom: 7
        }).addTo(state.map);

        // Add markers for all points of interest
        addMarkers();

        // Hide loading overlay
        setTimeout(() => {
            elements.loadingOverlay.classList.add('hidden');
        }, 500);
    }

    // ============================================
    // Custom Marker Creation
    // ============================================
    function createCustomIcon(type, isSelected = false, isStart = false, isEnd = false) {
        const config = TYPE_CONFIG[type];
        let className = `custom-marker ${type}`;

        if (isSelected) className += ' selected';
        if (isStart) className += ' start';
        if (isEnd) className += ' end';

        return L.divIcon({
            className: 'custom-marker-wrapper',
            html: `<div class="${className}">${config.icon}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -20]
        });
    }

    function addMarkers() {
        POINTS_OF_INTEREST.forEach(poi => {
            const icon = createCustomIcon(poi.type);
            const marker = L.marker([poi.lat, poi.lng], { icon: icon })
                .addTo(state.map);

            // Create popup content
            const popupContent = `
                <strong>${poi.name}</strong><br>
                <em>${TYPE_CONFIG[poi.type].name}</em><br>
                <small>${poi.description.substring(0, 100)}${poi.description.length > 100 ? '...' : ''}</small>
            `;
            marker.bindPopup(popupContent);

            // Store reference
            state.markers[poi.id] = {
                marker: marker,
                poi: poi
            };

            // Add click handler
            marker.on('click', () => {
                showQuickInfo(poi);
            });
        });
    }

    // ============================================
    // Update Marker Appearance
    // ============================================
    function updateMarkerAppearance(poiId, isStart = false, isEnd = false) {
        const markerData = state.markers[poiId];
        if (!markerData) return;

        const icon = createCustomIcon(markerData.poi.type, true, isStart, isEnd);
        markerData.marker.setIcon(icon);
    }

    function resetMarkerAppearance(poiId) {
        const markerData = state.markers[poiId];
        if (!markerData) return;

        const icon = createCustomIcon(markerData.poi.type);
        markerData.marker.setIcon(icon);
    }

    // ============================================
    // Populate Dropdowns
    // ============================================
    function populateDropdowns() {
        // Sort POIs alphabetically
        const sortedPOIs = [...POINTS_OF_INTEREST].sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // Clear existing options (keep placeholder)
        elements.startPoint.innerHTML = '<option value="">Select starting point...</option>';
        elements.endPoint.innerHTML = '<option value="">Select destination...</option>';

        // Group by type for better organization
        const grouped = {};
        sortedPOIs.forEach(poi => {
            if (!grouped[poi.type]) {
                grouped[poi.type] = [];
            }
            grouped[poi.type].push(poi);
        });

        // Add options grouped by type
        const typeOrder = ['marina', 'restaurant', 'bay', 'historic', 'fuel', 'anchorage'];

        typeOrder.forEach(type => {
            if (grouped[type] && grouped[type].length > 0) {
                const config = TYPE_CONFIG[type];
                const optgroup1 = document.createElement('optgroup');
                optgroup1.label = config.icon + ' ' + config.name + 's';
                const optgroup2 = optgroup1.cloneNode(true);

                grouped[type].forEach(poi => {
                    const option1 = document.createElement('option');
                    option1.value = poi.id;
                    option1.textContent = poi.name;
                    optgroup1.appendChild(option1);

                    const option2 = option1.cloneNode(true);
                    optgroup2.appendChild(option2);
                });

                elements.startPoint.appendChild(optgroup1);
                elements.endPoint.appendChild(optgroup2);
            }
        });

        // Set default start location
        elements.startPoint.value = DEFAULT_START_LOCATION;
        state.startPoint = DEFAULT_START_LOCATION;
        updateMarkerAppearance(DEFAULT_START_LOCATION, true, false);
    }

    // ============================================
    // Populate Location List
    // ============================================
    function populateLocationList() {
        // Filter POIs based on current filter and search
        let filteredPOIs = [...POINTS_OF_INTEREST];

        // Apply type filter
        if (state.currentFilter !== 'all') {
            filteredPOIs = filteredPOIs.filter(poi => poi.type === state.currentFilter);
        }

        // Apply search filter
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filteredPOIs = filteredPOIs.filter(poi =>
                poi.name.toLowerCase().includes(query) ||
                poi.description.toLowerCase().includes(query)
            );
        }

        // Sort: featured first, then alphabetically
        filteredPOIs.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return a.name.localeCompare(b.name);
        });

        // Update count
        elements.locationCount.textContent = filteredPOIs.length;

        // Clear list
        elements.locationList.innerHTML = '';

        // Add items
        filteredPOIs.forEach(poi => {
            const config = TYPE_CONFIG[poi.type];
            const li = document.createElement('li');
            li.className = 'location-item';
            li.dataset.poiId = poi.id;

            if (poi.id === state.startPoint || poi.id === state.endPoint) {
                li.classList.add('selected');
            }

            li.innerHTML = `
                <div class="poi-marker ${poi.type}">${config.icon}</div>
                <div class="poi-info">
                    <div class="poi-name">${poi.name}</div>
                    <div class="poi-type-label">${config.name}</div>
                </div>
            `;

            li.addEventListener('click', () => {
                handleLocationClick(poi);
            });

            elements.locationList.appendChild(li);
        });
    }

    // ============================================
    // Handle Location Click
    // ============================================
    function handleLocationClick(poi) {
        // Pan to location
        state.map.setView([poi.lat, poi.lng], 12);

        // Show quick info
        showQuickInfo(poi);

        // Close side panel on mobile
        if (state.isMobile) {
            elements.sidePanel.classList.remove('open');
            elements.menuToggle.classList.remove('active');
        }
    }

    // ============================================
    // Quick Info Panel
    // ============================================
    let currentQuickInfoPoi = null;

    function showQuickInfo(poi) {
        currentQuickInfoPoi = poi;
        const config = TYPE_CONFIG[poi.type];

        elements.quickInfoTitle.textContent = poi.name;
        elements.quickInfoType.textContent = config.icon + ' ' + config.name;
        elements.quickInfoDesc.textContent = poi.description;

        elements.quickInfo.classList.remove('hidden');
    }

    function hideQuickInfo() {
        elements.quickInfo.classList.add('hidden');
        currentQuickInfoPoi = null;
    }

    // ============================================
    // Set Start/End Points
    // ============================================
    function setStartPoint(poiId) {
        // Reset previous start marker
        if (state.startPoint) {
            resetMarkerAppearance(state.startPoint);
        }

        state.startPoint = poiId;
        elements.startPoint.value = poiId;

        // Update marker
        updateMarkerAppearance(poiId, true, false);

        // Update location list
        populateLocationList();

        // Calculate if both points are set
        if (state.startPoint && state.endPoint) {
            calculateRoute();
        }

        hideQuickInfo();
    }

    function setEndPoint(poiId) {
        // Reset previous end marker
        if (state.endPoint && state.endPoint !== state.startPoint) {
            resetMarkerAppearance(state.endPoint);
        }

        state.endPoint = poiId;
        elements.endPoint.value = poiId;

        // Update marker
        updateMarkerAppearance(poiId, false, true);

        // Update location list
        populateLocationList();

        // Calculate if both points are set
        if (state.startPoint && state.endPoint) {
            calculateRoute();
        }

        hideQuickInfo();
    }

    // ============================================
    // Calculate Route
    // ============================================
    function calculateRoute() {
        if (!state.startPoint || !state.endPoint) {
            elements.tripResults.classList.add('hidden');
            return;
        }

        const startPoi = POINTS_OF_INTEREST.find(p => p.id === state.startPoint);
        const endPoi = POINTS_OF_INTEREST.find(p => p.id === state.endPoint);

        if (!startPoi || !endPoi) return;

        // Calculate distance in km
        const distanceKm = calculateDistance(
            startPoi.lat, startPoi.lng,
            endPoi.lat, endPoi.lng
        );

        // Convert to current unit
        const unit = state.currentUnit;
        const distance = convertDistance(distanceKm, unit);
        const unitAbbr = UNIT_CONVERSIONS[unit].abbr;

        // Calculate travel time
        const travelTime = calculateTravelTime(distanceKm, state.vesselSpeed, unit);

        // Update display
        elements.distanceValue.textContent = formatDistance(distance, unitAbbr);
        elements.timeValue.textContent = formatTime(travelTime);
        elements.tripResults.classList.remove('hidden');

        // Draw route line
        drawRouteLine(startPoi, endPoi);

        // Fit map to show both points
        const bounds = L.latLngBounds(
            [startPoi.lat, startPoi.lng],
            [endPoi.lat, endPoi.lng]
        );
        state.map.fitBounds(bounds, { padding: [50, 50] });
    }

    // ============================================
    // Draw Route Line
    // ============================================
    function drawRouteLine(startPoi, endPoi) {
        // Remove existing line
        if (state.routeLine) {
            state.map.removeLayer(state.routeLine);
        }

        // Create new line
        state.routeLine = L.polyline([
            [startPoi.lat, startPoi.lng],
            [endPoi.lat, endPoi.lng]
        ], {
            color: '#1a5f7a',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10',
            lineCap: 'round'
        }).addTo(state.map);
    }

    function clearRouteLine() {
        if (state.routeLine) {
            state.map.removeLayer(state.routeLine);
            state.routeLine = null;
        }
    }

    // ============================================
    // Clear Selection
    // ============================================
    function clearSelection() {
        // Reset markers
        if (state.startPoint) {
            resetMarkerAppearance(state.startPoint);
        }
        if (state.endPoint) {
            resetMarkerAppearance(state.endPoint);
        }

        // Clear state
        state.startPoint = null;
        state.endPoint = null;

        // Reset dropdowns
        elements.startPoint.value = '';
        elements.endPoint.value = '';

        // Hide results
        elements.tripResults.classList.add('hidden');

        // Clear route line
        clearRouteLine();

        // Update location list
        populateLocationList();

        // Reset map view
        state.map.setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_CENTER.zoom);
    }

    // ============================================
    // Filter Markers on Map
    // ============================================
    function filterMarkers(type) {
        Object.values(state.markers).forEach(({ marker, poi }) => {
            if (type === 'all' || poi.type === type) {
                marker.addTo(state.map);
            } else {
                state.map.removeLayer(marker);
            }
        });
    }

    // ============================================
    // Event Listeners
    // ============================================
    function initEventListeners() {
        // Menu toggle (mobile)
        elements.menuToggle.addEventListener('click', () => {
            elements.sidePanel.classList.toggle('open');
            elements.menuToggle.classList.toggle('active');
        });

        // Start point change
        elements.startPoint.addEventListener('change', (e) => {
            if (state.startPoint) {
                resetMarkerAppearance(state.startPoint);
            }
            if (e.target.value) {
                setStartPoint(e.target.value);
                // Pan to start point
                const poi = POINTS_OF_INTEREST.find(p => p.id === e.target.value);
                if (poi) {
                    state.map.setView([poi.lat, poi.lng], 11);
                }
            } else {
                state.startPoint = null;
                elements.tripResults.classList.add('hidden');
                clearRouteLine();
            }
        });

        // End point change
        elements.endPoint.addEventListener('change', (e) => {
            if (state.endPoint) {
                resetMarkerAppearance(state.endPoint);
            }
            if (e.target.value) {
                setEndPoint(e.target.value);
            } else {
                state.endPoint = null;
                elements.tripResults.classList.add('hidden');
                clearRouteLine();
            }
        });

        // Swap points
        elements.swapPoints.addEventListener('click', () => {
            const tempStart = state.startPoint;
            const tempEnd = state.endPoint;

            // Reset both markers
            if (tempStart) resetMarkerAppearance(tempStart);
            if (tempEnd) resetMarkerAppearance(tempEnd);

            // Swap
            if (tempEnd) setStartPoint(tempEnd);
            if (tempStart) setEndPoint(tempStart);

            // Recalculate
            if (state.startPoint && state.endPoint) {
                calculateRoute();
            }
        });

        // Unit change
        elements.unitSelect.addEventListener('change', (e) => {
            state.currentUnit = e.target.value;
            elements.speedUnit.textContent = UNIT_CONVERSIONS[e.target.value].speedUnit;

            // Recalculate if route exists
            if (state.startPoint && state.endPoint) {
                calculateRoute();
            }
        });

        // Speed change
        elements.vesselSpeed.addEventListener('change', (e) => {
            state.vesselSpeed = parseFloat(e.target.value) || 15;

            // Recalculate if route exists
            if (state.startPoint && state.endPoint) {
                calculateRoute();
            }
        });

        // Speed input (also update on input for immediate feedback)
        elements.vesselSpeed.addEventListener('input', (e) => {
            state.vesselSpeed = parseFloat(e.target.value) || 15;

            if (state.startPoint && state.endPoint) {
                calculateRoute();
            }
        });

        // Calculate button
        elements.calculateBtn.addEventListener('click', calculateRoute);

        // Clear button
        elements.clearBtn.addEventListener('click', clearSelection);

        // Filter buttons
        elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                elements.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Apply filter
                state.currentFilter = btn.dataset.filter;
                filterMarkers(state.currentFilter);
                populateLocationList();
            });
        });

        // Location search
        elements.locationSearch.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            populateLocationList();
        });

        // Quick info close
        elements.closeQuickInfo.addEventListener('click', hideQuickInfo);

        // Set as start button
        elements.setAsStart.addEventListener('click', () => {
            if (currentQuickInfoPoi) {
                setStartPoint(currentQuickInfoPoi.id);
            }
        });

        // Set as end button
        elements.setAsEnd.addEventListener('click', () => {
            if (currentQuickInfoPoi) {
                setEndPoint(currentQuickInfoPoi.id);
            }
        });

        // Legend toggle
        elements.legendToggle.addEventListener('click', () => {
            elements.legendContent.classList.toggle('hidden');
        });

        // Close quick info on map click
        state.map.on('click', (e) => {
            // Only hide if clicking on map, not on a marker
            if (!e.originalEvent.target.closest('.custom-marker-wrapper')) {
                hideQuickInfo();
            }
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                state.isMobile = window.innerWidth <= 900;
                state.map.invalidateSize();
            }, 250);
        });

        // Close side panel when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (state.isMobile &&
                elements.sidePanel.classList.contains('open') &&
                !elements.sidePanel.contains(e.target) &&
                !elements.menuToggle.contains(e.target)) {
                elements.sidePanel.classList.remove('open');
                elements.menuToggle.classList.remove('active');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape closes panels
            if (e.key === 'Escape') {
                hideQuickInfo();
                if (state.isMobile) {
                    elements.sidePanel.classList.remove('open');
                    elements.menuToggle.classList.remove('active');
                }
                elements.legendContent.classList.add('hidden');
            }
        });
    }

    // ============================================
    // Save/Load Preferences (Local Storage)
    // ============================================
    function savePreferences() {
        const prefs = {
            unit: state.currentUnit,
            speed: state.vesselSpeed
        };
        try {
            localStorage.setItem('boatersGuidePrefs', JSON.stringify(prefs));
        } catch (e) {
            // Local storage not available
        }
    }

    function loadPreferences() {
        try {
            const prefs = JSON.parse(localStorage.getItem('boatersGuidePrefs'));
            if (prefs) {
                if (prefs.unit) {
                    state.currentUnit = prefs.unit;
                    elements.unitSelect.value = prefs.unit;
                    elements.speedUnit.textContent = UNIT_CONVERSIONS[prefs.unit].speedUnit;
                }
                if (prefs.speed) {
                    state.vesselSpeed = prefs.speed;
                    elements.vesselSpeed.value = prefs.speed;
                }
            }
        } catch (e) {
            // Local storage not available or invalid data
        }
    }

    // Save preferences when they change
    function initPreferenceSaving() {
        elements.unitSelect.addEventListener('change', savePreferences);
        elements.vesselSpeed.addEventListener('change', savePreferences);
    }

    // ============================================
    // Initialize Application
    // ============================================
    function init() {
        // Load saved preferences
        loadPreferences();

        // Initialize map
        initMap();

        // Populate UI elements
        populateDropdowns();
        populateLocationList();

        // Set up event listeners
        initEventListeners();

        // Set up preference saving
        initPreferenceSaving();

        // Set initial speed unit display
        elements.speedUnit.textContent = UNIT_CONVERSIONS[state.currentUnit].speedUnit;

        console.log('Lake Champlain & Hudson River Boater\'s Guide initialized');
    }

    // Start the application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
