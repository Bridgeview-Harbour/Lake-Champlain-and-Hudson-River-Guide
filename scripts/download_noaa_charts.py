#!/usr/bin/env python3
"""
NOAA Chart Downloader and Tile Generator
=========================================

Downloads official NOAA RNC (Raster Nautical Chart) files and converts them
to map tiles for self-hosting.

Requirements:
    pip install requests tqdm

System Requirements:
    - GDAL (brew install gdal)
    - gdal2tiles.py (included with GDAL)

Usage:
    python download_noaa_charts.py

Charts Downloaded:
    Lake Champlain: 14781, 14782, 14783
    Hudson River: 12343, 12347, 12348

Output:
    ./noaa_charts/     - Downloaded RNC files
    ./noaa_tiles/      - Generated map tiles (ready for hosting)
"""

import os
import sys
import subprocess
import zipfile
from pathlib import Path

try:
    import requests
    from tqdm import tqdm
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install requests tqdm")
    sys.exit(1)


# =============================================================================
# Configuration
# =============================================================================

# NOAA chart numbers for our region
CHARTS = {
    # Lake Champlain
    '14781': 'Lake Champlain South',
    '14782': 'Lake Champlain North',
    '14783': 'Approaches to Burlington',

    # Hudson River
    '12343': 'Hudson River - New York to Wappinger Creek',
    '12347': 'Hudson River - Wappinger Creek to Hudson',
    '12348': 'Hudson River - Hudson to Troy',
}

# NOAA RNC download base URL
# RNCs are available as ZIP files containing BSB/KAP format charts
NOAA_RNC_BASE_URL = "https://charts.noaa.gov/RNCs"

# Output directories
CHARTS_DIR = Path("./noaa_charts")
TILES_DIR = Path("./noaa_tiles")
TEMP_DIR = Path("./noaa_temp")

# Tile generation settings
MIN_ZOOM = 8
MAX_ZOOM = 16
TILE_FORMAT = "png"


# =============================================================================
# Download Functions
# =============================================================================

def download_file(url, dest_path, desc=None):
    """Download a file with progress bar."""
    try:
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))

        with open(dest_path, 'wb') as f:
            with tqdm(total=total_size, unit='B', unit_scale=True, desc=desc or dest_path.name) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    pbar.update(len(chunk))

        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False


def download_rnc(chart_number):
    """Download an RNC chart from NOAA."""
    # NOAA RNC files are named like: 14781_1.zip
    # Try different version numbers
    for version in range(1, 10):
        filename = f"{chart_number}_{version}.zip"
        url = f"{NOAA_RNC_BASE_URL}/{filename}"
        dest_path = CHARTS_DIR / filename

        if dest_path.exists():
            print(f"  Already downloaded: {filename}")
            return dest_path

        print(f"  Trying: {url}")
        if download_file(url, dest_path, desc=f"Chart {chart_number}"):
            return dest_path

    # Try without version number
    filename = f"{chart_number}.zip"
    url = f"{NOAA_RNC_BASE_URL}/{filename}"
    dest_path = CHARTS_DIR / filename

    if download_file(url, dest_path, desc=f"Chart {chart_number}"):
        return dest_path

    return None


def extract_rnc(zip_path, chart_number):
    """Extract RNC files from downloaded ZIP."""
    extract_dir = TEMP_DIR / chart_number
    extract_dir.mkdir(parents=True, exist_ok=True)

    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            z.extractall(extract_dir)

        # Find the BSB/KAP files
        kap_files = list(extract_dir.rglob("*.KAP")) + list(extract_dir.rglob("*.kap"))
        bsb_files = list(extract_dir.rglob("*.BSB")) + list(extract_dir.rglob("*.bsb"))

        return kap_files + bsb_files
    except Exception as e:
        print(f"Error extracting {zip_path}: {e}")
        return []


# =============================================================================
# Tile Generation Functions
# =============================================================================

