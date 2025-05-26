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
    onToggleCameraLock: () => void;
    onResetCamera: () => void;
    onToggleFullScreen: () => void;
}

/**
 * CanvasOverlay Component
 * Provides overlay controls that appear over the 3D canvas
 * Focused on camera and view controls only - dice controls are in the local dice panel
 */
export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
    isFullScreen,
    isRolling,
    rollResult,
    syncStatus,
    stats,
    isCameraLocked,
    diceCount,
    onToggleCameraLock,
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

            {/* Canvas View Controls Only */}
            <button
                onClick={onToggleCameraLock}
                className={`${isCameraLocked ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white rounded font-semibold ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1'
                    }`}
                title={isCameraLocked ? "Unlock camera (enable rotation/pan) - Hotkey: Space" : "Lock camera (disable rotation/pan) - Hotkey: Space"}
            >
                {isCameraLocked ? '🔒 Camera Locked' : '🔓 Camera Free'}
                {!isFullScreen && <span className="ml-1 opacity-60">(Space)</span>}
            </button>
            <button
                onClick={onResetCamera}
                className={`bg-gray-700 hover:bg-gray-600 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                    }`}
                title="Reset camera view - Hotkey: V"
            >
                📷 Reset View
                {!isFullScreen && <span className="ml-1 opacity-60">(V)</span>}
            </button>
            <button
                onClick={onToggleFullScreen}
                className={`bg-gray-700 hover:bg-gray-600 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                    }`}
                title={isFullScreen ? "Exit full screen - Hotkey: F" : "Full screen - Hotkey: F"}
            >
                {isFullScreen ? '✕ Exit Full Screen' : '⛶'}
                {!isFullScreen && <span className="ml-1 opacity-60">(F)</span>}
            </button>
        </div>
    );
}; 