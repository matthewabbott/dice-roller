import type { RollResult, MultiRollResult } from '../dice/DiceRollingService';

export interface CanvasEvent {
    type: string;
    timestamp: number;
    data: any;
}

export interface DiceRollEvent extends CanvasEvent {
    type: 'dice_roll';
    data: {
        rollResult: MultiRollResult;
        playerId: string;
        playerName: string;
    };
}

export interface DiceSpawnEvent extends CanvasEvent {
    type: 'dice_spawn';
    data: {
        diceType: string;
        position: { x: number; y: number; z: number };
        playerId: string;
    };
}

export interface DiceClearEvent extends CanvasEvent {
    type: 'dice_clear';
    data: {
        playerId: string;
    };
}

export type CanvasEventType = DiceRollEvent | DiceSpawnEvent | DiceClearEvent;

/**
 * Service for handling canvas event broadcasting and synchronization
 * Extracted from sync hooks for better testability and separation of concerns
 */
export class CanvasEventService {
    private eventListeners: Map<string, ((event: CanvasEventType) => void)[]> = new Map();

    /**
     * Broadcast a dice roll event to all connected players
     */
    public broadcastDiceRoll(rollResult: MultiRollResult, playerId: string, playerName: string): void {
        // TODO: Implementation will be moved from sync hooks
        throw new Error('CanvasEventService.broadcastDiceRoll not yet implemented');
    }

    /**
     * Broadcast a dice spawn event to all connected players
     */
    public broadcastDiceSpawn(diceType: string, position: { x: number; y: number; z: number }, playerId: string): void {
        // TODO: Implementation will be moved from sync hooks
        throw new Error('CanvasEventService.broadcastDiceSpawn not yet implemented');
    }

    /**
     * Broadcast a dice clear event to all connected players
     */
    public broadcastDiceClear(playerId: string): void {
        // TODO: Implementation will be moved from sync hooks
        throw new Error('CanvasEventService.broadcastDiceClear not yet implemented');
    }

    /**
     * Subscribe to canvas events
     */
    public addEventListener(eventType: string, callback: (event: CanvasEventType) => void): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType)!.push(callback);
    }

    /**
     * Unsubscribe from canvas events
     */
    public removeEventListener(eventType: string, callback: (event: CanvasEventType) => void): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit an event to all listeners
     */
    private emitEvent(event: CanvasEventType): void {
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            listeners.forEach(callback => callback(event));
        }
    }
} 