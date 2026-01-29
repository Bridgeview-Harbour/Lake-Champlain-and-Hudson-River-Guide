# POI Field Reference Guide

## Required Fields (All POI Types)

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique identifier (lowercase, hyphens) | `marina-bridgeview-harbour` |
| `name` | Display name | `Bridgeview Harbour Marina` |
| `category` | Main category | `marina`, `lock`, `bridge`, `aton`, `dining`, `poi`, `bay` |
| `latitude` | Decimal latitude | `44.04137` |
| `longitude` | Decimal longitude (negative for West) | `-73.45767` |
| `town` | City/Town name | `Port Henry` |
| `state` | State/Province abbreviation | `NY`, `VT`, `QC` |
| `country` | Country name | `United States`, `Canada` |
| `waterBodyRegion` | Water body and region | `Lake Champlain Southern`, `Hudson River`, `Champlain Canal` |

## Optional Common Fields

| Field | Description | Example |
|-------|-------------|---------|
| `subcategory` | More specific type | See subcategories below |
| `tags` | Additional categories (comma-separated) | `fuel,transient,historic` |
| `description` | Brief description | `Full-service marina with transient slips` |
| `website` | URL | `https://www.example.com` |
| `phone` | Phone number (digits only) | `15185467400` |
| `vhfChannel` | VHF radio channel | `9`, `13`, `16` |
| `email` | Email address | `info@example.com` |
| `amenities` | Comma-separated list | `fuel,electric,water,wifi,pumpout` |

---

## Categories and Subcategories

### Marina (`category: marina`)
**Subcategories:** `full-service`, `private`, `yacht-club`

| Field | Description |
|-------|-------------|
| `totalSlips` | Total number of slips |
| `transientSlips` | Number of transient slips |
| `maxVesselLength` | Maximum vessel length (feet) |
| `minDepth` | Minimum depth at dock (feet) |

### Fuel Information (for marinas with fuel)
| Field | Description | Values |
|-------|-------------|--------|
| `fuel_available` | Has fuel dock | `TRUE` or `FALSE` |
| `fuel_types` | Types available | `gasoline`, `diesel`, or `gasoline,diesel` |
| `fuel_ethanol_free` | Non-ethanol gas available | `TRUE` or `FALSE` |
| `fuel_high_speed` | High-speed pumps | `TRUE` or `FALSE` |
| `fuel_hours` | Fuel dock hours | `7am-6pm` |

---

### Lock (`category: lock`)
**Subcategories:** `canal-lock`

| Field | Description | Example |
|-------|-------------|---------|
| `lock_number` | Lock designation | `C-1`, `E2` |
| `lock_canal` | Canal name | `Champlain Canal`, `Erie Canal` |
| `lock_system` | Operating system | `NYS Canal System`, `Parks Canada` |
| `lock_lift` | Lift height (feet) | `14` |
| `lock_chamber_length` | Chamber length (feet) | `300` |
| `lock_chamber_width` | Chamber width (feet) | `43.5` |
| `lock_operating_hours` | Daily hours | `7am-5pm` |
| `lock_operating_season` | Season dates | `May 1 - Nov 15` |
| `lock_fee` | Fee information | `Free for recreational` |
| `lock_tie_up_walls` | Has tie-up walls | `TRUE` or `FALSE` |
| `lock_restrooms` | Has restrooms | `TRUE` or `FALSE` |
| `lock_water` | Has water | `TRUE` or `FALSE` |
| `lock_electric` | Has electric | `TRUE` or `FALSE` |
| `lock_pumpout` | Has pumpout | `TRUE` or `FALSE` |
| `lock_remarks` | Additional notes | Free text |

---

### Bridge (`category: bridge`)
**Subcategories:** `fixed-bridge`, `drawbridge`, `swing-bridge`, `bascule-bridge`, `lift-bridge`

