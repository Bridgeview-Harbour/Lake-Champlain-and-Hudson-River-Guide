#!/usr/bin/env python3
"""
CSV to JSON POI Converter

Converts the POI CSV file into the JSON format expected by the
Lake Champlain & Hudson River Boater's Guide application.

Usage:
    python convert_csv_to_json.py POIs_augmented.csv lake_champlain_pois.json

Author: Bridgeview Harbour Marina
"""

import csv
import json
import sys
import re
from datetime import datetime
from pathlib import Path


def parse_coordinates(coord_string):
    """Parse coordinates from 'lat, lng' format."""
    if not coord_string or not coord_string.strip():
        return None, None

    # Remove any extra whitespace and quotes
    coord_string = coord_string.strip().strip('"')

    # Try to split by comma
    parts = coord_string.split(',')
    if len(parts) != 2:
        return None, None

    try:
        lat = float(parts[0].strip())
        lng = float(parts[1].strip())
        return lat, lng
    except ValueError:
        return None, None


def parse_bool(value):
    """Parse boolean from string."""
    if not value:
        return False
    return str(value).strip().upper() in ('TRUE', 'YES', '1', 'Y')


def parse_float(value):
    """Parse float from string, return None if invalid."""
    if not value or not str(value).strip():
        return None
    try:
        return float(str(value).strip())
    except ValueError:
        return None


def parse_int(value):
    """Parse integer from string, return None if invalid."""
    if not value or not str(value).strip():
        return None
    try:
        return int(float(str(value).strip()))
    except ValueError:
        return None


def clean_phone(phone):
    """Clean phone number to digits only."""
    if not phone:
        return None
    digits = re.sub(r'\D', '', str(phone))
    return digits if digits else None


def generate_id(name, category):
    """Generate a URL-friendly ID from name and category."""
    # Map categories to prefixes
    prefix_map = {
        'marina': 'marina',
        'mairna': 'marina',  # Handle typo in data
        'lock': 'lock',
        'bridge': 'bridge',
        'aton': 'aton',
        'aid to navigation': 'aton',
        'dining': 'restaurant',
        'restaurant': 'restaurant',
        'poi': 'poi',
        'points of interest': 'poi',
        'historic landmark': 'poi',
        'bay': 'bay',
        'anchorage': 'bay',
        'boat launch': 'launch',
        'boat': 'launch',
        'public dock': 'dock',
        'campground': 'camp',
        'hotel': 'hotel',
        'ferry': 'ferry',
        'beach': 'beach',
        'island': 'island',
        'confluence': 'confluence',
        'landmark': 'poi',
        'border': 'poi',
        'obstructions': 'hazard',
        'winery': 'restaurant',
    }

    # Get first category if multiple
    first_cat = category.split(';')[0].strip().lower() if category else 'poi'
    prefix = prefix_map.get(first_cat, 'poi')

    # Clean name for ID
    clean_name = name.lower()
    clean_name = re.sub(r'[^a-z0-9\s-]', '', clean_name)
    clean_name = re.sub(r'\s+', '-', clean_name.strip())
    clean_name = re.sub(r'-+', '-', clean_name)

    return f"{prefix}-{clean_name}"


def map_category(categories_str):
    """Map CSV categories to JSON category and subcategory."""
    if not categories_str:
        return 'poi', None, []

    categories = [c.strip().lower() for c in categories_str.split(';')]
    tags = []

    # Category mapping
    category_map = {
        'marina': ('marina', 'full-service'),
        'mairna': ('marina', 'full-service'),  # Handle typo
        'lock': ('lock', 'canal-lock'),
        'bridge': ('bridge', None),
        'aton': ('aton', 'buoy'),
        'aid to navigation': ('aton', 'buoy'),
        'buoy': ('aton', 'buoy'),
        'lighthouse': ('aton', 'lighthouse'),
        'restaurant': ('dining', 'waterfront-restaurant'),
        'dining': ('dining', 'waterfront-restaurant'),
        'bar': ('dining', 'bar-grill'),
        'points of interest': ('poi', None),
        'poi': ('poi', None),
        'historic landmark': ('poi', 'historic'),
        'landmark': ('poi', 'landmark'),
        'museum': ('poi', 'museum'),
        'bay': ('bay', None),
        'anchorage': ('bay', 'anchorage'),
        'harbor': ('bay', 'harbor'),
        'boat launch': ('bay', 'boat-launch'),
        'boat': ('bay', 'boat-launch'),
        'public dock': ('bay', 'harbor'),
        'campground': ('poi', 'campground'),
        'hotel': ('poi', 'hotel'),
        'ferry': ('poi', 'ferry'),
        'beach': ('bay', 'beach'),
        'island': ('bay', 'island'),
        'confluence': ('poi', 'confluence'),
        'border': ('poi', 'landmark'),
        'obstructions': ('poi', 'hazard'),
        'winery': ('dining', 'winery'),
    }

    # Find primary category
    primary_cat = 'poi'
    subcategory = None

    for cat in categories:
        if cat in category_map:
            primary_cat, subcategory = category_map[cat]
            break

    # Build tags from additional categories
    tag_keywords = ['fuel', 'transient', 'historic', 'landmark', 'anchorage', 'campground']
    for cat in categories:
        for keyword in tag_keywords:
            if keyword in cat and keyword not in tags:
                tags.append(keyword)

    return primary_cat, subcategory, tags


