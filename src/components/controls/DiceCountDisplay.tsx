import React from 'react';
import type { SyncStatus } from '../../hooks/sync/useSyncStatus';

export interface DiceCountDisplayProps {
    localDiceCount: number;
    remoteDiceCount: number;
    rollResult?: number | null;
    syncStatus: SyncStatus;
    stats?: {
        totalDice: number;
        localDice: number;
        remoteDice: number;
        diceByUser: Record<string, number>;
        diceByType: Record<string, number>;
    };
}

/**
 * DiceCountDisplay Component
 * Shows dice count, roll results, and sync stats
 * Extracted from DiceCanvas for better separation of concerns
 */
export const DiceCountDisplay: React.FC<DiceCountDisplayProps> = ({
    localDiceCount,
    remoteDiceCount,
    rollResult,
    syncStatus,
    stats
}) => {
    return (
        <div className="mb-4 p-3 bg-gray-800 rounded">
            <div className="text-sm text-gray-300">Dice on Table:</div>
            <div className="text-xl font-bold">{localDiceCount + remoteDiceCount}</div>
            <div className="text-xs text-gray-400 mt-1">
                Local: {localDiceCount} • Remote: {remoteDiceCount}
            </div>
            {rollResult && (
                <div className="text-sm text-green-400 mt-1">
                    Last Total: {rollResult}
                </div>
            )}
            {syncStatus === 'connected' && stats && (
                <div className="text-xs text-blue-400 mt-1">
                    Users: {Object.keys(stats.diceByUser).length}
                </div>
            )}
        </div>
    );
}; 