import React from 'react';
import { DiceTypeSelector } from './DiceTypeSelector';
import { DiceCountDisplay } from './DiceCountDisplay';
import { SpawnControls } from './SpawnControls';
import { ActionButtons } from './ActionButtons';
import { CameraControls } from './CameraControls';
import { InstructionsPanel } from './InstructionsPanel';
import type { DiceControlsState, DiceControlsOperations } from '../../hooks/controls/useDiceControls';
import type { CameraControlsState, CameraControlsOperations } from '../../hooks/controls/useCameraControls';
import type { SyncStatus } from '../../hooks/sync/useSyncStatus';

export interface DiceControlPanelProps {
    // Dice controls
    diceState: DiceControlsState;
    diceOperations: DiceControlsOperations;

    // Camera controls
    cameraState: CameraControlsState;
    cameraOperations: CameraControlsOperations;

    // Sync data
    remoteDiceCount: number;
    syncStatus: SyncStatus;
    stats?: {
        totalDice: number;
        localDice: number;
        remoteDice: number;
        diceByUser: Record<string, number>;
        diceByType: Record<string, number>;
    };

    // System state
    isInitialized: boolean;
}

/**
 * DiceControlPanel Component
 * Main control panel that combines all dice and camera controls
 * Extracted from DiceCanvas for better separation of concerns
 */
export const DiceControlPanel: React.FC<DiceControlPanelProps> = ({
    diceState,
    diceOperations,
    cameraState,
    cameraOperations,
    remoteDiceCount,
    syncStatus,
    stats,
    isInitialized
}) => {
    return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Dice Controls</h3>

            {/* Dice Type Selector */}
            <DiceTypeSelector
                selectedDiceType={diceState.selectedDiceType}
                onDiceTypeChange={diceOperations.setSelectedDiceType}
                disabled={!isInitialized}
            />

            {/* Dice Count Display */}
            <DiceCountDisplay
                localDiceCount={diceState.dice.length}
                remoteDiceCount={remoteDiceCount}
                rollResult={diceState.rollResult}
                syncStatus={syncStatus}
                stats={stats}
            />

            {/* Spawn Controls */}
            <SpawnControls
                selectedDiceType={diceState.selectedDiceType}
                onSpawnDice={diceOperations.spawnDice}
                onClearAllDice={diceOperations.clearAllDice}
                isInitialized={isInitialized}
                diceCount={diceState.dice.length}
            />

            {/* Action Buttons */}
            <ActionButtons
                onRollAllDice={diceOperations.rollAllDice}
                onThrowAllDice={diceOperations.throwAllDice}
                isRolling={diceState.isRolling}
                diceCount={diceState.dice.length}
                rollResult={diceState.rollResult}
            />

            {/* Camera Controls */}
            <CameraControls
                isCameraLocked={cameraState.isCameraLocked}
                onToggleCameraLock={cameraOperations.toggleCameraLock}
                onResetCamera={cameraOperations.resetCamera}
            />

            {/* Instructions Panel */}
            <InstructionsPanel
                diceCount={diceState.dice.length}
                isFullScreen={cameraState.isFullScreen}
            />
        </div>
    );
}; 