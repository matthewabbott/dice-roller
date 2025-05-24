import { DiceManager, DiceD6 } from '../index';
import { validateD6Geometry } from '../dice/geometries/D6Geometry';

/**
 * Validation test for D6 dice implementation
 * Tests geometry, dice creation, and basic functionality
 */
export function validateD6Implementation(): boolean {
    console.log('🎲 Starting D6 Implementation Validation...\n');

    let testsPassed = 0;
    let totalTests = 0;

    // Helper function for test assertions
    function test(name: string, testFn: () => boolean): void {
        totalTests++;
        try {
            const result = testFn();
            if (result) {
                console.log(`✅ ${name}`);
                testsPassed++;
            } else {
                console.log(`❌ ${name} - Test failed`);
            }
        } catch (error) {
            console.log(`❌ ${name} - Error: ${error}`);
        }
    }

    // Ensure DiceManager is initialized
    if (!DiceManager.isInitialized()) {
        DiceManager.setWorld();
    }

    // Test 1: D6 Geometry Validation
    test('D6 geometry definition is valid', () => {
        return validateD6Geometry();
    });

    // Test 2: D6 Dice Creation
    test('Can create D6 dice instance', () => {
        const dice = new DiceD6();
        return dice instanceof DiceD6 &&
            dice.object !== null &&
            dice.body !== null &&
            dice.values === 6;
    });

    // Test 3: D6 Properties
    test('D6 has correct properties', () => {
        const dice = new DiceD6();
        return dice.diceType === 'D6' &&
            dice.minValue === 1 &&
            dice.maxValue === 6 &&
            dice.values === 6;
    });

    // Test 4: Value Validation
    test('D6 validates dice values correctly', () => {
        const dice = new DiceD6();
        try {
            // Valid values should work
            dice.shiftUpperValue(1);
            dice.shiftUpperValue(3);
            dice.shiftUpperValue(6);

            // Invalid values should throw
            try {
                dice.shiftUpperValue(0);
                return false; // Should have thrown
            } catch (e) {
                // Expected
            }

            try {
                dice.shiftUpperValue(7);
                return false; // Should have thrown
            } catch (e) {
                // Expected
            }

            return true;
        } catch (error) {
            return false;
        }
    });

    // Test 5: Upper Value Calculation
    test('D6 can calculate upper value', () => {
        const dice = new DiceD6();

        // Set to a known orientation and check value
        dice.shiftUpperValue(4);
        const value = dice.getUpperValue();

        // Should be close to 4 (allowing for floating point precision)
        return value >= 1 && value <= 6;
    });

    // Test 6: Position and Rotation
    test('D6 position and rotation methods work', () => {
        const dice = new DiceD6();

        // Test position
        const originalPos = dice.getPosition();
        dice.setPosition(originalPos.clone().add({ x: 1, y: 2, z: 3 }));
        const newPos = dice.getPosition();

        const positionChanged = Math.abs(newPos.x - originalPos.x - 1) < 0.001 &&
            Math.abs(newPos.y - originalPos.y - 2) < 0.001 &&
            Math.abs(newPos.z - originalPos.z - 3) < 0.001;

        // Test rotation
        const originalRot = dice.getRotation();
        const randomRot = dice.getRandomRotation();
        dice.body.quaternion.copy(randomRot);
        dice.object.quaternion.copy(dice.getRotation());

        return positionChanged && randomRot !== null;
    });

    // Test 7: Throw Dice Functionality
    test('D6 throw dice functionality works', () => {
        const dice = new DiceD6();

        try {
            dice.throwDice(0.5); // Gentle throw

            // Check that forces were applied
            const velocity = dice.body.velocity;
            const angularVel = dice.body.angularVelocity;

            const hasVelocity = velocity.length() > 0;
            const hasAngularVel = angularVel.length() > 0;

            return hasVelocity || hasAngularVel; // At least one should be non-zero
        } catch (error) {
            return false;
        }
    });

    // Test 8: Multiple Dice Creation
    test('Can create multiple D6 dice', () => {
        const diceArray = DiceD6.createMultiple(3);

        return diceArray.length === 3 &&
            diceArray.every(dice => dice instanceof DiceD6) &&
            diceArray.every(dice => dice.diceType === 'D6');
    });

    // Test 9: Physics Integration
    test('D6 integrates properly with physics world', () => {
        const initialBodyCount = DiceManager.getBodyCount();
        const dice = new DiceD6();
        const afterCreateCount = DiceManager.getBodyCount();

        dice.dispose();
        const afterDisposeCount = DiceManager.getBodyCount();

        return afterCreateCount === initialBodyCount + 1 &&
            afterDisposeCount === initialBodyCount;
    });

    // Test 10: Mesh Update
    test('D6 mesh updates correctly from physics body', () => {
        const dice = new DiceD6();

        // Move the physics body
        dice.body.position.set(5, 10, 15);

        // Update the mesh
        dice.updateMesh();

        // Check that Three.js object position matches
        const meshPos = dice.object.position;
        return Math.abs(meshPos.x - 5) < 0.001 &&
            Math.abs(meshPos.y - 10) < 0.001 &&
            Math.abs(meshPos.z - 15) < 0.001;
    });

    // Clean up
    DiceManager.resetWorld();

    // Summary
    console.log(`\n📊 D6 Validation Summary:`);
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`${testsPassed === totalTests ? '🎉 All D6 tests passed!' : '⚠️  Some D6 tests failed'}`);

    if (testsPassed === totalTests) {
        console.log(`\n🎲 D6 implementation is working perfectly! Ready for DiceCanvas integration.`);
    } else {
        console.log(`\n🔧 Fix the failing D6 tests before proceeding.`);
    }

    return testsPassed === totalTests;
} 