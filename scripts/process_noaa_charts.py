#!/usr/bin/env python3
"""
NOAA Chart Tile Processor - Water-Only Extraction
==================================================

This script downloads NOAA nautical chart tiles and removes land areas,
leaving only water portions visible. The processed tiles can be used as
an overlay on satellite/street maps.

Requirements:
    pip install requests pillow numpy shapely geopandas rasterio mercantile tqdm

Usage:
    python process_noaa_charts.py

Output:
    Processed tiles in ./processed_tiles/{z}/{x}/{y}.png
"""

import os
import sys
import math
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO

try:
    from PIL import Image
    import numpy as np
    from tqdm import tqdm
    import mercantile
    import geopandas as gpd
    from shapely.geometry import box, shape
    from shapely.ops import unary_union
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("\nInstall required packages:")
    print("pip install requests pillow numpy shapely geopandas mercantile tqdm")
    sys.exit(1)


# =============================================================================
# Configuration
# =============================================================================

# Bounding box for Lake Champlain & Hudson River region
# Format: (min_lon, min_lat, max_lon, max_lat)
BOUNDS = {
    'lake_champlain': (-73.45, 43.8, -73.2, 45.0),  # Just Lake Champlain
    'hudson_river': (-74.0, 40.6, -73.7, 42.8),     # Hudson River
    'full_region': (-74.1, 40.5, -73.1, 45.1),      # Combined (large)
    'test_area': (-73.4, 44.4, -73.25, 44.6)        # Small test area
}

# Which region to process
REGION = 'lake_champlain'

# Zoom levels to process - Start with lower zooms for overnight batch 1
# Batch 1: Zoom 10-12 (~108 tiles, ~6 minutes at 2s/tile + 2s delay)
# Batch 2: Zoom 13 (~280 tiles, ~19 minutes)
# Batch 3: Zoom 14+ (larger batches for later)
ZOOM_LEVELS = range(10, 13)  # Zoom 10-12 for first batch

# NOAA tile server URLs (try seamless RNC service - more reliable)
# Option 1: Seamless RNC (ArcGIS REST)
NOAA_TILE_URL = "https://seamlessrnc.nauticalcharts.noaa.gov/arcgis/rest/services/RNC/NOAA_RNC/MapServer/tile/{z}/{y}/{x}"
# Option 2: Direct tile service (can be slow)
# NOAA_TILE_URL = "https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png"

# Output directory
OUTPUT_DIR = Path("./processed_tiles")

# Water data source (will be downloaded if not present)
WATER_DATA_URL = "https://naciscdn.org/naturalearth/10m/physical/ne_10m_ocean.zip"
WATER_DATA_DIR = Path("./water_data")

# Processing settings - SLOW MODE for overnight batch processing
MAX_WORKERS = 1  # Single thread to be gentle on NOAA servers
RETRY_ATTEMPTS = 5  # More retry attempts
RETRY_DELAY = 5  # Longer delay between retries (seconds)
REQUEST_DELAY = 2  # Delay between each tile request (seconds)
LAND_COLORS_THRESHOLD = 200  # Brightness threshold for land detection
USE_WATER_MASK = False  # Use color-based detection (works better for inland waters like Lake Champlain)


# =============================================================================
# Utility Functions
# =============================================================================

def lat_lon_to_tile(lat, lon, zoom):
    """Convert lat/lon to tile coordinates at given zoom level."""
    n = 2 ** zoom
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    return x, y


def tile_to_lat_lon(x, y, zoom):
    """Convert tile coordinates to lat/lon (top-left corner)."""
    n = 2 ** zoom
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lat, lon


def get_tile_bounds(x, y, zoom):
    """Get the lat/lon bounding box for a tile."""
    lat1, lon1 = tile_to_lat_lon(x, y, zoom)
    lat2, lon2 = tile_to_lat_lon(x + 1, y + 1, zoom)
    return box(lon1, lat2, lon2, lat1)


def get_tiles_for_bounds(bounds, zoom):
    """Get all tile coordinates within a bounding box at given zoom."""
    min_lon, min_lat, max_lon, max_lat = bounds

    # Get tile coordinates for corners
    x_min, y_max = lat_lon_to_tile(min_lat, min_lon, zoom)
    x_max, y_min = lat_lon_to_tile(max_lat, max_lon, zoom)

    tiles = []
    for x in range(x_min, x_max + 1):
        for y in range(y_min, y_max + 1):
            tiles.append((zoom, x, y))

    return tiles


# =============================================================================
# Water Mask Functions
# =============================================================================

