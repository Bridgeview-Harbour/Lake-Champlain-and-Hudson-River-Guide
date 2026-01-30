# Changelog

All notable changes to the Lake Champlain & Hudson River Boater's Guide will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Content Security Policy meta tag for improved security
- Input validation for distance calculations and coordinates
- Error handling for pathfinding algorithm
- Debouncing for search input (300ms delay) to improve performance
- Comprehensive POI data validation in conversion script
- Documentation for magic numbers and constants in navigation.js
- CONTRIBUTING.md with POI addition guidelines
- CHANGELOG.md for version tracking
- .gitignore for common OS and development files

### Changed
- Removed user-scalable restrictions from viewport meta tag for better accessibility
- Improved error messages in pathfinding with detailed logging
- Enhanced JSDoc comments for better code documentation
- Updated GRID_CONFIG constants with explanatory comments

### Fixed
- Accessibility issue: users can now zoom the page for better readability

## [1.0.0] - 2025-01-29

### Added
- Initial release of the boater's guide application
- Interactive Leaflet map with multiple base layers (Street, Satellite, Topographic)
- 210+ Points of Interest across Lake Champlain and Hudson River
- 14 POI categories including marinas, restaurants, historic sites, navigation aids
- Water-based pathfinding using A* algorithm with 1,624-vertex water polygon
- Distance calculator with Haversine formula
- Multi-stop route planning with drag-and-drop reordering
- Unit conversion (Nautical Miles, Statute Miles, Kilometers)
- Travel time estimation based on vessel speed
- Filter system for POI categories
- Location search functionality
- Touch-optimized UI for tablets and large touchscreens
- Nautical-themed design with wood plank header and brass accents
- Quick info panel for location details
- Interactive map legend
- Local storage for user preferences (units, speed)
- Responsive design for desktop, tablet, and mobile
- Offline-capable calculations (no server required)
- USCG-compliant navigation aid classifications (IALA Region B)

### Features by Category

**Navigation**
- OpenSeaMap overlay for navigation aids
- Lock information (operating hours, chamber dimensions, lift)
- Bridge details (type, clearance, opening schedules)
- Navigation aid identification (Red Nuns, Green Cans, Lighthouses, etc.)

**Marina Information**
- Total and transient slip counts
- Maximum vessel length and minimum depth
- Fuel availability and types (including ethanol-free)
- Contact information (website, phone, VHF channel)

**Data Management**
- CSV to JSON conversion script (Python)
- Comprehensive data fields for all POI types
- Category and subcategory mapping system
- Tag system for additional attributes

**Map Features**
- Multiple base map options
- Marker clustering zones
- Custom marker icons for each category
- Route visualization with polylines
- Zoom and pan controls
- Map bounds restriction to region

### Technical Details
- Pure JavaScript (ES6+) - no frameworks required
- Leaflet.js 1.9.4 for mapping
- OpenStreetMap and Esri ArcGIS Online tiles
- Python 3 data processing scripts
- GDAL support for geographic data
- Git version control
- GitHub repository hosting

### Known Issues
- NOAA Charts layer temporarily removed (self-hosting in development)
- Large PDF assets may cause slow git push (recommend Git LFS)
- No automated tests yet (manual testing required)

## Version History

- **1.0.0** (2025-01-29): Initial public release
- **0.3.x** (2025-01): NOAA chart integration development
- **0.2.x** (2024-12): Navigation aid standardization, UI refinements
- **0.1.x** (2024-11): Initial development, core features

---

## Types of Changes

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

## Future Plans

See [README.md](README.md) for planned enhancements including:
- Service Worker for true PWA offline mode
- Weather integration (NOAA overlays)
- User-submitted POI system
- GPX export for marine GPS
- Tidal information
- Marina reviews and ratings
- Dark mode for night navigation
