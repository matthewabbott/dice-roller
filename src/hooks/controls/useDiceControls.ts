import { useState, useCallback } from 'react';
import { DiceManager, DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';
import { DiceSpawningService } from '../../services/dice/DiceSpawningService';

// Define available dice types
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
type DiceInstance = DiceD4 | DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20;

export interface DiceControlsState {
    selectedDiceType: DiceType;
    dice: DiceInstance[];
    isRolling: boolean;
    rollResult: number | null;
    rollHistory: { type: DiceType; value: number; timestamp: number }[];
}

export interface DiceControlsOperations {
    setSelectedDiceType: (type: DiceType) => void;
    spawnDice: (diceType?: DiceType) => Promise<void>;
    clearAllDice: () => void;
    rollAllDice: () => Promise<void>;
    throwAllDice: () => void;
}

export interface UseDiceControlsProps {
    isInitialized: boolean;
}

/**
 * Custom hook for managing dice controls and operations
 * Extracted from DiceCanvas for better separation of concerns
 */
export const useDiceControls = ({ isInitialized }: UseDiceControlsProps): [
    DiceControlsState,
    DiceControlsOperations
] => {
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>('d20');
    const [dice, setDice] = useState<DiceInstance[]>([]);
    const [isRolling, setIsRolling] = useState(false);
    const [rollResult, setRollResult] = useState<number | null>(null);
    const [rollHistory] = useState<{ type: DiceType; value: number; timestamp: number }[]>([]);

    // Initialize dice spawning service
    const diceSpawningService = new DiceSpawningService();

    // Spawn a new dice of the specified type
    const spawnDice = useCallback(async (diceType: DiceType = selectedDiceType) => {
        if (!isInitialized) return;

        try {
            const options = { size: 1 };
            const existingDiceCount = dice.length;

            // Use the dice spawning service
            const spawnResult = await diceSpawningService.spawnDice(
                diceType,
                options,
                existingDiceCount
            );

            // Add to dice array
            setDice(prevDice => [...prevDice, spawnResult.dice]);

        } catch (error) {
            console.error(`❌ Failed to spawn ${diceType}:`, error);
        }
    }, [isInitialized, selectedDiceType, dice.length, diceSpawningService]);

    // Clear all dice from the scene
    const clearAllDice = useCallback(() => {
        dice.forEach(die => {
            DiceManager.removeBody(die.body);
        });
        setDice([]);
        setRollResult(null);
        console.log('🎲 Cleared all dice');
    }, [dice]);

    // Roll all dice simultaneously
    const rollAllDice = useCallback(async () => {
        if (dice.length === 0 || isRolling) return;

        setIsRolling(true);
        setRollResult(null);

        try {
            // Apply random forces to all dice
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

            // Wait for all dice to settle and get their values
            const diceValuePairs = dice.map(die => ({ dice: die, value: 1 })); // Initial values
            const results = await DiceManager.prepareValues(diceValuePairs);

            // Calculate total result
            const totalResult = results.reduce((sum, result) => sum + result.value, 0);
            setRollResult(totalResult);

            console.log('🎲 Multi-dice roll results:', {
                individual: results.map(r => r.value),
                total: totalResult,
                diceCount: dice.length
            });

        } catch (error) {
            console.error('❌ Failed to roll dice:', error);
        } finally {
            setIsRolling(false);
        }
    }, [dice, isRolling]);

    // Throw all dice with physics (alternative to rollAllDice)
    const throwAllDice = useCallback(() => {
        if (dice.length === 0) return;

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

        console.log(`🎲 Threw ${dice.length} dice with physics`);
    }, [dice]);

    const state: DiceControlsState = {
        selectedDiceType,
        dice,
        isRolling,
        rollResult,
        rollHistory
    };

    const operations: DiceControlsOperations = {
        setSelectedDiceType,
        spawnDice,
        clearAllDice,
        rollAllDice,
        throwAllDice
    };

    return [state, operations];
}; 