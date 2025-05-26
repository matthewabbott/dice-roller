import { DiceResultManager } from './DiceResultManager';

export interface HighlightState {
    id: string;
    type: 'canvas' | 'activity';
    canvasId?: string;
    activityId?: string;
    color: string;
    isActive: boolean;
    timestamp: string;
    userId?: string;
    sessionId?: string;
}

export interface HighlightEvent {
    type: 'highlight_added' | 'highlight_removed' | 'highlight_updated' | 'highlights_cleared';
    highlight?: HighlightState;
    highlights?: HighlightState[];
    timestamp: string;
}

export interface CameraFocusRequest {
    canvasId: string;
    position: { x: number; y: number; z: number };
    smooth: boolean;
    zoom?: number;
    duration?: number;
}

export interface ScrollRequest {
    activityId: string;
    smooth: boolean;
    behavior?: 'auto' | 'smooth';
    block?: 'start' | 'center' | 'end' | 'nearest';
}

export class HighlightManager {
    private highlights = new Map<string, HighlightState>();
    private eventListeners = new Map<string, Function[]>();
    private diceResultManager: DiceResultManager;
    private maxHighlights: number = 10; // Prevent memory issues
    private defaultHighlightColor: string = '#ff6b6b';
    private highlightDuration: number = 30000; // 30 seconds default
    private autoCleanupInterval: NodeJS.Timeout | null = null;

    constructor(diceResultManager: DiceResultManager) {
        this.diceResultManager = diceResultManager;
        this.startAutoCleanup();
    }

