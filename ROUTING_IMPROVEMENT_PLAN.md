# Routing System Improvement Plan
## Smoother Routes & Channel Marker Infrastructure

### Current Issues
1. **Sharp turns** - Grid-based routing creates 90° or 45° angle turns
2. **Jagged paths** - Routes follow grid cells with visible "stair-stepping"
3. **Large grid cells** - 500m resolution is too coarse for precise navigation
4. **No turn penalties** - A* treats all moves equally, doesn't favor gentle turns
5. **No channel marker support** - No infrastructure for marked channels

### Proposed Improvements

#### 1. Finer Grid Resolution
**Current:** ~500m per cell (0.00450° lat × 0.00600° lng)
**Proposed:** ~100-150m per cell (0.00090° lat × 0.00120° lng)

**Benefits:**
- Smoother paths closer to shore
- Better island avoidance
- More accurate distance calculations

**Trade-offs:**
- 25× more grid cells (~120K-150K vs current ~6K)
- Longer grid generation time (but still <2s with spatial indexing)
- Slightly slower pathfinding (but A* scales well)

#### 2. Path Smoothing Algorithm
Add post-processing to smooth the A* path using:

**Option A: Catmull-Rom Spline**
- Generates smooth curves through waypoints
- Maintains reasonable path through all grid points
- Natural-looking boat paths

**Option B: Bezier Curve Fitting**
- Creates gentle curves between waypoints
- Can skip intermediate grid points for efficiency
- Very smooth visual appearance

**Option C: Douglas-Peucker + Spline**
- First simplify path (remove redundant points)
- Then apply spline smoothing
- Best balance of accuracy and performance

**Recommendation:** Option C (Douglas-Peucker + Catmull-Rom)

#### 3. Turn Cost Penalties
Modify A* cost function to penalize sharp turns:

```javascript
// Current cost: distance only
cost = gScore[current.id] + distance(current, neighbor)

// New cost: distance + turn penalty
const turnAngle = calculateTurnAngle(previous, current, neighbor);
const turnPenalty = Math.abs(turnAngle) * TURN_PENALTY_FACTOR;
cost = gScore[current.id] + distance(current, neighbor) + turnPenalty;
```

**Turn penalty scaling:**
- 0° (straight) = 0 penalty
- 45° turn = small penalty (0.1 km equivalent)
- 90° turn = medium penalty (0.3 km equivalent)
- 135°+ turn = large penalty (0.5 km equivalent)

#### 4. Channel Marker Data Structure

Create infrastructure for future channel marker support:

```javascript
// Channel marker definition
const CHANNEL_MARKERS = [
    {
        id: 'hud-001',
        name: 'Hudson River Mile 1 - Red',
        lat: 42.7500,
        lng: -73.6900,
        type: 'lateral-red',      // red, green, cardinal, safe-water, etc.
        waterBody: 'hudson-river',
        channelSide: 'starboard',  // port, starboard, center
        pairWith: 'hud-002',       // ID of paired green marker
        radius: 50,                // meters
        active: true
    },
    // ... more markers
];

// Channel definition (connects markers)
const CHANNELS = [
    {
        id: 'hudson-main',
        name: 'Hudson River Main Channel',
        waterBody: 'hudson-river',
        markers: ['hud-001', 'hud-002', 'hud-003', ...],
        width: 100,                // meters
        centerline: [              // Optional centerline path
            [lat1, lng1],
            [lat2, lng2],
            ...
        ],
        preferredDirection: 'north',  // Hint for routing
        restrictions: {
            commercial: true,
            recreational: true,
            minimumDepth: 3.5      // meters
        }
    }
];
```

#### 5. Safety Margins
Add configurable distance from shore/islands:

```javascript
const SAFETY_MARGINS = {
    fromShore: 50,        // meters from mainland shore
    fromIsland: 30,       // meters from islands
    fromShallows: 25,     // meters from marked shallows (future)
    inChannel: 0          // When in marked channel, no extra margin needed
};
```

#### 6. Route Validation & Metadata
Enhanced route return object:

