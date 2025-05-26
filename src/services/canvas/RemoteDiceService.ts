export interface RemoteDice {
    id: string;
    playerId: string;
    playerName: string;
    diceType: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    value?: number;
    timestamp: number;
}

export interface RemotePlayer {
    id: string;
    name: string;
    dice: RemoteDice[];
    lastActivity: number;
}

/**
 * Service for handling remote dice state management
 * Extracted from sync hooks for better testability and separation of concerns
 */
export class RemoteDiceService {
    private remotePlayers: Map<string, RemotePlayer> = new Map();
    private updateCallbacks: ((players: RemotePlayer[]) => void)[] = [];

    /**
     * Add or update a remote dice from another player
     */
    public updateRemoteDice(dice: RemoteDice): void {
        // TODO: Implementation will be moved from sync hooks
        throw new Error('RemoteDiceService.updateRemoteDice not yet implemented');
    }

    /**
     * Remove all dice for a specific player
     */
    public clearPlayerDice(playerId: string): void {
        // TODO: Implementation will be moved from sync hooks
        throw new Error('RemoteDiceService.clearPlayerDice not yet implemented');
    }

    /**
     * Get all remote dice from all players
     */
    public getAllRemoteDice(): RemoteDice[] {
        // TODO: Implementation will be moved from sync hooks
        throw new Error('RemoteDiceService.getAllRemoteDice not yet implemented');
    }

    /**
     * Get dice for a specific player
     */
    public getPlayerDice(playerId: string): RemoteDice[] {
        // TODO: Implementation will be moved from sync hooks
        throw new Error('RemoteDiceService.getPlayerDice not yet implemented');
    }

    /**
     * Get all remote players
     */
    public getAllPlayers(): RemotePlayer[] {
        return Array.from(this.remotePlayers.values());
    }

    /**
     * Subscribe to remote dice updates
     */
    public onUpdate(callback: (players: RemotePlayer[]) => void): void {
        this.updateCallbacks.push(callback);
    }

    /**
     * Unsubscribe from remote dice updates
     */
    public offUpdate(callback: (players: RemotePlayer[]) => void): void {
        const index = this.updateCallbacks.indexOf(callback);
        if (index > -1) {
            this.updateCallbacks.splice(index, 1);
        }
    }

    /**
     * Notify all subscribers of updates
     */
    private notifyUpdate(): void {
        const players = this.getAllPlayers();
        this.updateCallbacks.forEach(callback => callback(players));
    }

    /**
     * Clean up old/inactive players
     */
    public cleanupInactivePlayers(maxAge: number = 300000): void { // 5 minutes default
        const now = Date.now();
        for (const [playerId, player] of this.remotePlayers.entries()) {
            if (now - player.lastActivity > maxAge) {
                this.remotePlayers.delete(playerId);
            }
        }
        this.notifyUpdate();
    }
} 