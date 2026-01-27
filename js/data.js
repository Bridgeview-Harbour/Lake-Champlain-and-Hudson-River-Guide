/**
 * Lake Champlain & Hudson River Boater's Guide
 * Points of Interest Data
 *
 * This file contains all location data for the interactive map.
 * Locations are organized by type and include coordinates, descriptions,
 * and additional metadata.
 */

// Default starting location - Bridgeview Harbour Marina
const DEFAULT_START_LOCATION = 'bridgeview-harbour-marina';

// Map center coordinates (centered on Lake Champlain region)
const MAP_CENTER = {
    lat: 44.0,
    lng: -73.3,
    zoom: 8
};

// Map bounds to restrict panning
const MAP_BOUNDS = {
    north: 45.5,
    south: 40.5,
    east: -72.0,
    west: -74.5
};

/**
 * Points of Interest Database
 * Each location has:
 * - id: Unique identifier
 * - name: Display name
 * - type: Category (marina, restaurant, historic, bay, fuel, anchorage)
 * - lat/lng: Coordinates
 * - description: Brief description
 * - amenities: Array of available amenities (optional)
 * - website: URL (optional)
 * - phone: Contact number (optional)
 * - vhf: VHF channel (optional)
 */
const POINTS_OF_INTEREST = [
    // ============================================
    // MARINAS - Lake Champlain
    // ============================================
    {
        id: 'bridgeview-harbour-marina',
        name: 'Bridgeview Harbour Marina',
        type: 'marina',
        lat: 44.6167,
        lng: -73.4167,
        description: 'Full-service marina on Lake Champlain offering transient slips, fuel, and excellent amenities. Your home base for exploring the lake.',
        amenities: ['fuel', 'pumpout', 'electric', 'water', 'wifi', 'restrooms', 'showers', 'laundry', 'ship-store'],
        vhf: 'Channel 16/68',
        featured: true
    },
    {
        id: 'westport-marina',
        name: 'Westport Marina',
        type: 'marina',
        lat: 44.1833,
        lng: -73.4333,
        description: 'Protected harbor with excellent facilities in the charming village of Westport.',
        amenities: ['fuel', 'pumpout', 'electric', 'water', 'restrooms'],
        vhf: 'Channel 16'
    },
    {
        id: 'essex-shipyard',
        name: 'Essex Shipyard',
        type: 'marina',
        lat: 44.2833,
        lng: -73.3667,
        description: 'Historic shipyard offering repairs, storage, and transient dockage.',
        amenities: ['repairs', 'storage', 'electric', 'water']
    },
    {
        id: 'basin-harbor-club',
        name: 'Basin Harbor Club Marina',
        type: 'marina',
        lat: 44.1667,
        lng: -73.3667,
        description: 'Elegant resort marina with full amenities and beautiful grounds.',
        amenities: ['fuel', 'electric', 'water', 'restaurant', 'pool']
    },
    {
        id: 'burlington-harbor-marina',
        name: 'Burlington Harbor Marina',
        type: 'marina',
        lat: 44.4750,
        lng: -73.2200,
        description: 'Large marina in downtown Burlington with easy access to shops and restaurants.',
        amenities: ['fuel', 'pumpout', 'electric', 'water', 'wifi', 'restrooms', 'showers']
    },
    {
        id: 'point-bay-marina',
        name: 'Point Bay Marina',
        type: 'marina',
        lat: 44.9667,
        lng: -73.3500,
        description: 'Northern Lake Champlain marina near the Canadian border.',
        amenities: ['fuel', 'electric', 'water', 'repairs']
    },
    {
        id: 'plattsburgh-city-marina',
        name: 'Plattsburgh City Marina',
        type: 'marina',
        lat: 44.6950,
        lng: -73.4550,
        description: 'Municipal marina with convenient downtown access and modern facilities.',
        amenities: ['fuel', 'pumpout', 'electric', 'water', 'wifi', 'restrooms', 'showers']
    },
    {
        id: 'willsboro-bay-marina',
        name: 'Willsboro Bay Marina',
        type: 'marina',
        lat: 44.3667,
        lng: -73.3833,
        description: 'Protected marina in scenic Willsboro Bay.',
        amenities: ['fuel', 'electric', 'water', 'repairs']
    },
    {
        id: 'chipman-point-marina',
        name: 'Chipman Point Marina',
        type: 'marina',
        lat: 43.8500,
        lng: -73.3833,
        description: 'Full-service marina on the Vermont side with a relaxed atmosphere.',
        amenities: ['fuel', 'electric', 'water', 'repairs', 'restaurant']
    },
    {
        id: 'ticonderoga-marina',
        name: 'Ticonderoga Town Marina',
        type: 'marina',
        lat: 43.8500,
        lng: -73.4250,
        description: 'Historic marina near Fort Ticonderoga with transient slips.',
        amenities: ['electric', 'water', 'restrooms']
    },

    // ============================================
    // MARINAS - Hudson River
    // ============================================
    {
        id: 'albany-yacht-club',
        name: 'Albany Yacht Club',
        type: 'marina',
        lat: 42.6383,
        lng: -73.7500,
        description: 'Historic yacht club on the Hudson River near Albany.',
        amenities: ['electric', 'water', 'clubhouse', 'restaurant']
    },
    {
        id: 'castleton-boat-club',
        name: 'Castleton Boat Club',
        type: 'marina',
        lat: 42.5333,
        lng: -73.7500,
        description: 'Friendly boat club south of Albany with transient dockage.',
        amenities: ['fuel', 'electric', 'water']
    },
    {
        id: 'kingston-rondout-marina',
        name: 'Kingston Rondout Marina',
        type: 'marina',
        lat: 41.9167,
        lng: -73.9833,
        description: 'Full-service marina in the historic Rondout district.',
        amenities: ['fuel', 'pumpout', 'electric', 'water', 'restrooms', 'showers']
    },
    {
        id: 'poughkeepsie-yacht-club',
        name: 'Poughkeepsie Yacht Club',
        type: 'marina',
        lat: 41.7167,
        lng: -73.9333,
        description: 'Welcoming yacht club with excellent Mid-Hudson location.',
        amenities: ['electric', 'water', 'clubhouse']
    },
    {
        id: 'newburgh-yacht-club',
        name: 'Newburgh Yacht Club',
        type: 'marina',
        lat: 41.5000,
        lng: -74.0000,
        description: 'Active yacht club in the Hudson Highlands region.',
        amenities: ['electric', 'water', 'clubhouse', 'restaurant']
    },
    {
        id: 'haverstraw-marina',
        name: 'Haverstraw Marina',
        type: 'marina',
        lat: 41.2000,
        lng: -73.9667,
        description: 'Large marina on Haverstraw Bay with full services.',
        amenities: ['fuel', 'pumpout', 'electric', 'water', 'restaurant', 'pool']
    },

    // ============================================
    // RESTAURANTS - Lake Champlain
    // ============================================
    {
        id: 'boathouse-grill-burlington',
        name: 'Boathouse at Echo Bay',
        type: 'restaurant',
        lat: 44.4800,
        lng: -73.2250,
        description: 'Waterfront dining with stunning lake views and fresh seafood.',
        amenities: ['dockage', 'outdoor-seating']
    },
    {
        id: 'shanty-plattsburgh',
        name: 'The Shanty on the Shore',
        type: 'restaurant',
        lat: 44.6900,
        lng: -73.4500,
        description: 'Casual waterfront dining with dockage for boaters.',
        amenities: ['dockage', 'outdoor-seating', 'bar']
    },
    {
        id: 'basin-harbor-restaurant',
        name: 'Red Mill at Basin Harbor',
        type: 'restaurant',
        lat: 44.1680,
        lng: -73.3650,
        description: 'Fine dining in a historic mill building with lake views.',
        amenities: ['dockage', 'fine-dining']
    },
    {
        id: 'essex-on-the-lake',
        name: 'The Essex Inn Restaurant',
        type: 'restaurant',
        lat: 44.2850,
        lng: -73.3680,
        description: 'Historic inn with excellent farm-to-table cuisine.',
        amenities: ['dockage']
    },
    {
        id: 'westport-galley',
        name: 'The Galley at Westport',
        type: 'restaurant',
        lat: 44.1850,
        lng: -73.4350,
        description: 'Waterfront restaurant popular with boaters.',
        amenities: ['dockage', 'outdoor-seating', 'bar']
    },
    {
        id: 'three-brothers-pizza',
        name: 'Three Brothers Pizza & Restaurant',
        type: 'restaurant',
        lat: 44.6200,
        lng: -73.4200,
        description: 'Family-friendly Italian restaurant near the marina.',
        amenities: ['takeout']
    },
    {
        id: 'docs-restaurant',
        name: "Doc's Restaurant & Bar",
        type: 'restaurant',
        lat: 44.9700,
        lng: -73.3480,
        description: 'Casual waterfront dining near the Canadian border.',
        amenities: ['dockage', 'bar']
    },

    // ============================================
    // RESTAURANTS - Hudson River
    // ============================================
    {
        id: 'ship-lantern-inn',
        name: 'Ship Lantern Inn',
        type: 'restaurant',
        lat: 41.4333,
        lng: -73.9833,
        description: 'Historic waterfront inn with American cuisine.',
        amenities: ['dockage']
    },
    {
        id: 'shadows-hudson',
        name: 'Shadows on the Hudson',
        type: 'restaurant',
        lat: 41.7200,
        lng: -73.9350,
        description: 'Upscale waterfront dining with spectacular river views.',
        amenities: ['outdoor-seating', 'fine-dining']
    },
    {
        id: 'mariner-kingston',
        name: "Mariner's Harbor",
        type: 'restaurant',
        lat: 41.9180,
        lng: -73.9850,
        description: 'Seafood restaurant in historic Rondout with dock access.',
        amenities: ['dockage', 'outdoor-seating', 'bar']
    },

    // ============================================
    // HISTORIC SITES - Lake Champlain
    // ============================================
    {
        id: 'fort-ticonderoga',
        name: 'Fort Ticonderoga',
        type: 'historic',
        lat: 43.8428,
        lng: -73.3897,
        description: 'Revolutionary War fort with museum and stunning lake views. Important strategic point in both French & Indian War and Revolutionary War.',
        amenities: ['museum', 'tours', 'gift-shop']
    },
    {
        id: 'crown-point',
        name: 'Crown Point State Historic Site',
        type: 'historic',
        lat: 43.9417,
        lng: -73.4139,
        description: 'Ruins of British and French fortifications at a strategic narrow point on the lake.',
        amenities: ['museum', 'tours', 'picnic-area']
    },
    {
        id: 'valcour-island',
        name: 'Valcour Island (Battle Site)',
        type: 'historic',
        lat: 44.6167,
        lng: -73.4333,
        description: 'Site of the 1776 Battle of Valcour Island, a pivotal Revolutionary War naval battle. Excellent anchorage.',
        amenities: ['anchorage', 'hiking']
    },
    {
        id: 'button-bay',
        name: 'Button Bay State Park',
        type: 'historic',
        lat: 44.1500,
        lng: -73.3500,
        description: 'Named for button-like fossils found on the shore. Beautiful natural area.',
        amenities: ['anchorage', 'hiking', 'picnic-area']
    },
    {
        id: 'isle-la-motte',
        name: 'Isle La Motte Historic District',
        type: 'historic',
        lat: 44.8833,
        lng: -73.3333,
        description: 'Site of Fort Ste. Anne (1666), the first French settlement in Vermont. Home to the Chazy Fossil Reef.',
        amenities: ['tours', 'shrine']
    },
    {
        id: 'skenesborough-museum',
        name: 'Skenesborough Museum (Whitehall)',
        type: 'historic',
        lat: 43.5556,
        lng: -73.4022,
        description: 'Birthplace of the U.S. Navy. Museum tells the story of early American naval history.',
        amenities: ['museum', 'gift-shop']
    },

    // ============================================
    // HISTORIC SITES - Hudson River
    // ============================================
    {
        id: 'west-point',
        name: 'West Point Military Academy',
        type: 'historic',
        lat: 41.3917,
        lng: -73.9567,
        description: 'U.S. Military Academy with beautiful grounds and museum. Iconic Hudson River landmark.',
        amenities: ['museum', 'tours']
    },
    {
        id: 'bannermans-castle',
        name: "Bannerman's Castle",
        type: 'historic',
        lat: 41.4528,
        lng: -73.9892,
        description: 'Mysterious castle ruins on Pollepel Island. Tours available by boat.',
        amenities: ['tours']
    },
    {
        id: 'cold-spring-village',
        name: 'Cold Spring Historic Village',
        type: 'historic',
        lat: 41.4203,
        lng: -73.9547,
        description: 'Charming 19th-century village with shops, restaurants, and river access.',
        amenities: ['shops', 'restaurants']
    },
    {
        id: 'kingston-stockade',
        name: 'Kingston Stockade District',
        type: 'historic',
        lat: 41.9269,
        lng: -74.0206,
        description: "New York's first capital. Historic district with colonial architecture.",
        amenities: ['tours', 'shops', 'restaurants']
    },
    {
        id: 'clermont-historic-site',
        name: 'Clermont State Historic Site',
        type: 'historic',
        lat: 42.0833,
        lng: -73.9167,
        description: 'Home of the Livingston family, overlooking the Hudson with beautiful grounds.',
        amenities: ['tours', 'gardens', 'picnic-area']
    },

    // ============================================
    // BAYS & HARBORS - Lake Champlain
    // ============================================
    {
        id: 'malletts-bay',
        name: "Mallett's Bay",
        type: 'bay',
        lat: 44.5333,
        lng: -73.2000,
        description: 'Large protected bay north of Burlington, popular with boaters.',
        amenities: ['anchorage', 'marinas', 'restaurants']
    },
    {
        id: 'burlington-harbor',
        name: 'Burlington Harbor',
        type: 'bay',
        lat: 44.4750,
        lng: -73.2250,
        description: 'Vermont\'s largest city harbor with excellent facilities and entertainment.',
        amenities: ['marinas', 'restaurants', 'shops', 'entertainment']
    },
    {
        id: 'shelburne-bay',
        name: 'Shelburne Bay',
        type: 'bay',
        lat: 44.4000,
        lng: -73.2333,
        description: 'Protected bay south of Burlington with marina and nature areas.',
        amenities: ['anchorage', 'marina', 'nature-trails']
    },
    {
        id: 'willsboro-bay',
        name: 'Willsboro Bay',
        type: 'bay',
        lat: 44.3500,
        lng: -73.3750,
        description: 'Long, narrow bay offering excellent protection from weather.',
        amenities: ['anchorage', 'marina']
    },
    {
        id: 'bulwagga-bay',
        name: 'Bulwagga Bay',
        type: 'bay',
        lat: 44.0000,
        lng: -73.4333,
        description: 'Quiet bay on the New York side with good anchorage.',
        amenities: ['anchorage']
    },
    {
        id: 'south-bay',
        name: 'South Bay',
        type: 'bay',
        lat: 43.5833,
        lng: -73.4000,
        description: 'Southern end of Lake Champlain near Whitehall. Gateway to the Champlain Canal.',
        amenities: ['anchorage', 'canal-access']
    },
    {
        id: 'cumberland-bay',
        name: 'Cumberland Bay',
        type: 'bay',
        lat: 44.7000,
        lng: -73.4333,
        description: 'Large bay at Plattsburgh with state park and marina.',
        amenities: ['anchorage', 'marina', 'beach', 'camping']
    },
    {
        id: 'missisquoi-bay',
        name: 'Missisquoi Bay',
        type: 'bay',
        lat: 44.9667,
        lng: -73.1500,
        description: 'Large bay at the northeast corner of the lake, extending into Canada.',
        amenities: ['anchorage', 'wildlife-refuge']
    },
    {
        id: 'saint-albans-bay',
        name: "St. Albans Bay",
        type: 'bay',
        lat: 44.8000,
        lng: -73.1667,
        description: 'Protected bay with marina facilities and beach.',
        amenities: ['anchorage', 'marina', 'beach']
    },

    // ============================================
    // BAYS & HARBORS - Hudson River
    // ============================================
    {
        id: 'haverstraw-bay',
        name: 'Haverstraw Bay',
        type: 'bay',
        lat: 41.2167,
        lng: -73.9500,
        description: 'Widest point on the Hudson River with excellent sailing conditions.',
        amenities: ['anchorage', 'marinas']
    },
    {
        id: 'newburgh-bay',
        name: 'Newburgh Bay',
        type: 'bay',
        lat: 41.5000,
        lng: -74.0167,
        description: 'Scenic bay in the Hudson Highlands with good anchorage.',
        amenities: ['anchorage', 'marinas']
    },
    {
        id: 'rondout-creek',
        name: 'Rondout Creek',
        type: 'bay',
        lat: 41.9200,
        lng: -73.9833,
        description: 'Historic creek mouth in Kingston with marinas and restaurants.',
        amenities: ['marinas', 'restaurants', 'museum']
    },
    {
        id: 'catskill-creek',
        name: 'Catskill Creek',
        type: 'bay',
        lat: 42.2167,
        lng: -73.8667,
        description: 'Protected creek with marina access to the village of Catskill.',
        amenities: ['marina', 'anchorage']
    },
    {
        id: 'athens-cove',
        name: 'Athens Cove',
        type: 'bay',
        lat: 42.2500,
        lng: -73.8000,
        description: 'Small protected cove with anchorage near the historic village.',
        amenities: ['anchorage']
    },

    // ============================================
    // FUEL STATIONS
    // ============================================
    {
        id: 'bridgeview-fuel',
        name: 'Bridgeview Harbour Fuel Dock',
        type: 'fuel',
        lat: 44.6167,
        lng: -73.4150,
        description: 'Gas and diesel fuel available. Check VHF 68 for hours.',
        amenities: ['gas', 'diesel', 'pumpout']
    },
    {
        id: 'burlington-fuel',
        name: 'Burlington Harbor Fuel',
        type: 'fuel',
        lat: 44.4760,
        lng: -73.2210,
        description: 'Full fuel service in downtown Burlington.',
        amenities: ['gas', 'diesel', 'pumpout']
    },
    {
        id: 'plattsburgh-fuel',
        name: 'Plattsburgh Fuel Dock',
        type: 'fuel',
        lat: 44.6960,
        lng: -73.4540,
        description: 'Gas and diesel available at the city marina.',
        amenities: ['gas', 'diesel']
    },
    {
        id: 'westport-fuel',
        name: 'Westport Marina Fuel',
        type: 'fuel',
        lat: 44.1840,
        lng: -73.4340,
        description: 'Fuel available at Westport Marina.',
        amenities: ['gas', 'diesel']
    },
    {
        id: 'kingston-fuel',
        name: 'Kingston Fuel Dock',
        type: 'fuel',
        lat: 41.9175,
        lng: -73.9840,
        description: 'Fuel service in the Rondout district.',
        amenities: ['gas', 'diesel', 'pumpout']
    },
    {
        id: 'haverstraw-fuel',
        name: 'Haverstraw Fuel Station',
        type: 'fuel',
        lat: 41.2010,
        lng: -73.9670,
        description: 'Fuel available at Haverstraw Marina.',
        amenities: ['gas', 'diesel']
    },

    // ============================================
    // ANCHORAGES
    // ============================================
    {
        id: 'valcour-anchorage',
        name: 'Valcour Island Anchorage',
        type: 'anchorage',
        lat: 44.6250,
        lng: -73.4250,
        description: 'Protected anchorage on the west side of Valcour Island. Historic and scenic.',
        amenities: ['swimming', 'hiking', 'historic-site']
    },
    {
        id: 'button-island-anchorage',
        name: 'Button Island Anchorage',
        type: 'anchorage',
        lat: 44.1550,
        lng: -73.3550,
        description: 'Quiet anchorage near Button Bay with good holding.',
        amenities: ['swimming', 'nature']
    },
    {
        id: 'kingsland-bay-anchorage',
        name: 'Kingsland Bay Anchorage',
        type: 'anchorage',
        lat: 44.3333,
        lng: -73.2500,
        description: 'Scenic anchorage with state park access.',
        amenities: ['swimming', 'hiking', 'picnic-area']
    },
    {
        id: 'four-brothers-anchorage',
        name: 'Four Brothers Islands Anchorage',
        type: 'anchorage',
        lat: 44.3833,
        lng: -73.3833,
        description: 'Popular anchorage among small islands. Wildlife sanctuary.',
        amenities: ['swimming', 'wildlife-viewing']
    },
    {
        id: 'crab-island-anchorage',
        name: 'Crab Island Anchorage',
        type: 'anchorage',
        lat: 44.6833,
        lng: -73.4500,
        description: 'Protected anchorage north of Plattsburgh.',
        amenities: ['swimming', 'beach']
    },
    {
        id: 'schuyler-island-anchorage',
        name: 'Schuyler Island Anchorage',
        type: 'anchorage',
        lat: 44.3500,
        lng: -73.4000,
        description: 'Quiet anchorage between Schuyler Island and the mainland.',
        amenities: ['swimming', 'nature']
    },
    {
        id: 'world-end-anchorage',
        name: "World's End Anchorage (Hudson)",
        type: 'anchorage',
        lat: 41.4333,
        lng: -73.9833,
        description: 'Protected anchorage in the Hudson Highlands near Constitution Island.',
        amenities: ['scenic-views']
    },
    {
        id: 'iona-island-anchorage',
        name: 'Iona Island Anchorage',
        type: 'anchorage',
        lat: 41.2983,
        lng: -73.9717,
        description: 'Anchorage near Bear Mountain with beautiful mountain views.',
        amenities: ['scenic-views', 'wildlife-viewing']
    }
];

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
        name: 'Historic Site',
        icon: '🏰',
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

// Export for use in app.js (works in both module and non-module contexts)
if (typeof window !== 'undefined') {
    window.DEFAULT_START_LOCATION = DEFAULT_START_LOCATION;
    window.MAP_CENTER = MAP_CENTER;
    window.MAP_BOUNDS = MAP_BOUNDS;
    window.POINTS_OF_INTEREST = POINTS_OF_INTEREST;
    window.TYPE_CONFIG = TYPE_CONFIG;
    window.UNIT_CONVERSIONS = UNIT_CONVERSIONS;
}
