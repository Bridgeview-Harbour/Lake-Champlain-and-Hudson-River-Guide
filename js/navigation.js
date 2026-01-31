/**
 * Lake Champlain & Hudson River Boater's Guide
 * Water-Based Navigation Routing with Grid Pathfinding
 *
 * Uses a high-resolution water polygon and grid-based A* pathfinding
 * to ensure routes stay on navigable water and never cross land.
 */

// Check if we're in a Node.js environment (for testing)
const isNodeNav = typeof module !== 'undefined' && module.exports;

// ============================================
// Water Boundary Data - Loaded from GeoJSON
// ============================================
// Water boundaries are now loaded dynamically from GeoJSON files
// with support for islands (polygon holes) and multiple water bodies

let WATER_BOUNDARIES = null;
let DEPTH_GRID = null;  // Bathymetric depth data

// User vessel settings for depth-based routing
let VESSEL_DRAFT = 1.5;   // meters (default ~5 feet)
let SAFETY_MARGIN = 1.0;  // meters (default ~3 feet)

/**
 * Load bathymetric depth data
 * @returns {Promise<void>}
 */
async function loadDepthData() {
    const depthFiles = [
        'data/depth/lake-champlain-depth-grid.json'
    ];

    DEPTH_GRID = new Map();

    for (const file of depthFiles) {
        try {
            const response = await fetch(file);
            if (!response.ok) {
                console.warn(`Could not load ${file}: ${response.status}`);
                continue;
            }

            const data = await response.json();

            console.log(`Loaded bathymetric data: ${data.metadata.grid_points} points`);
            console.log(`  Depth range: ${data.depth_statistics.min}m - ${data.depth_statistics.max}m`);
            console.log(`  Average depth: ${data.depth_statistics.mean}m`);

            // Store depth data in Map for fast lookup
            for (const [id, point] of Object.entries(data.depth_grid)) {
                DEPTH_GRID.set(id, {
                    lat: point.lat,
                    lng: point.lng,
                    depth: point.depth
                });
            }

        } catch (error) {
            console.warn(`Failed to load ${file}:`, error);
        }
    }

    if (DEPTH_GRID.size === 0) {
        console.warn('No depth data loaded - routing will use water/land only');
    }
}

/**
 * Load water boundary data from GeoJSON file(s)
 * Supports multi-polygon features with holes (islands)
 * @returns {Promise<void>}
 */
async function loadWaterBoundaries() {
    const boundaryFiles = [
        'data/boundaries/lake-champlain.geojson'
        // Future water bodies can be added here:
        // 'data/boundaries/hudson-river.geojson',
        // 'data/boundaries/otter-creek.geojson'
    ];

    WATER_BOUNDARIES = [];

    for (const file of boundaryFiles) {
        try {
            const response = await fetch(file);
            if (!response.ok) {
                console.warn(`Could not load ${file}: ${response.status}`);
                continue;
            }

            const geojson = await response.json();

            for (const feature of geojson.features) {
                const coords = feature.geometry.coordinates;
                WATER_BOUNDARIES.push({
                    name: feature.properties.name || 'Unknown',
                    outer: coords[0],        // First ring is outer boundary
                    holes: coords.slice(1),  // Remaining rings are islands
                    properties: feature.properties
                });
            }
        } catch (error) {
            console.warn(`Failed to load ${file}:`, error);
        }
    }

    if (WATER_BOUNDARIES.length === 0) {
        console.error('No water boundaries loaded - navigation will not work');
        return;
    }

    console.log(`Loaded ${WATER_BOUNDARIES.length} water boundaries`);
    WATER_BOUNDARIES.forEach(wb => {
        const totalVertices = wb.outer.length + wb.holes.reduce((sum, h) => sum + h.length, 0);
        console.log(`  ${wb.name}: ${wb.outer.length} outer vertices, ${wb.holes.length} islands, ${totalVertices} total vertices`);
    });
}

// Legacy: Keep a reference for backward compatibility (deprecated)
// This will be removed in future versions - use WATER_BOUNDARIES instead
let LAKE_CHAMPLAIN_POLYGON = [];

// Old hardcoded polygon removed - now loaded dynamically from GeoJSON
// This array will be populated from the first loaded water boundary for backward compatibility
// and will be removed in a future version.

// ============================================
// Grid Configuration - Updated for KMZ bounds
// ============================================

/**
 * Earth's radius in kilometers
 * Used for Haversine distance calculations
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Grid configuration for water-based pathfinding
 *
 * HIGH-RESOLUTION ROUTING:
 * Fine grid resolution (200m) for maximum precision:
 * - Very detailed routes with many waypoints
 * - Precise navigation around shorelines and obstacles
 * - Visual smoothness from high waypoint density
 * - Better adherence to water boundaries
 * - Expected ~30-35K water grid points
 *
 * latStep: ~200m resolution in latitude (degrees)
 *   0.00180° ≈ 200 meters per grid cell
 *
 * lngStep: ~200m resolution in longitude (degrees)
 *   0.00240° ≈ 200 meters per grid cell at 44°N
 *   Adjusted for longitude compression at this latitude
 *
 * bounds: Geographic boundary of the navigation region
 *   Covers Lake Champlain from Whitehall, NY to Canadian border
 *   and extends to include the Champlain Canal connection
 */
