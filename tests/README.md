# Tests

This directory contains all test files for the dice-roller project.

## Running Tests

### Run All Tests
```bash
npm test
# or
npm run test
```

### Run Specific Phase Tests
```bash
# Phase 1: RollProcessor tests
npm run test:phase1

# Individual test files
npx tsx tests/phase1-rollprocessor.test.ts
```

## Test Files

### `phase1-rollprocessor.test.ts`
Tests the unified roll processing system including:
- **Standard dice expressions** (2d6, d20, 10d6)
- **Virtual dice handling** (1000d20, 1d100, 11d6)
- **Canvas positioning** (3D coordinates, grid layout)
- **Edge cases** (invalid expressions, zero dice)
- **Configuration validation**

### `run-tests.ts`
Test runner that automatically discovers and runs all `*.test.ts` files in the tests directory.

## Test Structure

Each test file should:
1. Import required modules with correct relative paths
2. Use descriptive console output with emojis for readability
3. Test both success and failure cases
4. Provide clear error reporting
5. Follow the naming convention: `{feature}.test.ts`

## Adding New Tests

1. Create a new file following the pattern: `{feature}.test.ts`
2. Import modules using relative paths: `../src/...`
3. Add ESM extensions to imports: `.js` for TypeScript files
4. The test runner will automatically discover and run your test

## Example Test Structure

```typescript
// Import with correct path and extension
import { MyService } from '../src/services/MyService.js';

console.log('🧪 Testing MyService');
console.log('===================');

try {
    const service = new MyService();
    
    // Test cases here
    console.log('✅ All tests passed!');
} catch (error) {
    console.error('❌ Test failed:', error);
}
``` 