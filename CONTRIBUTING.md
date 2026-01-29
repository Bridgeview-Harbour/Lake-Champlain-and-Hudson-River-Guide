# Contributing to Lake Champlain & Hudson River Boater's Guide

Thank you for your interest in contributing! This guide will help you add new locations, fix bugs, or improve the application.

## Table of Contents

- [Adding Points of Interest](#adding-points-of-interest)
- [Reporting Issues](#reporting-issues)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Changes](#testing-changes)
- [Submitting Changes](#submitting-changes)

## Adding Points of Interest

### Quick Method: Edit CSV File

The easiest way to add new POIs is by editing the CSV file:

1. Open `pois/POIs.csv` in Excel, Google Sheets, or a text editor
2. Add a new row with the following required fields:
   - **Name**: Display name of the location
   - **Coordinates**: Latitude and longitude in format: `44.12345, -73.54321`
   - **Categories**: Type of location (see categories below)
   - **Description**: Brief description (optional but recommended)

3. Additional fields (optional):
   - City/Town, State/Province, Country
   - Website, Telephone, VHF Channel
   - Marina-specific: Total Slips, Transient Slips, Max Vessel Length, Min Depth
   - Fuel: Fuel Available, Fuel Types, Ethanol Free
   - Navigation aids: ATON Color, ATON Shape, ATON Characteristic
   - Locks: Lock Number, Lock Canal, Lock Lift, Operating Hours
   - Bridges: Bridge Type, Bridge Clearance, Opening Schedule

4. Convert CSV to JSON:
   ```bash
   python pois/convert_csv_to_json.py pois/POIs.csv pois/lake_champlain_pois.json
   ```

5. Test your changes locally by opening `index.html` in a browser

### POI Categories

Valid categories include:
- **marina** - Full-service marinas with transient dockage
- **dining** / **restaurant** - Waterfront restaurants and bars
- **poi** / **points of interest** - Historic sites, museums, landmarks
- **bay** / **harbor** / **anchorage** - Natural harbors and anchorages
- **lock** - Canal locks
- **bridge** - Fixed or movable bridges
- **aton** / **aid to navigation** - Buoys, lighthouses, navigation aids
- **boat launch** - Public boat ramps
- **campground** - Waterfront camping areas
- **hotel** - Waterfront accommodations
- **beach** - Public beaches
- **fuel** - Fuel stations

### Data Quality Guidelines

When adding POIs, please ensure:

1. **Accurate Coordinates**: Use decimal degrees format (not degrees/minutes/seconds)
   - Example: `44.123456, -73.234567`
   - Verify location on a map before submitting

2. **Complete Information**: Include as many relevant fields as possible
   - Contact information (website, phone)
   - Operating hours and seasonal information
   - Amenities and services available

3. **Clear Descriptions**: Write concise, helpful descriptions
   - Mention key features and amenities
   - Note any special considerations (depth, clearance, etc.)
   - Keep it factual and objective

4. **Up-to-Date**: Verify information is current
   - Check websites and contact info are still active
   - Note any recent changes in comments

### Coordinate Requirements

Coordinates must be within the Lake Champlain & Hudson River region:
- **Latitude**: 40°N to 46°N (approximately)
- **Longitude**: -75°W to -71°W (approximately)

The conversion script will validate coordinates and warn if they're outside the expected range.

## Reporting Issues

Found a bug or have a suggestion? Please open an issue on GitHub with:

1. **Clear title**: Briefly describe the issue
2. **Description**: Detailed explanation of the problem
3. **Steps to reproduce**: For bugs, list steps to reproduce the issue
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Screenshots**: If applicable, add screenshots
7. **Browser/Device**: Which browser and device you're using

## Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.7+ (for data conversion scripts)
- Git (for version control)

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Bridgeview-Harbour/Lake-Champlain-and-Hudson-River-Guide.git
   cd Lake-Champlain-and-Hudson-River-Guide
   ```

2. Serve locally (recommended):
   ```bash
   python -m http.server 8000
   ```
   Then visit http://localhost:8000

3. Or open directly:
   ```bash
   open index.html
   ```

### File Structure

```
Lake-Champlain-and-Hudson-River-Guide/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All application styles
├── js/
│   ├── app.js             # Main application logic
│   ├── data.js            # POI data and configuration
│   └── navigation.js      # Water-based pathfinding
├── pois/
│   ├── POIs.csv           # Source data (edit this)
│   ├── lake_champlain_pois.json  # Generated JSON (don't edit directly)
│   └── convert_csv_to_json.py    # Conversion script
└── images/                # Logo and branding assets
```

## Code Style Guidelines

### JavaScript

- Use ES6+ features (const/let, arrow functions, template literals)
- Follow existing code style and indentation (4 spaces)
- Add JSDoc comments for functions
- Use meaningful variable names
- Keep functions focused and single-purpose

### CSS

- Use CSS custom properties (variables) for theming
- Follow BEM-like naming conventions where appropriate
- Maintain responsive design principles
- Ensure touch-friendly targets (48px minimum)

### Commits

- Write clear, descriptive commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issue numbers when applicable
- Keep commits focused on a single change

Example:
```
Add fuel filter button to POI filters

- Add fuel category to filter buttons
- Update filterMarkers function to handle fuel type
- Add fuel icon to legend

Fixes #123
```

## Testing Changes

Before submitting changes:

1. **Visual Testing**: Open in multiple browsers
   - Chrome/Edge
   - Firefox
   - Safari (if on macOS)

2. **Functional Testing**:
   - Test distance calculations with known locations
   - Verify route pathfinding works correctly
   - Check filters show/hide appropriate markers
   - Test search functionality
   - Verify responsive design on mobile/tablet

3. **Data Validation**:
   - Run the CSV to JSON converter without errors
   - Verify new POIs appear on the map
   - Check marker icons are correct for category

4. **Console Check**: Open browser console (F12) and verify:
   - No JavaScript errors
   - No broken resource links
   - Performance is acceptable

## Submitting Changes

### Pull Request Process

1. **Fork** the repository to your GitHub account

2. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/add-marina-xyz
   ```

3. **Make your changes** following the guidelines above

4. **Test thoroughly** on multiple browsers

5. **Commit** with clear messages:
   ```bash
   git add .
   git commit -m "Add Marina XYZ to Burlington, VT"
   ```

6. **Push** to your fork:
   ```bash
   git push origin feature/add-marina-xyz
   ```

7. **Open a Pull Request** on GitHub:
   - Describe what you changed and why
   - Reference any related issues
   - Include screenshots for UI changes
   - List browsers/devices tested

### Pull Request Checklist

- [ ] Code follows existing style guidelines
- [ ] All files are properly formatted
- [ ] No console errors or warnings
- [ ] Tested in multiple browsers
- [ ] POI data validated (if applicable)
- [ ] Commit messages are clear and descriptive
- [ ] No unnecessary files included (no .DS_Store, etc.)

## Questions?

If you have questions about contributing, feel free to:
- Open an issue on GitHub
- Contact Bridgeview Harbour Marina

Thank you for helping make this guide better for the boating community!
