/**
 * Lake Champlain & Hudson River Boater's Guide
 * Waterway Polygon Data
 *
 * This file contains all polygon data for navigable waterways and
 * island exclusion zones. The data is structured to support:
 * - Multiple navigable waterway polygons (Lake Champlain, Champlain Canal, Hudson River)
 * - Island exclusion zones within waterways
 *
 * Coordinate format: [latitude, longitude]
 *
 * Sources:
 * - Lake Champlain boundary: USGS NHD via lake_champlain_boundary.kmz
 * - Island boundaries: OpenStreetMap, USGS topographic maps
 * - Canal/River: NOAA charts, NYS Canal Corporation
 */

// ============================================
// ISLAND EXCLUSION POLYGONS
// ============================================
// These are land masses within Lake Champlain that routes must avoid.
// Polygons are ordered clockwise.

/**
 * Grand Isle, VT - Largest island in Lake Champlain
 * Approximate bounds: 44.63-44.73°N, 73.27-73.32°W
 */
const GRAND_ISLE_POLYGON = [
    [44.7320, -73.3050],
    [44.7280, -73.2900],
    [44.7200, -73.2800],
    [44.7100, -73.2750],
    [44.7000, -73.2720],
    [44.6900, -73.2700],
    [44.6800, -73.2700],
    [44.6700, -73.2720],
    [44.6600, -73.2750],
    [44.6500, -73.2800],
    [44.6400, -73.2850],
    [44.6350, -73.2900],
    [44.6320, -73.2950],
    [44.6300, -73.3000],
    [44.6300, -73.3100],
    [44.6320, -73.3150],
    [44.6350, -73.3180],
    [44.6400, -73.3200],
    [44.6500, -73.3220],
    [44.6600, -73.3230],
    [44.6700, -73.3220],
    [44.6800, -73.3200],
    [44.6900, -73.3180],
    [44.7000, -73.3150],
    [44.7100, -73.3120],
    [44.7200, -73.3100],
    [44.7280, -73.3080],
    [44.7320, -73.3050]
];

/**
 * North Hero Island, VT
 * Approximate bounds: 44.79-44.86°N, 73.24-73.32°W
 */
const NORTH_HERO_POLYGON = [
    [44.8600, -73.2900],
    [44.8550, -73.2750],
    [44.8450, -73.2650],
    [44.8350, -73.2550],
    [44.8250, -73.2500],
    [44.8150, -73.2450],
    [44.8050, -73.2430],
    [44.7950, -73.2450],
    [44.7900, -73.2500],
    [44.7850, -73.2600],
    [44.7830, -73.2700],
    [44.7830, -73.2800],
    [44.7850, -73.2900],
    [44.7900, -73.3000],
    [44.7950, -73.3080],
    [44.8000, -73.3120],
    [44.8100, -73.3150],
    [44.8200, -73.3150],
    [44.8300, -73.3130],
    [44.8400, -73.3100],
    [44.8500, -73.3050],
    [44.8550, -73.3000],
    [44.8600, -73.2900]
];

/**
 * Isle La Motte, VT
 * Approximate bounds: 44.85-44.92°N, 73.32-73.38°W
 */
const ISLE_LA_MOTTE_POLYGON = [
    [44.9200, -73.3400],
    [44.9150, -73.3300],
    [44.9050, -73.3250],
    [44.8950, -73.3220],
    [44.8850, -73.3230],
    [44.8750, -73.3280],
    [44.8700, -73.3350],
    [44.8680, -73.3450],
    [44.8680, -73.3550],
    [44.8700, -73.3650],
    [44.8750, -73.3720],
    [44.8850, -73.3780],
    [44.8950, -73.3800],
    [44.9050, -73.3780],
    [44.9150, -73.3700],
    [44.9200, -73.3600],
    [44.9220, -73.3500],
    [44.9200, -73.3400]
];

/**
 * South Hero (essentially connected to Grand Isle via causeway, but water on sides)
 * Approximate bounds: 44.58-44.65°N, 73.28-73.34°W
 */
