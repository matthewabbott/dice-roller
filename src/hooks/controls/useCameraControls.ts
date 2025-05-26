import { useState, useCallback, useEffect, useRef } from 'react';

export interface CameraControlsState {
    isFullScreen: boolean;
    isCameraLocked: boolean;
}

export interface CameraControlsOperations {
    toggleFullScreen: () => void;
    toggleCameraLock: () => void;
    resetCamera: () => void;
}

export interface UseCameraControlsProps {
    // Additional props can be added here if needed
}

/**
 * Custom hook for managing camera controls and fullscreen state
 * Extracted from DiceCanvas for better separation of concerns
 */
export const useCameraControls = (_props?: UseCameraControlsProps): [
    CameraControlsState,
    CameraControlsOperations,
    React.RefObject<any>
] => {
    const controlsRef = useRef<any>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isCameraLocked, setIsCameraLocked] = useState(false);

    // Update OrbitControls when camera lock state changes
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.enabled = !isCameraLocked;
        }
    }, [isCameraLocked]);

    // Toggle camera lock
    const toggleCameraLock = useCallback(() => {
        setIsCameraLocked(prev => !prev);
        console.log(`📷 Camera ${!isCameraLocked ? 'locked' : 'unlocked'}`);
    }, [isCameraLocked]);

    // Reset camera to default position
    const resetCamera = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    }, []);

    // Toggle fullscreen mode
    const toggleFullScreen = useCallback(() => {
        setIsFullScreen(prev => !prev);
    }, []);

    const state: CameraControlsState = {
        isFullScreen,
        isCameraLocked
    };

    const operations: CameraControlsOperations = {
        toggleFullScreen,
        toggleCameraLock,
        resetCamera
    };

    return [state, operations, controlsRef];
}; 