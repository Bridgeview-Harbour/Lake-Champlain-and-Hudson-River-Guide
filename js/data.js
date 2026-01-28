/**
 * Lake Champlain & Hudson River Boater's Guide
 * Data Configuration and POI Loader
 *
 * This file loads POI data from the JSON flat file and transforms it
 * for use by the application.
 */

// Default starting location - Bridgeview Harbour Marina
const DEFAULT_START_LOCATION = 'marina-bridgeview-harbour';

// Map center coordinates (centered on Lake Champlain region)
const MAP_CENTER = {
    lat: 44.2,
    lng: -73.35,
    zoom: 9
};

// Map bounds to restrict panning
const MAP_BOUNDS = {
    north: 45.5,
    south: 43.5,
    east: -72.5,
    west: -74.0
};

/**
 * Category mapping from JSON to app types
 * JSON uses: marina, bay, dining, poi
 * App uses: marina, bay, restaurant, historic, fuel, anchorage
 */
const CATEGORY_MAP = {
    'marina': 'marina',
    'bay': 'bay',
    'dining': 'restaurant',
    'poi': 'historic'
};

/**
 * Subcategory to type mapping for more specific categorization
 */
const SUBCATEGORY_MAP = {
    'anchorage': 'anchorage',
    'harbor': 'bay',
    'outlet': 'bay',
    'fuel-dock': 'fuel',
    'museum': 'historic',
    'lighthouse': 'historic',
    'waterfront-restaurant': 'restaurant',
    'full-service': 'marina',
    'private': 'marina'
};

/**
 * Get type display name and icon
 */
const TYPE_CONFIG = {
    marina: {
        name: 'Marina',
        icon: '⚓',
        color: '#2980b9'
    },
    restaurant: {
        name: 'Restaurant',
        icon: '🍴',
        color: '#e74c3c'
    },
    historic: {
        name: 'Point of Interest',
        icon: '🏛',
        color: '#8e44ad'
    },
    bay: {
        name: 'Bay/Harbor',
        icon: '🌊',
        color: '#16a085'
    },
    fuel: {
        name: 'Fuel',
        icon: '⛽',
        color: '#f39c12'
    },
    anchorage: {
        name: 'Anchorage',
        icon: '⚓',
        color: '#27ae60'
    }
};

/**
 * Unit conversion factors
 * Base unit is kilometers
 */
const UNIT_CONVERSIONS = {
    nm: {
        name: 'Nautical Miles',
        abbr: 'nm',
        factor: 0.539957,  // km to nm
        speedUnit: 'kts'
    },
    mi: {
        name: 'Miles',
        abbr: 'mi',
        factor: 0.621371,  // km to mi
        speedUnit: 'mph'
    },
    km: {
        name: 'Kilometers',
        abbr: 'km',
        factor: 1,
        speedUnit: 'km/h'
    }
};

/**
 * Points of Interest array - populated from JSON
 */
let POINTS_OF_INTEREST = [];

/**
 * Transform a JSON POI object to the app's internal format
 */
function transformPoi(jsonPoi) {
    // Determine the type based on category and subcategory
    let type = CATEGORY_MAP[jsonPoi.category] || 'historic';

    // Override with subcategory if more specific
    if (jsonPoi.subcategory && SUBCATEGORY_MAP[jsonPoi.subcategory]) {
        type = SUBCATEGORY_MAP[jsonPoi.subcategory];
    }

    // Build amenities array from details
    let amenities = [];
    if (jsonPoi.details) {
        if (jsonPoi.details.amenities) {
            amenities = [...jsonPoi.details.amenities];
        }
        if (jsonPoi.details.services) {
            amenities = [...amenities, ...jsonPoi.details.services];
        }
    }

    // Build the transformed POI
    const poi = {
        id: jsonPoi.id,
        name: jsonPoi.name,
        type: type,
        lat: jsonPoi.location.coordinates.latitude,
        lng: jsonPoi.location.coordinates.longitude,
        description: jsonPoi.details?.description || '',
        amenities: amenities
    };

    // Add optional fields if present
    if (jsonPoi.contact?.website) {
        poi.website = jsonPoi.contact.website;
    }
    if (jsonPoi.contact?.phone) {
        poi.phone = jsonPoi.contact.phone;
    }
    if (jsonPoi.contact?.vhfChannel) {
        poi.vhf = 'Channel ' + jsonPoi.contact.vhfChannel;
    }
    if (jsonPoi.contact?.email) {
        poi.email = jsonPoi.contact.email;
    }

    // Add location details
    if (jsonPoi.location.town) {
        poi.town = jsonPoi.location.town;
    }
    if (jsonPoi.location.state) {
        poi.state = jsonPoi.location.state;
    }
    if (jsonPoi.location.waterBodyRegion) {
        poi.region = jsonPoi.location.waterBodyRegion;
    }

    // Mark featured locations
    if (jsonPoi.id === 'marina-bridgeview-harbour') {
        poi.featured = true;
    }

    // Add marina-specific details
    if (jsonPoi.details?.totalSlips) {
        poi.totalSlips = jsonPoi.details.totalSlips;
    }
    if (jsonPoi.details?.transientSlips) {
        poi.transientSlips = jsonPoi.details.transientSlips;
    }
    if (jsonPoi.details?.maxVesselLength) {
        poi.maxVesselLength = jsonPoi.details.maxVesselLength;
    }
    if (jsonPoi.details?.minDepth) {
        poi.minDepth = jsonPoi.details.minDepth;
    }

    return poi;
}

/**
 * Load POIs from the JSON file
 * Returns a promise that resolves with the POI array
 */
async function loadPoisFromJson() {
    try {
        const response = await fetch('pois/lake_champlain_pois.json');
        if (!response.ok) {
            throw new Error(`Failed to load POI data: ${response.status}`);
        }

        const data = await response.json();

        if (!data.pois || !Array.isArray(data.pois)) {
            throw new Error('Invalid POI data format');
        }

        // Transform each POI
        POINTS_OF_INTEREST = data.pois.map(transformPoi);

        console.log(`Loaded ${POINTS_OF_INTEREST.length} points of interest`);

        // Update global reference
        if (typeof window !== 'undefined') {
            window.POINTS_OF_INTEREST = POINTS_OF_INTEREST;
        }

        return POINTS_OF_INTEREST;
    } catch (error) {
        console.error('Error loading POI data:', error);
        // Return empty array on error
        POINTS_OF_INTEREST = [];
        return POINTS_OF_INTEREST;
    }
}

/**
 * Initialize data - call this before using POIs
 * Returns a promise that resolves when data is ready
 */
async function initializeData() {
    await loadPoisFromJson();
    return {
        pois: POINTS_OF_INTEREST,
        config: {
            defaultStart: DEFAULT_START_LOCATION,
            mapCenter: MAP_CENTER,
            mapBounds: MAP_BOUNDS,
            types: TYPE_CONFIG,
            units: UNIT_CONVERSIONS
        }
    };
}

// Export for use in app.js (works in both module and non-module contexts)
if (typeof window !== 'undefined') {
    window.DEFAULT_START_LOCATION = DEFAULT_START_LOCATION;
    window.MAP_CENTER = MAP_CENTER;
    window.MAP_BOUNDS = MAP_BOUNDS;
    window.POINTS_OF_INTEREST = POINTS_OF_INTEREST;
    window.TYPE_CONFIG = TYPE_CONFIG;
    window.UNIT_CONVERSIONS = UNIT_CONVERSIONS;
    window.loadPoisFromJson = loadPoisFromJson;
    window.initializeData = initializeData;
}