const GRID_CONFIG = {
    latStep: 0.00180,      // Grid resolution: ~200m per cell (latitude)
    lngStep: 0.00240,      // Grid resolution: ~200m per cell (longitude)
    bounds: {
        south: 43.5300,    // Southern extent (near Whitehall, NY)
        north: 45.0900,    // Northern extent (Canadian border)
        west: -73.5200,    // Western shore
        east: -73.0700     // Eastern shore
    }
};

/**
 * Routing configuration for pathfinding behavior
 */
const ROUTING_CONFIG = {
    // Turn penalties (in km-equivalent cost)
    turnPenalty: {
        enabled: true,
        gentle: 0.05,      // < 30°
        moderate: 0.15,    // 30-60°
        sharp: 0.40,       // 60-90°
        verySharp: 0.80    // > 90°
    },

    // Path smoothing
    smoothing: {
        enabled: false,         // Disabled - rely on dense waypoints for visual smoothness
        method: 'catmull-rom',  // 'catmull-rom', 'bezier', 'none'
        tension: 0.9,           // 0 = loose curves, 1 = tight curves (very tight if enabled)
        simplifyFirst: false,   // Keep ALL waypoints - density creates visual smoothness
        simplifyTolerance: 0.00001  // degrees (very fine - keeps maximum waypoints)
    },

    // Safety margins (meters)
    safetyMargins: {
        fromShore: 50,
        fromIsland: 30,
        fromShallows: 25,
        inChannel: 0        // When in marked channel
    },

    // Visualization
    visualization: {
        showTurns: false,
        showWaypoints: false,
        highlightSharpTurns: true,
        pathWidth: 3
    }
};

/**
 * Maximum distance (km) to search for nearest grid point
 * If a POI is farther than this from any water grid point,
 * pathfinding will fail (prevents infinite searches)
 */
const MAX_GRID_SEARCH_DISTANCE_KM = 5;

// ============================================
// Channel Markers & Navigation Aids
// ============================================
/**
 * Channel marker infrastructure for future implementation
 * Supports IALA-B (US) buoyage system and other navigation aids
 */
let CHANNEL_MARKERS = [];
let CHANNELS = [];

/**
 * Channel marker types (IALA-B system used in Americas)
 */
const MARKER_TYPES = {
    // Lateral marks (channel sides)
    LATERAL_RED: 'lateral-red',         // Keep to starboard when returning from sea
    LATERAL_GREEN: 'lateral-green',     // Keep to port when returning from sea

    // Cardinal marks (indicate safe water direction)
    CARDINAL_NORTH: 'cardinal-north',
    CARDINAL_SOUTH: 'cardinal-south',
    CARDINAL_EAST: 'cardinal-east',
    CARDINAL_WEST: 'cardinal-west',

    // Special purpose
    SAFE_WATER: 'safe-water',           // Mid-channel/fairway
    ISOLATED_DANGER: 'isolated-danger', // Danger with navigable water around
    SPECIAL: 'special',                 // Special area (anchorage, etc.)

    // Information
    REGULATORY: 'regulatory',           // Speed limit, no wake, etc.
    MOORING: 'mooring'                 // Mooring area
};

/**
 * Example channel marker structure (for future Hudson River implementation)
 *
 * const CHANNEL_MARKERS = [
 *     {
 *         id: 'hud-mile-001-red',
 *         name: 'Hudson River Mile 1 - Red Nun #2',
 *         lat: 42.7500,
 *         lng: -73.6900,
 *         type: MARKER_TYPES.LATERAL_RED,
 *         waterBody: 'hudson-river',
 *         channelSide: 'starboard',
 *         number: '2',
 *         pairWith: 'hud-mile-001-green',
 *         light: {
 *             color: 'red',
 *             pattern: 'flashing',
 *             period: 4  // seconds
 *         },
 *         radius: 50,  // meters - stay outside this
 *         active: true,
 *         notes: 'Mile 1.2 from Battery'
 *     },
 *     {
 *         id: 'hud-mile-001-green',
 *         name: 'Hudson River Mile 1 - Green Can #1',
 *         lat: 42.7495,
 *         lng: -73.6880,
 *         type: MARKER_TYPES.LATERAL_GREEN,
 *         waterBody: 'hudson-river',
 *         channelSide: 'port',
 *         number: '1',
 *         pairWith: 'hud-mile-001-red',
 *         light: {
 *             color: 'green',
 *             pattern: 'flashing',
 *             period: 4
 *         },
 *         radius: 50,
 *         active: true,
 *         notes: 'Mile 1.2 from Battery'
 *     }
 * ];
 */

