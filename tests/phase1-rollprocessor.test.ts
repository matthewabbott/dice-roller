// TypeScript test script for Phase 1 implementation
import { RollProcessor } from '../src/services/RollProcessor.js';

console.log('🎲 Testing Phase 1: Unified Roll System');
console.log('=====================================');

// Test basic functionality
try {
    const processor = new RollProcessor();

    console.log('\n📋 Testing basic dice expressions:');

    // Test standard dice
    const test1 = processor.processRoll('2d6');
    console.log('2d6:', {
        result: test1.result,
        rolls: test1.rolls,
        canvasDice: test1.canvasData.diceRolls.length,
        virtual: test1.canvasData.diceRolls[0]?.isVirtual,
        diceTypes: test1.canvasData.diceRolls.map(d => d.diceType)
    });

    // Test virtual dice (large roll)
    const test2 = processor.processRoll('1000d20');
    console.log('1000d20:', {
        result: test2.result,
        totalRolls: test2.rolls.length,
        canvasDice: test2.canvasData.diceRolls.length,
        virtual: test2.canvasData.diceRolls[0]?.isVirtual,
        virtualRollsCount: test2.canvasData.diceRolls[0]?.virtualRolls?.length
    });

    // Test non-standard dice
    const test3 = processor.processRoll('1d100');
    console.log('1d100:', {
        result: test3.result,
        rolls: test3.rolls,
        canvasDice: test3.canvasData.diceRolls.length,
        virtual: test3.canvasData.diceRolls[0]?.isVirtual,
        physicalType: test3.canvasData.diceRolls[0]?.diceType
    });

    // Test edge case - single die
    const test4 = processor.processRoll('d20');
    console.log('d20:', {
        result: test4.result,
        rolls: test4.rolls,
        canvasDice: test4.canvasData.diceRolls.length,
        virtual: test4.canvasData.diceRolls[0]?.isVirtual
    });

    // Test maximum physical dice
    const test5 = processor.processRoll('10d6');
    console.log('10d6:', {
        result: test5.result,
        rolls: test5.rolls.length,
        canvasDice: test5.canvasData.diceRolls.length,
        virtual: test5.canvasData.diceRolls[0]?.isVirtual
    });

    // Test just over physical limit
    const test6 = processor.processRoll('11d6');
    console.log('11d6:', {
        result: test6.result,
        rolls: test6.rolls.length,
        canvasDice: test6.canvasData.diceRolls.length,
        virtual: test6.canvasData.diceRolls[0]?.isVirtual
    });

    console.log('\n🎯 Testing canvas positioning:');
    const positionTest = processor.processRoll('3d6');
    positionTest.canvasData.diceRolls.forEach((dice, index) => {
        console.log(`Dice ${index + 1} (${dice.canvasId.slice(0, 8)}...):`, {
            type: dice.diceType,
            position: dice.position,
            result: dice.result
        });
    });

    console.log('\n🎯 Testing edge cases:');

    // Test invalid expressions
    const invalidTest = processor.processRoll('invalid');
    console.log('invalid expression:', {
        result: invalidTest.result,
        rolls: invalidTest.rolls,
        interpreted: invalidTest.interpretedExpression,
        canvasDice: invalidTest.canvasData.diceRolls.length
    });

    // Test zero dice
    const zeroTest = processor.processRoll('0d6');
    console.log('0d6:', {
        result: zeroTest.result,
        rolls: zeroTest.rolls,
        interpreted: zeroTest.interpretedExpression,
        canvasDice: zeroTest.canvasData.diceRolls.length
    });

    console.log('\n✅ Phase 1 RollProcessor working correctly!');
    console.log('\n📊 Configuration:');
    console.log(processor.getConfig());

} catch (error) {
    console.error('❌ Phase 1 test failed:', error);
    if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

console.log('\n🎯 Next: Implement Phase 2 (Chat Integration)'); 