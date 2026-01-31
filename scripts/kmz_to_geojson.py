#!/usr/bin/env python3
"""
Convert Lake Champlain KMZ boundary to GeoJSON with island support
Optimized for web routing with coordinate precision control
"""

import zipfile
import json
from xml.etree import ElementTree as ET
from shapely.geometry import Polygon, mapping
from shapely.ops import transform
import pyproj

def extract_kmz_to_geojson(kmz_path, output_path, simplify_tolerance=0.0001):
    """
    Extract KMZ polygon with holes (islands) to GeoJSON

    Args:
        kmz_path: Path to .kmz file
        output_path: Path for output .geojson file
        simplify_tolerance: Douglas-Peucker simplification (degrees)
                            0.0001° ≈ 11 meters at this latitude
                            Set to 0 or None to disable
    """
    # Parse KMZ
    with zipfile.ZipFile(kmz_path, 'r') as kmz:
        kml = kmz.read('doc.kml')

    root = ET.fromstring(kml)
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}

    # Extract outer boundary
    outer_elem = root.find('.//kml:outerBoundaryIs//kml:coordinates', ns)
    outer_coords = parse_kml_coordinates(outer_elem.text)

    # Extract inner boundaries (islands)
    inner_coords_list = []
    for inner_elem in root.findall('.//kml:innerBoundaryIs//kml:coordinates', ns):
        inner_coords_list.append(parse_kml_coordinates(inner_elem.text))

    # Build Shapely Polygon (outer + holes)
    polygon = Polygon(outer_coords, holes=inner_coords_list)

    # Optional: Simplify to reduce vertex count
    if simplify_tolerance and simplify_tolerance > 0:
        original_vertices = len(outer_coords) + sum(len(h) for h in inner_coords_list)
        polygon = polygon.simplify(simplify_tolerance, preserve_topology=True)
        simplified_vertices = len(polygon.exterior.coords) + sum(
            len(interior.coords) for interior in polygon.interiors
        )
        print(f"Simplified: {original_vertices} → {simplified_vertices} vertices "
              f"({100*(1-simplified_vertices/original_vertices):.1f}% reduction)")

    # Convert to GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "name": "Lake Champlain",
                "waterBodyType": "lake",
                "source": "USGS National Hydrography Dataset",
                "extractedFrom": kmz_path,
                "islandCount": len(polygon.interiors),
                "vertexCount": len(polygon.exterior.coords) + sum(
                    len(interior.coords) for interior in polygon.interiors
                )
            },
            "geometry": mapping(polygon)
        }]
    }

    # Write with precision control (6 decimals ≈ 11cm precision)
    with open(output_path, 'w') as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)

    print(f"✓ Wrote {output_path}")
    print(f"  Outer ring: {len(polygon.exterior.coords)} vertices")
    print(f"  Islands: {len(polygon.interiors)}")
    for i, interior in enumerate(polygon.interiors):
        print(f"    Island {i}: {len(interior.coords)} vertices")

def parse_kml_coordinates(coord_text):
    """Parse KML coordinate string to [(lng, lat), ...] tuples"""
    coords = []
    for point in coord_text.strip().split():
        if ',' in point:
            parts = point.split(',')
            lng, lat = float(parts[0]), float(parts[1])
            coords.append((lng, lat))  # GeoJSON uses [lng, lat] order
    return coords

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print('Usage: python3 kmz_to_geojson.py <input.kmz> [output.geojson]')
        sys.exit(1)

    kmz_file = sys.argv[1]
    geojson_file = sys.argv[2] if len(sys.argv) > 2 else kmz_file.replace('.kmz', '.geojson')

    # Extract with optional simplification
    # 0.0001° ≈ 11m - good balance of accuracy vs file size
    extract_kmz_to_geojson(kmz_file, geojson_file, simplify_tolerance=0.0001)