def convert_row_to_poi(row, row_num):
    """Convert a CSV row to POI JSON format."""
    name = row.get('Name', '').strip()

    # Skip empty or comment rows
    if not name or name.startswith('###'):
        return None

    categories_str = row.get('Categories', '')

    # Parse coordinates - try the Coordinates column first, then search other columns
    coord_string = row.get('Coordinates', '').strip()

    if not coord_string:
        # Fall back to searching for coordinate-like values
        for key in row.keys():
            val = row.get(key, '')
            if val and ',' in str(val) and re.match(r'^-?\d+\.\d+,\s*-?\d+\.\d+$', str(val).strip()):
                coord_string = val
                break

    lat, lng = parse_coordinates(coord_string)

    # Skip if no coordinates (but warn)
    if lat is None or lng is None:
        print(f"  Warning row {row_num}: '{name}' has no valid coordinates, skipping")
        return None

    # Generate ID
    poi_id = generate_id(name, categories_str)

    # Map category
    category, subcategory, tags = map_category(categories_str)

    # Build POI object
    poi = {
        "id": poi_id,
        "name": name,
        "category": category,
        "location": {
            "coordinates": {
                "latitude": lat,
                "longitude": lng
            }
        }
    }

    # Add subcategory
    if subcategory:
        poi["subcategory"] = subcategory

    # Add tags from CSV or mapped categories
    csv_tags = row.get('Tags', '').strip()
    if csv_tags:
        tags.extend([t.strip() for t in csv_tags.split(',') if t.strip()])

    # Add fuel tag if fuel is available
    if parse_bool(row.get('Fuel Available', '')):
        if 'fuel' not in tags:
            tags.append('fuel')

    if tags:
        poi["tags"] = list(set(tags))  # Remove duplicates

    # Add location details
    town = row.get('City/Town', '').strip()
    state = row.get('State/Province', '').strip()
    country = row.get('Country', '').strip()
    location = row.get('Location', '').strip()
    sublocation = row.get('Sublocation', '').strip()

    if town:
        poi["location"]["town"] = town
    if state:
        poi["location"]["state"] = state
    if country:
        poi["location"]["country"] = country
    if location:
        region = location
        if sublocation:
            region = f"{location} {sublocation}"
        poi["location"]["waterBodyRegion"] = region

    # Add contact info
    contact = {}
    website = row.get('Website', '').strip()
    phone = clean_phone(row.get('Telephone', ''))
    vhf = row.get('VHF', '').strip()

    if website:
        contact["website"] = website
    if phone:
        contact["phone"] = phone
    if vhf:
        contact["vhfChannel"] = parse_int(vhf)

    if contact:
        poi["contact"] = contact

    # Add details section
    details = {}

    # Add description
    description = row.get('Description', '').strip()
    if description:
        details["description"] = description

    # Add marina-specific details
    total_slips = parse_int(row.get('Total Slips', ''))
    transient_slips = parse_int(row.get('Transient Slips', ''))
    max_vessel = parse_int(row.get('Max Vessel Length', ''))
    min_depth = parse_float(row.get('Min Depth', ''))

    if total_slips:
        details["totalSlips"] = total_slips
    if transient_slips:
        details["transientSlips"] = transient_slips
    if max_vessel:
        details["maxVesselLength"] = max_vessel
    if min_depth:
        details["minDepth"] = min_depth

    # Add fuel details
    if parse_bool(row.get('Fuel Available', '')):
        fuel_types_str = row.get('Fuel Types', '').strip()
        fuel_types = [t.strip() for t in fuel_types_str.split(',') if t.strip()] if fuel_types_str else []

        details["fuel"] = {
            "available": True,
            "types": fuel_types if fuel_types else ["gasoline"],
            "ethanol-free": parse_bool(row.get('Ethanol Free', ''))
        }

    # Add lock details
    lock_number = row.get('Lock Number', '').strip()
    lock_canal = row.get('Lock Canal', '').strip()
    lock_lift = parse_float(row.get('Lock Lift', ''))

    if lock_number or lock_canal or category == 'lock':
        lock_details = {}
        if lock_number:
            lock_details["lockNumber"] = lock_number
        if lock_canal:
            lock_details["canalName"] = lock_canal

        lock_system = row.get('Lock System', '').strip()
        if lock_system:
            lock_details["canalSystem"] = lock_system
        elif lock_canal and 'champlain' in lock_canal.lower():
            lock_details["canalSystem"] = "NYS Canal System"

        if lock_lift:
            lock_details["lift"] = lock_lift

        lock_length = parse_float(row.get('Lock Chamber Length', ''))
        lock_width = parse_float(row.get('Lock Chamber Width', ''))
        if lock_length:
            lock_details["chamberLength"] = lock_length
        if lock_width:
            lock_details["chamberWidth"] = lock_width

        lock_hours = row.get('Lock Operating Hours', '').strip()
        lock_season = row.get('Lock Operating Season', '').strip()
        if lock_hours:
            lock_details["operatingHours"] = lock_hours
        if lock_season:
            lock_details["operatingSeason"] = lock_season

        if lock_details:
            details["lock"] = lock_details

    # Add bridge details
    bridge_type = row.get('Bridge Type', '').strip()
    bridge_clearance = parse_float(row.get('Bridge Clearance', ''))

    if bridge_type or bridge_clearance or category == 'bridge':
        bridge_details = {}

        if bridge_type:
            bridge_details["bridgeType"] = bridge_type
        elif 'rail' in name.lower() or 'railroad' in name.lower():
            bridge_details["bridgeType"] = "lift"
        else:
            bridge_details["bridgeType"] = "fixed"

        if bridge_clearance:
            bridge_details["clearanceHeight"] = bridge_clearance

        bridge_open = parse_float(row.get('Bridge Clearance Open', ''))
        if bridge_open:
            bridge_details["clearanceHeightOpen"] = bridge_open

        bridge_roadway = row.get('Bridge Roadway', '').strip()
        if bridge_roadway:
            bridge_details["roadway"] = bridge_roadway

        bridge_schedule = row.get('Bridge Opening Schedule', '').strip()
        if bridge_schedule:
            bridge_details["openingSchedule"] = bridge_schedule

        if bridge_details:
            details["bridge"] = bridge_details
            # Update subcategory based on bridge type
            if bridge_details.get("bridgeType") in ["draw", "swing", "bascule", "lift"]:
                poi["subcategory"] = f"bridge-{bridge_details['bridgeType']}"
            else:
                poi["subcategory"] = "fixed-bridge"

    # Add ATON details
    aton_char = row.get('ATON Characteristic', '').strip()
    aton_color = row.get('ATON Color', '').strip()
    aton_shape = row.get('ATON Shape', '').strip()

    if aton_char or aton_color or 'aton' in categories_str.lower() or 'lighthouse' in categories_str.lower():
        aton_details = {}
        if aton_char:
            aton_details["characteristic"] = aton_char
        if aton_color:
            aton_details["color"] = aton_color
        if aton_shape:
            aton_details["shape"] = aton_shape

        if aton_details:
            details["aton"] = aton_details

        # Update subcategory for lighthouses
        if 'lighthouse' in categories_str.lower() or 'lighthouse' in name.lower():
            poi["subcategory"] = "lighthouse"
        elif aton_shape and 'nun' in aton_shape.lower():
            poi["subcategory"] = "buoy"
        elif aton_shape and 'can' in aton_shape.lower():
            poi["subcategory"] = "buoy"

    if details:
        poi["details"] = details

    return poi


def convert_csv_to_json(input_file, output_file):
    """Main conversion function."""
    print(f"Reading {input_file}...")

    pois = []
    skipped = 0

    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row_num, row in enumerate(reader, start=2):
            poi = convert_row_to_poi(row, row_num)
            if poi:
                pois.append(poi)
            else:
                skipped += 1

    print(f"Converted {len(pois)} POIs ({skipped} skipped)")

    # Build output structure
    output = {
        "version": "1.0",
        "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
        "source": "Lake Champlain & Hudson River Boater's Guide",
        "pois": pois
    }

    # Write JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Written to {output_file}")

    return pois


def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_csv_to_json.py <input.csv> <output.json>")
        print("Example: python convert_csv_to_json.py POIs_augmented.csv lake_champlain_pois.json")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    if not Path(input_file).exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    convert_csv_to_json(input_file, output_file)


if __name__ == "__main__":
    main()
