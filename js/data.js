/**
 * Lake Champlain & Hudson River Boater's Guide
 * Data Configuration and POI Loader
 *
 * This file loads POI data from the JSON flat file and transforms it
 * for use by the application.
 */

// Default starting location - Bridgeview Harbour Marina
const DEFAULT_START_LOCATION = 'marina-bridgeview-harbour-marina';

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
 * JSON uses: marina, bay, dining, poi, aton, lock, bridge
 * App uses: marina, bay, restaurant, historic, fuel, anchorage, aton-*, lock, bridge-*
 */
const CATEGORY_MAP = {
    'marina': 'marina',
    'bay': 'bay',
    'dining': 'restaurant',
    'poi': 'historic',
    'aton': 'aton',
    'lock': 'lock',
    'bridge': 'bridge',
    // Additional categories
    'hotel': 'hotel',
    'campground': 'campground',
    'boat-launch': 'boat-launch',
    'beach': 'beach',
    'ferry': 'ferry',
    'island': 'island',
    'public-dock': 'public-dock',
    'confluence': 'historic',
    'landmark': 'historic'
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
    'waterfront-restaurant': 'restaurant',
    'full-service': 'marina',
    'private': 'marina',
    // Aids to Navigation subtypes - USCG IALA Region B
    'lighthouse': 'aton-lighthouse',
    'buoy': 'aton-buoy',
    'daymark': 'aton-daymark',
    'light': 'aton-light',
    'beacon': 'aton-beacon',
    // Lateral marks (Red Right Returning)
    'red-nun': 'aton-red-nun',           // Starboard (right) - red conical
    'green-can': 'aton-green-can',       // Port (left) - green cylindrical
    // Daybeacons
    'red-daybeacon': 'aton-red-daybeacon',   // Red triangle
    'green-daybeacon': 'aton-green-daybeacon', // Green square
    // Other marks
    'safe-water': 'aton-safe-water',     // Red/white vertical stripes
    'isolated-danger': 'aton-danger',    // Black with red band
    'special-mark': 'aton-special',      // Yellow
    // Lock subtypes
    'lock': 'lock',
    'canal-lock': 'lock',
    // Bridge subtypes
    'bridge': 'bridge',
    'fixed-bridge': 'bridge-fixed',
    'drawbridge': 'bridge-draw',
    'swing-bridge': 'bridge-swing',
    'bascule-bridge': 'bridge-bascule',
    'lift-bridge': 'bridge-lift',
    // Additional subtypes
    'hotel': 'hotel',
    'campground': 'campground',
    'boat-launch': 'boat-launch',
    'beach': 'beach',
    'ferry': 'ferry',
    'island': 'island',
    'public-dock': 'public-dock'
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
    },
    // Aids to Navigation types - USCG IALA Region B compliant
    'aton': {
        name: 'Nav Aid',
        icon: '◆',
        color: '#e74c3c'
    },
    'aton-lighthouse': {
        name: 'Lighthouse',
        icon: '',  // Uses CSS shape
        color: '#f1c40f'
    },
    'aton-buoy': {
        name: 'Buoy',
        icon: '',  // Uses CSS shape
        color: '#e74c3c'
    },
    'aton-daymark': {
        name: 'Daymark',
        icon: '',  // Uses CSS shape
        color: '#27ae60'
    },
    'aton-light': {
        name: 'Light',
        icon: '✦',
        color: '#f1c40f'
    },
    'aton-beacon': {
        name: 'Beacon',
        icon: '',  // Uses CSS shape
        color: '#3498db'
    },
    // Lateral Marks - USCG Red Right Returning (IALA-B)
    'aton-red-nun': {
        name: 'Red Nun (Starboard)',
        icon: '',  // Uses CSS triangle shape
        color: '#cc0000'  // USCG Red
    },
    'aton-green-can': {
        name: 'Green Can (Port)',
        icon: '',  // Uses CSS square shape
        color: '#006633'  // USCG Green
    },
    // Daybeacons
    'aton-red-daybeacon': {
        name: 'Red Daybeacon',
        icon: '',  // Uses CSS triangle
        color: '#cc0000'
    },
    'aton-green-daybeacon': {
        name: 'Green Daybeacon',
        icon: '',  // Uses CSS square
        color: '#006633'
    },
    // Safe Water Mark - Red and white vertical stripes
    'aton-safe-water': {
        name: 'Safe Water Mark',
        icon: '',  // Uses CSS striped pattern
        color: '#cc0000'
    },
    // Isolated Danger Mark - Black with red band
    'aton-danger': {
        name: 'Isolated Danger',
        icon: '',  // Uses CSS banded pattern
        color: '#000000'
    },
    // Special Mark - Yellow
    'aton-special': {
        name: 'Special Mark',
        icon: '',  // Uses CSS shape
        color: '#ffcc00'  // USCG Yellow
    },
    // Lock type
    'lock': {
        name: 'Lock',
        icon: '🔒',
        color: '#9b59b6'
    },
    // Bridge types
    'bridge': {
        name: 'Bridge',
        icon: '🌉',
        color: '#7f8c8d'
    },
    'bridge-fixed': {
        name: 'Fixed Bridge',
        icon: '🌉',
        color: '#7f8c8d'
    },
    'bridge-draw': {
        name: 'Drawbridge',
        icon: '🌉',
        color: '#e67e22'
    },
    'bridge-swing': {
        name: 'Swing Bridge',
        icon: '🌉',
        color: '#e67e22'
    },
    'bridge-bascule': {
        name: 'Bascule Bridge',
        icon: '🌉',
        color: '#e67e22'
    },
    'bridge-lift': {
        name: 'Lift Bridge',
        icon: '🌉',
        color: '#e67e22'
    },
    // Additional POI types
    'hotel': {
        name: 'Hotel',
        icon: '🏨',
        color: '#9b59b6'
    },
    'campground': {
        name: 'Campground',
        icon: '⛺',
        color: '#27ae60'
    },
    'boat-launch': {
        name: 'Boat Launch',
        icon: '🚤',
        color: '#3498db'
    },
    'beach': {
        name: 'Beach',
        icon: '🏖',
        color: '#f1c40f'
    },
    'ferry': {
        name: 'Ferry',
        icon: '⛴',
        color: '#1abc9c'
    },
    'island': {
        name: 'Island',
        icon: '🏝',
        color: '#2ecc71'
    },
    'public-dock': {
        name: 'Public Dock',
        icon: '🛥',
        color: '#34495e'
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

    // Build tags array (for multi-category filtering)
    let tags = jsonPoi.tags ? [...jsonPoi.tags] : [];

    // Auto-add fuel tag if fuel is in amenities or fuel object exists
    if (amenities.includes('fuel') || jsonPoi.details?.fuel?.available) {
        if (!tags.includes('fuel')) {
            tags.push('fuel');
        }
    }

    // Build the transformed POI
    const poi = {
        id: jsonPoi.id,
        name: jsonPoi.name,
        type: type,
        tags: tags,
        lat: jsonPoi.location.coordinates.latitude,
        lng: jsonPoi.location.coordinates.longitude,
        description: jsonPoi.details?.description || '',
        amenities: amenities
    };

    // Add fuel details if present
    if (jsonPoi.details?.fuel) {
        poi.fuel = {
            available: jsonPoi.details.fuel.available || false,
            types: jsonPoi.details.fuel.types || [],
            ethanolFree: jsonPoi.details.fuel['ethanol-free'] || false,
            highSpeed: jsonPoi.details.fuel['high-speed'] || false,
            hours: jsonPoi.details.fuel.hours || null
        };
    } else if (amenities.includes('fuel')) {
        // Legacy support: if fuel is in amenities but no fuel object, assume both types
        poi.fuel = {
            available: true,
            types: ['gasoline', 'diesel'],
            ethanolFree: amenities.includes('non-ethanol-fuel'),
            highSpeed: false,
            hours: null
        };
    }

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
    if (jsonPoi.id === 'marina-bridgeview-harbour-marina') {
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

    // Add ATON (Aids to Navigation) specific details
    if (jsonPoi.details?.aton) {
        poi.aton = {
            uscgId: jsonPoi.details.aton.uscgId || null,
            llnr: jsonPoi.details.aton.llnr || null,  // Light List Number
            characteristic: jsonPoi.details.aton.characteristic || null,  // e.g., "Fl R 4s"
            color: jsonPoi.details.aton.color || null,  // e.g., "red", "green", "red-white"
            shape: jsonPoi.details.aton.shape || null,  // e.g., "nun", "can", "sphere"
            height: jsonPoi.details.aton.height || null,  // height in feet
            range: jsonPoi.details.aton.range || null,  // visible range in nm
            structure: jsonPoi.details.aton.structure || null,  // e.g., "white tower", "skeleton tower"
            radarReflector: jsonPoi.details.aton.radarReflector || false,
            sound: jsonPoi.details.aton.sound || null,  // e.g., "horn", "bell", "whistle"
            racon: jsonPoi.details.aton.racon || null,  // radar beacon code
            ais: jsonPoi.details.aton.ais || false,  // has AIS transponder
            remarks: jsonPoi.details.aton.remarks || null
        };

        // Determine specific ATON type based on color and shape (USCG IALA Region B)
        const atonColor = (poi.aton.color || '').toLowerCase();
        const atonShape = (poi.aton.shape || '').toLowerCase();
        const poiName = (jsonPoi.name || '').toLowerCase();
        const subcategory = (jsonPoi.subcategory || '').toLowerCase();

        // Check for lighthouse first (takes precedence)
        if (subcategory === 'lighthouse' || poiName.includes('lighthouse') || poiName.includes('light house')) {
            type = 'aton-lighthouse';
        }
        // Red markers - Starboard (right side returning from sea)
        else if (atonColor.includes('red') && !atonColor.includes('white') && !atonColor.includes('black')) {
            if (atonShape.includes('nun') || atonShape.includes('conical') || atonShape.includes('cone')) {
                type = 'aton-red-nun';
            } else if (atonShape.includes('daybeacon') || atonShape.includes('daymark') || atonShape.includes('triangle')) {
                type = 'aton-red-daybeacon';
            } else if (subcategory === 'buoy' || poiName.includes('buoy')) {
                type = 'aton-red-nun';  // Default red buoys to nun shape
            } else {
                type = 'aton-red-daybeacon';  // Default red to daybeacon
            }
        }
        // Green markers - Port (left side returning from sea)
        else if (atonColor.includes('green')) {
            if (atonShape.includes('can') || atonShape.includes('cylinder') || atonShape.includes('cylindrical')) {
                type = 'aton-green-can';
            } else if (atonShape.includes('daybeacon') || atonShape.includes('daymark') || atonShape.includes('square')) {
                type = 'aton-green-daybeacon';
            } else if (subcategory === 'buoy' || poiName.includes('buoy')) {
                type = 'aton-green-can';  // Default green buoys to can shape
            } else {
                type = 'aton-green-daybeacon';  // Default green to daybeacon
            }
        }
        // Safe water marks - Red and white vertical stripes
        else if ((atonColor.includes('red') && atonColor.includes('white')) || atonColor.includes('safe')) {
            type = 'aton-safe-water';
        }
        // Isolated danger marks - Black with red band
        else if ((atonColor.includes('black') && atonColor.includes('red')) || atonColor.includes('danger')) {
            type = 'aton-danger';
        }
        // Special marks - Yellow
        else if (atonColor.includes('yellow')) {
            type = 'aton-special';
        }
        // Detect from name patterns
        else if (poiName.includes('red nun') || poiName.includes('red conical')) {
            type = 'aton-red-nun';
        } else if (poiName.includes('green can') || poiName.includes('green cylinder')) {
            type = 'aton-green-can';
        }

        // Update the poi type with the detected ATON type
        poi.type = type;
    }

    // Add Lock specific details
    if (jsonPoi.details?.lock) {
        poi.lock = {
            lockNumber: jsonPoi.details.lock.lockNumber || null,  // e.g., "C-1" for Champlain Lock 1
            canalName: jsonPoi.details.lock.canalName || null,  // e.g., "Champlain Canal", "Erie Canal", "Chambly Canal"
            canalSystem: jsonPoi.details.lock.canalSystem || null,  // e.g., "NYS Canal System", "Parks Canada"
            lift: jsonPoi.details.lock.lift || null,  // lift height in feet
            chamberLength: jsonPoi.details.lock.chamberLength || null,  // chamber length in feet
            chamberWidth: jsonPoi.details.lock.chamberWidth || null,  // chamber width in feet
            minDepth: jsonPoi.details.lock.minDepth || null,  // minimum depth in feet
            maxVesselLength: jsonPoi.details.lock.maxVesselLength || null,  // max vessel length in feet
            maxVesselBeam: jsonPoi.details.lock.maxVesselBeam || null,  // max vessel beam in feet
            maxVesselHeight: jsonPoi.details.lock.maxVesselHeight || null,  // max air draft in feet (clearance)
            operatingHours: jsonPoi.details.lock.operatingHours || null,  // e.g., "7am-5pm"
            operatingSeason: jsonPoi.details.lock.operatingSeason || null,  // e.g., "May 1 - Nov 15"
            lockageTime: jsonPoi.details.lock.lockageTime || null,  // typical lockage time in minutes
            fee: jsonPoi.details.lock.fee || null,  // lockage fee info
            tieUpWalls: jsonPoi.details.lock.tieUpWalls || false,  // has tie-up walls above/below lock
            restrooms: jsonPoi.details.lock.restrooms || false,
            water: jsonPoi.details.lock.water || false,
            electric: jsonPoi.details.lock.electric || false,
            pumpOut: jsonPoi.details.lock.pumpOut || false,
            remarks: jsonPoi.details.lock.remarks || null
        };
    }

    // Add Bridge specific details
    if (jsonPoi.details?.bridge) {
        poi.bridge = {
            bridgeType: jsonPoi.details.bridge.bridgeType || null,  // "fixed", "draw", "swing", "bascule", "lift"
            clearanceHeight: jsonPoi.details.bridge.clearanceHeight || null,  // vertical clearance in feet (closed position)
            clearanceHeightOpen: jsonPoi.details.bridge.clearanceHeightOpen || null,  // vertical clearance when open (for movable bridges)
            horizontalClearance: jsonPoi.details.bridge.horizontalClearance || null,  // horizontal clearance in feet
            channelWidth: jsonPoi.details.bridge.channelWidth || null,  // navigable channel width in feet
            mileMarker: jsonPoi.details.bridge.mileMarker || null,  // mile marker on waterway
            chartNumber: jsonPoi.details.bridge.chartNumber || null,  // NOAA chart number
            owner: jsonPoi.details.bridge.owner || null,  // e.g., "NYS DOT", "Vermont AOT"
            roadway: jsonPoi.details.bridge.roadway || null,  // e.g., "US Route 2", "NY Route 22"
            // Opening schedule for movable bridges
            openingSchedule: jsonPoi.details.bridge.openingSchedule || null,  // e.g., "On signal" or "On the hour and half-hour"
            restrictedHours: jsonPoi.details.bridge.restrictedHours || null,  // e.g., "No openings 7-9am, 4-6pm weekdays"
            vhfChannel: jsonPoi.details.bridge.vhfChannel || null,  // VHF channel for bridge tender
            phone: jsonPoi.details.bridge.phone || null,  // phone for bridge tender
            signalRequired: jsonPoi.details.bridge.signalRequired || false,  // requires signal to open
            signalType: jsonPoi.details.bridge.signalType || null,  // e.g., "1 prolonged blast + 1 short blast"
            advanceNotice: jsonPoi.details.bridge.advanceNotice || null,  // e.g., "24 hours" for some bridges
            operatingSeason: jsonPoi.details.bridge.operatingSeason || null,  // seasonal operation dates
            remarks: jsonPoi.details.bridge.remarks || null
        };
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