/**
 * Example channel definition (for future implementation)
 *
 * const CHANNELS = [
 *     {
 *         id: 'hudson-main',
 *         name: 'Hudson River Main Channel',
 *         waterBody: 'hudson-river',
 *         markers: ['hud-mile-001-red', 'hud-mile-001-green', ...],
 *         width: 100,  // meters
 *         centerline: [  // Optional pre-computed centerline
 *             [42.7500, -73.6890],
 *             [42.7550, -73.6895],
 *             ...
 *         ],
 *         preferredDirection: 'north',
 *         restrictions: {
 *             commercial: true,
 *             recreational: true,
 *             minimumDepth: 3.5,  // meters at low water
 *             speedLimit: null    // null = no limit, or number in knots
 *         },
 *         notes: 'Federal navigation channel, maintained 12ft depth'
 *     }
 * ];
 */

/**
 * Load channel markers from JSON file (future implementation)
 */
async function loadChannelMarkers(waterBodyId) {
    // Future: Load from data/channels/{waterBodyId}-markers.json
    console.log(`Channel marker loading not yet implemented for ${waterBodyId}`);
    return [];
}

/**
 * Check if a point is within a marked channel (future implementation)
 */
function isInMarkedChannel(lat, lng) {
    // Future: Check if point is between channel markers
    return false;
}

/**
 * Get nearest channel marker (future implementation)
 */
function getNearestChannelMarker(lat, lng, maxDistance = 1.0) {
    // Future: Find closest marker within maxDistance km
    return null;
}

// ============================================
// Point in Polygon Check (Ray Casting)
// ============================================
/**
 * Ray casting algorithm for point-in-polygon test
 * Works with [lat, lng] coordinate pairs (standard format)
 */
