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
        stops: [null, null],  // Array of POI IDs: [startId, stop1Id, stop2Id, ..., endId]
        currentUnit: 'nm',
        vesselSpeed: 15,
        currentFilter: 'all',
        searchQuery: '',
        isMobile: window.innerWidth <= 900
    };

    // Drag-and-drop state
    let draggedIndex = null;

    // Focus management state
    let lastFocusedElement = null;

    // ============================================
    // Toast Notification System
    // ============================================
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of toast: 'info', 'success', 'error', 'warning'
     * @param {number} duration - How long to show the toast in ms (default 3000)
     */
    function showToast(message, type = 'info', duration = 3000) {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.textContent = message;

        // Add to document
        document.body.appendChild(toast);

        // Trigger reflow for animation
        toast.offsetHeight;

        // Show toast
        toast.classList.add('visible');

        // Auto-hide after duration
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        map: document.getElementById('map'),
        sidePanel: document.getElementById('sidePanel'),
        menuToggle: document.getElementById('menuToggle'),
        stopsContainer: document.getElementById('stopsContainer'),
        addStopBtn: document.getElementById('addStopBtn'),
        unitSelect: document.getElementById('unitSelect'),
        vesselSpeed: document.getElementById('vesselSpeed'),
        speedUnit: document.getElementById('speedUnit'),
        tripResults: document.getElementById('tripResults'),
        itinerary: document.getElementById('itinerary'),
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
            tap: true
        });

        // Define base map layers
        const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 7
        });

        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri, Maxar, Earthstar Geographics',
            maxZoom: 19,
            minZoom: 7
        });

        // Esri World Topo Map (more reliable than OpenTopoMap)
        const topoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri, HERE, Garmin, USGS',
            maxZoom: 19,
            minZoom: 7
        });

        // NOAA Raster Nautical Charts (RNC) - Seamless service
        const noaaCharts = L.tileLayer('https://seamlessrnc.nauticalcharts.noaa.gov/arcgis/rest/services/RNC/NOAA_RNC/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; <a href="https://www.charts.noaa.gov">NOAA</a> Nautical Charts',
            maxZoom: 16,
            minZoom: 7,
            tileSize: 256,
            opacity: 1
        });

        // OpenSeaMap overlay (navigation aids symbols)
        const seaMarks = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openseamap.org">OpenSeaMap</a>',
            maxZoom: 18,
            minZoom: 7
        });

        // Add default layer to map
        streetMap.addTo(state.map);

        // Create base maps object for layer control
        const baseMaps = {
            "Street Map": streetMap,
            "Satellite": satellite,
            "Topographic": topoMap,
            "NOAA Charts": noaaCharts
        };

        // Create overlay maps (navigation aids overlay)
        const overlayMaps = {
            "Nav Aids (OpenSeaMap)": seaMarks
        };

        // Add layer control to map (top-right corner)
        L.control.layers(baseMaps, overlayMaps, {
            position: 'topright',
            collapsed: true
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
    function createCustomIcon(type, isSelected = false, isStart = false, isEnd = false, isIntermediate = false) {
        const config = TYPE_CONFIG[type];
        let className = `custom-marker ${type}`;

        if (isSelected) className += ' selected';
        if (isStart) className += ' start';
        if (isEnd) className += ' end';
        if (isIntermediate) className += ' intermediate';

        return L.divIcon({
            className: 'custom-marker-wrapper',
            html: `<div class="${className}">${config.icon}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
    }

    // Custom icon for Bridgeview Harbour Marina
    const bridgeviewIcon = L.icon({
        iconUrl: 'images/BridgeviewHarbourMarina_favicon_transparent.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });

    function addMarkers() {
        POINTS_OF_INTEREST.forEach(poi => {
            // Use custom icon for Bridgeview Harbour Marina
            const icon = poi.featured ? bridgeviewIcon : createCustomIcon(poi.type);
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

        // Keep custom icon for featured POI (Bridgeview Harbour Marina)
        if (markerData.poi.featured) {
            markerData.marker.setIcon(bridgeviewIcon);
        } else {
            const icon = createCustomIcon(markerData.poi.type, true, isStart, isEnd);
            markerData.marker.setIcon(icon);
        }
    }

    function resetMarkerAppearance(poiId) {
        const markerData = state.markers[poiId];
        if (!markerData) return;

        // Keep custom icon for featured POI (Bridgeview Harbour Marina)
        if (markerData.poi.featured) {
            markerData.marker.setIcon(bridgeviewIcon);
        } else {
            const icon = createCustomIcon(markerData.poi.type);
            markerData.marker.setIcon(icon);
        }
    }

    // ============================================
    // Generate Select Options HTML
    // ============================================
    function generateSelectOptionsHTML(placeholder) {
        // Guard against missing data
        if (!POINTS_OF_INTEREST || !Array.isArray(POINTS_OF_INTEREST)) {
            console.error('POINTS_OF_INTEREST not available in generateSelectOptionsHTML');
            return `<option value="">${placeholder}</option>`;
        }

        // Sort POIs alphabetically
        const sortedPOIs = [...POINTS_OF_INTEREST].sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // Group by type for better organization
        const grouped = {};
        sortedPOIs.forEach(poi => {
            if (!grouped[poi.type]) {
                grouped[poi.type] = [];
            }
            grouped[poi.type].push(poi);
        });

        // Build options HTML
        let html = `<option value="">${placeholder}</option>`;
        const typeOrder = ['marina', 'restaurant', 'bay', 'historic', 'fuel', 'anchorage', 'lock', 'bridge', 'bridge-fixed', 'bridge-draw', 'bridge-swing', 'bridge-bascule', 'bridge-lift', 'aton-lighthouse', 'aton-buoy', 'aton-daymark', 'aton-light', 'aton-beacon', 'aton'];

        typeOrder.forEach(type => {
            if (grouped[type] && grouped[type].length > 0) {
                const config = TYPE_CONFIG[type];
                if (config) {
                    html += `<optgroup label="${config.icon} ${config.name}s">`;
                    grouped[type].forEach(poi => {
                        html += `<option value="${poi.id}">${poi.name}</option>`;
                    });
                    html += '</optgroup>';
                }
            }
        });

        return html;
    }

    // ============================================
    // Render Stops UI
    // ============================================
    function renderStopsUI() {
        const container = elements.stopsContainer;
        if (!container) {
            console.error('stopsContainer element not found');
            return;
        }
        container.innerHTML = '';

        state.stops.forEach((stopId, index) => {
            const isFirst = index === 0;
            const isLast = index === state.stops.length - 1;
            const isMiddle = !isFirst && !isLast;

            // Determine label
            let label;
            if (isFirst) {
                label = 'Start';
            } else if (isLast) {
                label = 'End';
            } else {
                label = `Stop ${index}`;
            }

            // Determine placeholder
            let placeholder;
            if (isFirst) {
                placeholder = 'Select starting point...';
            } else if (isLast) {
                placeholder = 'Select destination...';
            } else {
                placeholder = 'Select stop...';
            }

            // Create stop row
            const row = document.createElement('div');
            row.className = 'stop-row';
            row.draggable = true;
            row.dataset.index = index;

            row.innerHTML = `
                <span class="drag-handle" title="Drag to reorder">&#x2630;</span>
                <span class="stop-label">${label}</span>
                <select class="stop-select" data-index="${index}">
                    ${generateSelectOptionsHTML(placeholder)}
                </select>
                <button class="remove-stop-btn ${isMiddle ? '' : 'hidden'}" data-index="${index}" title="Remove stop">&times;</button>
            `;

            // Set the selected value
            const select = row.querySelector('.stop-select');
            if (stopId) {
                select.value = stopId;
            }

            // Add change listener
            select.addEventListener('change', (e) => {
                updateStop(parseInt(e.target.dataset.index), e.target.value);
            });

            // Add remove button listener
            const removeBtn = row.querySelector('.remove-stop-btn');
            removeBtn.addEventListener('click', () => {
                removeStop(parseInt(removeBtn.dataset.index));
            });

            // Drag-and-drop event listeners
            row.addEventListener('dragstart', (e) => handleDragStart(e, index));
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('dragenter', (e) => handleDragEnter(e, index));
            row.addEventListener('dragleave', handleDragLeave);
            row.addEventListener('drop', (e) => handleDrop(e, index));
            row.addEventListener('dragend', handleDragEnd);

            container.appendChild(row);
        });
    }

    // ============================================
    // Stop Management Functions
    // ============================================
    function addStop() {
        // Insert null before the last position (before End)
        state.stops.splice(state.stops.length - 1, 0, null);
        renderStopsUI();
    }

    function removeStop(index) {
        // Only allow removing middle stops (not Start or End)
        if (index > 0 && index < state.stops.length - 1) {
            // Reset marker appearance for removed stop
            const poiId = state.stops[index];
            if (poiId) {
                resetMarkerAppearance(poiId);
            }
            state.stops.splice(index, 1);
            renderStopsUI();
            updateAllMarkerAppearances();
            calculateRoute();
        }
    }

    function updateStop(index, poiId) {
        // Reset old marker if it exists
        const oldPoiId = state.stops[index];
        if (oldPoiId) {
            resetMarkerAppearance(oldPoiId);
        }

        // Update state
        state.stops[index] = poiId || null;

        // Update marker appearances
        updateAllMarkerAppearances();

        // Recalculate route
        calculateRoute();

        // Update location list to show selection state
        populateLocationList();
    }

    // ============================================
    // Drag-and-Drop Handlers
    // ============================================
    function handleDragStart(e, index) {
        draggedIndex = index;
        e.target.closest('.stop-row').classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e, index) {
        if (draggedIndex !== null && draggedIndex !== index) {
            const row = e.target.closest('.stop-row');
            if (row) {
                row.classList.add('drag-over');
            }
        }
    }

    function handleDragLeave(e) {
        const row = e.target.closest('.stop-row');
        if (row && !row.contains(e.relatedTarget)) {
            row.classList.remove('drag-over');
        }
    }

    function handleDrop(e, targetIndex) {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            // Reorder state.stops array
            const [removed] = state.stops.splice(draggedIndex, 1);
            state.stops.splice(targetIndex, 0, removed);
            renderStopsUI();
            updateAllMarkerAppearances();
            calculateRoute();
        }
        cleanupDragState();
    }

    function handleDragEnd() {
        cleanupDragState();
    }

    function cleanupDragState() {
        draggedIndex = null;
        document.querySelectorAll('.stop-row').forEach(row => {
            row.classList.remove('dragging', 'drag-over');
        });
    }

    // ============================================
    // Update All Marker Appearances
    // ============================================
    function updateAllMarkerAppearances() {
        // First reset all markers
        Object.keys(state.markers).forEach(poiId => {
            resetMarkerAppearance(poiId);
        });

        // Then update based on current stops
        state.stops.forEach((poiId, index) => {
            if (poiId) {
                const isStart = index === 0;
                const isEnd = index === state.stops.length - 1;
                const isIntermediate = !isStart && !isEnd;

                const markerData = state.markers[poiId];
                if (markerData) {
                    // Keep custom icon for featured POI (Bridgeview Harbour Marina)
                    if (markerData.poi.featured) {
                        markerData.marker.setIcon(bridgeviewIcon);
                    } else {
                        const icon = createCustomIcon(markerData.poi.type, true, isStart, isEnd, isIntermediate);
                        markerData.marker.setIcon(icon);
                    }
                }
            }
        });
    }

    // ============================================
    // Initialize Stops with Default
    // ============================================
    function initializeStops() {
        // Guard against missing data
        if (!POINTS_OF_INTEREST || !Array.isArray(POINTS_OF_INTEREST)) {
            console.error('POINTS_OF_INTEREST not available in initializeStops');
            renderStopsUI();  // Still render empty stops
            return;
        }

        // Set default start location if it exists
        const defaultExists = POINTS_OF_INTEREST.some(p => p.id === DEFAULT_START_LOCATION);
        if (defaultExists) {
            state.stops[0] = DEFAULT_START_LOCATION;
        }
        renderStopsUI();
        updateAllMarkerAppearances();
    }

    // ============================================
    // POI Filter Matching
    // ============================================
    function poiMatchesFilter(poi, filter) {
        if (filter === 'all') return true;

        // Handle fuel type filters
        if (filter === 'fuel-gasoline') {
            return poi.fuel && poi.fuel.available && poi.fuel.types.includes('gasoline');
        }
        if (filter === 'fuel-diesel') {
            return poi.fuel && poi.fuel.available && poi.fuel.types.includes('diesel');
        }

        // Check primary type
        if (poi.type === filter) return true;

        // Check tags for secondary categories (e.g., marina with fuel tag)
        if (poi.tags && poi.tags.includes(filter)) return true;

        // Special case: 'fuel' filter should match any POI with fuel available
        if (filter === 'fuel' && poi.fuel && poi.fuel.available) return true;

        // Special case: 'poi' filter should match 'historic' type (generic points of interest)
        if (filter === 'poi' && poi.type === 'historic') return true;

        // Special case: 'aton' filter should match all ATON subtypes (lighthouses, buoys, etc.)
        if (filter === 'aton' && poi.type && poi.type.startsWith('aton')) return true;

        // Special case: 'bridge' filter should match all bridge subtypes (fixed and movable)
        if (filter === 'bridge' && poi.type && poi.type.startsWith('bridge')) return true;

        return false;
    }

    // ============================================
    // Populate Location List
    // ============================================
    function populateLocationList() {
        // Guard against missing elements or data
        if (!elements.locationList || !elements.locationCount) {
            console.error('Location list elements not found');
            return;
        }
        if (!POINTS_OF_INTEREST || !Array.isArray(POINTS_OF_INTEREST)) {
            console.error('POINTS_OF_INTEREST not available:', POINTS_OF_INTEREST);
            return;
        }

        // Filter POIs based on current filter and search
        let filteredPOIs = [...POINTS_OF_INTEREST];

        // Apply type/tag filter
        if (state.currentFilter !== 'all') {
            filteredPOIs = filteredPOIs.filter(poi => poiMatchesFilter(poi, state.currentFilter));
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

            if (state.stops.includes(poi.id)) {
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
            elements.menuToggle.setAttribute('aria-expanded', 'false');
        }
    }

    // ============================================
    // Quick Info Panel
    // ============================================
    let currentQuickInfoPoi = null;

    function showQuickInfo(poi) {
        // Save the currently focused element for restoring later
        lastFocusedElement = document.activeElement;

        currentQuickInfoPoi = poi;
        const config = TYPE_CONFIG[poi.type];

        elements.quickInfoTitle.textContent = poi.name;
        elements.quickInfoType.textContent = config.icon + ' ' + config.name;
        elements.quickInfoDesc.textContent = poi.description;

        elements.quickInfo.classList.remove('hidden');

        // Set focus to close button for keyboard users
        setTimeout(() => {
            elements.closeQuickInfo.focus();
        }, 100);
    }

    function hideQuickInfo() {
        elements.quickInfo.classList.add('hidden');
        currentQuickInfoPoi = null;

        // Restore focus to the element that triggered the dialog
        if (lastFocusedElement && lastFocusedElement.focus) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }

    // ============================================
    // Set Start/End Points
    // ============================================
    function setStartPoint(poiId) {
        updateStop(0, poiId);
        renderStopsUI();
        hideQuickInfo();
    }

    function setEndPoint(poiId) {
        updateStop(state.stops.length - 1, poiId);
        renderStopsUI();
        hideQuickInfo();
    }

    // ============================================
    // Calculate Route (Multi-Stop Water-Based Routing)
    // ============================================
    function calculateRoute() {
        // Filter to only valid (selected) stops
        const validStops = state.stops.filter(id => id);

        if (validStops.length < 2) {
            showToast('Please select at least a start and destination', 'error');
            clearRoute();
            return;
        }

        let totalDistanceKm = 0;
        let allCoordinates = [];
        const legs = [];  // Store leg information for itinerary

        // Calculate each segment
        for (let i = 0; i < validStops.length - 1; i++) {
            const startPoi = POINTS_OF_INTEREST.find(p => p.id === validStops[i]);
            const endPoi = POINTS_OF_INTEREST.find(p => p.id === validStops[i + 1]);

            if (!startPoi || !endPoi) continue;

            // Calculate water-based route for this segment
            const routeResult = calculateWaterRoute(validStops[i], validStops[i + 1]);

            let segmentDistanceKm;
            if (routeResult && !routeResult.isFallback) {
                // Use water route distance
                segmentDistanceKm = routeResult.distance;

                // Concatenate coordinates (avoid duplicating junction points)
                if (i === 0) {
                    allCoordinates = [...routeResult.coordinates];
                } else {
                    // Skip the first coordinate if it's the same as the last one
                    allCoordinates.push(...routeResult.coordinates.slice(1));
                }
            } else {
                // Fallback to straight-line distance
                segmentDistanceKm = calculateDistance(
                    startPoi.lat, startPoi.lng,
                    endPoi.lat, endPoi.lng
                );

                // Add direct line coordinates
                if (i === 0) {
                    allCoordinates.push([startPoi.lat, startPoi.lng]);
                }
                allCoordinates.push([endPoi.lat, endPoi.lng]);
            }

            // Store leg information
            legs.push({
                from: startPoi.name,
                to: endPoi.name,
                distanceKm: segmentDistanceKm
            });

            totalDistanceKm += segmentDistanceKm;
        }

        // Convert to current unit
        const unit = state.currentUnit;
        const unitAbbr = UNIT_CONVERSIONS[unit].abbr;
        const totalDistance = convertDistance(totalDistanceKm, unit);
        const totalTime = calculateTravelTime(totalDistanceKm, state.vesselSpeed, unit);

        // Build itinerary HTML
        let itineraryHTML = '';
        legs.forEach((leg, index) => {
            const legDistance = convertDistance(leg.distanceKm, unit);
            const legTime = calculateTravelTime(leg.distanceKm, state.vesselSpeed, unit);

            itineraryHTML += `
                <div class="itinerary-leg">
                    <div class="leg-icon">${index + 1}</div>
                    <div class="leg-details">
                        <div class="leg-route">
                            <span class="from-to">${leg.from}</span>
                            <span class="arrow">→</span>
                            <span class="from-to">${leg.to}</span>
                        </div>
                        <div class="leg-stats">
                            <span>📏 ${formatDistance(legDistance, unitAbbr)}</span>
                            <span>⏱️ ${formatTime(legTime)}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        // Update itinerary display
        if (elements.itinerary) {
            elements.itinerary.innerHTML = itineraryHTML;
        }

        // Update totals
        elements.distanceValue.textContent = formatDistance(totalDistance, unitAbbr);
        elements.timeValue.textContent = formatTime(totalTime);
        elements.tripResults.classList.remove('hidden');

        // Draw route line through all coordinates
        drawRouteLine(null, null, { coordinates: allCoordinates });

        // Fit map to show entire route
        if (allCoordinates.length > 0) {
            const bounds = L.latLngBounds(allCoordinates);
            state.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    // ============================================
    // Clear Route
    // ============================================
    function clearRoute() {
        elements.tripResults.classList.add('hidden');
        if (elements.itinerary) {
            elements.itinerary.innerHTML = '';
        }
        clearRouteLine();
    }

    // ============================================
    // Draw Route Line (Multi-Point Water Route)
    // ============================================
    function drawRouteLine(startPoi, endPoi, routeResult) {
        // Remove existing line
        if (state.routeLine) {
            state.map.removeLayer(state.routeLine);
        }

        // Determine coordinates to draw
        let coordinates;
        if (routeResult && routeResult.coordinates && routeResult.coordinates.length > 0) {
            // Use water route through waypoints
            coordinates = routeResult.coordinates;
        } else {
            // Fallback to direct line
            coordinates = [
                [startPoi.lat, startPoi.lng],
                [endPoi.lat, endPoi.lng]
            ];
        }

        // Create multi-point polyline following the water route
        state.routeLine = L.polyline(coordinates, {
            color: '#1a5f7a',
            weight: 4,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
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
        // Reset all markers
        state.stops.forEach(poiId => {
            if (poiId) {
                resetMarkerAppearance(poiId);
            }
        });

        // Reset stops to just Start and End (both empty)
        state.stops = [null, null];

        // Re-render stops UI
        renderStopsUI();

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
    function filterMarkers(filter) {
        Object.values(state.markers).forEach(({ marker, poi }) => {
            if (poiMatchesFilter(poi, filter)) {
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
            // Update ARIA expanded state
            const isOpen = elements.sidePanel.classList.contains('open');
            elements.menuToggle.setAttribute('aria-expanded', isOpen.toString());
        });

        // Add stop button
        if (elements.addStopBtn) {
            elements.addStopBtn.addEventListener('click', addStop);
        } else {
            console.error('addStopBtn element not found');
        }

        // Unit change
        elements.unitSelect.addEventListener('change', (e) => {
            state.currentUnit = e.target.value;
            elements.speedUnit.textContent = UNIT_CONVERSIONS[e.target.value].speedUnit;

            // Recalculate if route exists (need at least 2 valid stops)
            const validStops = state.stops.filter(id => id);
            if (validStops.length >= 2) {
                calculateRoute();
            }
        });

        // Speed change
        elements.vesselSpeed.addEventListener('change', (e) => {
            state.vesselSpeed = parseFloat(e.target.value) || 15;

            // Recalculate if route exists
            const validStops = state.stops.filter(id => id);
            if (validStops.length >= 2) {
                calculateRoute();
            }
        });

        // Speed input (also update on input for immediate feedback)
        elements.vesselSpeed.addEventListener('input', (e) => {
            state.vesselSpeed = parseFloat(e.target.value) || 15;

            const validStops = state.stops.filter(id => id);
            if (validStops.length >= 2) {
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
                // Update active state and ARIA pressed
                elements.filterButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

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
            // Update ARIA expanded state
            const isExpanded = !elements.legendContent.classList.contains('hidden');
            elements.legendToggle.setAttribute('aria-expanded', isExpanded.toString());
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
                elements.menuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape closes panels in order of priority
            if (e.key === 'Escape') {
                // First close quick info if open
                if (!elements.quickInfo.classList.contains('hidden')) {
                    hideQuickInfo();
                    return;
                }

                // Then close legend if open
                if (!elements.legendContent.classList.contains('hidden')) {
                    elements.legendContent.classList.add('hidden');
                    elements.legendToggle.setAttribute('aria-expanded', 'false');
                    elements.legendToggle.focus();
                    return;
                }

                // Then close side panel on mobile if open
                if (state.isMobile && elements.sidePanel.classList.contains('open')) {
                    elements.sidePanel.classList.remove('open');
                    elements.menuToggle.classList.remove('active');
                    elements.menuToggle.setAttribute('aria-expanded', 'false');
                    elements.menuToggle.focus();
                    return;
                }
            }

            // Focus trap for quick info panel when Tab is pressed
            if (e.key === 'Tab' && !elements.quickInfo.classList.contains('hidden')) {
                trapFocusInQuickInfo(e);
            }
        });
    }

    // ============================================
    // Focus Trap for Quick Info Panel
    // ============================================
    function trapFocusInQuickInfo(e) {
        const focusableElements = elements.quickInfo.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab: if on first element, go to last
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab: if on last element, go to first
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
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
    async function init() {
        console.log('Starting initialization...');
        try {
            // Load POI data from JSON file
            await initializeData();
            console.log('POI data loaded successfully, count:', POINTS_OF_INTEREST.length);

            // Load saved preferences
            loadPreferences();
            console.log('Preferences loaded');

            // Initialize map
            initMap();
            console.log('Map initialized');

            // Populate UI elements
            console.log('Initializing stops...');
            initializeStops();
            console.log('Stops initialized');

            console.log('Populating location list...');
            populateLocationList();
            console.log('Location list populated');

            // Set up event listeners
            console.log('Setting up event listeners...');
            initEventListeners();
            console.log('Event listeners set up');

            // Set up preference saving
            initPreferenceSaving();

            // Set initial speed unit display
            elements.speedUnit.textContent = UNIT_CONVERSIONS[state.currentUnit].speedUnit;

            console.log('Lake Champlain & Hudson River Boater\'s Guide initialized');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            console.error('Error stack:', error.stack);
            // Hide loading overlay even on error
            if (elements.loadingOverlay) {
                elements.loadingOverlay.classList.add('hidden');
            }
        }
    }

    // Start the application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
    } else {
        init();
    }

})();
