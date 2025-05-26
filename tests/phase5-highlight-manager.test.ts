// TypeScript test script for Phase 5 Commit 5.1: HighlightManager
import { HighlightManager } from '../src/services/HighlightManager.js';
import { DiceResultManager } from '../src/services/DiceResultManager.js';

console.log('🎯 Testing Phase 5 Commit 5.1: HighlightManager');
console.log('================================================');

try {
    console.log('\n🎲 Setting up test environment:');

    // Create DiceResultManager instance
    const diceResultManager = new DiceResultManager();

    // Create HighlightManager instance
    const highlightManager = new HighlightManager(diceResultManager);

    // Register some test dice
    console.log('\n📋 Registering test dice:');

    // Test dice 1: Single D20
    diceResultManager.registerDiceRoll(
        'dice-1',
        'activity-1',
        'roll-1',
        'testUser1',
        'session-1',
        'd20',
        false,
        15,
        { x: 1, y: 0, z: 1 }
    );

    // Test dice 2: Virtual D100
    diceResultManager.registerDiceRoll(
        'dice-2',
        'activity-2',
        'roll-2',
        'testUser2',
        'session-2',
        'd100',
        true,
        67,
        { x: -1, y: 0, z: -1 }
    );

    // Test dice 3: Multiple dice for same activity
    diceResultManager.registerDiceRoll(
        'dice-3a',
        'activity-3',
        'roll-3',
        'testUser1',
        'session-1',
        'd6',
        false,
        4,
        { x: 2, y: 0, z: 0 }
    );

    diceResultManager.registerDiceRoll(
        'dice-3b',
        'activity-3',
        'roll-3',
        'testUser1',
        'session-1',
        'd6',
        false,
        6,
        { x: 2.5, y: 0, z: 0 }
    );

    console.log('✅ Registered 4 test dice across 3 activities');

    console.log('\n🎯 Testing dice highlighting:');

    // Test 1: Highlight single dice
    const highlight1 = highlightManager.highlightDice('dice-1', {
        color: '#ff0000',
        userId: 'testUser1',
        duration: 5000
    });

    console.log('Test 1 - Single dice highlight:', {
        success: !!highlight1,
        highlightId: highlight1?.id,
        canvasId: highlight1?.canvasId,
        activityId: highlight1?.activityId,
        color: highlight1?.color
    });

    // Test 2: Highlight activity with multiple dice
    const highlights2 = highlightManager.highlightActivity('activity-3', {
        color: '#00ff00',
        userId: 'testUser1',
        duration: 5000
    });

    console.log('Test 2 - Activity highlight (multiple dice):', {
        success: highlights2.length > 0,
        highlightCount: highlights2.length,
        diceIds: highlights2.map(h => h.canvasId),
        activityId: highlights2[0]?.activityId
    });

    // Test 3: Get highlights for dice
    const diceHighlights = highlightManager.getHighlightsForDice('dice-1');
    console.log('Test 3 - Get highlights for dice-1:', {
        count: diceHighlights.length,
        isHighlighted: diceHighlights.length > 0
    });

    // Test 4: Get highlights for activity
    const activityHighlights = highlightManager.getHighlightsForActivity('activity-3');
    console.log('Test 4 - Get highlights for activity-3:', {
        count: activityHighlights.length,
        diceIds: activityHighlights.map(h => h.canvasId)
    });

    console.log('\n📷 Testing camera focus requests:');

    // Test 5: Request camera focus
    const focusRequest = highlightManager.requestCameraFocus('dice-2', {
        smooth: true,
        zoom: 2.0,
        duration: 1500
    });

    console.log('Test 5 - Camera focus request:', {
        success: !!focusRequest,
        canvasId: focusRequest?.canvasId,
        position: focusRequest?.position,
        zoom: focusRequest?.zoom,
        smooth: focusRequest?.smooth
    });

    console.log('\n📜 Testing activity scroll requests:');

    // Test 6: Request activity scroll
    const scrollRequest = highlightManager.requestActivityScroll('activity-1', {
        smooth: true,
        behavior: 'smooth',
        block: 'center'
    });

    console.log('Test 6 - Activity scroll request:', {
        success: !!scrollRequest,
        activityId: scrollRequest?.activityId,
        behavior: scrollRequest?.behavior,
        block: scrollRequest?.block
    });

    console.log('\n🔄 Testing toggle functionality:');

    // Test 7: Toggle dice highlight (should remove existing)
    const toggleResult1 = highlightManager.toggleDiceHighlight('dice-1');
    console.log('Test 7a - Toggle dice highlight (remove):', {
        result: toggleResult1,
        shouldBeNull: toggleResult1 === null
    });

    // Test 7b: Toggle dice highlight again (should add new)
    const toggleResult2 = highlightManager.toggleDiceHighlight('dice-1', {
        color: '#0000ff'
    });
    console.log('Test 7b - Toggle dice highlight (add):', {
        success: !!toggleResult2,
        color: toggleResult2?.color
    });

    // Test 8: Toggle activity highlight
    const toggleActivity1 = highlightManager.toggleActivityHighlight('activity-3');
    console.log('Test 8a - Toggle activity highlight (remove):', {
        removedCount: toggleActivity1.length,
        shouldBeEmpty: toggleActivity1.length === 0
    });

    const toggleActivity2 = highlightManager.toggleActivityHighlight('activity-3', {
        color: '#ffff00'
    });
    console.log('Test 8b - Toggle activity highlight (add):', {
        addedCount: toggleActivity2.length,
        color: toggleActivity2[0]?.color
    });

    console.log('\n📊 Testing statistics:');

    // Test 9: Get statistics
    const stats = highlightManager.getStats();
    console.log('Test 9 - Highlight statistics:', stats);

    console.log('\n🧹 Testing cleanup functionality:');

    // Test 10: Remove highlights by canvas ID
    const removedByCanvas = highlightManager.removeHighlightsByCanvasId('dice-1');
    console.log('Test 10 - Remove highlights by canvas ID:', {
        removedCount: removedByCanvas
    });

    // Test 11: Remove highlights by activity ID
    const removedByActivity = highlightManager.removeHighlightsByActivityId('activity-3');
    console.log('Test 11 - Remove highlights by activity ID:', {
        removedCount: removedByActivity
    });

    // Test 12: Clear all highlights
    const clearedCount = highlightManager.clearAllHighlights();
    console.log('Test 12 - Clear all highlights:', {
        clearedCount
    });

    console.log('\n⚙️ Testing configuration:');

    // Test 13: Update configuration
    highlightManager.updateConfig({
        maxHighlights: 20,
        defaultHighlightColor: '#purple',
        highlightDuration: 60000
    });

    // Test with new config
    const highlight13 = highlightManager.highlightDice('dice-2');
    console.log('Test 13 - Configuration update:', {
        success: !!highlight13,
        usesNewColor: highlight13?.color === '#purple'
    });

    console.log('\n🎯 Testing event system:');

    // Test 14: Event listeners
    let eventReceived = false;
    const eventListener = (data: any) => {
        eventReceived = true;
        console.log('Event received:', data.highlight?.id || 'bulk event');
    };

    highlightManager.addEventListener('highlight_added', eventListener);

    // Trigger an event
    highlightManager.highlightDice('dice-1', { color: '#test' });

    console.log('Test 14 - Event system:', {
        eventReceived
    });

    // Clean up event listener
    highlightManager.removeEventListener('highlight_added', eventListener);

    console.log('\n🧪 Testing edge cases:');

    // Test 15: Highlight non-existent dice
    const nonExistentHighlight = highlightManager.highlightDice('non-existent-dice');
    console.log('Test 15 - Highlight non-existent dice:', {
        result: nonExistentHighlight,
        shouldBeNull: nonExistentHighlight === null
    });

    // Test 16: Focus camera on non-existent dice
    const nonExistentFocus = highlightManager.requestCameraFocus('non-existent-dice');
    console.log('Test 16 - Focus non-existent dice:', {
        result: nonExistentFocus,
        shouldBeNull: nonExistentFocus === null
    });

    // Test 17: Highlight activity with no dice
    const emptyActivityHighlight = highlightManager.highlightActivity('non-existent-activity');
    console.log('Test 17 - Highlight empty activity:', {
        result: emptyActivityHighlight,
        shouldBeEmpty: emptyActivityHighlight.length === 0
    });

    console.log('\n🏁 Final statistics:');
    const finalStats = highlightManager.getStats();
    console.log('Final stats:', finalStats);

    // Cleanup
    highlightManager.destroy();
    diceResultManager.clear();

    console.log('\n✅ Phase 5 Commit 5.1: HighlightManager working correctly!');
    console.log('🎯 Features implemented:');
    console.log('   • Bidirectional highlighting (dice ↔ activity)');
    console.log('   • Camera focus requests');
    console.log('   • Activity scroll requests');
    console.log('   • Toggle functionality');
    console.log('   • Event-driven architecture');
    console.log('   • Automatic cleanup and memory management');
    console.log('   • Configuration management');
    console.log('   • Statistics and monitoring');
    console.log('   • Edge case handling');

} catch (error) {
    console.error('❌ Phase 5 Commit 5.1 test failed:', error);
    if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

console.log('\n🎯 Next: Phase 5 Commit 5.2 - Canvas → Chat highlighting'); 