| Field | Description | Example |
|-------|-------------|---------|
| `bridge_type` | Bridge mechanism | `fixed`, `draw`, `swing`, `bascule`, `lift` |
| `bridge_clearance_height` | Vertical clearance closed (feet) | `14` |
| `bridge_clearance_open` | Vertical clearance open (feet) | `135` |
| `bridge_horizontal_clearance` | Horizontal clearance (feet) | `100` |
| `bridge_roadway` | Road/railroad | `NY 2`, `CSX Railroad` |
| `bridge_owner` | Owner/operator | `NYSDOT`, `CSX Transportation` |
| `bridge_opening_schedule` | Opening schedule | `On signal`, `On the hour` |
| `bridge_restricted_hours` | No-opening periods | `7-9am, 4-6pm weekdays` |
| `bridge_vhf` | Bridge tender VHF channel | `13` |
| `bridge_signal_required` | Requires signal to open | `TRUE` or `FALSE` |
| `bridge_signal_type` | Signal description | `1 long + 1 short` |
| `bridge_advance_notice` | Notice required | `24 hours` |
| `bridge_operating_season` | Seasonal operation | `May-Nov` |
| `bridge_remarks` | Additional notes | Free text |

---

### Aid to Navigation (`category: aton`)
**Subcategories:** `lighthouse`, `buoy`, `daymark`, `light`, `beacon`

| Field | Description | Example |
|-------|-------------|---------|
| `aton_uscg_id` | USCG identifier | `7890` |
| `aton_llnr` | Light List Number | `19250` |
| `aton_characteristic` | Light characteristic | `Fl W 10s`, `Fl R 4s` |
| `aton_color` | Color | `red`, `green`, `white`, `red-white` |
| `aton_shape` | Shape (buoys) | `nun`, `can`, `conical`, `sphere` |
| `aton_height` | Height (feet) | `55` |
| `aton_range` | Visible range (nm) | `14` |
| `aton_structure` | Structure description | `white octagonal tower` |
| `aton_radar_reflector` | Has radar reflector | `TRUE` or `FALSE` |
| `aton_sound` | Sound signal | `horn`, `bell`, `whistle` |
| `aton_remarks` | Additional notes | Free text |

---

### Restaurant (`category: dining`)
**Subcategories:** `waterfront-restaurant`, `cafe`, `bar-grill`

Standard fields only (name, location, contact info, description).

---

### Point of Interest (`category: poi`)
**Subcategories:** `museum`, `historic`, `park`, `landmark`, `visitor-center`

Standard fields only. Use `tags` for additional categorization like `historic,landmark`.

---

### Bay/Harbor (`category: bay`)
**Subcategories:** `anchorage`, `harbor`, `boat-launch`, `beach`

Standard fields only. Use `tags: anchorage` for good anchoring spots.

---

## Water Body Regions

Use these for the `waterBodyRegion` field:

| Region | Description |
|--------|-------------|
| `Lake Champlain Southern` | South of Crown Point Bridge |
| `Lake Champlain Narrows` | Crown Point to Split Rock |
| `Lake Champlain Broad` | Split Rock to Plattsburgh |
| `Lake Champlain Northern` | North of Plattsburgh |
| `Lake Champlain Islands` | Grand Isle, North/South Hero, Isle La Motte |
| `Champlain Canal` | Waterford to Whitehall |
| `Hudson River` | Troy to NYC |
| `Richelieu River` | Canadian border to St. Lawrence |

---

## ID Naming Convention

Format: `{category}-{location-or-name}`

Examples:
- `marina-bridgeview-harbour`
- `lock-champlain-c1`
- `bridge-crown-point`
- `aton-split-rock-light`
- `restaurant-dockside-cafe`
- `poi-fort-ticonderoga`
- `bay-willsboro`

---

## Tips

1. **Coordinates**: Use Google Maps to get precise lat/lng. Right-click on location → "What's here?"
2. **Phone Numbers**: Use digits only, include country code (1 for US/Canada)
3. **Tags**: Use for POIs that fit multiple categories (e.g., marina with fuel: `tags: fuel,transient`)
4. **Boolean Fields**: Use `TRUE` or `FALSE` (or leave empty for FALSE)
5. **Empty Fields**: Leave blank if not applicable - don't use "N/A"
