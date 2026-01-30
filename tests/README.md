# Test Suite

This directory contains unit and integration tests for the Lake Champlain & Hudson River Boater's Guide.

## Directory Structure

```
tests/
├── unit/                    # Unit tests for individual functions
│   ├── calculations.test.js # Distance and time calculations
│   ├── navigation.test.js   # Pathfinding and water grid
│   └── data.test.js        # POI data validation
├── integration/             # Integration tests (future)
└── README.md               # This file
```

## Running Tests

### Setup Test Runner

First, install a test runner. We recommend Jest:

```bash
npm init -y
npm install --save-dev jest
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
  }
}
```

### Create Test Setup

Create `tests/setup.js`:
```javascript
// Mock browser globals if needed
global.performance = {
    now: () => Date.now()
};

// Load application files
// You may need to refactor app.js to export functions for testing
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test calculations.test.js
```

## Writing Tests

### Test Structure

Tests use Jest syntax:

```javascript
describe('Feature Name', () => {
    it('should do something', () => {
        const result = functionToTest(input);
        expect(result).toBe(expectedOutput);
    });
});
```

### Common Matchers

```javascript
expect(value).toBe(expected);              // Strict equality
expect(value).toEqual(expected);           // Deep equality
expect(value).toBeCloseTo(expected, 2);    // Floating point ~equality
expect(value).toBeDefined();
expect(value).toBeNull();
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(array).toContain(item);
expect(() => fn()).toThrow('Error message');
expect(object).toHaveProperty('key');
```

### Setup and Teardown

```javascript
beforeAll(() => {
    // Runs once before all tests in this describe block
});

beforeEach(() => {
    // Runs before each test
});

afterEach(() => {
    // Runs after each test
});

afterAll(() => {
    // Runs once after all tests
});
```

## Test Coverage

Aim for:
- **80%+ code coverage** overall
- **100% coverage** for critical functions:
  - Distance calculations
  - Coordinate validation
  - Pathfinding algorithm
  - Unit conversions

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## Current Status

**⚠️ Tests Not Yet Configured**

The test files are written but not yet executable. To enable testing:

1. Install Jest: `npm install --save-dev jest`
2. Create `tests/setup.js` to load application code
3. Refactor application code to export testable functions
4. Run tests: `npm test`

## Refactoring for Testability

Current application code uses IIFE pattern which makes testing difficult. Consider:

1. **Module Pattern**: Export functions from `app.js`, `navigation.js`, `data.js`
2. **Browser Detection**: Use conditional exports:
   ```javascript
   if (typeof module !== 'undefined' && module.exports) {
       module.exports = { calculateDistance, convertDistance, ... };
   }
   ```

3. **Dependency Injection**: Pass dependencies as parameters:
   ```javascript
   function initMap(leaflet, config) {
       // Uses passed Leaflet instead of global L
   }
   ```

## Future Tests

- **Integration tests**: Full user workflows
- **E2E tests**: Browser automation with Playwright or Cypress
- **Performance tests**: Pathfinding with large grids
- **Visual regression tests**: UI screenshot comparison

## Questions?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
