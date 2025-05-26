import type { DiceInstance } from './DiceSpawningService';
import { DiceManager } from '../../physics';

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
        if (dice.length === 0) {
            return {
                individual: [],
                total: 0,
                diceCount: 0
            };
        }

        try {
            // Apply random forces to all dice
            this.applyRollForces(dice);

            // Wait for all dice to settle and get their values
            const results = await this.waitForDiceToSettle(dice);

            // Calculate total result
            const totalResult = results.reduce((sum, result) => sum + result.value, 0);

            const multiRollResult: MultiRollResult = {
                individual: results,
                total: totalResult,
                diceCount: dice.length
            };

            console.log('🎲 Multi-dice roll results:', {
                individual: results.map(r => r.value),
                total: totalResult,
                diceCount: dice.length
            });

            return multiRollResult;

        } catch (error) {
            console.error('❌ Failed to roll dice:', error);
            throw error;
        }
    }

    /**
     * Throw all dice with physics-based throwing patterns
     */
    public throwAllDice(dice: DiceInstance[]): void {
        if (dice.length === 0) return;

        this.applyThrowForces(dice);

        console.log(`🎲 Threw ${dice.length} dice with physics`);
    }

    /**
     * Apply random forces to dice for rolling
     */
    public applyRollForces(dice: DiceInstance[]): void {
        dice.forEach((die, index) => {
            const force = 8 + Math.random() * 4; // Random force between 8-12
            const angle = (index / dice.length) * Math.PI * 2 + Math.random() * 0.5; // Spread dice in circle

            die.body.velocity.set(
                Math.cos(angle) * force,
                8 + Math.random() * 4, // Upward force
                Math.sin(angle) * force
            );

            die.body.angularVelocity.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );

            die.body.wakeUp();
        });
    }

    /**
     * Apply physics-based throwing forces to dice
     */
    public applyThrowForces(dice: DiceInstance[]): void {
        dice.forEach((die, index) => {
            // Create varied throwing patterns
            const throwAngle = (index / dice.length) * Math.PI * 2;
            const throwForce = 6 + Math.random() * 6;

            die.body.velocity.set(
                Math.cos(throwAngle) * throwForce,
                5 + Math.random() * 3,
                Math.sin(throwAngle) * throwForce
            );

            die.body.angularVelocity.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
            );

            die.body.wakeUp();
        });
    }

    /**
     * Wait for dice to settle and get their final values
     */
    public async waitForDiceToSettle(dice: DiceInstance[]): Promise<RollResult[]> {
        // Wait for all dice to settle and get their values
        const diceValuePairs = dice.map(die => ({ dice: die, value: 1 })); // Initial values
        const results = await DiceManager.prepareValues(diceValuePairs);

        // Convert to RollResult format
        return results.map((result, index) => ({
            diceId: `dice-${index}`, // Simple ID for now
            value: result.value,
            diceType: this.getDiceType(dice[index])
        }));
    }

    /**
     * Get the dice type string from a dice instance
     */
    private getDiceType(dice: DiceInstance): string {
        // Use the constructor name to determine dice type
        const constructorName = dice.constructor.name;
        switch (constructorName) {
            case 'DiceD4': return 'd4';
            case 'DiceD6': return 'd6';
            case 'DiceD8': return 'd8';
            case 'DiceD10': return 'd10';
            case 'DiceD12': return 'd12';
            case 'DiceD20': return 'd20';
            default: return 'd6'; // fallback
        }
    }
} 