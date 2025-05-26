import type { DiceType } from '../../hooks/controls/useDiceControls';
import { DiceManager, DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';

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
        try {
            // Create dice based on type
            const newDice = this.createDiceInstance(diceType, options);

            // Calculate spawn position
            const position = options.position || this.calculateSpawnPosition(existingDiceCount, diceType);

            // Generate rotation
            const rotation = options.rotation || this.generateRandomRotation();

            // Set physics properties
            this.setupDicePhysics(newDice, position, rotation);

            // Add to physics world
            DiceManager.addBody(newDice.body);

            console.log(`🎲 Spawned ${diceType} at position:`, {
                x: position.x,
                y: position.y,
                z: position.z,
                totalDice: existingDiceCount + 1
            });

            return {
                dice: newDice,
                position
            };

        } catch (error) {
            console.error(`❌ Failed to spawn ${diceType}:`, error);
            throw error;
        }
    }

    /**
     * Calculate optimal position for a new dice to avoid stacking
     */
    public calculateSpawnPosition(
        existingDiceCount: number,
        diceType: DiceType
    ): { x: number; y: number; z: number } {
        // Position dice above table with some randomization to prevent stacking
        const spacing = 1.5;
        const gridSize = Math.ceil(Math.sqrt(existingDiceCount + 1));
        const row = Math.floor(existingDiceCount / gridSize);
        const col = existingDiceCount % gridSize;

        const offsetX = (col - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;
        const offsetZ = (row - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;

        // Higher starting position for larger dice
        const startY = diceType === 'd12' ? 4 : 3;

        return {
            x: offsetX,
            y: startY,
            z: offsetZ
        };
    }

    /**
     * Generate random rotation for a new dice
     */
    public generateRandomRotation(): { x: number; y: number; z: number; w: number } {
        const rotation = {
            x: Math.random() * 0.5,
            y: Math.random() * 0.5,
            z: Math.random() * 0.5,
            w: Math.random() * 0.5
        };

        // Normalize quaternion
        const magnitude = Math.sqrt(
            rotation.x * rotation.x +
            rotation.y * rotation.y +
            rotation.z * rotation.z +
            rotation.w * rotation.w
        );

        return {
            x: rotation.x / magnitude,
            y: rotation.y / magnitude,
            z: rotation.z / magnitude,
            w: rotation.w / magnitude
        };
    }

    /**
     * Create a dice instance of the specified type
     */
    private createDiceInstance(diceType: DiceType, options: DiceSpawnOptions): DiceInstance {
        switch (diceType) {
            case 'd4':
                return new DiceD4(options);
            case 'd6':
                return new DiceD6(options);
            case 'd8':
                return new DiceD8(options);
            case 'd10':
                return new DiceD10(options);
            case 'd12':
                return new DiceD12(options);
            case 'd20':
                return new DiceD20(options);
            default:
                return new DiceD6(options);
        }
    }

    /**
     * Setup physics properties for a dice
     */
    private setupDicePhysics(
        dice: DiceInstance,
        position: { x: number; y: number; z: number },
        rotation: { x: number; y: number; z: number; w: number }
    ): void {
        // Set position
        dice.body.position.set(position.x, position.y, position.z);

        // Set rotation
        dice.body.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

        // Apply dampening for controlled behavior
        dice.body.linearDamping = 0.1;  // Air resistance for movement
        dice.body.angularDamping = 0.1; // Air resistance for rotation
    }
} 