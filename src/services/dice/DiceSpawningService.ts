import type { DiceType } from '../../hooks/controls/useDiceControls';
import type { DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';

// Union type for all dice instances
export type DiceInstance = DiceD4 | DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20;

export interface DiceSpawnOptions {
    size: number;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number; w: number };
}

export interface DiceSpawnResult {
    dice: DiceInstance;
    position: { x: number; y: number; z: number };
}

/**
 * Service for handling dice spawning logic
 * Extracted from useDiceControls hook for better testability and separation of concerns
 */
export class DiceSpawningService {
    /**
     * Create a new dice instance of the specified type
     */
    public async spawnDice(
        diceType: DiceType,
        options: DiceSpawnOptions,
        existingDiceCount: number
    ): Promise<DiceSpawnResult> {
        // TODO: Implementation will be moved from useDiceControls
        throw new Error('DiceSpawningService.spawnDice not yet implemented');
    }

    /**
     * Calculate optimal position for a new dice to avoid stacking
     */
    public calculateSpawnPosition(
        existingDiceCount: number,
        diceType: DiceType
    ): { x: number; y: number; z: number } {
        // TODO: Implementation will be moved from useDiceControls
        throw new Error('DiceSpawningService.calculateSpawnPosition not yet implemented');
    }

    /**
     * Generate random rotation for a new dice
     */
    public generateRandomRotation(): { x: number; y: number; z: number; w: number } {
        // TODO: Implementation will be moved from useDiceControls
        throw new Error('DiceSpawningService.generateRandomRotation not yet implemented');
    }
} 