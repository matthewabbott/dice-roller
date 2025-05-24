#!/usr/bin/env node

/**
 * Test runner for D6 dice implementation
 * Validates that our first concrete dice type works correctly
 */

import { validateD6Implementation } from './d6-validation';

async function main() {
    console.log('🎲 D6 Dice Implementation Test\n');
    console.log('This will test our first concrete dice implementation:');
    console.log('- D6 geometry definition and validation');
    console.log('- DiceD6 class functionality');
    console.log('- Physics integration');
    console.log('- Value calculation and positioning\n');

    try {
        const success = validateD6Implementation();

        if (success) {
            console.log('\n🎉 D6 implementation is working perfectly!');
            console.log('Ready to integrate with DiceCanvas or implement more dice types.');
            process.exit(0);
        } else {
            console.log('\n💥 D6 implementation has issues. Check the errors above.');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n🚨 D6 validation crashed:', error);
        process.exit(1);
    }
}

// Run the D6 tests
main(); 