def check_gdal():
    """Check if GDAL is installed."""
    try:
        result = subprocess.run(['gdalinfo', '--version'], capture_output=True, text=True)
        print(f"GDAL found: {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("GDAL not found. Install with:")
        print("  macOS: brew install gdal")
        print("  Ubuntu: sudo apt-get install gdal-bin python3-gdal")
        return False


def convert_to_geotiff(kap_file, output_path):
    """Convert BSB/KAP chart to GeoTIFF."""
    try:
        cmd = [
            'gdal_translate',
            '-of', 'GTiff',
            '-expand', 'rgba',
            str(kap_file),
            str(output_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            return True
        else:
            print(f"  Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"  Error converting {kap_file}: {e}")
        return False


def generate_tiles(geotiff_path, output_dir, chart_name):
    """Generate map tiles from GeoTIFF using gdal2tiles."""
    try:
        cmd = [
            'gdal2tiles.py',
            '-z', f'{MIN_ZOOM}-{MAX_ZOOM}',
            '-w', 'none',  # No HTML viewer files
            '-r', 'bilinear',  # Resampling method
            '--processes=4',  # Parallel processing
            str(geotiff_path),
            str(output_dir)
        ]

        print(f"  Generating tiles for {chart_name}...")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            return True
        else:
            print(f"  Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"  Error generating tiles: {e}")
        return False


def merge_tilesets(source_dirs, output_dir):
    """Merge multiple tile directories into one, with later tiles overwriting earlier ones."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for source in source_dirs:
        source = Path(source)
        if not source.exists():
            continue

        for zoom_dir in source.iterdir():
            if not zoom_dir.is_dir():
                continue

            dest_zoom = output_dir / zoom_dir.name
            dest_zoom.mkdir(exist_ok=True)

            for x_dir in zoom_dir.iterdir():
                if not x_dir.is_dir():
                    continue

                dest_x = dest_zoom / x_dir.name
                dest_x.mkdir(exist_ok=True)

                for tile in x_dir.iterdir():
                    if tile.is_file():
                        dest_tile = dest_x / tile.name
                        # Copy tile (overwrites if exists)
                        import shutil
                        shutil.copy2(tile, dest_tile)


# =============================================================================
# Main Script
# =============================================================================

def main():
    print("=" * 60)
    print("NOAA Chart Downloader and Tile Generator")
    print("=" * 60)

    # Check for GDAL
    if not check_gdal():
        print("\nGDAL is required for tile generation.")
        print("Install it and run this script again.")
        sys.exit(1)

    # Create directories
    CHARTS_DIR.mkdir(parents=True, exist_ok=True)
    TILES_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\nCharts to download: {len(CHARTS)}")
    for num, name in CHARTS.items():
        print(f"  {num}: {name}")

    # Download charts
    print("\n" + "-" * 60)
    print("Step 1: Downloading NOAA RNC files...")
    print("-" * 60)

    downloaded = {}
    for chart_num, chart_name in CHARTS.items():
        print(f"\nDownloading Chart {chart_num} ({chart_name})...")
        zip_path = download_rnc(chart_num)
        if zip_path:
            downloaded[chart_num] = zip_path
        else:
            print(f"  Failed to download chart {chart_num}")

    if not downloaded:
        print("\nNo charts were downloaded. Check your internet connection.")
        sys.exit(1)

    print(f"\nDownloaded {len(downloaded)}/{len(CHARTS)} charts")

    # Extract and convert
    print("\n" + "-" * 60)
    print("Step 2: Extracting and converting charts...")
    print("-" * 60)

    geotiffs = []
    for chart_num, zip_path in downloaded.items():
        print(f"\nProcessing Chart {chart_num}...")

        # Extract
        kap_files = extract_rnc(zip_path, chart_num)
        if not kap_files:
            print(f"  No KAP/BSB files found in {zip_path}")
            continue

        print(f"  Found {len(kap_files)} chart file(s)")

        # Convert each KAP to GeoTIFF
        for kap_file in kap_files:
            geotiff_path = TEMP_DIR / f"{kap_file.stem}.tif"
            print(f"  Converting {kap_file.name} to GeoTIFF...")

            if convert_to_geotiff(kap_file, geotiff_path):
                geotiffs.append((geotiff_path, f"{chart_num}_{kap_file.stem}"))

    if not geotiffs:
        print("\nNo charts were converted. Check GDAL installation.")
        sys.exit(1)

    print(f"\nConverted {len(geotiffs)} chart files to GeoTIFF")

    # Generate tiles
    print("\n" + "-" * 60)
    print("Step 3: Generating map tiles...")
    print("-" * 60)

    tile_dirs = []
    for geotiff_path, chart_name in geotiffs:
        chart_tiles_dir = TEMP_DIR / f"tiles_{chart_name}"

        if generate_tiles(geotiff_path, chart_tiles_dir, chart_name):
            tile_dirs.append(chart_tiles_dir)

    if not tile_dirs:
        print("\nNo tiles were generated. Check GDAL installation.")
        sys.exit(1)

    # Merge all tile sets
    print("\n" + "-" * 60)
    print("Step 4: Merging tile sets...")
    print("-" * 60)

    merge_tilesets(tile_dirs, TILES_DIR)

    # Count output tiles
    tile_count = sum(1 for _ in TILES_DIR.rglob("*.png"))

    # Summary
    print("\n" + "=" * 60)
    print("Complete!")
    print("=" * 60)
    print(f"  Charts downloaded: {len(downloaded)}")
    print(f"  GeoTIFFs created: {len(geotiffs)}")
    print(f"  Tiles generated: {tile_count}")
    print(f"  Output directory: {TILES_DIR.absolute()}")

    print("\n" + "-" * 60)
    print("Next Steps:")
    print("-" * 60)
    print("""
1. Upload the 'noaa_tiles' folder to your web hosting:
   - GitHub Pages: Push to gh-pages branch
   - AWS S3: aws s3 sync noaa_tiles s3://your-bucket/noaa_tiles
   - Any static file host

2. Update your Leaflet code with the hosted tile URL:

   const noaaCharts = L.tileLayer('YOUR_URL/{z}/{x}/{y}.png', {
       attribution: '&copy; NOAA Nautical Charts',
       maxZoom: 16,
       minZoom: 8,
       tileSize: 256
   });

3. Add to your baseMaps object:
   "NOAA Charts": noaaCharts
""")

    # Cleanup option
    print("\nTo save disk space, you can delete the temp files:")
    print(f"  rm -rf {TEMP_DIR}")


if __name__ == "__main__":
    main()
