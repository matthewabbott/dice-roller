import React, { useState } from 'react';

interface DiceControlsPanelProps {
    onQuickRoll?: (command: string) => void;
    isPeeking?: boolean;
}

/**
 * DiceControlsPanel Component
 * Contains dice roll controls with quantity selection
 * Moved from QuickRollModal to provide better integration
 */
const DiceControlsPanel: React.FC<DiceControlsPanelProps> = ({
    onQuickRoll,
    isPeeking = false
}) => {
    const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({
        4: 1, 6: 1, 8: 1, 10: 1, 12: 1, 20: 1
    });

    const commonDice = [4, 6, 8, 10, 12, 20];

    const handleQuantityChange = (dieType: number, quantity: number) => {
        setSelectedQuantities(prev => ({
            ...prev,
            [dieType]: Math.max(1, Math.min(10, quantity)) // Limit between 1-10
        }));
    };

    const handleDiceRoll = (dieType: number) => {
        const quantity = selectedQuantities[dieType];
        const command = `/roll ${quantity}d${dieType}`;
        if (onQuickRoll) {
            onQuickRoll(command);
        }
    };

    const handleMixedRoll = () => {
        const rollParts: string[] = [];
        commonDice.forEach(dieType => {
            const quantity = selectedQuantities[dieType];
            if (quantity > 0) {
                rollParts.push(`${quantity}d${dieType}`);
            }
        });

        if (rollParts.length > 0) {
            const command = `/roll ${rollParts.join(' + ')}`;
            if (onQuickRoll) {
                onQuickRoll(command);
            }
        }
    };

    // Show condensed view when peeking
    if (isPeeking) {
        return (
            <div className="space-y-3">
                {/* Quick Dice Buttons - Condensed */}
                <div>
                    <h3 className="text-sm font-medium text-brand-text-muted mb-2">Quick Dice Rolls</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {commonDice.slice(0, 6).map((die) => (
                            <button
                                key={die}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 px-2 rounded transition-colors text-xs"
                                onClick={() => handleDiceRoll(die)}
                                title={`Roll ${selectedQuantities[die]}d${die}`}
                            >
                                🎲 {selectedQuantities[die]}d{die}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Info */}
                <div className="p-2 bg-blue-900/20 rounded border-l-2 border-blue-500">
                    <div className="text-xs text-blue-300">
                        <strong>Quick Rolls:</strong> Generate shared dice visible to all players
                    </div>
                </div>
            </div>
        );
    }

    // Full expanded view
    return (
        <div className="space-y-4">
            {/* Explanation Header */}
            <div className="p-3 bg-blue-900/20 rounded border-l-4 border-blue-500">
                <div className="flex items-start gap-2">
                    <span className="text-blue-400 text-sm">🎲</span>
                    <div className="text-xs text-blue-300">
                        <strong>Shared Dice Commands:</strong> These controls generate <code>/roll</code> commands
                        that create dice visible to all players in the session. Results appear in chat and on the canvas.
                    </div>
                </div>
            </div>

            {/* Dice Controls Grid */}
            <div>
                <h3 className="text-sm font-medium text-brand-text-muted mb-3">Dice Roll Controls</h3>
                <div className="grid grid-cols-2 gap-3">
                    {commonDice.map((die) => (
                        <div key={die} className="bg-brand-background/50 rounded-lg p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-brand-text">d{die}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleQuantityChange(die, selectedQuantities[die] - 1)}
                                        className="w-6 h-6 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center justify-center"
                                        disabled={selectedQuantities[die] <= 1}
                                    >
                                        −
                                    </button>
                                    <span className="w-8 text-center text-sm font-medium text-brand-text">
                                        {selectedQuantities[die]}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange(die, selectedQuantities[die] + 1)}
                                        className="w-6 h-6 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center justify-center"
                                        disabled={selectedQuantities[die] >= 10}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDiceRoll(die)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded transition-colors text-sm"
                                title={`Roll ${selectedQuantities[die]}d${die}`}
                            >
                                🎲 Roll {selectedQuantities[die]}d{die}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mixed Roll Button */}
            <div className="border-t border-brand-surface pt-3">
                <button
                    onClick={handleMixedRoll}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4 rounded transition-colors"
                    title="Roll all selected dice together"
                >
                    🎯 Roll All Selected Dice
                </button>
                <p className="text-xs text-brand-text-muted mt-2 text-center">
                    Rolls: {commonDice.map(die => `${selectedQuantities[die]}d${die}`).join(' + ')}
                </p>
            </div>
        </div>
    );
};

export default DiceControlsPanel; 