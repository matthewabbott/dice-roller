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
    const [quantity, setQuantity] = useState(1);

    const commonDice = [
        { type: 4, emoji: '▲', name: 'D4', color: 'bg-red-600 hover:bg-red-500' },
        { type: 6, emoji: '⬜', name: 'D6', color: 'bg-blue-600 hover:bg-blue-500' },
        { type: 8, emoji: '🔸', name: 'D8', color: 'bg-green-600 hover:bg-green-500' },
        { type: 10, emoji: '🔟', name: 'D10', color: 'bg-yellow-600 hover:bg-yellow-500' },
        { type: 12, emoji: '⬡', name: 'D12', color: 'bg-purple-600 hover:bg-purple-500' },
        { type: 20, emoji: '🔴', name: 'D20', color: 'bg-pink-600 hover:bg-pink-500' }
    ];

    const handleQuantityChange = (newQuantity: number) => {
        setQuantity(Math.max(1, Math.min(10, newQuantity))); // Limit between 1-10
    };

    const handleDiceRoll = (dieType: number) => {
        const command = `/roll ${quantity}d${dieType}`;
        if (onQuickRoll) {
            onQuickRoll(command);
        }
    };

    const handleMixedRoll = () => {
        const rollParts = commonDice.map(die => `${quantity}d${die.type}`);
        const command = `/roll ${rollParts.join(' + ')}`;
        if (onQuickRoll) {
            onQuickRoll(command);
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
                                key={die.type}
                                className={`${die.color} text-white font-medium py-1.5 px-2 rounded transition-colors text-xs flex items-center justify-center gap-1`}
                                onClick={() => handleDiceRoll(die.type)}
                                title={`Roll ${quantity}d${die.type}`}
                            >
                                <span className="text-xs">{die.emoji}</span>
                                <span>{quantity}d{die.type}</span>
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

            {/* Quantity Selector */}
            <div className="bg-brand-background/50 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-text">Number of Dice</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleQuantityChange(quantity - 1)}
                            className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm flex items-center justify-center font-bold"
                            disabled={quantity <= 1}
                        >
                            −
                        </button>
                        <span className="w-12 text-center text-lg font-bold text-brand-text bg-brand-surface rounded px-2 py-1">
                            {quantity}
                        </span>
                        <button
                            onClick={() => handleQuantityChange(quantity + 1)}
                            className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm flex items-center justify-center font-bold"
                            disabled={quantity >= 10}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {/* Dice Controls Grid */}
            <div>
                <h3 className="text-sm font-medium text-brand-text-muted mb-3">Dice Types</h3>
                <div className="grid grid-cols-2 gap-3">
                    {commonDice.map((die) => (
                        <button
                            key={die.type}
                            onClick={() => handleDiceRoll(die.type)}
                            className={`
                                ${die.color} 
                                text-white 
                                px-4 
                                py-3 
                                rounded-lg 
                                font-medium 
                                transition-colors 
                                flex 
                                items-center 
                                justify-center 
                                gap-2
                            `}
                            title={`Roll ${quantity}d${die.type} - creates shared dice visible to all players`}
                        >
                            <span className="text-lg">{die.emoji}</span>
                            <span>{die.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Mixed Roll Button */}
            <div className="border-t border-brand-surface pt-3">
                <button
                    onClick={handleMixedRoll}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded transition-colors"
                    title="Roll all dice types together"
                >
                    🎯 Roll All Dice Types ({quantity} each)
                </button>
                <p className="text-xs text-brand-text-muted mt-2 text-center">
                    Rolls: {commonDice.map(die => `${quantity}d${die.type}`).join(' + ')}
                </p>
            </div>
        </div>
    );
};

export default DiceControlsPanel; 