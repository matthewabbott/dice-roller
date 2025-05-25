import { v4 as uuidv4 } from 'uuid';

export interface DiceRoll {
    canvasId: string;
    diceType: string;
    position?: Position;
    isVirtual: boolean;
    virtualRolls?: number[];
    result: number;
}

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface CanvasData {
    diceRolls: DiceRoll[];
}

export interface ProcessedRoll {
    result: number;
    rolls: number[];
    interpretedExpression: string;
    canvasData: CanvasData;
}

export interface RollConfig {
    maxPhysicalDice: number;
    maxTotalDice: number;
    supportedDiceTypes: string[];
    virtualDiceThreshold: number;
}

export class RollProcessor {
    private static readonly DEFAULT_CONFIG: RollConfig = {
        maxPhysicalDice: 10,
        maxTotalDice: 10000,
        supportedDiceTypes: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'],
        virtualDiceThreshold: 100
    };

    private config: RollConfig;

    constructor(config: Partial<RollConfig> = {}) {
        this.config = { ...RollProcessor.DEFAULT_CONFIG, ...config };
    }

    /**
     * Parse and process a dice expression into roll results and canvas instructions
     * @param expression - Dice expression like "2d6", "1000d20", "d100"
     * @returns Processed roll with results and canvas data
     */
    public processRoll(expression: string): ProcessedRoll {
        const parseResult = this.parseExpression(expression);
        if (!parseResult.isValid) {
            return {
                result: 0,
                rolls: [],
                interpretedExpression: "invalid",
                canvasData: { diceRolls: [] }
            };
        }

        const { numDice, dieType, interpretedExpression } = parseResult;

        // Generate actual roll results
        const rolls = this.generateRolls(numDice, dieType);
        const result = rolls.reduce((sum, roll) => sum + roll, 0);

        // Determine canvas representation
        const canvasData = this.generateCanvasData(numDice, dieType, rolls);

        return {
            result,
            rolls,
            interpretedExpression,
            canvasData
        };
    }

    /**
     * Parse a dice expression into components
     * @param expression - Raw dice expression
     * @returns Parsed components or invalid result
     */
    private parseExpression(expression: string): {
        isValid: boolean;
        numDice: number;
        dieType: number;
        interpretedExpression: string;
    } {
        // Enhanced regex to handle more complex expressions
        const match = expression.toLowerCase().trim().match(/^(?:(\d+))?d(\d+)$/);

        if (!match) {
            console.error(`Invalid dice expression format: ${expression}. Expected format like "XdY" or "dY".`);
            return { isValid: false, numDice: 0, dieType: 0, interpretedExpression: "invalid" };
        }

        let numDice = match[1] ? parseInt(match[1], 10) : 1;
        let dieType = parseInt(match[2], 10);

        // Apply limits and corrections
        if (numDice > this.config.maxTotalDice) {
            console.warn(`Capping dice count from ${numDice} to ${this.config.maxTotalDice}`);
            numDice = this.config.maxTotalDice;
        }

        if (numDice <= 0) {
            console.warn(`Invalid dice count ${numDice}, defaulting to 1`);
            numDice = 1;
        }

        if (dieType < 1) {
            console.warn(`Invalid die type ${dieType}, defaulting to 1`);
            dieType = 1;
        }

        const interpretedExpression = `${numDice}d${dieType}`;

        return {
            isValid: true,
            numDice,
            dieType,
            interpretedExpression
        };
    }

    /**
     * Generate random roll results
     * @param numDice - Number of dice to roll
     * @param dieType - Type of die (number of sides)
     * @returns Array of roll results
     */
    private generateRolls(numDice: number, dieType: number): number[] {
        const rolls: number[] = [];
        for (let i = 0; i < numDice; i++) {
            rolls.push(Math.floor(Math.random() * dieType) + 1);
        }
        return rolls;
    }

    /**
     * Generate canvas data based on roll parameters
     * @param numDice - Number of dice rolled
     * @param dieType - Type of die
     * @param rolls - Individual roll results
     * @returns Canvas data with dice representations
     */
    private generateCanvasData(numDice: number, dieType: number, rolls: number[]): CanvasData {
        const diceRolls: DiceRoll[] = [];

        // Determine if this should be virtual or physical representation
        const shouldBeVirtual = this.shouldUseVirtualRepresentation(numDice, dieType);
        const physicalDiceType = this.getPhysicalDiceType(dieType);

        if (shouldBeVirtual) {
            // Create single virtual dice representing the entire roll
            const virtualDice: DiceRoll = {
                canvasId: uuidv4(),
                diceType: physicalDiceType,
                position: this.generateSpawnPosition(0, 1),
                isVirtual: true,
                virtualRolls: rolls,
                result: rolls.reduce((sum, roll) => sum + roll, 0)
            };
            diceRolls.push(virtualDice);
        } else {
            // Create individual physical dice
            for (let i = 0; i < numDice; i++) {
                const physicalDice: DiceRoll = {
                    canvasId: uuidv4(),
                    diceType: physicalDiceType,
                    position: this.generateSpawnPosition(i, numDice),
                    isVirtual: false,
                    result: rolls[i]
                };
                diceRolls.push(physicalDice);
            }
        }

        return { diceRolls };
    }

    /**
     * Determine if a roll should use virtual representation
     * @param numDice - Number of dice
     * @param dieType - Type of die
     * @returns True if should be virtual
     */
    private shouldUseVirtualRepresentation(numDice: number, dieType: number): boolean {
        // Use virtual if:
        // 1. Too many dice for physical representation
        // 2. Non-standard die type
        // 3. Total result count exceeds threshold

        if (numDice > this.config.maxPhysicalDice) {
            return true;
        }

        if (!this.config.supportedDiceTypes.includes(`d${dieType}`)) {
            return true;
        }

        if (numDice * dieType > this.config.virtualDiceThreshold) {
            return true;
        }

        return false;
    }

    /**
     * Get the closest supported physical dice type
     * @param dieType - Requested die type
     * @returns Supported physical dice type
     */
    private getPhysicalDiceType(dieType: number): string {
        const supportedTypes = [4, 6, 8, 10, 12, 20];

        // If it's already supported, use it
        if (supportedTypes.includes(dieType)) {
            return `d${dieType}`;
        }

        // Find closest supported type
        let closest = supportedTypes[0];
        let minDiff = Math.abs(dieType - closest);

        for (const type of supportedTypes) {
            const diff = Math.abs(dieType - type);
            if (diff < minDiff) {
                minDiff = diff;
                closest = type;
            }
        }

        return `d${closest}`;
    }

    /**
     * Generate spawn position for a dice
     * @param index - Index of the dice in the roll
     * @param total - Total number of dice
     * @returns 3D position for spawning
     */
    private generateSpawnPosition(index: number, total: number): Position {
        // Arrange dice in a grid pattern above the table
        const spacing = 1.5;
        const gridSize = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        // Center the grid and add some randomization
        const offsetX = (col - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;
        const offsetZ = (row - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;
        const offsetY = 3 + Math.random() * 2; // Spawn above table

        return {
            x: offsetX,
            y: offsetY,
            z: offsetZ
        };
    }

    /**
     * Get configuration for testing/debugging
     */
    public getConfig(): RollConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<RollConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
} 