def download_water_data():
    """Download Natural Earth ocean/water data."""
    WATER_DATA_DIR.mkdir(parents=True, exist_ok=True)

    shapefile = WATER_DATA_DIR / "ne_10m_ocean.shp"
    if shapefile.exists():
        print("Water data already downloaded.")
        return shapefile

    print("Downloading Natural Earth ocean data...")
    zip_path = WATER_DATA_DIR / "ne_10m_ocean.zip"

    response = requests.get(WATER_DATA_URL, stream=True)
    total_size = int(response.headers.get('content-length', 0))

    with open(zip_path, 'wb') as f:
        with tqdm(total=total_size, unit='B', unit_scale=True, desc="Downloading") as pbar:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                pbar.update(len(chunk))

    # Extract
    print("Extracting...")
    import zipfile
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(WATER_DATA_DIR)

    zip_path.unlink()  # Remove zip file
    return shapefile


def load_water_geometry(bounds):
    """Load water polygon geometry for the region."""
    shapefile = download_water_data()

    print("Loading water geometry...")
    gdf = gpd.read_file(shapefile)

    # Create bounding box for our region
    region_box = box(*bounds)

    # Clip to region (for efficiency)
    gdf_clipped = gdf.clip(region_box)

    if gdf_clipped.empty:
        print("Warning: No ocean data in region. Using lakes/rivers data...")
        # For inland water, we might need a different approach
        # Natural Earth's lakes dataset
        lakes_url = "https://naciscdn.org/naturalearth/10m/physical/ne_10m_lakes.zip"
        lakes_dir = WATER_DATA_DIR / "lakes"
        lakes_dir.mkdir(exist_ok=True)

        lakes_zip = lakes_dir / "ne_10m_lakes.zip"
        if not (lakes_dir / "ne_10m_lakes.shp").exists():
            print("Downloading lakes data...")
            response = requests.get(lakes_url)
            with open(lakes_zip, 'wb') as f:
                f.write(response.content)
            import zipfile
            with zipfile.ZipFile(lakes_zip, 'r') as z:
                z.extractall(lakes_dir)

        lakes_gdf = gpd.read_file(lakes_dir / "ne_10m_lakes.shp")
        gdf_clipped = lakes_gdf.clip(region_box)

    # Combine all water polygons
    water_geom = unary_union(gdf_clipped.geometry)

    return water_geom


# =============================================================================
# Tile Processing Functions
# =============================================================================

def download_tile(z, x, y):
    """Download a single NOAA tile with retry logic."""
    import time

    url = NOAA_TILE_URL.format(z=z, x=x, y=y)

    for attempt in range(RETRY_ATTEMPTS):
        try:
            response = requests.get(url, timeout=60, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) NOAA Chart Processor'
            })
            if response.status_code == 200:
                # Check if we got actual image data
                if len(response.content) > 100:
                    return Image.open(BytesIO(response.content)).convert('RGBA')
                else:
                    return None  # Empty/placeholder tile
            elif response.status_code == 404:
                return None  # No chart data for this tile
            else:
                if attempt < RETRY_ATTEMPTS - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                return None
        except Exception as e:
            if attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            # Only print error on final attempt
            print(f"Failed tile {z}/{x}/{y} after {RETRY_ATTEMPTS} attempts: {type(e).__name__}")
            return None

    return None


def create_water_mask_for_tile(tile_bounds, water_geom, tile_size=256):
    """Create a binary mask where water=255 and land=0."""
    from shapely.geometry import mapping
    import rasterio
    from rasterio import features
    from rasterio.transform import from_bounds

    # Get intersection of tile with water
    tile_water = water_geom.intersection(tile_bounds)

    if tile_water.is_empty:
        # No water in this tile
        return np.zeros((tile_size, tile_size), dtype=np.uint8)

    # Create transform for the tile
    minx, miny, maxx, maxy = tile_bounds.bounds
    transform = from_bounds(minx, miny, maxx, maxy, tile_size, tile_size)

    # Rasterize the water polygon
    mask = features.rasterize(
        [(tile_water, 255)],
        out_shape=(tile_size, tile_size),
        transform=transform,
        fill=0,
        dtype=np.uint8
    )

    return mask