```javascript
{
    coordinates: [[lat, lng], ...],
    distance: 45.2,               // km
    path: ['g123', 'g456', ...],  // grid IDs

    // NEW FIELDS
    smoothed: true,               // Whether smoothing was applied
    smoothingMethod: 'catmull-rom',
    originalWaypoints: 87,        // Before smoothing
    smoothedWaypoints: 45,        // After smoothing

    turns: [                      // Turn analysis
        { at: [lat, lng], angle: 45, severity: 'gentle' },
        { at: [lat, lng], angle: 120, severity: 'sharp' }
    ],
    maxTurnAngle: 120,            // degrees

    channelMarkers: [],           // IDs of relevant channel markers
    inMarkedChannel: false,       // Whether route uses marked channel
    safetyMargin: 50,            // meters used

    warnings: [],                 // e.g., "Sharp turn at 44.567, -73.234"
    clearanceIssues: []          // Future: shallow water, bridges, etc.
}
```

### Implementation Strategy

#### Phase 1: Grid Resolution & Turn Costs (Priority: HIGH)
1. Reduce grid cell size to ~150m
2. Add turn angle calculation
3. Implement turn penalty in A* cost function
4. Test on existing routes

**Estimated Time:** 2-3 hours
**Expected Improvement:** Noticeably smoother routes, fewer sharp turns

#### Phase 2: Path Smoothing (Priority: HIGH)
1. Implement Douglas-Peucker simplification
2. Add Catmull-Rom spline interpolation
3. Create smoothing configuration options
4. Add visual comparison tool

**Estimated Time:** 3-4 hours
**Expected Improvement:** Smooth, natural-looking boat paths

#### Phase 3: Channel Marker Infrastructure (Priority: MEDIUM)
1. Create channel marker data structures
2. Add marker loading system
3. Implement marker visualization on map
4. Design channel-aware routing (no implementation yet)

**Estimated Time:** 2-3 hours
**Expected Improvement:** Foundation for Hudson River expansion

#### Phase 4: Safety Margins (Priority: LOW)
1. Add configurable margin settings
2. Implement shore/island distance checking
3. Adjust grid generation to respect margins
4. Add margin visualization

**Estimated Time:** 2-3 hours
**Expected Improvement:** Safer routes with buffer zones

### Configuration Options

Add user-configurable routing preferences:

```javascript
const ROUTING_CONFIG = {
    gridResolution: 'medium',     // coarse (500m), medium (150m), fine (50m)
    smoothing: true,              // Enable path smoothing
    smoothingFactor: 0.5,         // 0 = minimal, 1 = maximum
    turnPreference: 'gradual',    // sharp, normal, gradual, gentle
    safetyMargin: 50,            // meters from shore
    preferChannels: true,         // Use marked channels when available (future)

    // Visualization
    showTurns: true,              // Highlight turns on map
    showWaypoints: false,         // Show individual waypoints
    pathWidth: 3                  // pixels
};
```

### Testing Checklist

After implementation, test:
- [ ] Burlington → Plattsburgh route is visibly smoother
- [ ] Routes avoid sharp 90° turns
- [ ] Grid generation time still <3 seconds
- [ ] Route calculation time still <2 seconds
- [ ] Routes stay away from islands with safety margin
- [ ] Path smoothing produces natural curves
- [ ] Turn analysis correctly identifies sharp turns
- [ ] Channel marker data structure is extensible

### Performance Targets

| Metric | Current | Target | Acceptable |
|--------|---------|--------|------------|
| Grid Resolution | 500m | 150m | 100m |
| Grid Cells | ~6K | ~150K | ~200K |
| Grid Generation | ~200ms | ~1500ms | ~3000ms |
| Route Calculation | ~800ms | ~1500ms | ~3000ms |
| Max Turn Angle | 90-135° | <60° | <90° |
| Waypoints per 10km | ~20 | ~40-60 | ~30 |

### Success Criteria

✅ Routes look natural and boat-friendly
✅ No sharp turns >90° unless necessary
✅ Smooth curves instead of jagged grid paths
✅ Performance remains acceptable (<3s total)
✅ Channel marker infrastructure ready for Hudson River
✅ Safety margins configurable and working
✅ Route metadata provides useful navigation info

### Future Enhancements (Post-Implementation)

1. **Tidal current awareness** - Factor in current speed/direction
2. **Weather routing** - Avoid wind/wave exposure
3. **Bridge clearance** - Track vertical clearance for sailboats
4. **Lock scheduling** - Integrate lock wait times
5. **Anchorage preferences** - Route toward preferred anchorages
6. **Fuel optimization** - Minimize fuel consumption routes
7. **Multi-leg journeys** - Support overnight stops
