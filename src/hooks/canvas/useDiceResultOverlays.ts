import { useState, useCallback } from 'react';

export interface DiceResultOverlay {
    diceId: string;
    result: number;
    position: [number, number, number];
    isVisible: boolean;
    timestamp: number;
    originalPosition?: [number, number, number]; // Store original position for distance checks
}

/**
 * Hook for managing floating result number overlays
 * Handles showing, hiding, and cleaning up result overlays for dice
 */
export const useDiceResultOverlays = () => {
    const [overlays, setOverlays] = useState<Map<string, DiceResultOverlay>>(new Map());

    /**
     * Show a result overlay for a specific dice
     */
    const showResultOverlay = useCallback((
        diceId: string,
        result: number,
        position: [number, number, number]
    ) => {
        setOverlays(prev => {
            const newOverlays = new Map(prev);
            newOverlays.set(diceId, {
                diceId,
                result,
                position,
                isVisible: true,
                timestamp: Date.now(),
                originalPosition: [...position] as [number, number, number]
            });
            return newOverlays;
        });

        console.log(`🎲 Showing result overlay for dice ${diceId}: ${result}`);
    }, []);

    /**
     * Update the position of an existing overlay (for following dice)
     */
    const updateOverlayPosition = useCallback((
        diceId: string,
        newPosition: [number, number, number]
    ) => {
        setOverlays(prev => {
            const newOverlays = new Map(prev);
            const overlay = newOverlays.get(diceId);
            if (overlay && overlay.isVisible) {
                newOverlays.set(diceId, {
                    ...overlay,
                    position: [newPosition[0], newPosition[1] + 2, newPosition[2]] // Keep 2 units above dice
                });
            }
            return newOverlays;
        });
    }, []);

    /**
     * Check if dice has moved too far from original position and hide overlay
     */
    const checkDistanceAndHide = useCallback((
        diceId: string,
        currentPosition: [number, number, number],
        maxDistance: number = 3
    ) => {
        setOverlays(prev => {
            const overlay = prev.get(diceId);
            if (!overlay || !overlay.originalPosition || !overlay.isVisible) {
                return prev;
            }

            const [origX, origY, origZ] = overlay.originalPosition;
            const [currX, currY, currZ] = currentPosition;

            const distance = Math.sqrt(
                Math.pow(currX - origX, 2) +
                Math.pow(currY - origY, 2) +
                Math.pow(currZ - origZ, 2)
            );

            if (distance > maxDistance) {
                console.log(`🎲 Hiding overlay for dice ${diceId} - moved too far (${distance.toFixed(2)} > ${maxDistance})`);
                const newOverlays = new Map(prev);
                newOverlays.set(diceId, { ...overlay, isVisible: false });
                return newOverlays;
            }

            return prev;
        });
    }, []);

    /**
     * Hide a result overlay for a specific dice
     */
    const hideResultOverlay = useCallback((diceId: string) => {
        setOverlays(prev => {
            const newOverlays = new Map(prev);
            const overlay = newOverlays.get(diceId);
            if (overlay) {
                newOverlays.set(diceId, { ...overlay, isVisible: false });
            }
            return newOverlays;
        });

        console.log(`🎲 Hiding result overlay for dice ${diceId}`);
    }, []);

    /**
     * Remove a result overlay completely
     */
    const removeResultOverlay = useCallback((diceId: string) => {
        setOverlays(prev => {
            const newOverlays = new Map(prev);
            newOverlays.delete(diceId);
            return newOverlays;
        });

        console.log(`🎲 Removed result overlay for dice ${diceId}`);
    }, []);

    /**
     * Clear all result overlays
     */
    const clearAllOverlays = useCallback(() => {
        setOverlays(new Map());
        console.log('🎲 Cleared all result overlays');
    }, []);

    /**
     * Clean up old overlays (older than specified age)
     */
    const cleanupOldOverlays = useCallback((maxAge: number = 10000) => {
        const now = Date.now();
        setOverlays(prev => {
            const newOverlays = new Map();
            for (const [diceId, overlay] of prev.entries()) {
                if (now - overlay.timestamp < maxAge) {
                    newOverlays.set(diceId, overlay);
                }
            }
            return newOverlays;
        });
    }, []);

    /**
     * Get all current overlays as an array
     */
    const getOverlaysArray = useCallback(() => {
        return Array.from(overlays.values());
    }, [overlays]);

    /**
     * Get a specific overlay by dice ID
     */
    const getOverlay = useCallback((diceId: string) => {
        return overlays.get(diceId);
    }, [overlays]);

    return {
        overlays: getOverlaysArray(),
        showResultOverlay,
        updateOverlayPosition,
        checkDistanceAndHide,
        hideResultOverlay,
        removeResultOverlay,
        clearAllOverlays,
        cleanupOldOverlays,
        getOverlay
    };
}; 