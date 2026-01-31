#!/usr/bin/env python3
"""
Analyze Lake Champlain KMZ boundary files
Extract outer boundaries and inner boundaries (islands)
"""

import zipfile
import sys
from xml.etree import ElementTree as ET

def parse_coordinates(coord_text):
    """Convert KML coordinate string to list of [lat, lng] pairs"""
    coords = []
    for point in coord_text.strip().split():
        if ',' in point:
            parts = point.split(',')
            if len(parts) >= 2:
                lon, lat = float(parts[0]), float(parts[1])
                coords.append([lat, lon])
    return coords

def analyze_kmz(kmz_path):
    """Analyze KMZ file and extract boundary information"""
    with zipfile.ZipFile(kmz_path, 'r') as kmz:
        kml_content = kmz.read('doc.kml')

    root = ET.fromstring(kml_content)
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}

    placemarks = root.findall('.//kml:Placemark', ns)
    print(f'\n=== {kmz_path} ===')
    print(f'Total Placemarks: {len(placemarks)}\n')

    all_outer_boundaries = []
    all_inner_boundaries = []

    for i, placemark in enumerate(placemarks):
        name_elem = placemark.find('kml:name', ns)
        name = name_elem.text if name_elem is not None else f'Placemark {i}'

        # Get extended data
        gnis_name = placemark.find('.//kml:SimpleData[@name="GNIS_NAME"]', ns)
        if gnis_name is not None:
            name = gnis_name.text

        polygon = placemark.find('.//kml:Polygon', ns)
        if polygon is None:
            continue

        # Extract outer boundary
        outer = polygon.find('.//kml:outerBoundaryIs//kml:coordinates', ns)
        if outer is not None:
            outer_coords = parse_coordinates(outer.text)
            all_outer_boundaries.append({
                'name': name,
                'coords': outer_coords
            })
            print(f'Placemark {i}: {name}')
            print(f'  Outer boundary: {len(outer_coords)} points')

            # Get bounding box
            if outer_coords:
                lats = [c[0] for c in outer_coords]
                lngs = [c[1] for c in outer_coords]
                print(f'  Lat range: {min(lats):.6f} to {max(lats):.6f}')
                print(f'  Lng range: {min(lngs):.6f} to {max(lngs):.6f}')

        # Extract inner boundaries (islands)
        inners = polygon.findall('.//kml:innerBoundaryIs//kml:coordinates', ns)
        if inners:
            print(f'  Inner boundaries (islands): {len(inners)}')
            for j, inner in enumerate(inners):
                inner_coords = parse_coordinates(inner.text)
                all_inner_boundaries.append({
                    'name': f'{name} - Island {j}',
                    'coords': inner_coords
                })
                print(f'    Island {j}: {len(inner_coords)} points')

        print()

    return all_outer_boundaries, all_inner_boundaries

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 analyze_kmz.py <kmz_file>')
        sys.exit(1)

    outer_boundaries, inner_boundaries = analyze_kmz(sys.argv[1])

    print(f'\n=== SUMMARY ===')
    print(f'Total outer boundaries: {len(outer_boundaries)}')
    print(f'Total inner boundaries (islands): {len(inner_boundaries)}')

    if outer_boundaries:
        total_outer_points = sum(len(b['coords']) for b in outer_boundaries)
        print(f'Total outer boundary points: {total_outer_points}')

    if inner_boundaries:
        total_inner_points = sum(len(b['coords']) for b in inner_boundaries)
        print(f'Total inner boundary points: {total_inner_points}')
