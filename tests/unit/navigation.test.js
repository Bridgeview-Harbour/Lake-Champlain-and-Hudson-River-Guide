/**
 * Unit Tests for Navigation & Pathfinding
 *
 * Tests the water-based A* pathfinding algorithm
 * Run with: npm test (after setting up test runner)
 */

// Import functions from navigation.js
const {
    pointInPolygon,
    isInWater,
    haversineDistance,
    generateWaterGrid,
    getNeighbors,
    findNearestGridPoint,
    findPath,
    LAKE_CHAMPLAIN_POLYGON,
    GRID_CONFIG,
    EARTH_RADIUS_KM,
    MAX_GRID_SEARCH_DISTANCE_KM,
    waterGrid,
    gridIndex
} = require('../../js/navigation.js');

// Need to reference data for POINTS_OF_INTEREST
const { POINTS_OF_INTEREST } = require('../../js/data.js');

describe('Navigation and Pathfinding', () => {
    describe('pointInPolygon', () => {
        it('should correctly identify points inside polygon', () => {
            // Mid-lake Champlain coordinates (definitely in water)
            const lat = 44.5;
            const lng = -73.3;

            const result = pointInPolygon(lat, lng, LAKE_CHAMPLAIN_POLYGON);
            expect(result).toBe(true);
        });

        it('should correctly identify points outside polygon', () => {
            // Albany, NY - outside Lake Champlain polygon
            const lat = 42.6526;
            const lng = -73.7562;

            const result = pointInPolygon(lat, lng, LAKE_CHAMPLAIN_POLYGON);
            expect(result).toBe(false);
        });

        it('should handle edge cases on polygon boundary', () => {
            // Test a point from the polygon itself (first vertex)
            const lat = LAKE_CHAMPLAIN_POLYGON[0][0];
            const lng = LAKE_CHAMPLAIN_POLYGON[0][1];

            const result = pointInPolygon(lat, lng, LAKE_CHAMPLAIN_POLYGON);
            // Boundary points might be inside or outside depending on algorithm
            expect(typeof result).toBe('boolean');
        });
    });

    describe('isInWater', () => {
        it('should return true for coordinates in water', () => {
            // Mid-lake Champlain
            expect(isInWater(44.5, -73.3)).toBe(true);
        });

        it('should return false for coordinates on land', () => {
            // Vermont land
            expect(isInWater(44.5, -72.5)).toBe(false);
        });
    });

    describe('haversineDistance', () => {
        it('should calculate distance correctly', () => {
            const distance = haversineDistance(44.4759, -73.2121, 44.6995, -73.4529);
            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThan(100);
        });

        it('should return 0 for same coordinates', () => {
            const distance = haversineDistance(44.5, -73.3, 44.5, -73.3);
            expect(distance).toBe(0);
        });

        it('should use EARTH_RADIUS_KM constant', () => {
            expect(EARTH_RADIUS_KM).toBe(6371);
        });
    });

    describe('generateWaterGrid', () => {

        it('should generate grid points', () => {
            const grid = generateWaterGrid();

            expect(grid).toBeDefined();
            expect(Array.isArray(grid)).toBe(true);
            expect(grid.length).toBeGreaterThan(0);
        });

        it('should cache grid after first generation', () => {
            const grid1 = generateWaterGrid();
            const grid2 = generateWaterGrid();

            expect(grid1).toBe(grid2); // Same reference
        });

        it('should have valid grid point structure', () => {
            const grid = generateWaterGrid();
            const point = grid[0];

            expect(point).toHaveProperty('id');
            expect(point).toHaveProperty('lat');
            expect(point).toHaveProperty('lng');
            expect(point).toHaveProperty('row');
            expect(point).toHaveProperty('col');
        });

        it('should only include water points', () => {
            const grid = generateWaterGrid();

            // Sample check - all points should be in water
            const sampleSize = Math.min(100, grid.length);
            for (let i = 0; i < sampleSize; i++) {
                const point = grid[Math.floor(Math.random() * grid.length)];
                expect(isInWater(point.lat, point.lng)).toBe(true);
            }
        });

        it('should respect GRID_CONFIG bounds', () => {
            const grid = generateWaterGrid();

            for (const point of grid) {
                expect(point.lat).toBeGreaterThanOrEqual(GRID_CONFIG.bounds.south);
                expect(point.lat).toBeLessThanOrEqual(GRID_CONFIG.bounds.north);
                expect(point.lng).toBeGreaterThanOrEqual(GRID_CONFIG.bounds.west);
                expect(point.lng).toBeLessThanOrEqual(GRID_CONFIG.bounds.east);
            }
        });
    });

    describe('getNeighbors', () => {
        beforeAll(() => {
            generateWaterGrid();
        });

        it('should return 8-directional neighbors', () => {
            // Get a point not on edge
            const grid = generateWaterGrid();
            const midPoint = grid[Math.floor(grid.length / 2)];

            const neighbors = getNeighbors(midPoint);

            expect(neighbors.length).toBeGreaterThan(0);
            expect(neighbors.length).toBeLessThanOrEqual(8);
        });

        it('should only return valid water neighbors', () => {
            const grid = generateWaterGrid();
            const point = grid[0];

            const neighbors = getNeighbors(point);

            for (const neighbor of neighbors) {
                expect(isInWater(neighbor.lat, neighbor.lng)).toBe(true);
            }
        });
    });

    describe('findNearestGridPoint', () => {
        beforeAll(() => {
            generateWaterGrid();
        });

        it('should find nearest grid point for coordinates', () => {
            // Burlington, VT
            const lat = 44.4759;
            const lng = -73.2121;

            const nearest = findNearestGridPoint(lat, lng);

            expect(nearest).toBeDefined();
            expect(nearest.lat).toBeCloseTo(lat, 1);
            expect(nearest.lng).toBeCloseTo(lng, 1);
        });

        it('should return water point even for land coordinates', () => {
            // Land coordinate - should find nearest water
            const lat = 44.5;
            const lng = -72.5;

            const nearest = findNearestGridPoint(lat, lng);

            expect(nearest).toBeDefined();
            expect(isInWater(nearest.lat, nearest.lng)).toBe(true);
        });
    });

    describe('findPath', () => {
        beforeAll(() => {
            generateWaterGrid();
        });

        it('should find path between valid water points', () => {
            // Burlington to Plattsburgh
            const result = findPath(44.4759, -73.2121, 44.6995, -73.4529);

            expect(result).toBeDefined();
            expect(result.path).toBeDefined();
            expect(result.distance).toBeGreaterThan(0);
            expect(result.path.length).toBeGreaterThan(1);
        });

        it('should return null for invalid coordinates', () => {
            const result = findPath(NaN, -73.2121, 44.6995, -73.4529);
            expect(result).toBeNull();
        });

        it('should return null for out-of-range coordinates', () => {
            const result = findPath(100, -73.2121, 44.6995, -73.4529);
            expect(result).toBeNull();
        });

        it('should return null for points too far from water', () => {
            // Coordinates in Vermont, far from water
            const result = findPath(44.0, -72.0, 44.1, -72.1);
            expect(result).toBeNull();
        });

        it('should respect MAX_GRID_SEARCH_DISTANCE_KM', () => {
            expect(MAX_GRID_SEARCH_DISTANCE_KM).toBe(5);
        });

        it('should have all path points in water', () => {
            const result = findPath(44.4759, -73.2121, 44.6995, -73.4529);

            if (result) {
                for (const point of result.path) {
                    expect(isInWater(point.lat, point.lng)).toBe(true);
                }
            }
        });
    });

    describe('GRID_CONFIG constants', () => {
        it('should have documented grid step sizes', () => {
            expect(GRID_CONFIG.latStep).toBe(0.00450);
            expect(GRID_CONFIG.lngStep).toBe(0.00600);
        });

        it('should have valid bounds', () => {
            expect(GRID_CONFIG.bounds.south).toBeLessThan(GRID_CONFIG.bounds.north);
            expect(GRID_CONFIG.bounds.west).toBeLessThan(GRID_CONFIG.bounds.east);
        });
    });
});
