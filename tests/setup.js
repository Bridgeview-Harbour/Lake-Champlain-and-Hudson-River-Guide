/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

// Mock Leaflet (L) global
global.L = {
    icon: jest.fn(() => ({})),
    map: jest.fn(() => ({
        setView: jest.fn(),
        addLayer: jest.fn(),
        on: jest.fn()
    })),
    tileLayer: jest.fn(() => ({
        addTo: jest.fn()
    })),
    marker: jest.fn(() => ({
        addTo: jest.fn(),
        bindPopup: jest.fn(),
        on: jest.fn()
    })),
    polyline: jest.fn(() => ({
        addTo: jest.fn()
    })),
    layerGroup: jest.fn(() => ({
        addTo: jest.fn(),
        clearLayers: jest.fn()
    }))
};

// Mock browser globals that might be missing in Node.js environment
global.performance = global.performance || {
    now: () => Date.now()
};

// Mock console methods (keep errors and warnings for debugging)
global.console = {
    ...console,
    // Optionally suppress console.log in tests (uncomment to enable)
    log: jest.fn(),

    // Keep error and warn for debugging
    error: console.error,
    warn: console.warn
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock document.readyState for tests
Object.defineProperty(global.document, 'readyState', {
    writable: true,
    value: 'complete'
});

// Add global test helpers
global.testHelpers = {
    /**
     * Helper to create a mock POI
     */
    createMockPOI: (overrides = {}) => ({
        id: 'test-poi',
        name: 'Test Location',
        category: 'marina',
        location: {
            coordinates: {
                latitude: 44.5,
                longitude: -73.3
            }
        },
        ...overrides
    }),

    /**
     * Helper to create coordinates
     */
    createCoords: (lat, lng) => ({
        latitude: lat,
        longitude: lng
    }),

    /**
     * Suppress console warnings during a test
     */
    suppressConsoleWarnings: () => {
        const originalWarn = console.warn;
        beforeAll(() => {
            console.warn = jest.fn();
        });
        afterAll(() => {
            console.warn = originalWarn;
        });
    }
};

// Reset mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
});
