import React from 'react';

export interface ActionButtonsProps {
    onRollAllDice: () => void;
    onThrowAllDice: () => void;
    isRolling: boolean;
    diceCount: number;
    rollResult?: number | null;
}

/**
 * ActionButtons Component
 * Provides roll and throw action buttons
 * Extracted from DiceCanvas for better separation of concerns
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
    onRollAllDice,
    onThrowAllDice,
    isRolling,
    diceCount,
    rollResult
}) => {
    return (
        <div className="flex gap-3">
            <button
                onClick={onRollAllDice}
                disabled={isRolling || diceCount === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
                {isRolling ? (
                    <>
                        <span className="animate-spin mr-2">🎲</span>
                        Rolling All Dice...
                    </>
                ) : (
                    <>
                        🎲 Roll All Dice
                        {rollResult && ` (Total: ${rollResult})`}
                    </>
                )}
            </button>

            <button
                onClick={onThrowAllDice}
                disabled={diceCount === 0}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors"
                title="Throw all dice with physics"
            >
                🚀
            </button>
        </div>
    );
}; 