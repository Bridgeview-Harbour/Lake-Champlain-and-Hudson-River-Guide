/**
 * Unit Tests for Distance Calculations
 *
 * Tests the Haversine distance formula and unit conversions
 * Run with: npm test (after setting up test runner)
 */

// Import functions from app.js
const {
    calculateDistance,
    convertDistance,
    formatDistance,
    calculateTravelTime,
    formatTime
} = require('../../js/app.js');

const { UNIT_CONVERSIONS } = require('../../js/data.js');

describe('Distance Calculations', () => {
    describe('calculateDistance', () => {
        it('should calculate correct distance between two points', () => {
            // Test case: Burlington, VT to Plattsburgh, NY
            // Expected: ~31 km (19 miles)
            const lat1 = 44.4759;
            const lng1 = -73.2121;
            const lat2 = 44.6995;
            const lng2 = -73.4529;

            const distance = calculateDistance(lat1, lng1, lat2, lng2);

            // Should be close to 31 km (within 1 decimal place)
            expect(distance).toBeCloseTo(31.3, 1);
        });

        it('should return 0 for identical coordinates', () => {
            const lat = 44.4759;
            const lng = -73.2121;

            const distance = calculateDistance(lat, lng, lat, lng);

            expect(distance).toBe(0);
        });

        it('should throw error for invalid coordinates', () => {
            expect(() => {
                calculateDistance(NaN, -73.2121, 44.6995, -73.4529);
            }).toThrow('Invalid coordinates');

            expect(() => {
                calculateDistance(44.4759, -73.2121, 100, -73.4529);
            }).toThrow('Latitude must be between');

            expect(() => {
                calculateDistance(44.4759, -200, 44.6995, -73.4529);
            }).toThrow('Longitude must be between');
        });

        it('should handle negative coordinates correctly', () => {
            // Southern and Eastern hemispheres
            const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
            expect(distance).toBeGreaterThan(0);
        });
    });

    describe('convertDistance', () => {
        it('should convert kilometers to nautical miles', () => {
            const km = 10;
            const nm = convertDistance(km, 'nm');
            expect(nm).toBeCloseTo(5.4, 0.1);
        });

        it('should convert kilometers to statute miles', () => {
            const km = 10;
            const miles = convertDistance(km, 'mi');
            expect(miles).toBeCloseTo(6.21, 0.1);
        });

        it('should return same value for kilometers', () => {
            const km = 10;
            const result = convertDistance(km, 'km');
            expect(result).toBe(10);
        });

        it('should throw error for invalid distance', () => {
            expect(() => {
                convertDistance(-10, 'nm');
            }).toThrow('Distance must be a positive');

            expect(() => {
                convertDistance(NaN, 'nm');
            }).toThrow('Distance must be a positive');
        });

        it('should throw error for unsupported unit', () => {
            expect(() => {
                convertDistance(10, 'invalid');
            }).toThrow('Unsupported unit');
        });
    });

    describe('formatDistance', () => {
        it('should format small distances with 2 decimals', () => {
            const formatted = formatDistance(0.5, 'nm');
            expect(formatted).toBe('0.50 nm');
        });

        it('should format medium distances with 1 decimal', () => {
            const formatted = formatDistance(5.7, 'nm');
            expect(formatted).toBe('5.7 nm');
        });

        it('should round large distances to nearest integer', () => {
            const formatted = formatDistance(42.7, 'nm');
            expect(formatted).toBe('43 nm');
        });
    });

    describe('calculateTravelTime', () => {
        it('should calculate correct travel time', () => {
            const distanceKm = 37; // ~20 nm
            const speed = 10; // 10 knots
            const unit = 'nm';

            const hours = calculateTravelTime(distanceKm, speed, unit);
            expect(hours).toBeCloseTo(2.0, 0.1);
        });

        it('should handle different units correctly', () => {
            const distanceKm = 10;

            const timeNm = calculateTravelTime(distanceKm, 10, 'nm');
            const timeMi = calculateTravelTime(distanceKm, 10, 'mi');

            expect(timeNm).not.toBe(timeMi);
        });
    });

    describe('formatTime', () => {
        it('should format less than 1 minute', () => {
            const formatted = formatTime(0.01);
            expect(formatted).toBe('< 1 min');
        });

        it('should format hours and minutes', () => {
            const formatted = formatTime(2.5);
            expect(formatted).toContain('2h');
            expect(formatted).toContain('30m');
        });

        it('should format minutes only', () => {
            const formatted = formatTime(0.5);
            expect(formatted).toBe('30 min');
        });
    });
});
