import { useState, useCallback } from 'react';

export interface DiceResultOverlay {
    diceId: string;
    result: number;
    position: [number, number, number];
    isVisible: boolean;
    timestamp: number;
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
                timestamp: Date.now()
            });
            return newOverlays;
        });

        console.log(`🎲 Showing result overlay for dice ${diceId}: ${result}`);
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
        hideResultOverlay,
        removeResultOverlay,
        clearAllOverlays,
        cleanupOldOverlays,
        getOverlay
    };
}; 