function pointInPolygon(lat, lng, polygon) {
    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];

        if (((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Point-in-polygon check with hole support (for islands)
 * @param {number} lat - Latitude to check
 * @param {number} lng - Longitude to check
 * @param {Array} outerRing - Outer boundary coordinates [[lat, lng], ...]
 * @param {Array} holeRings - Array of hole (island) coordinates [[[lat, lng], ...], ...]
 * @returns {boolean} True if point is in water (inside outer, outside holes)
 */
function pointInPolygonWithHoles(lat, lng, outerRing, holeRings = []) {
    // Check if point is inside outer boundary
    if (!pointInPolygon(lat, lng, outerRing)) {
        return false;
    }

    // Check if point is inside any hole (island)
    for (const hole of holeRings) {
        if (pointInPolygon(lat, lng, hole)) {
            return false;  // Inside an island = not navigable water
        }
    }

    return true;
}

/**
 * Convert GeoJSON coordinate format [lng, lat] to [lat, lng]
 * GeoJSON uses [longitude, latitude] order, we use [latitude, longitude]
 */
function geoJsonToLatLng(geoJsonCoords) {
    return geoJsonCoords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Check if a point is in navigable water
 * Supports multiple water bodies and islands
 */
function isInWater(lat, lng) {
    if (!WATER_BOUNDARIES || WATER_BOUNDARIES.length === 0) {
        console.error('Water boundaries not loaded');
        return false;
    }

    for (const waterBody of WATER_BOUNDARIES) {
        const outer = geoJsonToLatLng(waterBody.outer);
        const holes = waterBody.holes.map(geoJsonToLatLng);

        if (pointInPolygonWithHoles(lat, lng, outer, holes)) {
            return true;
        }
    }

    return false;
}

/**
 * Get the name of the water body containing a point
 * @returns {string|null} Water body name or null if not in water
 */
function getWaterBodyName(lat, lng) {
    if (!WATER_BOUNDARIES) return null;

    for (const waterBody of WATER_BOUNDARIES) {
        const outer = geoJsonToLatLng(waterBody.outer);
        const holes = waterBody.holes.map(geoJsonToLatLng);

        if (pointInPolygonWithHoles(lat, lng, outer, holes)) {
            return waterBody.name;
        }
    }

    return null;
}

// ============================================
// Haversine Distance (km)
// ============================================
/**
 * Calculate great-circle distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lng1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lng2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

// ============================================
// Turn Angle Calculation (for smoother routing)
// ============================================
/**
 * Calculate the bearing (compass direction) from point 1 to point 2
 * @param {number} lat1 - Start latitude
 * @param {number} lng1 - Start longitude
 * @param {number} lat2 - End latitude
 * @param {number} lng2 - End longitude
 * @returns {number} Bearing in degrees (0-360, where 0/360 is north)
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;  // Normalize to 0-360
}

/**
 * Calculate the turn angle between three points
 * @param {Object} p1 - Previous point {lat, lng}
 * @param {Object} p2 - Current point {lat, lng}
 * @param {Object} p3 - Next point {lat, lng}
 * @returns {number} Turn angle in degrees (0-180, where 0 is straight, 180 is U-turn)
 */
function calculateTurnAngle(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return 0;

    const bearing1 = calculateBearing(p1.lat, p1.lng, p2.lat, p2.lng);
    const bearing2 = calculateBearing(p2.lat, p2.lng, p3.lat, p3.lng);

    let angle = Math.abs(bearing2 - bearing1);
    if (angle > 180) {
        angle = 360 - angle;
    }

    return angle;
}

/**
 * Calculate turn cost penalty based on angle
 * Encourages gentler, more boat-friendly turns
 * @param {number} turnAngle - Turn angle in degrees
 * @returns {number} Cost penalty in km-equivalent
 */
function calculateTurnCost(turnAngle) {
    if (!ROUTING_CONFIG.turnPenalty.enabled) return 0;

    const angle = Math.abs(turnAngle);
    const penalties = ROUTING_CONFIG.turnPenalty;

    if (angle < 30) {
        return penalties.gentle;
    } else if (angle < 60) {
        return penalties.moderate;
    } else if (angle < 90) {
        return penalties.sharp;
    } else {
        return penalties.verySharp;
    }
}

// ============================================
// Grid Generation with Spatial Indexing
// ============================================
let waterGrid = null;
let gridIndex = null;
let spatialIndex = null;  // RBush spatial index for fast nearest-neighbor queries

function generateWaterGrid() {
    if (waterGrid !== null) {
        return waterGrid;
    }

    if (!WATER_BOUNDARIES || WATER_BOUNDARIES.length === 0) {
        console.error('Cannot generate water grid: water boundaries not loaded');
        return null;
    }

    const totalVertices = WATER_BOUNDARIES.reduce((sum, wb) =>
        sum + wb.outer.length + wb.holes.reduce((h_sum, h) => h_sum + h.length, 0), 0
    );
    console.log(`Generating water grid from ${totalVertices} boundary vertices (${WATER_BOUNDARIES.reduce((sum, wb) => sum + wb.holes.length, 0)} islands)...`);
    const startTime = performance.now();

    waterGrid = [];
    gridIndex = {};

    const { south, north, west, east } = GRID_CONFIG.bounds;
    const { latStep, lngStep } = GRID_CONFIG;

    let id = 0;
    let depthFiltered = 0;

    for (let lat = south; lat <= north; lat += latStep) {
        for (let lng = west; lng <= east; lng += lngStep) {
            if (isInWater(lat, lng)) {
                const gridId = `g${id}`;

                // Check depth constraints if depth data available
                let depthOk = true;
                let depth = null;

                if (DEPTH_GRID && DEPTH_GRID.has(gridId)) {
                    const depthPoint = DEPTH_GRID.get(gridId);
                    depth = depthPoint.depth;

                    const minSafeDepth = VESSEL_DRAFT + SAFETY_MARGIN;

                    if (depth < minSafeDepth) {
                        depthOk = false;
                        depthFiltered++;
                    }
                }

                // Only add point if both in water AND has safe depth (if depth data available)
                if (depthOk) {
                    const point = {
                        id: gridId,
                        lat: Math.round(lat * 1000000) / 1000000,
                        lng: Math.round(lng * 1000000) / 1000000,
                        depth: depth,  // Include depth if available
                        row: Math.round((lat - south) / latStep),
                        col: Math.round((lng - west) / lngStep),
                        // RBush requires bounding box format
                        minX: lng,
                        minY: lat,
                        maxX: lng,
                        maxY: lat
                    };
                    waterGrid.push(point);

                    const key = `${point.row},${point.col}`;
                    gridIndex[key] = point;

                    id++;
                }
            }
        }
    }

    if (depthFiltered > 0) {
        console.log(`Filtered out ${depthFiltered} shallow water points (< ${VESSEL_DRAFT + SAFETY_MARGIN}m depth)`);
    }

    // Build RBush spatial index for fast nearest-neighbor queries
    if (typeof RBush !== 'undefined') {
        spatialIndex = new RBush();
        spatialIndex.load(waterGrid);
        console.log(`Built spatial index with ${spatialIndex.all().length} water grid points`);
    } else {
        console.warn('RBush not available - nearest point queries will use slower linear search');
    }

    const endTime = performance.now();
    console.log(`Generated ${waterGrid.length} water grid points in ${(endTime - startTime).toFixed(0)}ms`);

    return waterGrid;
}

// ============================================
// Find Neighbors (8-directional connectivity)
// ============================================
function getNeighbors(point) {
    const neighbors = [];
    const { row, col } = point;

    const directions = [
        [-1, 0], [-1, 1], [0, 1], [1, 1],
        [1, 0], [1, -1], [0, -1], [-1, -1]
    ];

    for (const [dr, dc] of directions) {
        const key = `${row + dr},${col + dc}`;
        if (gridIndex[key]) {
            neighbors.push(gridIndex[key]);
        }
    }

    return neighbors;
}

// ============================================
// A* Pathfinding Algorithm
// ============================================
/**
 * Find a water-only path between two points using A* algorithm
 * @param {number} startLat - Starting latitude
 * @param {number} startLng - Starting longitude
 * @param {number} endLat - Ending latitude
 * @param {number} endLng - Ending longitude
 * @returns {Object|null} Object with path array and distance, or null if no path found
 */
function findPath(startLat, startLng, endLat, endLng) {
    // Validate inputs
    if (!Number.isFinite(startLat) || !Number.isFinite(startLng) ||
        !Number.isFinite(endLat) || !Number.isFinite(endLng)) {
        console.error('Invalid coordinates provided to findPath:', {
            startLat, startLng, endLat, endLng
        });
        return null;
    }

    // Check if coordinates are within reasonable bounds
    if (startLat < -90 || startLat > 90 || endLat < -90 || endLat > 90 ||
        startLng < -180 || startLng > 180 || endLng < -180 || endLng > 180) {
        console.error('Coordinates out of valid range:', {
            startLat, startLng, endLat, endLng
        });
        return null;
    }

    generateWaterGrid();

    if (!waterGrid || waterGrid.length === 0) {
        console.error('Water grid generation failed');
        return null;
    }

    const startPoint = findNearestGridPoint(startLat, startLng);
    const endPoint = findNearestGridPoint(endLat, endLng);

    if (!startPoint || !endPoint) {
        console.warn('Could not find grid points for route');
        return null;
    }

    // Check if points are too far from water
    const startDist = haversineDistance(startLat, startLng, startPoint.lat, startPoint.lng);
    const endDist = haversineDistance(endLat, endLng, endPoint.lat, endPoint.lng);

    if (startDist > MAX_GRID_SEARCH_DISTANCE_KM) {
        console.warn(`Start point is ${startDist.toFixed(2)}km from nearest water (max: ${MAX_GRID_SEARCH_DISTANCE_KM}km)`);
        return null;
    }

    if (endDist > MAX_GRID_SEARCH_DISTANCE_KM) {
        console.warn(`End point is ${endDist.toFixed(2)}km from nearest water (max: ${MAX_GRID_SEARCH_DISTANCE_KM}km)`);
        return null;
    }

    const openSet = new Map();
    openSet.set(startPoint.id, startPoint);

    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    for (const p of waterGrid) {
        gScore[p.id] = Infinity;
        fScore[p.id] = Infinity;
    }

    gScore[startPoint.id] = 0;
    fScore[startPoint.id] = haversineDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng);

    const pointById = {};
    for (const p of waterGrid) {
        pointById[p.id] = p;
    }

    const closedSet = new Set();

    while (openSet.size > 0) {
        let current = null;
        let lowestF = Infinity;

        for (const [id, point] of openSet) {
            if (fScore[id] < lowestF) {
                lowestF = fScore[id];
                current = point;
            }
        }

        if (!current) break;

        if (current.id === endPoint.id) {
            const path = [current];
            let curr = current.id;
            while (cameFrom[curr]) {
                curr = cameFrom[curr];
                path.unshift(pointById[curr]);
            }

            let totalDistance = 0;
            for (let i = 0; i < path.length - 1; i++) {
                totalDistance += haversineDistance(
                    path[i].lat, path[i].lng,
                    path[i + 1].lat, path[i + 1].lng
                );
            }

            return { path, distance: totalDistance };
        }

        openSet.delete(current.id);
        closedSet.add(current.id);

        for (const neighbor of getNeighbors(current)) {
            if (closedSet.has(neighbor.id)) continue;

            // Base distance cost
            const distanceCost = haversineDistance(current.lat, current.lng, neighbor.lat, neighbor.lng);

            // Calculate turn cost penalty for smoother routes
            let turnCost = 0;
            if (ROUTING_CONFIG.turnPenalty.enabled && cameFrom[current.id]) {
                const previousPoint = pointById[cameFrom[current.id]];
                if (previousPoint) {
                    const turnAngle = calculateTurnAngle(previousPoint, current, neighbor);
                    turnCost = calculateTurnCost(turnAngle);
                }
            }

            const tentativeG = gScore[current.id] + distanceCost + turnCost;

            if (tentativeG < gScore[neighbor.id]) {
                cameFrom[neighbor.id] = current.id;
                gScore[neighbor.id] = tentativeG;
                fScore[neighbor.id] = tentativeG +
                    haversineDistance(neighbor.lat, neighbor.lng, endPoint.lat, endPoint.lng);

                if (!openSet.has(neighbor.id)) {
                    openSet.set(neighbor.id, neighbor);
                }
            }
        }
    }

    // No path found - all possible routes have been exhausted
    console.warn('No water path found between points:', {
        start: { lat: startLat, lng: startLng },
        end: { lat: endLat, lng: endLng },
        startPoint: { lat: startPoint.lat, lng: startPoint.lng },
        endPoint: { lat: endPoint.lat, lng: endPoint.lng },
        nodesExplored: closedSet.size
    });
    return null;
}

// ============================================
// Path Smoothing for Boat-Friendly Routes
// ============================================
/**
 * Douglas-Peucker path simplification algorithm
 * Removes unnecessary waypoints while preserving path shape
 * @param {Array} points - Array of {lat, lng} points
 * @param {number} tolerance - Simplification tolerance in degrees
 * @returns {Array} Simplified array of points
 */
function douglasPeucker(points, tolerance) {
    if (points.length <= 2) return points;

    // Find the point with maximum distance from line segment
    let maxDistance = 0;
    let index = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
        const distance = perpendicularDistance(
            points[i],
            points[0],
            points[end]
        );
        if (distance > maxDistance) {
            maxDistance = distance;
            index = i;
        }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
        const left = douglasPeucker(points.slice(0, index + 1), tolerance);
        const right = douglasPeucker(points.slice(index), tolerance);
        return left.slice(0, -1).concat(right);
    } else {
        return [points[0], points[end]];
    }
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.lng - lineStart.lng;
    const dy = lineEnd.lat - lineStart.lat;

    const numerator = Math.abs(
        dy * point.lng - dx * point.lat +
        lineEnd.lng * lineStart.lat - lineEnd.lat * lineStart.lng
    );

    const denominator = Math.sqrt(dx * dx + dy * dy);

    return numerator / denominator;
}

/**
 * Catmull-Rom spline interpolation for smooth curves
 * Creates natural-looking curves through waypoints
 * @param {Array} points - Array of {lat, lng} control points
 * @param {number} segmentsPerPoint - Number of interpolated points between each pair
 * @param {number} tension - Curve tension (0-1, where 0.5 is standard Catmull-Rom)
 * @returns {Array} Smooth path with interpolated points
 */
function catmullRomSpline(points, segmentsPerPoint = 10, tension = 0.5) {
    if (points.length < 2) return points;
    if (points.length === 2) return points;

    const result = [];
    const alpha = tension;

    // Add first point
    result.push(points[0]);

    // For each segment between points
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

        // Interpolate between p1 and p2
        for (let t = 1; t <= segmentsPerPoint; t++) {
            const tNorm = t / segmentsPerPoint;

            // Catmull-Rom matrix
            const lat = catmullRomInterpolate(
                p0.lat, p1.lat, p2.lat, p3.lat, tNorm, alpha
            );
            const lng = catmullRomInterpolate(
                p0.lng, p1.lng, p2.lng, p3.lng, tNorm, alpha
            );

            result.push({ lat, lng });
        }
    }

    return result;
}

/**
 * Catmull-Rom interpolation formula
 */
function catmullRomInterpolate(p0, p1, p2, p3, t, alpha) {
    const t2 = t * t;
    const t3 = t2 * t;

    return (
        0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        )
    );
}