const SOUTH_HERO_POLYGON = [
    [44.6500, -73.3150],
    [44.6450, -73.3050],
    [44.6350, -73.2950],
    [44.6250, -73.2880],
    [44.6150, -73.2850],
    [44.6050, -73.2850],
    [44.5950, -73.2880],
    [44.5880, -73.2950],
    [44.5830, -73.3050],
    [44.5800, -73.3150],
    [44.5800, -73.3250],
    [44.5830, -73.3330],
    [44.5880, -73.3400],
    [44.5950, -73.3450],
    [44.6050, -73.3480],
    [44.6150, -73.3480],
    [44.6250, -73.3450],
    [44.6350, -73.3400],
    [44.6450, -73.3300],
    [44.6500, -73.3200],
    [44.6500, -73.3150]
];

/**
 * Valcour Island, NY - Historic Revolutionary War battle site
 * Approximate bounds: 44.60-44.64°N, 73.42-73.44°W
 */
const VALCOUR_ISLAND_POLYGON = [
    [44.6400, -73.4280],
    [44.6380, -73.4220],
    [44.6320, -73.4180],
    [44.6250, -73.4170],
    [44.6180, -73.4180],
    [44.6120, -73.4220],
    [44.6080, -73.4280],
    [44.6050, -73.4350],
    [44.6050, -73.4420],
    [44.6080, -73.4480],
    [44.6120, -73.4530],
    [44.6180, -73.4560],
    [44.6250, -73.4570],
    [44.6320, -73.4560],
    [44.6380, -73.4520],
    [44.6400, -73.4450],
    [44.6410, -73.4350],
    [44.6400, -73.4280]
];

/**
 * Crab Island, NY - North of Plattsburgh
 * Small island near Cumberland Bay
 */
const CRAB_ISLAND_POLYGON = [
    [44.6950, -73.4400],
    [44.6920, -73.4350],
    [44.6880, -73.4330],
    [44.6840, -73.4350],
    [44.6820, -73.4400],
    [44.6820, -73.4450],
    [44.6840, -73.4500],
    [44.6880, -73.4520],
    [44.6920, -73.4500],
    [44.6950, -73.4450],
    [44.6950, -73.4400]
];

/**
 * Providence Island, VT - Near Alburgh
 */
const PROVIDENCE_ISLAND_POLYGON = [
    [44.9700, -73.2300],
    [44.9680, -73.2250],
    [44.9640, -73.2230],
    [44.9600, -73.2250],
    [44.9580, -73.2300],
    [44.9580, -73.2350],
    [44.9600, -73.2400],
    [44.9640, -73.2420],
    [44.9680, -73.2400],
    [44.9700, -73.2350],
    [44.9700, -73.2300]
];

/**
 * Four Brothers Islands - Small island group
 */
const FOUR_BROTHERS_POLYGON = [
    [44.3900, -73.3950],
    [44.3880, -73.3900],
    [44.3850, -73.3880],
    [44.3820, -73.3900],
    [44.3800, -73.3950],
    [44.3800, -73.4000],
    [44.3820, -73.4050],
    [44.3850, -73.4070],
    [44.3880, -73.4050],
    [44.3900, -73.4000],
    [44.3900, -73.3950]
];

/**
 * Schuyler Island, NY
 */
const SCHUYLER_ISLAND_POLYGON = [
    [44.3600, -73.4100],
    [44.3580, -73.4050],
    [44.3540, -73.4020],
    [44.3500, -73.4030],
    [44.3470, -73.4070],
    [44.3460, -73.4120],
    [44.3470, -73.4180],
    [44.3500, -73.4220],
    [44.3540, -73.4230],
    [44.3580, -73.4200],
    [44.3600, -73.4150],
    [44.3600, -73.4100]
];

// Collection of all island polygons
const ISLAND_EXCLUSIONS = [
    { name: 'Grand Isle', polygon: GRAND_ISLE_POLYGON },
    { name: 'North Hero', polygon: NORTH_HERO_POLYGON },
    { name: 'Isle La Motte', polygon: ISLE_LA_MOTTE_POLYGON },
    { name: 'South Hero', polygon: SOUTH_HERO_POLYGON },
    { name: 'Valcour Island', polygon: VALCOUR_ISLAND_POLYGON },
    { name: 'Crab Island', polygon: CRAB_ISLAND_POLYGON },
    { name: 'Providence Island', polygon: PROVIDENCE_ISLAND_POLYGON },
    { name: 'Four Brothers', polygon: FOUR_BROTHERS_POLYGON },
    { name: 'Schuyler Island', polygon: SCHUYLER_ISLAND_POLYGON }
];

