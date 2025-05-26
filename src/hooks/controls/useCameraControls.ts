import { useState, useCallback, useEffect, useRef } from 'react';

export interface CameraControlsState {
    isFullScreen: boolean;
    isCameraLocked: boolean;
}

export interface CameraControlsOperations {
    toggleFullScreen: () => void;
    toggleCameraLock: () => void;
    resetCamera: () => void;
    jumpToPosition: (position: { x: number; y: number; z: number }, target?: { x: number; y: number; z: number }) => void;
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

    // Jump camera to a specific position with smooth animation
    const jumpToPosition = useCallback((position: { x: number; y: number; z: number }, target?: { x: number; y: number; z: number }) => {
        if (controlsRef.current) {
            const controls = controlsRef.current;

            // Calculate camera position (offset from target for good viewing angle)
            const cameraOffset = { x: 8, y: 10, z: 8 }; // Offset for good dice viewing angle (zoomed out)
            const cameraPosition = {
                x: position.x + cameraOffset.x,
                y: position.y + cameraOffset.y,
                z: position.z + cameraOffset.z
            };

            // Set target (where camera looks at) - use provided target or the dice position
            const lookAtTarget = target || position;

            // Smoothly animate to the new position
            // Note: This requires the controls to support smooth transitions
            // For OrbitControls, we can set the target and position directly
            controls.target.set(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);

            // Set camera position
            if (controls.object) {
                controls.object.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
                controls.object.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
            }

            // Update controls
            controls.update();

            console.log(`📷 Camera jumped to position:`, cameraPosition, `looking at:`, lookAtTarget);
        }
    }, []);

    const state: CameraControlsState = {
        isFullScreen,
        isCameraLocked
    };

    const operations: CameraControlsOperations = {
        toggleFullScreen,
        toggleCameraLock,
        resetCamera,
        jumpToPosition
    };

    return [state, operations, controlsRef];
};