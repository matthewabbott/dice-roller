import React from 'react';
import { SyncStatusIndicator } from '../sync/SyncStatusIndicator';
import type { SyncStatus } from '../../hooks/sync/useSyncStatus';

export interface CanvasOverlayProps {
    isFullScreen: boolean;
    isRolling: boolean;
    rollResult: number | null;
    syncStatus: SyncStatus;
    stats?: {
        totalDice: number;
        localDice: number;
        remoteDice: number;
        diceByUser: Record<string, number>;
        diceByType: Record<string, number>;
    };
    isCameraLocked: boolean;
    diceCount: number;
    onRollAllDice: () => void;
    onToggleCameraLock: () => void;
    onClearAllDice: () => void;
    onResetCamera: () => void;
    onToggleFullScreen: () => void;
}

/**
 * CanvasOverlay Component
 * Provides overlay controls that appear over the 3D canvas
 * Extracted from DiceCanvas for better separation of concerns
 */
export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
    isFullScreen,
    isRolling,
    rollResult,
    syncStatus,
    stats,
    isCameraLocked,
    diceCount,
    onRollAllDice,
    onToggleCameraLock,
    onClearAllDice,
    onResetCamera,
    onToggleFullScreen
}) => {
    return (
        <div className={`absolute ${isFullScreen ? 'top-4 right-4' : 'top-2 right-2'} flex gap-2`}>
            {/* Sync Status Indicator */}
            <SyncStatusIndicator
                status={syncStatus}
                isFullScreen={isFullScreen}
                stats={stats}
            />

            <div className={`bg-gray-800 px-3 py-2 rounded text-white font-mono ${isFullScreen ? 'text-base' : 'text-xs'}`}>
                {isRolling ? 'Rolling...' : rollResult ? `Total: ${rollResult}` : 'Ready to roll'}
            </div>

            <button
                onClick={onRollAllDice}
                disabled={isRolling || diceCount === 0}
                className={`bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded font-semibold ${isFullScreen ? 'px-4 py-2' : 'text-xs px-2 py-1'
                    }`}
                title="Roll all dice"
            >
                {isRolling ? '🎲 Rolling...' : `🎲 Roll All Dice`}
            </button>
            <button
                onClick={onToggleCameraLock}
                className={`${isCameraLocked ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white rounded font-semibold ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1'
                    }`}
                title={isCameraLocked ? "Unlock camera (enable rotation/pan)" : "Lock camera (disable rotation/pan)"}
            >
                {isCameraLocked ? '🔒 Camera Locked' : '🔓 Camera Free'}
            </button>
            <button
                onClick={onClearAllDice}
                className={`bg-yellow-600 hover:bg-yellow-500 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                    }`}
                title="Clear all dice"
            >
                🗑 Clear All
            </button>
            <button
                onClick={onResetCamera}
                className={`bg-gray-700 hover:bg-gray-600 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                    }`}
                title="Reset camera view"
            >
                📷 Reset View
            </button>
            <button
                onClick={onToggleFullScreen}
                className={`bg-gray-700 hover:bg-gray-600 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                    }`}
                title={isFullScreen ? "Exit full screen" : "Full screen"}
            >
                {isFullScreen ? '✕ Exit Full Screen' : '⛶'}
            </button>
        </div>
    );
}; 