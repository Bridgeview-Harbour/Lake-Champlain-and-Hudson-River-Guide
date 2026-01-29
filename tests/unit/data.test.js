/**
 * Unit Tests for Data Validation
 *
 * Tests POI data structure and validation
 * Run with: npm test (after setting up test runner)
 */

describe('Data Validation', () => {
    describe('POINTS_OF_INTEREST array', () => {
        it('should have POI data loaded', () => {
            expect(POINTS_OF_INTEREST).toBeDefined();
            expect(Array.isArray(POINTS_OF_INTEREST)).toBe(true);
            expect(POINTS_OF_INTEREST.length).toBeGreaterThan(0);
        });

        it('should have at least 200 POIs', () => {
            expect(POINTS_OF_INTEREST.length).toBeGreaterThanOrEqual(200);
        });
    });

    describe('POI Structure', () => {
        let samplePOI;

        beforeAll(() => {
            // Use Bridgeview Harbour Marina as sample
            samplePOI = POINTS_OF_INTEREST.find(poi => poi.id === 'marina-bridgeview-harbour');
        });

        it('should have required fields', () => {
            expect(samplePOI).toBeDefined();
            expect(samplePOI).toHaveProperty('id');
            expect(samplePOI).toHaveProperty('name');
            expect(samplePOI).toHaveProperty('category');
            expect(samplePOI).toHaveProperty('location');
        });

        it('should have valid coordinates', () => {
            const coords = samplePOI.location.coordinates;

            expect(coords).toHaveProperty('latitude');
            expect(coords).toHaveProperty('longitude');
            expect(typeof coords.latitude).toBe('number');
            expect(typeof coords.longitude).toBe('number');
            expect(coords.latitude).toBeGreaterThanOrEqual(-90);
            expect(coords.latitude).toBeLessThanOrEqual(90);
            expect(coords.longitude).toBeGreaterThanOrEqual(-180);
            expect(coords.longitude).toBeLessThanOrEqual(180);
        });

        it('should have valid category', () => {
            const validCategories = [
                'marina', 'dining', 'poi', 'bay', 'lock', 'bridge',
                'aton', 'boat-launch', 'campground', 'hotel', 'beach',
                'ferry', 'island', 'public-dock'
            ];

            expect(validCategories).toContain(samplePOI.category);
        });
    });

    describe('All POIs Validation', () => {
        it('should have unique IDs', () => {
            const ids = POINTS_OF_INTEREST.map(poi => poi.id);
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should have all POIs with valid coordinates', () => {
            for (const poi of POINTS_OF_INTEREST) {
                const coords = poi.location.coordinates;

                expect(coords.latitude).toBeGreaterThanOrEqual(40);
                expect(coords.latitude).toBeLessThanOrEqual(46);
                expect(coords.longitude).toBeGreaterThanOrEqual(-75);
                expect(coords.longitude).toBeLessThanOrEqual(-71);
            }
        });

        it('should have all POIs with non-empty names', () => {
            for (const poi of POINTS_OF_INTEREST) {
                expect(poi.name).toBeTruthy();
                expect(poi.name.length).toBeGreaterThan(0);
            }
        });
    });

    describe('UNIT_CONVERSIONS', () => {
        it('should have nautical mile conversion', () => {
            expect(UNIT_CONVERSIONS.nm).toBeDefined();
            expect(UNIT_CONVERSIONS.nm.factor).toBeCloseTo(0.539957, 0.00001);
            expect(UNIT_CONVERSIONS.nm.label).toBe('nm');
            expect(UNIT_CONVERSIONS.nm.speedLabel).toBe('kts');
        });

        it('should have statute mile conversion', () => {
            expect(UNIT_CONVERSIONS.mi).toBeDefined();
            expect(UNIT_CONVERSIONS.mi.factor).toBeCloseTo(0.621371, 0.00001);
        });

        it('should have kilometer conversion', () => {
            expect(UNIT_CONVERSIONS.km).toBeDefined();
            expect(UNIT_CONVERSIONS.km.factor).toBe(1.0);
        });
    });

    describe('TYPE_CONFIG', () => {
        it('should have configuration for all categories', () => {
            const categories = ['marina', 'restaurant', 'historic', 'bay', 'fuel', 'anchorage'];

            for (const category of categories) {
                expect(TYPE_CONFIG[category]).toBeDefined();
                expect(TYPE_CONFIG[category]).toHaveProperty('icon');
                expect(TYPE_CONFIG[category]).toHaveProperty('color');
            }
        });

        it('should have valid color values', () => {
            for (const [type, config] of Object.entries(TYPE_CONFIG)) {
                expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
            }
        });
    });

    describe('MAP_CENTER', () => {
        it('should be defined and in Lake Champlain region', () => {
            expect(MAP_CENTER).toBeDefined();
            expect(MAP_CENTER.lat).toBeGreaterThan(43);
            expect(MAP_CENTER.lat).toBeLessThan(46);
            expect(MAP_CENTER.lng).toBeGreaterThan(-74);
            expect(MAP_CENTER.lng).toBeLessThan(-72);
        });
    });
});
