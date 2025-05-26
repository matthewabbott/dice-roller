import React from 'react';

export interface InstructionsPanelProps {
    diceCount: number;
    isFullScreen?: boolean;
}

/**
 * InstructionsPanel Component
 * Shows dice interaction instructions and tooltips
 * Extracted from DiceCanvas for better separation of concerns
 */
export const InstructionsPanel: React.FC<InstructionsPanelProps> = ({
    diceCount,
    isFullScreen = false
}) => {
    return (
        <>
            {/* Dice Interaction Tooltip */}
            {diceCount > 0 && (
                <div className={`absolute ${isFullScreen ? 'bottom-4 left-4' : 'bottom-2 left-2'} bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm pointer-events-none`}>
                    💡 <strong>Shift + Click & Drag</strong> dice to throw them
                </div>
            )}

            {/* Multi-dice Instructions */}
            {diceCount > 0 && !isFullScreen && (
                <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded text-sm">
                    <div className="font-medium mb-1">💡 Controls:</div>
                    <ul className="text-xs space-y-1 text-blue-200">
                        <li>• <strong>🔒 Lock Camera</strong> to click dice without moving the view</li>
                        <li>• <strong>Shift + Click & Drag</strong> any dice to throw it</li>
                        <li>• <strong>Left Click & Drag</strong> to rotate camera view (when unlocked)</li>
                        <li>• <strong>Right Click & Drag</strong> to pan camera (when unlocked)</li>
                        <li>• <strong>Mouse Wheel</strong> to zoom in/out</li>
                        <li>• Use "Roll All" for controlled results</li>
                        <li>• Use "🚀" for physics-based throwing</li>
                        <li>• Dice will collide and interact naturally</li>
                    </ul>
                </div>
            )}
        </>
    );
}; 