    /**
     * Add event listener for highlight events
     */
    public addEventListener(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    /**
     * Remove event listener
     */
    public removeEventListener(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Highlight a canvas dice and its corresponding chat activity
     */
    public highlightDice(
        canvasId: string,
        options: {
            color?: string;
            userId?: string;
            sessionId?: string;
            duration?: number;
        } = {}
    ): HighlightState | null {
        const diceState = this.diceResultManager.getDiceState(canvasId);
        if (!diceState) {
            console.warn(`Cannot highlight dice ${canvasId}: not found in DiceResultManager`);
            return null;
        }

        const highlightId = `dice-${canvasId}-${Date.now()}`;
        const highlight: HighlightState = {
            id: highlightId,
            type: 'canvas',
            canvasId,
            activityId: diceState.activityId,
            color: options.color || this.defaultHighlightColor,
            isActive: true,
            timestamp: new Date().toISOString(),
            userId: options.userId,
            sessionId: options.sessionId
        };

        // Remove any existing highlights for this dice
        this.removeHighlightsByCanvasId(canvasId);

        // Add new highlight
        this.highlights.set(highlightId, highlight);

        // Update dice status in result manager
        this.diceResultManager.updateDiceStatus(canvasId, 'highlighted');

        // Emit event
        this.emit('highlight_added', { highlight, timestamp: new Date().toISOString() });

        // Schedule auto-removal
        if (options.duration !== -1) { // -1 means permanent
            const duration = options.duration || this.highlightDuration;
            setTimeout(() => {
                this.removeHighlight(highlightId);
            }, duration);
        }

        console.log(`🎯 Highlighted dice ${canvasId} with activity ${diceState.activityId}`);
        return highlight;
    }

    /**
     * Highlight a chat activity and its corresponding canvas dice
     */
    public highlightActivity(
        activityId: string,
        options: {
            color?: string;
            userId?: string;
            sessionId?: string;
            duration?: number;
        } = {}
    ): HighlightState[] {
        const diceStates = this.diceResultManager.getDiceForActivity(activityId);
        if (diceStates.length === 0) {
            console.warn(`Cannot highlight activity ${activityId}: no associated dice found`);
            return [];
        }

        const highlights: HighlightState[] = [];

        // Create highlights for all dice in this activity
        diceStates.forEach((diceState, index) => {
            const highlightId = `activity-${activityId}-dice-${diceState.canvasId}-${Date.now()}`;
            const highlight: HighlightState = {
                id: highlightId,
                type: 'activity',
                canvasId: diceState.canvasId,
                activityId,
                color: options.color || this.defaultHighlightColor,
                isActive: true,
                timestamp: new Date().toISOString(),
                userId: options.userId,
                sessionId: options.sessionId
            };

            // Remove any existing highlights for this dice
            this.removeHighlightsByCanvasId(diceState.canvasId);

            // Add new highlight
            this.highlights.set(highlightId, highlight);
            highlights.push(highlight);

            // Update dice status in result manager
            this.diceResultManager.updateDiceStatus(diceState.canvasId, 'highlighted');
        });

        // Emit event
        this.emit('highlight_added', { highlights, timestamp: new Date().toISOString() });

        // Schedule auto-removal
        if (options.duration !== -1) { // -1 means permanent
            const duration = options.duration || this.highlightDuration;
            setTimeout(() => {
                highlights.forEach(h => this.removeHighlight(h.id));
            }, duration);
        }

        console.log(`🎯 Highlighted activity ${activityId} with ${highlights.length} dice`);
        return highlights;
    }

    /**
     * Remove a specific highlight
     */
    public removeHighlight(highlightId: string): boolean {
        const highlight = this.highlights.get(highlightId);
        if (!highlight) {
            return false;
        }

        // Update dice status in result manager
        if (highlight.canvasId) {
            const diceState = this.diceResultManager.getDiceState(highlight.canvasId);
            if (diceState && diceState.status === 'highlighted') {
                this.diceResultManager.updateDiceStatus(highlight.canvasId, 'settled');
            }
        }

        // Remove highlight
        this.highlights.delete(highlightId);

        // Emit event
        this.emit('highlight_removed', { highlight, timestamp: new Date().toISOString() });

        console.log(`🎯 Removed highlight ${highlightId}`);
        return true;
    }

    /**
     * Remove all highlights for a specific canvas dice
     */
    public removeHighlightsByCanvasId(canvasId: string): number {
        let removedCount = 0;
        const toRemove: string[] = [];

        this.highlights.forEach((highlight, id) => {
            if (highlight.canvasId === canvasId) {
                toRemove.push(id);
            }
        });

        toRemove.forEach(id => {
            if (this.removeHighlight(id)) {
                removedCount++;
            }
        });

        return removedCount;
    }

    /**
     * Remove all highlights for a specific activity
     */
    public removeHighlightsByActivityId(activityId: string): number {
        let removedCount = 0;
        const toRemove: string[] = [];

        this.highlights.forEach((highlight, id) => {
            if (highlight.activityId === activityId) {
                toRemove.push(id);
            }
        });

        toRemove.forEach(id => {
            if (this.removeHighlight(id)) {
                removedCount++;
            }
        });

        return removedCount;
    }

    /**
     * Clear all highlights
     */
    public clearAllHighlights(): number {
        const count = this.highlights.size;

        // Update all highlighted dice status
        this.highlights.forEach(highlight => {
            if (highlight.canvasId) {
                const diceState = this.diceResultManager.getDiceState(highlight.canvasId);
                if (diceState && diceState.status === 'highlighted') {
                    this.diceResultManager.updateDiceStatus(highlight.canvasId, 'settled');
                }
            }
        });

        // Clear all highlights
        this.highlights.clear();

        // Emit event
        this.emit('highlights_cleared', { timestamp: new Date().toISOString() });

        console.log(`🎯 Cleared ${count} highlights`);
        return count;
    }

    /**
     * Get all active highlights
     */
    public getActiveHighlights(): HighlightState[] {
        return Array.from(this.highlights.values()).filter(h => h.isActive);
    }

    /**
     * Get highlights for a specific canvas dice
     */
    public getHighlightsForDice(canvasId: string): HighlightState[] {
        return Array.from(this.highlights.values()).filter(h => h.canvasId === canvasId && h.isActive);
    }

    /**
     * Get highlights for a specific activity
     */
    public getHighlightsForActivity(activityId: string): HighlightState[] {
        return Array.from(this.highlights.values()).filter(h => h.activityId === activityId && h.isActive);
    }

    /**
     * Request camera focus on a specific dice
     */
    public requestCameraFocus(
        canvasId: string,
        options: {
            smooth?: boolean;
            zoom?: number;
            duration?: number;
        } = {}
    ): CameraFocusRequest | null {
        const diceState = this.diceResultManager.getDiceState(canvasId);
        if (!diceState || !diceState.position) {
            console.warn(`Cannot focus camera on dice ${canvasId}: position not available`);
            return null;
        }

        const focusRequest: CameraFocusRequest = {
            canvasId,
            position: diceState.position,
            smooth: options.smooth !== false, // Default to smooth
            zoom: options.zoom || 1.5,
            duration: options.duration || 1000
        };

        // Emit camera focus event
        this.emit('camera_focus_requested', focusRequest);

        console.log(`📷 Requested camera focus on dice ${canvasId} at position:`, diceState.position);
        return focusRequest;
    }

    /**
     * Request scroll to a specific activity
     */
    public requestActivityScroll(
        activityId: string,
        options: {
            smooth?: boolean;
            behavior?: 'auto' | 'smooth';
            block?: 'start' | 'center' | 'end' | 'nearest';
        } = {}
    ): ScrollRequest {
        const scrollRequest: ScrollRequest = {
            activityId,
            smooth: options.smooth !== false, // Default to smooth
            behavior: options.behavior || 'smooth',
            block: options.block || 'center'
        };

        // Emit scroll request event
        this.emit('activity_scroll_requested', scrollRequest);

        console.log(`📜 Requested scroll to activity ${activityId}`);
        return scrollRequest;
    }

    /**
     * Toggle highlight for a dice (highlight if not highlighted, remove if highlighted)
     */
    public toggleDiceHighlight(
        canvasId: string,
        options: {
            color?: string;
            userId?: string;
            sessionId?: string;
            duration?: number;
        } = {}
    ): HighlightState | null {
        const existingHighlights = this.getHighlightsForDice(canvasId);

        if (existingHighlights.length > 0) {
            // Remove existing highlights
            existingHighlights.forEach(h => this.removeHighlight(h.id));
            return null;
        } else {
            // Add new highlight
            return this.highlightDice(canvasId, options);
        }
    }

    /**
     * Toggle highlight for an activity
     */
    public toggleActivityHighlight(
        activityId: string,
        options: {
            color?: string;
            userId?: string;
            sessionId?: string;
            duration?: number;
        } = {}
    ): HighlightState[] {
        const existingHighlights = this.getHighlightsForActivity(activityId);

        if (existingHighlights.length > 0) {
            // Remove existing highlights
            existingHighlights.forEach(h => this.removeHighlight(h.id));
            return [];
        } else {
            // Add new highlights
            return this.highlightActivity(activityId, options);
        }
    }

    /**
     * Get statistics about highlights
     */
    public getStats(): {
        totalHighlights: number;
        activeHighlights: number;
        canvasHighlights: number;
        activityHighlights: number;
        highlightsByUser: Record<string, number>;
    } {
        const allHighlights = Array.from(this.highlights.values());
        const activeHighlights = allHighlights.filter(h => h.isActive);

        const highlightsByUser: Record<string, number> = {};
        activeHighlights.forEach(h => {
            if (h.userId) {
                highlightsByUser[h.userId] = (highlightsByUser[h.userId] || 0) + 1;
            }
        });

        return {
            totalHighlights: allHighlights.length,
            activeHighlights: activeHighlights.length,
            canvasHighlights: activeHighlights.filter(h => h.type === 'canvas').length,
            activityHighlights: activeHighlights.filter(h => h.type === 'activity').length,
            highlightsByUser
        };
    }

    /**
     * Update configuration
     */
    public updateConfig(config: {
        maxHighlights?: number;
        defaultHighlightColor?: string;
        highlightDuration?: number;
    }): void {
        if (config.maxHighlights !== undefined) {
            this.maxHighlights = config.maxHighlights;
        }
        if (config.defaultHighlightColor !== undefined) {
            this.defaultHighlightColor = config.defaultHighlightColor;
        }
        if (config.highlightDuration !== undefined) {
            this.highlightDuration = config.highlightDuration;
        }

        console.log('🎯 HighlightManager configuration updated:', {
            maxHighlights: this.maxHighlights,
            defaultHighlightColor: this.defaultHighlightColor,
            highlightDuration: this.highlightDuration
        });
    }

    /**
     * Start automatic cleanup of old highlights
     */
    private startAutoCleanup(): void {
        if (this.autoCleanupInterval) {
            clearInterval(this.autoCleanupInterval);
        }

        this.autoCleanupInterval = setInterval(() => {
            this.cleanupOldHighlights();
        }, 60000); // Check every minute
    }

    /**
     * Clean up old highlights to prevent memory leaks
     */
    private cleanupOldHighlights(): void {
        const now = Date.now();
        const maxAge = this.highlightDuration * 2; // Keep highlights for 2x the duration
        let cleanedCount = 0;

        const toRemove: string[] = [];
        this.highlights.forEach((highlight, id) => {
            const age = now - new Date(highlight.timestamp).getTime();
            if (age > maxAge) {
                toRemove.push(id);
            }
        });

        // Also enforce max highlights limit
        if (this.highlights.size > this.maxHighlights) {
            const sortedHighlights = Array.from(this.highlights.entries())
                .sort(([, a], [, b]) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const excessCount = this.highlights.size - this.maxHighlights;
            for (let i = 0; i < excessCount; i++) {
                toRemove.push(sortedHighlights[i][0]);
            }
        }

        toRemove.forEach(id => {
            if (this.removeHighlight(id)) {
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            console.log(`🎯 Cleaned up ${cleanedCount} old highlights`);
        }
    }

    /**
     * Emit event to listeners
     */
    private emit(event: string, data: any): void {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in HighlightManager event listener for ${event}:`, error);
            }
        });
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        if (this.autoCleanupInterval) {
            clearInterval(this.autoCleanupInterval);
            this.autoCleanupInterval = null;
        }
        this.clearAllHighlights();
        this.eventListeners.clear();
        console.log('🎯 HighlightManager destroyed');
    }
} 