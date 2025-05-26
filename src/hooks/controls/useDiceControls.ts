import { useState, useCallback } from 'react';
import { DiceManager, DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';
import { DiceSpawningService } from '../../services/dice/DiceSpawningService';
import { DiceRollingService } from '../../services/dice/DiceRollingService';
import { CanvasEventService } from '../../services/canvas/CanvasEventService';

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
    onDiceSettle?: (diceId: string, result: number, position: [number, number, number]) => void;
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

    // Initialize services
    const diceSpawningService = new DiceSpawningService();
    const diceRollingService = new DiceRollingService();
    const canvasEventService = new CanvasEventService();

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

            // Broadcast spawn event
            canvasEventService.broadcastDiceSpawn(
                diceType,
                spawnResult.position,
                canvasEventService.getCurrentPlayerId()
            );

        } catch (error) {
            console.error(`❌ Failed to spawn ${diceType}:`, error);
        }
    }, [isInitialized, selectedDiceType, dice.length, diceSpawningService, canvasEventService]);

    // Clear all dice from the scene
    const clearAllDice = useCallback(() => {
        dice.forEach(die => {
            DiceManager.removeBody(die.body);
        });
        setDice([]);
        setRollResult(null);

        // Broadcast clear event
        canvasEventService.broadcastDiceClear(
            canvasEventService.getCurrentPlayerId()
        );

        console.log('🎲 Cleared all dice');
    }, [dice, canvasEventService]);

    // Roll all dice simultaneously
    const rollAllDice = useCallback(async () => {
        if (dice.length === 0 || isRolling) return;

        setIsRolling(true);
        setRollResult(null);

        try {
            // Use the dice rolling service
            const rollResult = await diceRollingService.rollAllDice(dice);
            setRollResult(rollResult.total);

            // Broadcast roll event
            canvasEventService.broadcastDiceRoll(
                rollResult,
                canvasEventService.getCurrentPlayerId(),
                'Player' // TODO: Get actual player name
            );

        } catch (error) {
            console.error('❌ Failed to roll dice:', error);
        } finally {
            setIsRolling(false);
        }
    }, [dice, isRolling, diceRollingService, canvasEventService]);

    // Throw all dice with physics (alternative to rollAllDice)
    const throwAllDice = useCallback(() => {
        // Use the dice rolling service
        diceRollingService.throwAllDice(dice);

        // Broadcast throw event
        const diceIds = dice.map((_, index) => `dice-${index}`); // Simple IDs for now
        canvasEventService.broadcastDiceThrow(
            diceIds,
            canvasEventService.getCurrentPlayerId()
        );
    }, [dice, diceRollingService, canvasEventService]);

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