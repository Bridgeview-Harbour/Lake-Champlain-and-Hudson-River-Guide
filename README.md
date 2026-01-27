# Lake Champlain & Hudson River Boater's Guide

An interactive web-based guide for boaters exploring Lake Champlain, the Hudson River, and connected waterways. Presented by **Bridgeview Harbour Marina**.

## Features

- **Interactive Map**: Explore Lake Champlain and the Hudson River with an easy-to-use touch-friendly map
- **Points of Interest**: Find marinas, restaurants, historic sites, bays/harbors, fuel stations, and anchorages
- **Distance Calculator**: Calculate distances between any two locations using the Haversine formula
- **Travel Time Estimator**: Input your average vessel cruise speed to get estimated travel times
- **Unit Selection**: Switch between Nautical Miles, Statute Miles, and Kilometers
- **Touch-Optimized**: Designed for iPads, large touchscreens (Surface Hub), and desktop browsers
- **Offline-Capable**: All calculations run client-side - no internet required after initial load

## Getting Started

Simply open `index.html` in a modern web browser. No server or build process required.

```bash
# Option 1: Open directly
open index.html

# Option 2: Serve locally (recommended for development)
python -m http.server 8000
# Then visit http://localhost:8000
```

## Usage

1. **Select Starting Point**: Default is Bridgeview Harbour Marina. Click any marker or use the dropdown to change
2. **Select Destination**: Choose where you want to go
3. **View Results**: See the distance and estimated travel time
4. **Adjust Settings**:
   - Change units (Nautical Miles, Miles, Kilometers)
   - Input your vessel's average cruise speed
5. **Filter Locations**: Use the filter buttons to show only specific types of POIs
6. **Search**: Use the search box to find specific locations by name

## Technology

- **Leaflet.js**: Open-source mapping library
- **OpenStreetMap**: Free map tiles
- **Vanilla JavaScript**: No frameworks required
- **CSS3**: Modern responsive design with CSS variables
- **Local Storage**: Saves your unit and speed preferences

## Points of Interest

The guide includes over 60 locations across:
- Lake Champlain (Vermont & New York)
- Hudson River (Albany to NYC)
- Champlain Canal connection

Categories include:
- Marinas with transient dockage
- Waterfront restaurants
- Historic sites (forts, villages, landmarks)
- Bays and harbors
- Fuel stations
- Popular anchorages

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS/macOS)
- Any modern browser with ES6 support

## Contributing

To add new locations, edit `js/data.js` and add entries to the `POINTS_OF_INTEREST` array with:
- `id`: Unique identifier
- `name`: Display name
- `type`: Category (marina, restaurant, historic, bay, fuel, anchorage)
- `lat`/`lng`: Coordinates
- `description`: Brief description
- `amenities`: Array of available amenities (optional)

## License

This project is provided for use by Bridgeview Harbour Marina and the boating community.
