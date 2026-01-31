#!/usr/bin/env python3
"""
Process GeoJSON bathymetric data into depth grid for routing

Handles both:
- Point cloud data (Lake Champlain)
- Contour line data (Hudson River)
"""

import json
import sys
from math import sqrt
import argparse

# Grid configuration (must match navigation.js)
GRID_CONFIG = {
    'latStep': 0.00180,  # 200m
    'lngStep': 0.00240,  # 200m
    'bounds': {
        'south': 43.5300,
        'north': 45.0900,
        'west': -73.5200,
        'east': -73.0700
    }
}

def distance(lat1, lng1, lat2, lng2):
    """Simple Euclidean distance for nearby points"""
    return sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2)

def process_point_cloud(bathymetry_file, water_boundary_file, output_file):
    """
    Process point cloud bathymetry (Lake Champlain format)
    Each grid point gets depth from nearest bathymetric point
    """
    print(f"Processing point cloud: {bathymetry_file}")

    # Load bathymetric points
    with open(bathymetry_file, 'r') as f:
        bathy_data = json.load(f)

    print(f"Loaded {len(bathy_data['features']):,} bathymetric points")

    # Extract points with depths
    bathy_points = []
    for feature in bathy_data['features']:
        coords = feature['geometry']['coordinates']
        props = feature['properties']

        # Handle depth field (could be DEPTH_FT, CONTOUR, etc.)
        depth_ft = props.get('DEPTH_FT') or props.get('depth_ft') or props.get('DEPTH')

        if depth_ft is not None:
            # Convert negative feet to positive meters
            depth_m = abs(float(depth_ft)) * 0.3048  # feet to meters

            # FILTER OUT SHORELINE/LAND POINTS (depth < 3 feet / 1 meter)
            # These are elevation points, not navigable water
            if depth_m >= 0.9:  # 3 feet minimum
                bathy_points.append({
                    'lat': coords[1],
                    'lng': coords[0],
                    'depth_m': depth_m
                })

    print(f"Extracted {len(bathy_points):,} valid depth points")

    if not bathy_points:
        print("ERROR: No valid depth points found!")
        return

    # Load water boundary
    with open(water_boundary_file, 'r') as f:
        boundary_data = json.load(f)

    # Simple point-in-polygon check (can be optimized)
    def point_in_water(lat, lng):
        # Simplified - just check bounding box for now
        # In production, use proper point-in-polygon
        bounds = GRID_CONFIG['bounds']
        return (bounds['south'] <= lat <= bounds['north'] and
                bounds['west'] <= lng <= bounds['east'])

    # Generate grid and find nearest depth for each point
    depth_grid = {}
    grid_id = 0
    total_checked = 0
    water_with_depth = 0

    print(f"Generating depth grid...")

    lat = GRID_CONFIG['bounds']['south']
    while lat <= GRID_CONFIG['bounds']['north']:
        lng = GRID_CONFIG['bounds']['west']

        while lng <= GRID_CONFIG['bounds']['east']:
            total_checked += 1

            if total_checked % 10000 == 0:
                print(f"  Processed {total_checked:,} grid points, found {water_with_depth:,} with depth data...")

            if point_in_water(lat, lng):
                # Find nearest bathymetric point
                nearest_depth = None
                min_dist = float('inf')

                for bathy_point in bathy_points:
                    dist = distance(lat, lng, bathy_point['lat'], bathy_point['lng'])

                    if dist < min_dist:
                        min_dist = dist
                        nearest_depth = bathy_point['depth_m']

                # Only include if nearest point is within 0.01° (~1km)
                if nearest_depth is not None and min_dist < 0.01:
                    depth_grid[f"g{grid_id}"] = {
                        "lat": round(lat, 6),
                        "lng": round(lng, 6),
                        "depth": round(nearest_depth, 2),
                        "nearest_dist": round(min_dist * 111000, 0)  # degrees to meters
                    }

                    water_with_depth += 1
                    grid_id += 1

            lng += GRID_CONFIG['lngStep']

        lat += GRID_CONFIG['latStep']

    if not depth_grid:
        print("ERROR: No grid points with depth data!")
        return

    # Calculate statistics
    depths = [p['depth'] for p in depth_grid.values()]

    output = {
        "metadata": {
            "source": bathymetry_file,
            "format": "point_cloud",
            "resolution_m": 200,
            "grid_points": len(depth_grid),
            "bounds": GRID_CONFIG['bounds'],
            "units": "meters",
            "coverage_note": "Only areas with nearby bathymetric data"
        },
        "depth_grid": depth_grid,
        "depth_statistics": {
            "min": round(min(depths), 2),
            "max": round(max(depths), 2),
            "mean": round(sum(depths) / len(depths), 2),
            "count": len(depths)
        }
    }

    # Write output
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)

    file_size_kb = len(json.dumps(output)) / 1024

    print(f"\n✓ Created depth grid:")
    print(f"  Grid points with depth: {len(depth_grid):,}")
    print(f"  Depth range: {output['depth_statistics']['min']}m - {output['depth_statistics']['max']}m")
    print(f"  Average depth: {output['depth_statistics']['mean']}m")
    print(f"  File size: {file_size_kb:.1f} KB")

