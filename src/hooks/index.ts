export { useDiceInteraction } from './useDiceInteraction';
export { usePhysicsSync } from './usePhysicsSync';

// Sync hooks
export { useRemoteDice, useSyncStatus, useCanvasSync } from './sync';

// Control hooks
export { useDiceControls, useCameraControls } from './controls';

export type {
    DiceInteractionState,
    DiceInteractionHandlers,
    UseDiceInteractionProps
} from './useDiceInteraction';

export type { UsePhysicsSyncProps } from './usePhysicsSync';

// Sync hook types
export type {
    UseRemoteDiceProps,
    RemoteDiceOperations,
    SyncStatus,
    SyncStatusState,
    UseSyncStatusProps,
    UseCanvasSyncProps
} from './sync';

// Control hook types
export type {
    DiceType,
    DiceControlsState,
    DiceControlsOperations,
    UseDiceControlsProps,
    CameraControlsState,
    CameraControlsOperations,
    UseCameraControlsProps
} from './controls'; 