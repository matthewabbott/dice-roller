import { useState, useCallback } from 'react';
import { DiceManager, DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';
import type { RemoteDiceData } from '../../services/CanvasSyncManager';

// Define available dice types
type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
type DiceInstance = DiceD4 | DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20;

export interface UseRemoteDiceProps {
    isInitialized: boolean;
}

export interface RemoteDiceOperations {
    spawnRemoteDice: (diceData: RemoteDiceData) => Promise<void>;
    applyRemoteDiceThrow: (diceId: string, velocity: { x: number; y: number; z: number }) => void;
    applyRemoteDiceSettle: (diceId: string, position: { x: number; y: number; z: number }, result: number) => void;
    applyRemoteDiceHighlight: (diceId: string, color: string) => void;
    removeRemoteDice: (diceId: string) => void;
    clearRemoteDice: () => void;
}

/**
 * Custom hook for managing remote dice state and operations
 * Extracted from DiceCanvas for better separation of concerns
 */
export const useRemoteDice = ({ isInitialized }: UseRemoteDiceProps): [
    Map<string, DiceInstance>,
    RemoteDiceOperations
] => {
    const [remoteDice, setRemoteDice] = useState<Map<string, DiceInstance>>(new Map());

    // Spawn a remote dice from sync data
    const spawnRemoteDice = useCallback(async (diceData: RemoteDiceData) => {
        if (!isInitialized) return;

        try {
            let newDice: DiceInstance;
            const options = { size: 1 };

            // Create dice based on type
            switch (diceData.diceType as DiceType) {
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

            // Set position from remote data
            newDice.body.position.set(
                diceData.position.x,
                diceData.position.y,
                diceData.position.z
            );

            // Add random rotation for visual variety
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
            newDice.body.linearDamping = 0.1;
            newDice.body.angularDamping = 0.1;

            // Store in remote dice map
            setRemoteDice(prev => new Map(prev.set(diceData.canvasId, newDice)));

            console.log(`📡 Spawned remote ${diceData.diceType} from user ${diceData.userId} at:`, diceData.position);

        } catch (error) {
            console.error(`❌ Failed to spawn remote ${diceData.diceType}:`, error);
        }
    }, [isInitialized]);

    // Apply throw velocity to remote dice
    const applyRemoteDiceThrow = useCallback((diceId: string, velocity: { x: number; y: number; z: number }) => {
        const remoteDie = remoteDice.get(diceId);
        if (remoteDie) {
            remoteDie.body.velocity.set(velocity.x, velocity.y, velocity.z);
            remoteDie.body.wakeUp();
            console.log(`📡 Applied remote throw to dice ${diceId}`);
        }
    }, [remoteDice]);

    // Apply settle position and result to remote dice
    const applyRemoteDiceSettle = useCallback((diceId: string, position: { x: number; y: number; z: number }, result: number) => {
        const remoteDie = remoteDice.get(diceId);
        if (remoteDie) {
            // Smoothly move to final position
            remoteDie.body.position.set(position.x, position.y, position.z);
            remoteDie.body.velocity.set(0, 0, 0);
            remoteDie.body.angularVelocity.set(0, 0, 0);
            console.log(`📡 Settled remote dice ${diceId} at result ${result}`);
        }
    }, [remoteDice]);

    // Apply highlight to remote dice
    const applyRemoteDiceHighlight = useCallback((diceId: string, color: string) => {
        // TODO: Implement visual highlighting
        console.log(`📡 Highlighting dice ${diceId} with color ${color}`);
    }, []);

    // Remove a specific remote dice
    const removeRemoteDice = useCallback((diceId: string) => {
        const remoteDie = remoteDice.get(diceId);
        if (remoteDie) {
            DiceManager.removeBody(remoteDie.body);
            setRemoteDice(prev => {
                const newMap = new Map(prev);
                newMap.delete(diceId);
                return newMap;
            });
            console.log(`📡 Removed remote dice ${diceId}`);
        }
    }, [remoteDice]);

    // Clear all remote dice
    const clearRemoteDice = useCallback(() => {
        remoteDice.forEach(die => {
            DiceManager.removeBody(die.body);
        });
        setRemoteDice(new Map());
        console.log('📡 Cleared all remote dice');
    }, [remoteDice]);

    const operations: RemoteDiceOperations = {
        spawnRemoteDice,
        applyRemoteDiceThrow,
        applyRemoteDiceSettle,
        applyRemoteDiceHighlight,
        removeRemoteDice,
        clearRemoteDice
    };

    return [remoteDice, operations];
}; 