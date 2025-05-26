import React from 'react';
import type { DiceType } from '../../hooks/controls/useDiceControls';

export interface SpawnControlsProps {
    selectedDiceType: DiceType;
    onSpawnDice: (diceType?: DiceType) => void;
    onClearAllDice: () => void;
    isInitialized: boolean;
    diceCount: number;
}

/**
 * SpawnControls Component
 * Provides controls for spawning and clearing dice
 * Extracted from DiceCanvas for better separation of concerns
 */
export const SpawnControls: React.FC<SpawnControlsProps> = ({
    selectedDiceType,
    onSpawnDice,
    onClearAllDice,
    isInitialized,
    diceCount
}) => {
    const allDiceTypes: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

    return (
        <>
            {/* Main Spawn Controls */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={() => onSpawnDice(selectedDiceType)}
                    disabled={!isInitialized}
                    className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-semibold py-2 px-3 rounded transition-colors"
                    title={`Spawn a ${selectedDiceType.toUpperCase()}`}
                >
                    + Add {selectedDiceType.toUpperCase()}
                </button>

                <button
                    onClick={onClearAllDice}
                    disabled={diceCount === 0}
                    className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white font-semibold py-2 px-3 rounded transition-colors"
                    title="Remove all dice"
                >
                    🗑 Clear All
                </button>
            </div>

            {/* Quick Spawn Buttons */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-2">Quick Spawn:</div>
                <div className="grid grid-cols-3 gap-1">
                    {allDiceTypes.map(diceType => (
                        <button
                            key={diceType}
                            onClick={() => onSpawnDice(diceType)}
                            disabled={!isInitialized}
                            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white text-xs py-1 px-2 rounded transition-colors"
                            title={`Spawn ${diceType.toUpperCase()}`}
                        >
                            {diceType.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}; 