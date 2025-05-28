import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

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

    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.enabled = !isCameraLocked;
        }
    }, [isCameraLocked]);

    const toggleCameraLock = useCallback(() => {
        setIsCameraLocked(prev => {
            const newValue = !prev;
            console.log(`📷 Camera ${newValue ? 'locked' : 'unlocked'}`);
            return newValue;
        });
    }, []);

    const resetCamera = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    }, []);

    const toggleFullScreen = useCallback(() => {
        setIsFullScreen(prev => !prev);
    }, []);

    const jumpToPosition = useCallback((position: { x: number; y: number; z: number }, target?: { x: number; y: number; z: number }) => {
        if (controlsRef.current) {
            const controls = controlsRef.current;

            const cameraOffset = { x: 8, y: 10, z: 8 };
            const cameraPosition = {
                x: position.x + cameraOffset.x,
                y: position.y + cameraOffset.y,
                z: position.z + cameraOffset.z
            };

            const lookAtTarget = target || position;

            controls.target.set(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);

            if (controls.object) {
                controls.object.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
                controls.object.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
            }

            controls.update();

            console.log(`📷 Camera jumped to position:`, cameraPosition, `looking at:`, lookAtTarget);
        }
    }, []);

    const state: CameraControlsState = useMemo(() => ({
        isFullScreen,
        isCameraLocked
    }), [isFullScreen, isCameraLocked]);

    const operations: CameraControlsOperations = useMemo(() => ({
        toggleFullScreen,
        toggleCameraLock,
        resetCamera,
        jumpToPosition
    }), [toggleFullScreen, toggleCameraLock, resetCamera, jumpToPosition]);

    return [state, operations, controlsRef];
};