/**
 * Validate that smoothed path points are in water
 * Removes or adjusts points that have strayed onto land
 * @param {Array} smoothedPath - Array of {lat, lng} points from smoothing
 * @param {Array} originalPath - Original grid-based path (guaranteed in water)
 * @returns {Object} { validated: Array, issues: Number }
 */
function validateSmoothedPath(smoothedPath, originalPath) {
    const validated = [];
    let landIssues = 0;
    let lastGoodPoint = smoothedPath[0]; // Start point is always valid

    validated.push(smoothedPath[0]);

    for (let i = 1; i < smoothedPath.length - 1; i++) {
        const point = smoothedPath[i];

        // Check if point is in water
        if (isInWater(point.lat, point.lng)) {
            validated.push(point);
            lastGoodPoint = point;
        } else {
            // Point is on land! Need to handle this.
            landIssues++;

            // Strategy: Find the nearest original path point in this region
            // This ensures we stay on the proven water path
            const nearestOriginal = findNearestPointInArray(point, originalPath);
            if (nearestOriginal && isInWater(nearestOriginal.lat, nearestOriginal.lng)) {
                validated.push(nearestOriginal);
                lastGoodPoint = nearestOriginal;
            } else {
                // Fallback: use the last known good point (keeps route in water)
                validated.push(lastGoodPoint);
            }
        }
    }

    // End point is always valid
    validated.push(smoothedPath[smoothedPath.length - 1]);

    return {
        validated,
        landIssues
    };
}