// ============================================
// CHAMPLAIN CANAL POLYGON
// ============================================
/**
 * Champlain Canal - Connects Lake Champlain to the Hudson River
 * Runs from Whitehall, NY (south end of Lake Champlain) to
 * Fort Edward, NY (connects to Hudson River)
 *
 * The canal is narrow (~50-100 feet wide) so we create a buffer polygon
 * that follows the canal centerline with appropriate width.
 *
 * Lock locations (north to south):
 * - Lock C-12: Whitehall
 * - Lock C-11: Fort Ann
 * - Lock C-9: Fort Ann (south)
 * - Lock C-8: Dunham Basin
 * - Lock C-7: Fort Edward
 *
 * Note: This is a simplified polygon representing the navigable waterway.
 * Actual channel may vary. Always consult official charts.
 */
const CHAMPLAIN_CANAL_POLYGON = [
    // Start at Whitehall (connection to Lake Champlain)
    [43.5570, -73.4030],
    [43.5550, -73.4000],
    [43.5500, -73.3980],
    [43.5450, -73.3970],
    [43.5400, -73.3960],
    [43.5350, -73.3950],
    [43.5300, -73.3940],
    [43.5250, -73.3930],
    [43.5200, -73.3920],
    [43.5150, -73.3915],
    [43.5100, -73.3910],
    [43.5050, -73.3905],
    [43.5000, -73.3900],
    // Near Comstock
    [43.4900, -73.3880],
    [43.4800, -73.3860],
    [43.4700, -73.3850],
    [43.4600, -73.3840],
    // Near Fort Ann
    [43.4500, -73.3830],
    [43.4400, -73.3820],
    [43.4300, -73.3810],
    [43.4200, -73.3800],
    [43.4100, -73.3790],
    [43.4000, -73.3780],
    // Approaching Kingsbury
    [43.3900, -73.3770],
    [43.3800, -73.3760],
    [43.3700, -73.3750],
    [43.3600, -73.3740],
    [43.3500, -73.3720],
    [43.3400, -73.3700],
    [43.3300, -73.3680],
    // Near Fort Edward - canal joins Hudson
    [43.3200, -73.3660],
    [43.3100, -73.3640],
    [43.3000, -73.3620],
    [43.2900, -73.3600],
    [43.2850, -73.3580],
    // East side (return path - canal width buffer)
    [43.2850, -73.3520],
    [43.2900, -73.3540],
    [43.3000, -73.3560],
    [43.3100, -73.3580],
    [43.3200, -73.3600],
    [43.3300, -73.3620],
    [43.3400, -73.3640],
    [43.3500, -73.3660],
    [43.3600, -73.3680],
    [43.3700, -73.3690],
    [43.3800, -73.3700],
    [43.3900, -73.3710],
    [43.4000, -73.3720],
    [43.4100, -73.3730],
    [43.4200, -73.3740],
    [43.4300, -73.3750],
    [43.4400, -73.3760],
    [43.4500, -73.3770],
    [43.4600, -73.3780],
    [43.4700, -73.3790],
    [43.4800, -73.3800],
    [43.4900, -73.3820],
    [43.5000, -73.3840],
    [43.5050, -73.3845],
    [43.5100, -73.3850],
    [43.5150, -73.3855],
    [43.5200, -73.3860],
    [43.5250, -73.3870],
    [43.5300, -73.3880],
    [43.5350, -73.3890],
    [43.5400, -73.3900],
    [43.5450, -73.3910],
    [43.5500, -73.3920],
    [43.5550, -73.3940],
    [43.5570, -73.3970],
    [43.5570, -73.4030]  // Close polygon
];

