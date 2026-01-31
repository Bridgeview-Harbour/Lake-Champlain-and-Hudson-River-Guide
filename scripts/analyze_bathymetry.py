#!/usr/bin/env python3
"""
Analyze bathymetric GeoJSON files to understand their structure
"""

import json
import sys

def analyze_geojson(filepath):
    """Analyze a GeoJSON file and print statistics"""
    print(f"\n{'='*60}")
    print(f"Analyzing: {filepath}")
    print(f"{'='*60}")

    # Get file size
    import os
    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"File size: {file_size_mb:.1f} MB")

    # Load first 1000 features to analyze structure
    print("Loading data (sampling first 1000 features)...")

    with open(filepath, 'r') as f:
        # Read file line by line to avoid loading entire file
        content = f.read()

    # Parse JSON
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return

    # Basic structure
    print(f"\nType: {data.get('type', 'Unknown')}")

    features = data.get('features', [])
    print(f"Total features: {len(features):,}")

    if not features:
        print("No features found!")
        return

    # Sample first feature to understand structure
    sample_feature = features[0]
    print(f"\nSample feature structure:")
    print(f"  Geometry type: {sample_feature.get('geometry', {}).get('type', 'Unknown')}")
    print(f"  Properties: {list(sample_feature.get('properties', {}).keys())}")

    # Analyze geometry types
    geometry_types = {}
    for feature in features[:1000]:  # Sample first 1000
        geom_type = feature.get('geometry', {}).get('type', 'Unknown')
        geometry_types[geom_type] = geometry_types.get(geom_type, 0) + 1

    print(f"\nGeometry types (sample of {min(1000, len(features))}):")
    for geom_type, count in geometry_types.items():
        print(f"  {geom_type}: {count}")

    # Analyze depth properties
    if sample_feature.get('properties'):
        props = sample_feature['properties']

        # Look for depth field
        depth_fields = [k for k in props.keys() if 'depth' in k.lower() or 'contour' in k.lower() or 'elev' in k.lower()]

        if depth_fields:
            print(f"\nPotential depth fields: {depth_fields}")

            # Sample depth values
            depth_field = depth_fields[0]
            depth_values = []
            for feature in features[:1000]:
                depth_val = feature.get('properties', {}).get(depth_field)
                if depth_val is not None:
                    depth_values.append(depth_val)

            if depth_values:
                print(f"\nDepth statistics (field: {depth_field}):")
                print(f"  Min: {min(depth_values)}")
                print(f"  Max: {max(depth_values)}")
                print(f"  Sample values: {depth_values[:10]}")

    # Coordinate bounds
    lats = []
    lngs = []

    for feature in features[:1000]:
        geom = feature.get('geometry', {})
        coords = geom.get('coordinates', [])

        if geom.get('type') == 'Point':
            if len(coords) >= 2:
                lngs.append(coords[0])
                lats.append(coords[1])
        elif geom.get('type') in ['LineString', 'MultiLineString']:
            # Flatten line coords
            if geom.get('type') == 'LineString':
                for coord in coords:
                    if len(coord) >= 2:
                        lngs.append(coord[0])
                        lats.append(coord[1])

    if lats and lngs:
        print(f"\nCoordinate bounds (sample):")
        print(f"  Latitude: {min(lats):.4f} to {max(lats):.4f}")
        print(f"  Longitude: {min(lngs):.4f} to {max(lngs):.4f}")

    print(f"\n{'='*60}\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python analyze_bathymetry.py <geojson_file> [<geojson_file2> ...]")
        sys.exit(1)

    for filepath in sys.argv[1:]:
        try:
            analyze_geojson(filepath)
        except Exception as e:
            print(f"Error analyzing {filepath}: {e}")
            import traceback
            traceback.print_exc()