def detect_land_by_color(img_array):
    """
    Detect land areas by color analysis for NOAA nautical charts.

    NOAA chart colors:
    - Land: Tan/beige (RGB ~220, 200, 170) - sandy/earthy colors
    - Water: Blue tints, white, light cyan
    - Urban areas: Yellow/gray tints
    - Depth contours: Blue lines on lighter background
    """
    r, g, b, a = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2], img_array[:,:,3]

    # Detect land colors in NOAA charts
    # Land is typically tan/beige: high R, medium-high G, lower B
    is_land_tan = (
        (r > 180) & (r < 250) &
        (g > 160) & (g < 230) &
        (b > 120) & (b < 200) &
        (r > b + 15) &  # R higher than B (tan/beige characteristic)
        (g > b)  # G also higher than B
    )

    # Urban/developed areas often have yellow-gray tint
    is_land_urban = (
        (r > 190) & (g > 190) & (b > 150) & (b < 200) &
        (abs(r.astype(int) - g.astype(int)) < 30)  # R and G similar
    )

    # Very light beige/cream for some land areas
    is_land_light = (
        (r > 230) & (g > 220) & (b > 200) & (b < 230) &
        (r > b)
    )

    # Combine land detection
    is_land = is_land_tan | is_land_urban | is_land_light

    # Create mask (255 = keep/water, 0 = make transparent/land)
    mask = np.where(is_land, 0, 255).astype(np.uint8)

    return mask


def process_tile(z, x, y, water_geom=None):
    """Download and process a single tile."""
    import time

    output_path = OUTPUT_DIR / str(z) / str(x) / f"{y}.png"

    # Skip if already processed
    if output_path.exists():
        return True, (z, x, y), "skipped"

    # Add delay between requests to be gentle on NOAA servers
    time.sleep(REQUEST_DELAY)

    # Download tile
    img = download_tile(z, x, y)
    if img is None:
        return False, (z, x, y), "download failed"

    # Convert to numpy array
    img_array = np.array(img)

    # Check if tile is empty (all transparent or single color)
    if img_array[:,:,3].max() == 0:
        return False, (z, x, y), "empty tile"

    # Create water mask
    if USE_WATER_MASK and water_geom is not None:
        tile_bounds = get_tile_bounds(x, y, z)
        try:
            mask = create_water_mask_for_tile(tile_bounds, water_geom)
        except Exception as e:
            # Fallback to color detection
            mask = detect_land_by_color(img_array)
    else:
        # Use color-based detection
        mask = detect_land_by_color(img_array)

    # Apply mask to alpha channel
    # Where mask is 0 (land), make transparent
    img_array[:,:,3] = np.minimum(img_array[:,:,3], mask)

    # Save processed tile
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result_img = Image.fromarray(img_array)
    result_img.save(output_path, 'PNG', optimize=True)

    return True, (z, x, y), "processed"


# =============================================================================
# Main Processing Pipeline
# =============================================================================

def main():
    print("=" * 60)
    print("NOAA Chart Tile Processor - Water-Only Extraction")
    print("=" * 60)

    bounds = BOUNDS[REGION]
    print(f"\nRegion: {REGION}")
    print(f"Bounds: {bounds}")
    print(f"Zoom levels: {list(ZOOM_LEVELS)}")

    # Calculate total tiles
    all_tiles = []
    for zoom in ZOOM_LEVELS:
        tiles = get_tiles_for_bounds(bounds, zoom)
        all_tiles.extend(tiles)
        print(f"  Zoom {zoom}: {len(tiles)} tiles")

    print(f"\nTotal tiles to process: {len(all_tiles)}")

    # Load water geometry
    water_geom = None
    if USE_WATER_MASK:
        try:
            water_geom = load_water_geometry(bounds)
            print(f"Water geometry loaded successfully")
        except Exception as e:
            print(f"Warning: Could not load water geometry: {e}")
            print("Falling back to color-based land detection")

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Process tiles
    print(f"\nProcessing tiles with {MAX_WORKERS} workers...")

    processed = 0
    skipped = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(process_tile, z, x, y, water_geom): (z, x, y)
            for z, x, y in all_tiles
        }

        with tqdm(total=len(all_tiles), desc="Processing") as pbar:
            for future in as_completed(futures):
                success, tile_coords, status = future.result()

                if status == "processed":
                    processed += 1
                elif status == "skipped":
                    skipped += 1
                else:
                    failed += 1

                pbar.update(1)

    # Summary
    print("\n" + "=" * 60)
    print("Processing Complete!")
    print("=" * 60)
    print(f"  Processed: {processed}")
    print(f"  Skipped (existing): {skipped}")
    print(f"  Failed: {failed}")
    print(f"\nOutput directory: {OUTPUT_DIR.absolute()}")

    # Generate tile server info
    print("\n" + "-" * 60)
    print("To use these tiles in your app:")
    print("-" * 60)
    print("""
1. Host the 'processed_tiles' folder on a web server or GitHub Pages

2. Update your Leaflet code:

   const noaaWaterOnly = L.tileLayer('YOUR_URL/{z}/{x}/{y}.png', {
       attribution: '&copy; NOAA (processed)',
       maxZoom: 15,
       minZoom: 10,
       tileSize: 256
   });

3. Add as an overlay on top of satellite imagery
""")


if __name__ == "__main__":
    main()