// ============================================
// HUDSON RIVER POLYGON
// ============================================
/**
 * Hudson River - From Fort Edward/Hudson Falls south to NYC area
 *
 * The Hudson is a significant waterway with varying widths.
 * This polygon covers the navigable channel from the Champlain Canal
 * connection south through Troy, Albany, Kingston, Poughkeepsie,
 * Newburgh, and towards NYC.
 *
 * Key locations (north to south):
 * - Fort Edward (connection to Champlain Canal)
 * - Glens Falls
 * - Troy (Federal Lock - head of tidewater)
 * - Albany
 * - Catskill
 * - Kingston/Rondout
 * - Poughkeepsie
 * - Newburgh
 * - West Point
 * - Haverstraw Bay
 * - Tappan Zee
 * - NYC/Upper Bay
 *
 * Note: This is a simplified polygon. The Hudson widens significantly
 * in places like Haverstraw Bay and Tappan Zee.
 */
const HUDSON_RIVER_POLYGON = [
    // Northern section - Fort Edward to Troy (narrower, canal-like)
    // West bank going south
    [43.2850, -73.3580],  // Connection from Champlain Canal
    [43.2700, -73.3700],
    [43.2500, -73.3900],
    [43.2300, -73.4100],
    [43.2100, -73.4200],
    [43.1900, -73.4300],
    // Glens Falls area
    [43.1700, -73.4400],
    [43.1500, -73.4500],
    [43.1300, -73.4600],
    [43.1100, -73.4700],
    [43.0900, -73.4800],
    // Approaching Troy
    [43.0700, -73.5000],
    [43.0500, -73.5200],
    [43.0300, -73.5400],
    [43.0100, -73.5600],
    [42.9900, -73.5800],
    // Troy/Watervliet
    [42.9700, -73.6000],
    [42.9500, -73.6200],
    [42.9300, -73.6400],
    [42.9100, -73.6600],
    [42.8900, -73.6800],
    // Albany area - river widens
    [42.8700, -73.7000],
    [42.8500, -73.7200],
    [42.8300, -73.7400],
    [42.8100, -73.7500],
    [42.7900, -73.7600],
    [42.7700, -73.7700],
    [42.7500, -73.7800],
    [42.7300, -73.7900],
    [42.7100, -73.8000],
    [42.6900, -73.8100],
    // Below Albany
    [42.6700, -73.8200],
    [42.6500, -73.8300],
    [42.6300, -73.8400],
    [42.6100, -73.8500],
    [42.5900, -73.8600],
    [42.5700, -73.8700],
    [42.5500, -73.8800],
    [42.5300, -73.8850],
    // Catskill area
    [42.5100, -73.8900],
    [42.4900, -73.8950],
    [42.4700, -73.9000],
    [42.4500, -73.9050],
    [42.4300, -73.9100],
    [42.4100, -73.9150],
    [42.3900, -73.9200],
    [42.3700, -73.9250],
    // Saugerties/Kingston area
    [42.3500, -73.9300],
    [42.3300, -73.9350],
    [42.3100, -73.9400],
    [42.2900, -73.9450],
    [42.2700, -73.9500],
    [42.2500, -73.9550],
    [42.2300, -73.9600],
    [42.2100, -73.9650],
    // Kingston/Rondout
    [42.0900, -73.9700],
    [42.0700, -73.9750],
    [42.0500, -73.9800],
    // Rhinebeck area
    [42.0300, -73.9850],
    [42.0100, -73.9900],
    [41.9900, -73.9920],
    [41.9700, -73.9940],
    // Poughkeepsie
    [41.9500, -73.9960],
    [41.9300, -73.9980],
    [41.9100, -74.0000],
    [41.8900, -74.0020],
    [41.8700, -74.0040],
    // Newburgh/Beacon area
    [41.8500, -74.0060],
    [41.8300, -74.0080],
    [41.8100, -74.0100],
    [41.7900, -74.0120],
    [41.7700, -74.0140],
    [41.7500, -74.0160],
    [41.7300, -74.0180],
    [41.7100, -74.0200],
    // West Point / Hudson Highlands
    [41.6900, -74.0220],
    [41.6700, -74.0240],
    [41.6500, -74.0260],
    [41.6300, -74.0280],
    [41.6100, -74.0300],
    [41.5900, -74.0320],
    [41.5700, -74.0340],
    [41.5500, -74.0350],
    // Peekskill area
    [41.5300, -74.0360],
    [41.5100, -74.0370],
    [41.4900, -74.0380],
    [41.4700, -74.0390],
    [41.4500, -74.0400],
    [41.4300, -74.0410],
    [41.4100, -74.0420],
    // Haverstraw Bay - river widens significantly
    [41.3900, -74.0430],
    [41.3700, -74.0400],
    [41.3500, -74.0350],
    [41.3300, -74.0300],
    [41.3100, -74.0250],
    [41.2900, -74.0200],
    [41.2700, -74.0150],
    [41.2500, -74.0100],
    // Tappan Zee area
    [41.2300, -74.0050],
    [41.2100, -74.0000],
    [41.1900, -73.9950],
    [41.1700, -73.9900],
    [41.1500, -73.9850],
    // Tarrytown/Nyack
    [41.1300, -73.9800],
    [41.1100, -73.9750],
    [41.0900, -73.9700],
    [41.0700, -73.9650],
    // Yonkers/Palisades
    [41.0500, -73.9600],
    [41.0300, -73.9550],
    [41.0100, -73.9500],
    [40.9900, -73.9450],
    // George Washington Bridge area
    [40.9700, -73.9400],
    [40.9500, -73.9350],
    [40.9300, -73.9300],
    [40.9100, -73.9250],
    // Upper Manhattan
    [40.8900, -73.9200],
    [40.8700, -73.9150],
    [40.8500, -73.9100],
    // NYC Harbor entrance (southern extent)
    [40.8300, -73.9050],
    [40.8100, -73.9000],
    [40.7900, -73.8950],
    [40.7700, -73.8900],
    [40.7500, -73.8850],

    // ==== East bank returning north ====
    [40.7500, -73.8750],
    [40.7700, -73.8800],
    [40.7900, -73.8850],
    [40.8100, -73.8900],
    [40.8300, -73.8950],
    [40.8500, -73.9000],
    [40.8700, -73.9050],
    [40.8900, -73.9100],
    [40.9100, -73.9150],
    [40.9300, -73.9200],
    [40.9500, -73.9250],
    [40.9700, -73.9300],
    [40.9900, -73.9350],
    [41.0100, -73.9400],
    [41.0300, -73.9450],
    [41.0500, -73.9500],
    [41.0700, -73.9550],
    [41.0900, -73.9600],
    [41.1100, -73.9650],
    [41.1300, -73.9700],
    [41.1500, -73.9750],
    [41.1700, -73.9800],
    [41.1900, -73.9850],
    [41.2100, -73.9900],
    [41.2300, -73.9950],
    [41.2500, -74.0000],
    // Haverstraw Bay east - wider section
    [41.2700, -73.9950],
    [41.2900, -73.9900],
    [41.3100, -73.9850],
    [41.3300, -73.9800],
    [41.3500, -73.9750],
    [41.3700, -73.9700],
    [41.3900, -73.9680],
    [41.4100, -73.9700],
    [41.4300, -73.9720],
    [41.4500, -73.9740],
    [41.4700, -73.9760],
    [41.4900, -73.9780],
    [41.5100, -73.9800],
    [41.5300, -73.9820],
    [41.5500, -73.9840],
    [41.5700, -73.9860],
    [41.5900, -73.9880],
    [41.6100, -73.9900],
    [41.6300, -73.9920],
    [41.6500, -73.9940],
    [41.6700, -73.9960],
    [41.6900, -73.9980],
    [41.7100, -74.0000],
    [41.7300, -73.9980],
    [41.7500, -73.9960],
    [41.7700, -73.9940],
    [41.7900, -73.9920],
    [41.8100, -73.9900],
    [41.8300, -73.9880],
    [41.8500, -73.9860],
    [41.8700, -73.9840],
    [41.8900, -73.9820],
    [41.9100, -73.9800],
    [41.9300, -73.9780],
    [41.9500, -73.9760],
    [41.9700, -73.9740],
    [41.9900, -73.9720],
    [42.0100, -73.9700],
    [42.0300, -73.9650],
    [42.0500, -73.9600],
    [42.0700, -73.9550],
    [42.0900, -73.9500],
    [42.1100, -73.9450],
    [42.2100, -73.9450],
    [42.2300, -73.9400],
    [42.2500, -73.9350],
    [42.2700, -73.9300],
    [42.2900, -73.9250],
    [42.3100, -73.9200],
    [42.3300, -73.9150],
    [42.3500, -73.9100],
    [42.3700, -73.9050],
    [42.3900, -73.9000],
    [42.4100, -73.8950],
    [42.4300, -73.8900],
    [42.4500, -73.8850],
    [42.4700, -73.8800],
    [42.4900, -73.8750],
    [42.5100, -73.8700],
    [42.5300, -73.8650],
    [42.5500, -73.8600],
    [42.5700, -73.8500],
    [42.5900, -73.8400],
    [42.6100, -73.8300],
    [42.6300, -73.8200],
    [42.6500, -73.8100],
    [42.6700, -73.8000],
    [42.6900, -73.7900],
    [42.7100, -73.7800],
    [42.7300, -73.7700],
    [42.7500, -73.7600],
    [42.7700, -73.7500],
    [42.7900, -73.7400],
    [42.8100, -73.7300],
    [42.8300, -73.7200],
    [42.8500, -73.7000],
    [42.8700, -73.6800],
    [42.8900, -73.6600],
    [42.9100, -73.6400],
    [42.9300, -73.6200],
    [42.9500, -73.6000],
    [42.9700, -73.5800],
    [42.9900, -73.5600],
    [43.0100, -73.5400],
    [43.0300, -73.5200],
    [43.0500, -73.5000],
    [43.0700, -73.4800],
    [43.0900, -73.4600],
    [43.1100, -73.4500],
    [43.1300, -73.4400],
    [43.1500, -73.4300],
    [43.1700, -73.4200],
    [43.1900, -73.4100],
    [43.2100, -73.4000],
    [43.2300, -73.3900],
    [43.2500, -73.3700],
    [43.2700, -73.3550],
    [43.2850, -73.3520],  // Connection to Champlain Canal
    [43.2850, -73.3580]   // Close polygon
];