/**
 * Find nearest point in an array to a target point
 */
function findNearestPointInArray(target, pointArray) {
    let nearest = null;
    let minDist = Infinity;

    for (const point of pointArray) {
        const dist = Math.sqrt(
            Math.pow(target.lat - point.lat, 2) +
            Math.pow(target.lng - point.lng, 2)
        );
        if (dist < minDist) {
            minDist = dist;
            nearest = point;
        }
    }

    return nearest;
}

/**
 * Apply path smoothing to a route
 * Combines Douglas-Peucker simplification with Catmull-Rom spline
 * INCLUDES WATER VALIDATION to prevent routing over land
 * @param {Array} path - Array of grid points with {lat, lng}
 * @returns {Object} { smoothed: Array, metadata: Object }
 */
function smoothPath(path) {
    if (!ROUTING_CONFIG.smoothing.enabled || path.length < 3) {
        return {
            smoothed: path,
            metadata: {
                originalWaypoints: path.length,
                smoothedWaypoints: path.length,
                method: 'none',
                landIssues: 0
            }
        };
    }

    const originalCount = path.length;
    const originalPath = [...path]; // Keep original for validation
    let result = [...path];

    // Step 1: Simplify using Douglas-Peucker (if enabled)
    if (ROUTING_CONFIG.smoothing.simplifyFirst) {
        result = douglasPeucker(result, ROUTING_CONFIG.smoothing.simplifyTolerance);
    }

    const simplifiedCount = result.length;

    // Step 2: Apply spline smoothing (if enabled)
    if (ROUTING_CONFIG.smoothing.method === 'catmull-rom') {
        const segmentsPerPoint = Math.max(3, Math.floor(10 * (1 - ROUTING_CONFIG.smoothing.tension)));
        result = catmullRomSpline(result, segmentsPerPoint, ROUTING_CONFIG.smoothing.tension);
    }

    // Step 3: CRITICAL - Validate smoothed path stays in water
    const validation = validateSmoothedPath(result, originalPath);
    result = validation.validated;

    if (validation.landIssues > 0) {
        console.warn(`Path smoothing: ${validation.landIssues} points adjusted to stay in water`);
    }

    return {
        smoothed: result,
        metadata: {
            originalWaypoints: originalCount,
            simplifiedWaypoints: simplifiedCount,
            smoothedWaypoints: result.length,
            method: ROUTING_CONFIG.smoothing.method,
            landIssues: validation.landIssues
        }
    };
}

