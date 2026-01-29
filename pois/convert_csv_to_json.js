/**
 * CSV to JSON POI Converter
 *
 * Usage: node convert_csv_to_json.js POI_Template.csv output.json
 *
 * Converts the POI CSV template into the JSON format expected by the app.
 */

const fs = require('fs');
const path = require('path');

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

// Parse CSV file
function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        // Skip comment/header rows
        if (values[0] && values[0].startsWith('###')) continue;

        // Skip empty rows
        if (!values[1]) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        rows.push(row);
    }

    return rows;
}

// Convert a row to POI JSON format
function convertRowToPOI(row) {
    // Skip if missing required fields
    if (!row.id || !row.name || !row.latitude || !row.longitude) {
        console.warn(`Skipping row with missing required fields: ${row.name || 'unnamed'}`);
        return null;
    }

    const poi = {
        id: row.id,
        name: row.name,
        category: row.category || 'poi',
        location: {
            coordinates: {
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude)
            }
        },
        details: {}
    };

    // Add subcategory
    if (row.subcategory) {
        poi.subcategory = row.subcategory;
    }

    // Add tags
    if (row.tags) {
        poi.tags = row.tags.split(',').map(t => t.trim());
    }

    // Add location details
    if (row.town) poi.location.town = row.town;
    if (row.state) poi.location.state = row.state;
    if (row.country) poi.location.country = row.country;
    if (row.waterBodyRegion) poi.location.waterBodyRegion = row.waterBodyRegion;

    // Add description
    if (row.description) {
        poi.details.description = row.description;
    }

    // Add contact info
    const contact = {};
    if (row.website) contact.website = row.website;
    if (row.phone) contact.phone = row.phone;
    if (row.vhfChannel) contact.vhfChannel = parseInt(row.vhfChannel);
    if (row.email) contact.email = row.email;
    if (Object.keys(contact).length > 0) {
        poi.contact = contact;
    }

    // Add amenities
    if (row.amenities) {
        poi.details.amenities = row.amenities.split(',').map(a => a.trim());
    }

    // Add fuel info
    if (row.fuel_available === 'TRUE') {
        poi.details.fuel = {
            available: true,
            types: row.fuel_types ? row.fuel_types.split(',').map(t => t.trim()) : [],
            'ethanol-free': row.fuel_ethanol_free === 'TRUE',
            'high-speed': row.fuel_high_speed === 'TRUE'
        };
        if (row.fuel_hours) {
            poi.details.fuel.hours = row.fuel_hours;
        }
    }

    // Add marina details
    if (row.totalSlips) poi.details.totalSlips = parseInt(row.totalSlips);
    if (row.transientSlips) poi.details.transientSlips = parseInt(row.transientSlips);
    if (row.maxVesselLength) poi.details.maxVesselLength = parseInt(row.maxVesselLength);
    if (row.minDepth) poi.details.minDepth = parseFloat(row.minDepth);

    // Add lock details
    if (row.lock_number) {
        poi.details.lock = {
            lockNumber: row.lock_number,
            canalName: row.lock_canal || null,
            canalSystem: row.lock_system || null,
            lift: row.lock_lift ? parseFloat(row.lock_lift) : null,
            chamberLength: row.lock_chamber_length ? parseFloat(row.lock_chamber_length) : null,
            chamberWidth: row.lock_chamber_width ? parseFloat(row.lock_chamber_width) : null,
            operatingHours: row.lock_operating_hours || null,
            operatingSeason: row.lock_operating_season || null,
            fee: row.lock_fee || null,
            tieUpWalls: row.lock_tie_up_walls === 'TRUE',
            restrooms: row.lock_restrooms === 'TRUE',
            water: row.lock_water === 'TRUE',
            electric: row.lock_electric === 'TRUE',
            pumpOut: row.lock_pumpout === 'TRUE',
            remarks: row.lock_remarks || null
        };
    }

    // Add bridge details
    if (row.bridge_type) {
        poi.details.bridge = {
            bridgeType: row.bridge_type,
            clearanceHeight: row.bridge_clearance_height ? parseFloat(row.bridge_clearance_height) : null,
            clearanceHeightOpen: row.bridge_clearance_open ? parseFloat(row.bridge_clearance_open) : null,
            horizontalClearance: row.bridge_horizontal_clearance ? parseFloat(row.bridge_horizontal_clearance) : null,
            roadway: row.bridge_roadway || null,
            owner: row.bridge_owner || null,
            openingSchedule: row.bridge_opening_schedule || null,
            restrictedHours: row.bridge_restricted_hours || null,
            vhfChannel: row.bridge_vhf ? parseInt(row.bridge_vhf) : null,
            signalRequired: row.bridge_signal_required === 'TRUE',
            signalType: row.bridge_signal_type || null,
            advanceNotice: row.bridge_advance_notice || null,
            operatingSeason: row.bridge_operating_season || null,
            remarks: row.bridge_remarks || null
        };
    }

    // Add ATON details
    if (row.aton_uscg_id || row.aton_characteristic || row.category === 'aton') {
        poi.details.aton = {
            uscgId: row.aton_uscg_id || null,
            llnr: row.aton_llnr || null,
            characteristic: row.aton_characteristic || null,
            color: row.aton_color || null,
            shape: row.aton_shape || null,
            height: row.aton_height ? parseFloat(row.aton_height) : null,
            range: row.aton_range ? parseFloat(row.aton_range) : null,
            structure: row.aton_structure || null,
            radarReflector: row.aton_radar_reflector === 'TRUE',
            sound: row.aton_sound || null,
            remarks: row.aton_remarks || null
        };
    }

    // Clean up empty details
    if (Object.keys(poi.details).length === 0) {
        delete poi.details;
    }

    return poi;
}

// Main conversion function
function convertCSVtoJSON(inputFile, outputFile) {
    console.log(`Reading ${inputFile}...`);

    const content = fs.readFileSync(inputFile, 'utf-8');
    const rows = parseCSV(content);

    console.log(`Found ${rows.length} data rows`);

    const pois = rows
        .map(convertRowToPOI)
        .filter(poi => poi !== null);

    console.log(`Converted ${pois.length} POIs`);

    const output = {
        version: "1.0",
        lastUpdated: new Date().toISOString().split('T')[0],
        source: "Lake Champlain & Hudson River Boater's Guide",
        pois: pois
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`Written to ${outputFile}`);
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: node convert_csv_to_json.js <input.csv> <output.json>');
        console.log('Example: node convert_csv_to_json.js POI_Template.csv lake_champlain_pois.json');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1];

    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`);
        process.exit(1);
    }

    convertCSVtoJSON(inputFile, outputFile);
}

module.exports = { convertCSVtoJSON, parseCSV, convertRowToPOI };
