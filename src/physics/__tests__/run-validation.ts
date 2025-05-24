#!/usr/bin/env node

/**
 * Test runner for physics foundation validation
 * Run this to verify our physics system is working correctly
 */

import { validatePhysicsFoundation } from './foundation-validation';

async function main() {
    console.log('🎯 Dice Physics Foundation Validation\n');
    console.log('This will test the core physics components we\'ve built:');
    console.log('- DiceManager (world, materials, simulation)');
    console.log('- PhysicsUtils (conversions, shape creation)');
    console.log('- Basic physics world functionality\n');

    try {
        const success = validatePhysicsFoundation();

        if (success) {
            console.log('\n✨ Foundation validation complete! Physics system is ready.');
            process.exit(0);
        } else {
            console.log('\n💥 Foundation validation failed. Check the errors above.');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n🚨 Validation crashed:', error);
        process.exit(1);
    }
}

// Run the validation directly
main(); 