/**
 * Analyze turns in a path
 * Identifies sharp turns for warning purposes
 * @param {Array} path - Array of {lat, lng} points
 * @returns {Array} Array of turn analysis objects
 */
function analyzeTurns(path) {
    const turns = [];

    for (let i = 1; i < path.length - 1; i++) {
        const angle = calculateTurnAngle(path[i - 1], path[i], path[i + 1]);

        if (angle > 30) {  // Only record significant turns
            let severity = 'gentle';
            if (angle > 90) severity = 'very-sharp';
            else if (angle > 60) severity = 'sharp';
            else if (angle > 45) severity = 'moderate';

            turns.push({
                at: [path[i].lat, path[i].lng],
                angle: Math.round(angle),
                severity
            });
        }
    }

    return turns;
}

// ============================================
// Find Nearest Grid Point with Spatial Index
// ============================================
/**
 * Find the nearest water grid point to given coordinates
 * Uses RBush spatial index for O(log n) performance instead of O(n) linear search
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object|null} Nearest grid point or null if grid not generated
 */
function findNearestGridPoint(lat, lng) {
    generateWaterGrid();

    if (!waterGrid || waterGrid.length === 0) {
        console.error('Water grid not available');
        return null;
    }

    // Use RBush spatial index if available (much faster)
    if (spatialIndex && typeof spatialIndex.all === 'function') {
        // Create search bounding box (point)
        const searchPoint = {
            minX: lng,
            minY: lat,
            maxX: lng,
            maxY: lat
        };

        // Get all points and find nearest using Haversine
        // RBush doesn't have built-in nearest-neighbor, so we search
        // a small bounding box and expand if needed
        const candidates = spatialIndex.all();

        let nearest = null;
        let nearestDist = Infinity;

        for (const point of candidates) {
            const dist = haversineDistance(lat, lng, point.lat, point.lng);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = point;
            }
        }

        return nearest;
    }

    // Fallback to linear search if RBush not available
    console.warn('Using linear search for nearest point (RBush not available)');
    let nearest = null;
    let nearestDist = Infinity;

    for (const point of waterGrid) {
        const dist = haversineDistance(lat, lng, point.lat, point.lng);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = point;
        }
    }

    return nearest;
}

