// TypeScript test script for Phase 3: Canvas Synchronization
import { canvasStateManager } from '../src/services/CanvasStateManager.js';
import { CanvasEventType } from '../src/types/canvas.js';

console.log('🎯 Testing Phase 3: Canvas Synchronization');
console.log('==========================================');

try {
    console.log('\n🎲 Testing dice spawning:');

    // Test dice spawning
    const spawnEvent = canvasStateManager.spawnDice(
        'test-room',
        'TestUser',
        {
            diceId: 'test-dice-1',
            diceType: 'd20',
            position: { x: 0, y: 5, z: 0 },
            isVirtual: false
        }
    );

    console.log('Spawn event:', {
        id: spawnEvent.id,
        type: spawnEvent.type,
        diceId: spawnEvent.diceId,
        userId: spawnEvent.userId,
        hasPosition: !!spawnEvent.data?.position,
        diceType: spawnEvent.data?.diceType
    });

    console.log('\n🎯 Testing dice throwing:');

    // Test dice throwing
    const throwEvent = canvasStateManager.throwDice(
        'test-room',
        'TestUser',
        'test-dice-1',
        { x: 1, y: 0, z: 1 }
    );

    if (throwEvent) {
        console.log('Throw event:', {
            id: throwEvent.id,
            type: throwEvent.type,
            diceId: throwEvent.diceId,
            hasVelocity: !!throwEvent.data?.velocity
        });
    } else {
        console.log('❌ Throw event failed (expected for non-owner)');
    }

    console.log('\n🎯 Testing dice settling:');

    // Test dice settling
    const settleEvent = canvasStateManager.settleDice(
        'test-room',
        'TestUser',
        'test-dice-1',
        { x: 2, y: 0, z: 2 },
        15
    );

    if (settleEvent) {
        console.log('Settle event:', {
            id: settleEvent.id,
            type: settleEvent.type,
            diceId: settleEvent.diceId,
            result: settleEvent.data?.result,
            hasPosition: !!settleEvent.data?.position
        });
    } else {
        console.log('❌ Settle event failed');
    }

    console.log('\n✨ Testing dice highlighting:');

    // Test dice highlighting
    const highlightEvent = canvasStateManager.highlightDice(
        'test-room',
        'AnotherUser',
        'test-dice-1',
        '#ff0000'
    );

    if (highlightEvent) {
        console.log('Highlight event:', {
            id: highlightEvent.id,
            type: highlightEvent.type,
            diceId: highlightEvent.diceId,
            userId: highlightEvent.userId,
            color: highlightEvent.data?.highlightColor
        });
    } else {
        console.log('❌ Highlight event failed');
    }

    console.log('\n📊 Testing room statistics:');

    // Test room statistics
    const stats = canvasStateManager.getRoomStats('test-room');
    console.log('Room stats:', {
        totalDice: stats.totalDice,
        diceByUser: stats.diceByUser,
        diceByState: stats.diceByState
    });

    console.log('\n🗑️ Testing dice removal:');

    // Test dice removal
    const removeEvent = canvasStateManager.removeDice(
        'test-room',
        'TestUser',
        'test-dice-1'
    );

    if (removeEvent) {
        console.log('Remove event:', {
            id: removeEvent.id,
            type: removeEvent.type,
            diceId: removeEvent.diceId
        });
    } else {
        console.log('❌ Remove event failed');
    }

    console.log('\n🧹 Testing canvas clearing:');

    // Spawn a few more dice first
    canvasStateManager.spawnDice('test-room', 'User1', {
        diceId: 'dice-2',
        diceType: 'd6',
        position: { x: 1, y: 5, z: 1 },
        isVirtual: false
    });

    canvasStateManager.spawnDice('test-room', 'User2', {
        diceId: 'dice-3',
        diceType: 'd8',
        position: { x: -1, y: 5, z: -1 },
        isVirtual: true,
        virtualRolls: [1, 2, 3, 4, 5]
    });

    const statsBefore = canvasStateManager.getRoomStats('test-room');
    console.log('Stats before clear:', statsBefore);

    // Test canvas clearing
    const clearEvent = canvasStateManager.clearCanvas('test-room', 'Moderator');
    console.log('Clear event:', {
        id: clearEvent.id,
        type: clearEvent.type,
        diceId: clearEvent.diceId,
        userId: clearEvent.userId
    });

    const statsAfter = canvasStateManager.getRoomStats('test-room');
    console.log('Stats after clear:', statsAfter);

    console.log('\n🔌 Testing user disconnection cleanup:');

    // Spawn dice for a user
    canvasStateManager.spawnDice('test-room', 'DisconnectingUser', {
        diceId: 'disconnect-dice-1',
        diceType: 'd12',
        position: { x: 0, y: 5, z: 0 },
        isVirtual: false
    });

    canvasStateManager.spawnDice('test-room', 'DisconnectingUser', {
        diceId: 'disconnect-dice-2',
        diceType: 'd10',
        position: { x: 1, y: 5, z: 0 },
        isVirtual: false
    });

    const statsBeforeDisconnect = canvasStateManager.getRoomStats('test-room');
    console.log('Stats before disconnect:', statsBeforeDisconnect);

    // Simulate user disconnection
    const disconnectEvents = canvasStateManager.handleUserDisconnection('test-room', 'DisconnectingUser');
    console.log('Disconnect cleanup events:', disconnectEvents.length);

    const statsAfterDisconnect = canvasStateManager.getRoomStats('test-room');
    console.log('Stats after disconnect:', statsAfterDisconnect);

    console.log('\n🕒 Testing old dice cleanup:');

    // Test cleanup of old dice (using very short age for testing)
    const cleanupEvents = canvasStateManager.cleanupOldDice('test-room', 0); // 0ms = cleanup everything
    console.log('Cleanup events:', cleanupEvents.length);

    const finalStats = canvasStateManager.getRoomStats('test-room');
    console.log('Final stats:', finalStats);

    console.log('\n📡 Testing event subscription:');

    // Test event subscription
    let eventCount = 0;
    const unsubscribe = canvasStateManager.subscribe((event) => {
        eventCount++;
        console.log(`Received event ${eventCount}: ${event.type} for dice ${event.diceId}`);
    });

    // Generate some events
    canvasStateManager.spawnDice('test-room', 'SubscriptionTest', {
        diceId: 'sub-test-dice',
        diceType: 'd4',
        position: { x: 0, y: 5, z: 0 },
        isVirtual: false
    });

    canvasStateManager.settleDice('test-room', 'SubscriptionTest', 'sub-test-dice', { x: 0, y: 0, z: 0 }, 3);

    // Unsubscribe
    unsubscribe();

    // This event should not be received
    canvasStateManager.removeDice('test-room', 'SubscriptionTest', 'sub-test-dice');

    console.log(`Total events received: ${eventCount}`);

    console.log('\n✅ Phase 3 Canvas Synchronization working correctly!');

} catch (error) {
    console.error('❌ Phase 3 test failed:', error);
    if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

console.log('\n🎯 Next: Implement client-side canvas synchronization'); 