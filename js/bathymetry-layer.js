/**
 * Bathymetric Depth Visualization Layer
 * Creates a heatmap overlay showing water depth
 */

let bathymetryLayer = null;
let lakeBoundaryLayer = null;

/**
 * Create bathymetric heatmap layer from depth data
 * @param {L.Map} map - Leaflet map instance
 * @returns {L.HeatLayer} Heatmap layer
 */
function createBathymetryLayer(map) {
    if (!DEPTH_GRID || DEPTH_GRID.size === 0) {
        console.warn('No depth data available for bathymetry layer');
        return null;
    }

    console.log('Creating bathymetric heatmap layer...');

    // Convert depth grid to heatmap points
    const heatmapData = [];
    let minDepth = Infinity;
    let maxDepth = -Infinity;

    for (const [coordKey, depth] of DEPTH_GRID.entries()) {
        // Parse coordinates from key (format: "lat,lng")
        const [latStr, lngStr] = coordKey.split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        // Only include depths > 2 feet (0.6m)
        if (depth >= 0.6) {
            minDepth = Math.min(minDepth, depth);
            maxDepth = Math.max(maxDepth, depth);

            // Normalize depth for heatmap intensity (0-1)
            // We'll normalize after we know min/max
            heatmapData.push([lat, lng, depth]);
        }
    }

    if (heatmapData.length === 0) {
        console.warn('No depth data > 2 feet found');
        return null;
    }

    console.log(`Bathymetry data: ${heatmapData.length} points, depth range: ${minDepth.toFixed(1)}m - ${maxDepth.toFixed(1)}m`);

    // Normalize depth values for better visualization
    // Use logarithmic scale for better shallow/deep distinction
    const normalizedData = heatmapData.map(([lat, lng, depth]) => {
        // Normalize to 0-1 range with logarithmic scaling
        const normalized = Math.log(depth + 1) / Math.log(maxDepth + 1);
        return [lat, lng, normalized];
    });

    // Create heatmap layer
    bathymetryLayer = L.heatLayer(normalizedData, {
        radius: 20,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: {
            0.0: '#fff3b0',  // Very shallow (yellow)
            0.2: '#fee08b',  // Shallow (light yellow)
            0.4: '#abdda4',  // Moderate-shallow (light green-blue)
            0.6: '#66c2a5',  // Moderate (cyan)
            0.8: '#3288bd',  // Deep (blue)
            1.0: '#1a4d7a'   // Very deep (dark blue)
        },
        minOpacity: 0.3,
        opacity: 0.6
    });

    // Create lake boundary polygon for clipping
    if (WATER_BOUNDARIES && WATER_BOUNDARIES.length > 0) {
        const wb = WATER_BOUNDARIES[0];

        // Convert GeoJSON coords to Leaflet format [lat, lng]
        const outerRing = wb.outer.map(([lng, lat]) => [lat, lng]);

        // Create boundary polygon (invisible, just for clipping)
        lakeBoundaryLayer = L.polygon(outerRing, {
            color: 'transparent',
            fillColor: 'transparent',
            fillOpacity: 0,
            weight: 0,
            interactive: false
        });

        console.log('Created lake boundary mask');
    }

    console.log('Bathymetric heatmap layer created');
    return bathymetryLayer;
}

/**
 * Toggle bathymetry layer visibility
 * @param {L.Map} map - Leaflet map instance
 * @param {boolean} show - Show or hide the layer
 */
function toggleBathymetryLayer(map, show) {
    if (!map) {
        console.error('Map instance not provided');
        return;
    }

    if (show) {
        // Create layer if it doesn't exist
        if (!bathymetryLayer) {
            bathymetryLayer = createBathymetryLayer(map);
        }

        if (bathymetryLayer) {
            // Add to map
            bathymetryLayer.addTo(map);

            // Add boundary layer for visual reference (optional)
            if (lakeBoundaryLayer) {
                lakeBoundaryLayer.addTo(map);
            }

            // Move bathymetry layer below markers and routes
            const pane = map.getPane('overlayPane');
            if (pane && bathymetryLayer._canvas) {
                pane.insertBefore(bathymetryLayer._canvas, pane.firstChild);
            }

            console.log('Bathymetry layer shown');
        }
    } else {
        // Remove from map
        if (bathymetryLayer && map.hasLayer(bathymetryLayer)) {
            map.removeLayer(bathymetryLayer);
            console.log('Bathymetry layer hidden');
        }

        if (lakeBoundaryLayer && map.hasLayer(lakeBoundaryLayer)) {
            map.removeLayer(lakeBoundaryLayer);
        }
    }
}

/**
 * Refresh bathymetry layer (e.g., after depth data update)
 */
function refreshBathymetryLayer(map) {
    if (bathymetryLayer && map.hasLayer(bathymetryLayer)) {
        // Remove old layer
        map.removeLayer(bathymetryLayer);

        // Recreate
        bathymetryLayer = createBathymetryLayer(map);

        if (bathymetryLayer) {
            bathymetryLayer.addTo(map);
        }

        console.log('Bathymetry layer refreshed');
    }
}