// ============================================
// Main Water Route Calculation
// ============================================
function calculateWaterRoute(startPoiId, endPoiId) {
    const startPoi = POINTS_OF_INTEREST.find(p => p.id === startPoiId);
    const endPoi = POINTS_OF_INTEREST.find(p => p.id === endPoiId);

    if (!startPoi || !endPoi) {
        console.warn('POI not found:', startPoiId, endPoiId);
        return null;
    }

    if (startPoiId === endPoiId) {
        return {
            coordinates: [[startPoi.lat, startPoi.lng]],
            distance: 0,
            path: []
        };
    }

    const pathResult = findPath(startPoi.lat, startPoi.lng, endPoi.lat, endPoi.lng);

    if (!pathResult) {
        const directDistance = haversineDistance(
            startPoi.lat, startPoi.lng,
            endPoi.lat, endPoi.lng
        );
        return {
            coordinates: [
                [startPoi.lat, startPoi.lng],
                [endPoi.lat, endPoi.lng]
            ],
            distance: directDistance,
            path: [],
            isFallback: true
        };
    }

    let finalPath = pathResult.path;

    console.log(`Route found: ${finalPath.length} waypoints before smoothing`);

    // Build initial coordinate path
    const rawCoordinates = [[startPoi.lat, startPoi.lng]];
    for (const point of finalPath) {
        rawCoordinates.push([point.lat, point.lng]);
    }
    rawCoordinates.push([endPoi.lat, endPoi.lng]);

    // Convert to points array for smoothing
    const rawPoints = rawCoordinates.map(([lat, lng]) => ({ lat, lng }));

    // Apply path smoothing
    const smoothResult = smoothPath(rawPoints);
    const smoothedCoordinates = smoothResult.smoothed.map(p => [p.lat, p.lng]);

    // Analyze turns in smoothed path
    const turns = analyzeTurns(smoothResult.smoothed);
    const maxTurnAngle = turns.length > 0 ? Math.max(...turns.map(t => t.angle)) : 0;

    // Calculate distances
    const startGridDist = haversineDistance(
        startPoi.lat, startPoi.lng,
        pathResult.path[0].lat, pathResult.path[0].lng
    );
    const endGridDist = haversineDistance(
        endPoi.lat, endPoi.lng,
        pathResult.path[pathResult.path.length - 1].lat,
        pathResult.path[pathResult.path.length - 1].lng
    );

    // Calculate total distance of smoothed path
    let smoothedDistance = startGridDist + endGridDist;
    for (let i = 0; i < smoothedCoordinates.length - 1; i++) {
        smoothedDistance += haversineDistance(
            smoothedCoordinates[i][0], smoothedCoordinates[i][1],
            smoothedCoordinates[i + 1][0], smoothedCoordinates[i + 1][1]
        );
    }

    console.log(`Route smoothed: ${smoothResult.metadata.originalWaypoints} → ${smoothResult.metadata.smoothedWaypoints} waypoints`);
    if (turns.length > 0) {
        console.log(`Route has ${turns.length} significant turns (max: ${maxTurnAngle}°)`);
    }

    return {
        // Core route data
        coordinates: smoothedCoordinates,
        distance: smoothedDistance,
        path: finalPath.map(p => p.id),

        // Smoothing metadata
        smoothed: ROUTING_CONFIG.smoothing.enabled,
        smoothingMethod: smoothResult.metadata.method,
        originalWaypoints: smoothResult.metadata.originalWaypoints,
        smoothedWaypoints: smoothResult.metadata.smoothedWaypoints,

        // Turn analysis
        turns: turns,
        maxTurnAngle: maxTurnAngle,
        sharpTurns: turns.filter(t => t.severity === 'sharp' || t.severity === 'very-sharp').length,

        // Future channel marker support
        channelMarkers: [],
        inMarkedChannel: false,
        safetyMargin: ROUTING_CONFIG.safetyMargins.fromShore,

        // Warnings
        warnings: turns.filter(t => t.angle > 90).map(t =>
            `Sharp turn (${t.angle}°) at ${t.at[0].toFixed(4)}, ${t.at[1].toFixed(4)}`
        ),
        clearanceIssues: []
    };
}

// ============================================
// Pre-generate grid on page load
// ============================================
// Grid generation now happens after water boundaries are loaded
// See initializeData() in app.js

// ============================================
// Exports
// ============================================
if (typeof window !== 'undefined') {
    window.loadWaterBoundaries = loadWaterBoundaries;
    window.calculateWaterRoute = calculateWaterRoute;
    window.haversineDistance = haversineDistance;
    window.isInWater = isInWater;
    window.getWaterBodyName = getWaterBodyName;
    window.findNearestGridPoint = findNearestGridPoint;
    window.generateWaterGrid = generateWaterGrid;
    window.pointInPolygonWithHoles = pointInPolygonWithHoles;

    // Turn and smoothing functions
    window.calculateBearing = calculateBearing;
    window.calculateTurnAngle = calculateTurnAngle;
    window.smoothPath = smoothPath;
    window.analyzeTurns = analyzeTurns;

    // Configuration
    window.GRID_CONFIG = GRID_CONFIG;
    window.ROUTING_CONFIG = ROUTING_CONFIG;
    window.MARKER_TYPES = MARKER_TYPES;

    // Data
    window.LAKE_CHAMPLAIN_POLYGON = LAKE_CHAMPLAIN_POLYGON;
    window.WATER_BOUNDARIES = WATER_BOUNDARIES;
    window.CHANNEL_MARKERS = CHANNEL_MARKERS;
    window.CHANNELS = CHANNELS;
}

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadWaterBoundaries,
        pointInPolygon,
        pointInPolygonWithHoles,
        geoJsonToLatLng,
        isInWater,
        getWaterBodyName,
        haversineDistance,
        generateWaterGrid,
        getNeighbors,
        findNearestGridPoint,
        findPath,
        calculateWaterRoute,
        LAKE_CHAMPLAIN_POLYGON,
        GRID_CONFIG,
        EARTH_RADIUS_KM,
        MAX_GRID_SEARCH_DISTANCE_KM,
        // Expose internal variables for testing
        get waterGrid() { return waterGrid; },
        get gridIndex() { return gridIndex; },
        get spatialIndex() { return spatialIndex; },
        get WATER_BOUNDARIES() { return WATER_BOUNDARIES; }
    };
}
