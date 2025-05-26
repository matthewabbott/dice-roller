import type { DiceInstance } from './DiceSpawningService';

export interface RollResult {
    diceId: string;
    value: number;
    diceType: string;
}

export interface MultiRollResult {
    individual: RollResult[];
    total: number;
    diceCount: number;
}

/**
 * Service for handling dice rolling logic
 * Extracted from useDiceControls hook for better testability and separation of concerns
 */
export class DiceRollingService {
    /**
     * Roll all dice simultaneously with physics forces
     */
    public async rollAllDice(dice: DiceInstance[]): Promise<MultiRollResult> {
        // TODO: Implementation will be moved from useDiceControls
        throw new Error('DiceRollingService.rollAllDice not yet implemented');
    }

    /**
     * Throw all dice with physics-based throwing patterns
     */
    public throwAllDice(dice: DiceInstance[]): void {
        // TODO: Implementation will be moved from useDiceControls
        throw new Error('DiceRollingService.throwAllDice not yet implemented');
    }

    /**
     * Apply random forces to dice for rolling
     */
    public applyRollForces(dice: DiceInstance[]): void {
        // TODO: Implementation will be moved from useDiceControls
        throw new Error('DiceRollingService.applyRollForces not yet implemented');
    }

    /**
     * Apply physics-based throwing forces to dice
     */
    public applyThrowForces(dice: DiceInstance[]): void {
        // TODO: Implementation will be moved from useDiceControls
        throw new Error('DiceRollingService.applyThrowForces not yet implemented');
    }

    /**
     * Wait for dice to settle and get their final values
     */
    public async waitForDiceToSettle(dice: DiceInstance[]): Promise<RollResult[]> {
        // TODO: Implementation will be moved from useDiceControls
        throw new Error('DiceRollingService.waitForDiceToSettle not yet implemented');
    }
} 