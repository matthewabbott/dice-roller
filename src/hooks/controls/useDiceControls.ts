import { useState, useCallback } from 'react';
import { DiceManager, DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';

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

    // Spawn a new dice of the specified type
    const spawnDice = useCallback(async (diceType: DiceType = selectedDiceType) => {
        if (!isInitialized) return;

        try {
            let newDice: DiceInstance;
            const options = { size: 1 };

            // Create dice based on type
            switch (diceType) {
                case 'd4':
                    newDice = new DiceD4(options);
                    break;
                case 'd6':
                    newDice = new DiceD6(options);
                    break;
                case 'd8':
                    newDice = new DiceD8(options);
                    break;
                case 'd10':
                    newDice = new DiceD10(options);
                    break;
                case 'd12':
                    newDice = new DiceD12(options);
                    break;
                case 'd20':
                    newDice = new DiceD20(options);
                    break;
                default:
                    newDice = new DiceD6(options);
            }

            // Position dice above table with some randomization to prevent stacking
            const existingDiceCount = dice.length;
            const spacing = 1.5;
            const gridSize = Math.ceil(Math.sqrt(existingDiceCount + 1));
            const row = Math.floor(existingDiceCount / gridSize);
            const col = existingDiceCount % gridSize;

            const offsetX = (col - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;
            const offsetZ = (row - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;

            // Higher starting position for larger dice
            const startY = diceType === 'd12' ? 4 : 3;

            newDice.body.position.set(offsetX, startY, offsetZ);
            newDice.body.quaternion.set(
                Math.random() * 0.5,
                Math.random() * 0.5,
                Math.random() * 0.5,
                Math.random() * 0.5
            );
            newDice.body.quaternion.normalize();

            // Add to physics world
            DiceManager.addBody(newDice.body);

            // Apply dampening for controlled behavior
            newDice.body.linearDamping = 0.1;  // Air resistance for movement
            newDice.body.angularDamping = 0.1; // Air resistance for rotation

            // Add to dice array
            setDice(prevDice => [...prevDice, newDice]);

            console.log(`🎲 Spawned ${diceType} at position:`, {
                x: offsetX,
                y: startY,
                z: offsetZ,
                totalDice: existingDiceCount + 1
            });

        } catch (error) {
            console.error(`❌ Failed to spawn ${diceType}:`, error);
        }
    }, [isInitialized, selectedDiceType, dice.length]);

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