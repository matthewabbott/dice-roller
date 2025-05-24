/**
 * Example usage of DiceD4 implementation
 * This file demonstrates how to create and use D4 dice in your application
 */

import * as CANNON from 'cannon-es';
import { DiceManager } from '../DiceManager';
import { DiceD4 } from '../dice/DiceD4';

/**
 * Example: Basic D4 usage
 */
export function exampleBasicD4Usage() {
    console.log('=== Basic D4 Usage Example ===');

    // 1. Initialize physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    // 2. Initialize DiceManager
    DiceManager.setWorld({
        broadphase: 'naive',
        solverIterations: 10
    });

    // 3. Create a D4 dice with default options
    const d4 = new DiceD4();

    console.log('D4 Properties:');
    console.log('- Type:', d4.diceType);
    console.log('- Values:', d4.values);
    console.log('- Range:', d4.minValue, 'to', d4.maxValue);
    console.log('- Mass:', d4.body.mass, 'kg');

    return d4;
}

/**
 * Example: D4 with custom appearance
 */
export function exampleCustomD4() {
    console.log('=== Custom D4 Example ===');

    // Create D4 with custom colors and size
    const customD4 = new DiceD4({
        size: 75,           // Smaller than default (100)
        fontColor: '#ff4444', // Red text
        backColor: '#ffffff'  // White background
    });

    console.log('Custom D4 created with:');
    console.log('- Size:', customD4.options.size);
    console.log('- Font Color:', customD4.options.fontColor);
    console.log('- Background Color:', customD4.options.backColor);

    return customD4;
}

/**
 * Example: Multiple D4 dice for complex rolls
 */
export function exampleMultipleD4() {
    console.log('=== Multiple D4 Example ===');

    // Create multiple D4 dice for "3d4" roll
    const dice = DiceD4.createMultiple(3, {
        size: 80,
        fontColor: '#0066cc',
        backColor: '#f0f8ff'
    });

    console.log(`Created ${dice.length} D4 dice for 3d4 roll`);

    // Throw all dice
    dice.forEach((die, index) => {
        die.throwDice(1.0); // Normal throw force
        console.log(`D4 #${index + 1} thrown`);
    });

    return dice;
}

/**
 * Example: Setting specific D4 values (for testing)
 */
export function exampleSetD4Values() {
    console.log('=== Set D4 Values Example ===');

    const d4 = new DiceD4();

    // Test setting each possible value
    for (let value = 1; value <= 4; value++) {
        d4.shiftUpperValue(value);
        const currentValue = d4.getUpperValue();

        console.log(`Set to ${value}, reads as ${currentValue} - ${currentValue === value ? 'SUCCESS' : 'FAILED'}`);
    }

    return d4;
}

/**
 * Example: D4 physics simulation
 */
export function exampleD4Physics() {
    console.log('=== D4 Physics Example ===');

    const d4 = new DiceD4();

    // Position above the "table"
    d4.setPosition({ x: 0, y: 5, z: 0 } as any);

    // Throw with custom force and position
    const customPosition = { x: -1, y: 4, z: 1 };
    d4.throwDice(1.5, customPosition as any); // Stronger throw

    console.log('D4 thrown with:');
    console.log('- Force multiplier: 1.5');
    console.log('- Starting position:', customPosition);
    console.log('- Simulation running:', d4.simulationRunning);

    // Check physics state
    const vectors = d4.getCurrentVectors();
    console.log('Initial velocities:');
    console.log('- Linear:', vectors.velocity.length().toFixed(3));
    console.log('- Angular:', vectors.angularVelocity.length().toFixed(3));

    return d4;
}

/**
 * Example: D4 special characteristics
 */
export function exampleD4Characteristics() {
    console.log('=== D4 Characteristics Example ===');

    const d4 = new DiceD4();

    console.log('D4 Special Features:');
    console.log('- Inverted reading: true (reads from bottom face)');
    console.log('- Shape: Tetrahedron (4 triangular faces)');
    console.log('- Physics: ConvexPolyhedron shape');
    console.log('- Throw style: Gentler than D6 (default force: 0.8)');
    console.log('- Edge sharpness: Minimal chamfer (0.05)');

    // Demonstrate the inverted reading by checking normals
    console.log('\nFace Normal Information:');
    console.log('- D4 finds the face pointing DOWN to determine value');
    console.log('- Unlike D6 which finds the face pointing UP');
    console.log('- This matches real D4 dice behavior');

    return d4;
}

/**
 * Main example runner
 */
export function runAllD4Examples() {
    console.log('🎲 Running all D4 Examples 🎲\n');

    try {
        exampleBasicD4Usage();
        console.log('\n---\n');

        exampleCustomD4();
        console.log('\n---\n');

        exampleMultipleD4();
        console.log('\n---\n');

        exampleSetD4Values();
        console.log('\n---\n');

        exampleD4Physics();
        console.log('\n---\n');

        exampleD4Characteristics();

        console.log('\n✅ All D4 examples completed successfully!');

    } catch (error) {
        console.error('❌ Error running D4 examples:', error);
    } finally {
        // Clean up
        DiceManager.dispose();
    }
} 