def process_contour_lines(bathymetry_file, water_boundary_file, output_file):
    """
    Process contour line bathymetry (Hudson River format)
    Interpolate depth between contour lines
    """
    print(f"Processing contour lines: {bathymetry_file}")

    with open(bathymetry_file, 'r') as f:
        bathy_data = json.load(f)

    print(f"Loaded {len(bathy_data['features']):,} contour lines")

    # Extract contour segments
    contour_segments = []
    for feature in bathy_data['features']:
        depth_ft = feature['properties'].get('CONTOUR')

        if depth_ft is not None and feature['geometry']['type'] == 'LineString':
            depth_m = abs(float(depth_ft)) * 0.3048

            coords = feature['geometry']['coordinates']
            contour_segments.append({
                'depth_m': depth_m,
                'coords': coords
            })

    print(f"Extracted {len(contour_segments):,} contour segments")

    # For each grid point, find nearest contour and use its depth
    # (Simple approach - can be improved with interpolation)

    depth_grid = {}
    grid_id = 0

    lat = GRID_CONFIG['bounds']['south']
    while lat <= GRID_CONFIG['bounds']['north']:
        lng = GRID_CONFIG['bounds']['west']

        while lng <= GRID_CONFIG['bounds']['east']:

            # Find nearest contour point
            nearest_depth = None
            min_dist = float('inf')

            for contour in contour_segments:
                for coord in contour['coords']:
                    dist = distance(lat, lng, coord[1], coord[0])

                    if dist < min_dist:
                        min_dist = dist
                        nearest_depth = contour['depth_m']

            # Only include if within 0.005° (~500m) of a contour
            if nearest_depth is not None and min_dist < 0.005:
                depth_grid[f"g{grid_id}"] = {
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "depth": round(nearest_depth, 2)
                }

                grid_id += 1

            lng += GRID_CONFIG['lngStep']

        lat += GRID_CONFIG['latStep']

        if int(lat * 100) % 10 == 0:
            print(f"  Progress: {lat:.2f}° ({grid_id} points)")

    # Calculate statistics and save
    if not depth_grid:
        print("ERROR: No grid points with depth data!")
        return

    depths = [p['depth'] for p in depth_grid.values()]

    output = {
        "metadata": {
            "source": bathymetry_file,
            "format": "contour_lines",
            "resolution_m": 200,
            "grid_points": len(depth_grid),
            "bounds": GRID_CONFIG['bounds'],
            "units": "meters"
        },
        "depth_grid": depth_grid,
        "depth_statistics": {
            "min": round(min(depths), 2),
            "max": round(max(depths), 2),
            "mean": round(sum(depths) / len(depths), 2),
            "count": len(depths)
        }
    }

    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)

    file_size_kb = len(json.dumps(output)) / 1024

    print(f"\n✓ Created depth grid:")
    print(f"  Grid points: {len(depth_grid):,}")
    print(f"  Depth range: {output['depth_statistics']['min']}m - {output['depth_statistics']['max']}m")
    print(f"  File size: {file_size_kb:.1f} KB")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Process bathymetric GeoJSON data')
    parser.add_argument('bathymetry_file', help='Input bathymetry GeoJSON file')
    parser.add_argument('boundary_file', help='Water boundary GeoJSON file')
    parser.add_argument('output_file', help='Output depth grid JSON file')
    parser.add_argument('--format', choices=['points', 'contours'], required=True,
                        help='Bathymetry data format')

    args = parser.parse_args()

    if args.format == 'points':
        process_point_cloud(args.bathymetry_file, args.boundary_file, args.output_file)
    else:
        process_contour_lines(args.bathymetry_file, args.boundary_file, args.output_file)