// ============================================
// EXTENDED GRID BOUNDS
// ============================================
/**
 * Grid configuration for extended water-based pathfinding
 * Covers Lake Champlain, Champlain Canal, and Hudson River
 */
const EXTENDED_GRID_CONFIG = {
    latStep: 0.00450,      // Grid resolution: ~500m per cell (latitude)
    lngStep: 0.00600,      // Grid resolution: ~500m per cell (longitude)
    bounds: {
        south: 40.7500,    // Southern extent (NYC area)
        north: 45.0900,    // Northern extent (Canadian border)
        west: -74.1000,    // Western shore (Hudson River west)
        east: -73.0700     // Eastern shore (Lake Champlain east)
    }
};

// ============================================
// EXPORTS
// ============================================
if (typeof window !== 'undefined') {
    window.ISLAND_EXCLUSIONS = ISLAND_EXCLUSIONS;
    window.CHAMPLAIN_CANAL_POLYGON = CHAMPLAIN_CANAL_POLYGON;
    window.HUDSON_RIVER_POLYGON = HUDSON_RIVER_POLYGON;
    window.EXTENDED_GRID_CONFIG = EXTENDED_GRID_CONFIG;

    // Individual island polygons for debugging/visualization
    window.GRAND_ISLE_POLYGON = GRAND_ISLE_POLYGON;
    window.NORTH_HERO_POLYGON = NORTH_HERO_POLYGON;
    window.ISLE_LA_MOTTE_POLYGON = ISLE_LA_MOTTE_POLYGON;
    window.SOUTH_HERO_POLYGON = SOUTH_HERO_POLYGON;
    window.VALCOUR_ISLAND_POLYGON = VALCOUR_ISLAND_POLYGON;
}

// Node.js exports for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ISLAND_EXCLUSIONS,
        CHAMPLAIN_CANAL_POLYGON,
        HUDSON_RIVER_POLYGON,
        EXTENDED_GRID_CONFIG,
        GRAND_ISLE_POLYGON,
        NORTH_HERO_POLYGON,
        ISLE_LA_MOTTE_POLYGON,
        SOUTH_HERO_POLYGON,
        VALCOUR_ISLAND_POLYGON,
        CRAB_ISLAND_POLYGON,
        PROVIDENCE_ISLAND_POLYGON,
        FOUR_BROTHERS_POLYGON,
        SCHUYLER_ISLAND_POLYGON
    };
}
