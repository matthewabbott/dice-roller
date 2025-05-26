import React from 'react';
import type { DiceType } from '../../hooks/controls/useDiceControls';

// Dice configuration for colors and emojis
const DICE_CONFIG = {
    d4: {
        name: 'D4 (Tetrahedron)',
        emoji: '▲',
        color: '#ff6b6b'
    },
    d6: {
        name: 'D6 (Cube)',
        emoji: '⬜',
        color: '#4ecdc4'
    },
    d8: {
        name: 'D8 (Octahedron)',
        emoji: '🔸',
        color: '#45b7d1'
    },
    d10: {
        name: 'D10 (Pentagonal Trapezohedron)',
        emoji: '🔟',
        color: '#96ceb4'
    },
    d12: {
        name: 'D12 (Dodecahedron)',
        emoji: '⬡',
        color: '#feca57'
    },
    d20: {
        name: 'D20 (Icosahedron)',
        emoji: '🔴',
        color: '#ff9ff3'
    }
};

export interface RollHistoryProps {
    rollHistory: { type: DiceType; value: number; timestamp: number }[];
}

/**
 * RollHistory Component
 * Displays the history of dice rolls
 * Extracted from DiceCanvas for better separation of concerns
 */
export const RollHistory: React.FC<RollHistoryProps> = ({ rollHistory }) => {
    if (rollHistory.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                Recent Rolls
            </h4>
            <div className="space-y-2">
                {rollHistory.map((roll, index) => (
                    <div
                        key={roll.timestamp}
                        className={`flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
                            }`}
                    >
                        <span className="font-mono text-sm">
                            {DICE_CONFIG[roll.type].emoji} {roll.type.toUpperCase()}
                        </span>
                        <span className="font-bold text-lg" style={{ color: DICE_CONFIG[roll.type].color }}>
                            {roll.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}; 