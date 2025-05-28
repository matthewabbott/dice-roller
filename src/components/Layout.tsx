import React, { useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Header from './Header';
import DiceRoller from './DiceRoller';
import ActivityFeed from './ActivityFeed';
import type { ChatInputRef } from './ChatInput';
import DiceCanvas from './DiceCanvas';
import TranslucentSidebar from './TranslucentSidebar';
import UnifiedBottomControls from './UnifiedBottomControls';
import TabbedPanel from './TabbedPanel';
import { useCameraControls } from '../hooks/controls/useCameraControls';

const Layout: React.FC = () => {
    const chatInputRef = useRef<ChatInputRef>(null);

    // Camera controls managed at Layout level for sharing between components
    const [cameraState, cameraOperations, controlsRef] = useCameraControls();

    const handleQuickRoll = (command: string) => {
        if (chatInputRef.current) {
            chatInputRef.current.populateCommand(command);
        }
    };

    return (
        <div className="min-h-screen bg-brand-background text-brand-text flex flex-col">
            <Header />
            <main className="flex-grow h-0 relative">
                {/* Full-screen Canvas Background */}
                <div className="absolute inset-0">
                    <DiceCanvas
                        cameraState={cameraState}
                        cameraOperations={cameraOperations}
                        controlsRef={controlsRef}
                    />
                </div>

                {/* Resizable Panel Overlay System */}
                <div className="h-full relative z-10" style={{ pointerEvents: 'none' }}>
                    <PanelGroup
                        direction="horizontal"
                        autoSaveId="dice-roller-layout"
                        className="h-full"
                    >
                        {/* Left Sidebar - Activity Feed (Translucent Overlay) */}
                        <Panel
                            id="activity-feed"
                            defaultSize={25}
                            minSize={20}
                            maxSize={40}
                            order={1}
                        >
                            <TranslucentSidebar side="left" className="p-4">
                                <ActivityFeed onQuickRoll={handleQuickRoll} chatInputRef={chatInputRef} />
                            </TranslucentSidebar>
                        </Panel>

                        <PanelResizeHandle
                            className="w-1 bg-white/20 hover:bg-white/40 transition-colors relative z-20"
                            style={{ pointerEvents: 'auto' }}
                        />

                        {/* Center - Transparent spacer to allow canvas to show through */}
                        <Panel id="canvas-spacer" order={2}>
                            <div className="h-full relative" style={{ pointerEvents: 'none' }}>
                                {/* Unified Bottom Controls - Dice + Camera */}
                                <div className="absolute bottom-0 left-0 right-0" style={{ pointerEvents: 'auto' }}>
                                    <UnifiedBottomControls
                                        onQuickRoll={handleQuickRoll}
                                        isCameraLocked={cameraState.isCameraLocked}
                                        onToggleCameraLock={cameraOperations.toggleCameraLock}
                                        onResetCamera={cameraOperations.resetCamera}
                                        onToggleFullScreen={cameraOperations.toggleFullScreen}
                                    />
                                </div>
                            </div>
                        </Panel>

                        <PanelResizeHandle
                            className="w-1 bg-white/20 hover:bg-white/40 transition-colors relative z-20"
                            style={{ pointerEvents: 'auto' }}
                        />

                        {/* Right Sidebar - Lobby (Translucent Overlay) */}
                        <Panel
                            id="lobby"
                            defaultSize={25}
                            minSize={20}
                            maxSize={40}
                            order={3}
                        >
                            <TranslucentSidebar side="right" className="p-4">
                                <LobbyPanel />
                            </TranslucentSidebar>
                        </Panel>
                    </PanelGroup>
                </div>
            </main>
        </div>
    );
};

// Lobby Panel Component (now tabbed with Lobby and User Settings)
const LobbyPanel: React.FC = () => {
    const tabs = [
        {
            id: 'lobby',
            label: 'Lobby',
            icon: '👥',
            content: <LobbyTab />
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: '⚙️',
            content: <UserSettingsTab />
        }
    ];

    return (
        <TabbedPanel
            tabs={tabs}
            defaultTab="lobby"
            className="h-full"
        />
    );
};

// Lobby Tab - Player list and room information
const LobbyTab: React.FC = () => {
    return (
        <div className="p-4 space-y-4">
            {/* Room Info */}
            <div className="bg-brand-surface/50 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-medium text-brand-text mb-2 flex items-center gap-2">
                    🏠 Room Information
                </h3>
                <div className="space-y-1 text-xs text-brand-text-muted">
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="text-green-400">🟢 Connected</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Room ID:</span>
                        <span className="font-mono">dice-lobby</span>
                    </div>
                </div>
            </div>

            {/* Active Players */}
            <div>
                <DiceRoller onQuickRoll={() => { }} hideQuickRollCommands={true} />
            </div>
        </div>
    );
};

// User Settings Tab - Username, color picker, preferences
const UserSettingsTab: React.FC = () => {
    return (
        <div className="p-4 space-y-4">
            {/* User Settings */}
            <div>
                <h3 className="text-sm font-medium text-brand-text mb-3 flex items-center gap-2">
                    👤 User Profile
                </h3>
                <DiceRoller onQuickRoll={() => { }} hideQuickRollCommands={true} showOnlyUserSettings={true} />
            </div>

            {/* Additional Settings */}
            <div className="bg-brand-surface/50 rounded-lg p-3 border border-white/10">
                <h4 className="text-sm font-medium text-brand-text mb-3 flex items-center gap-2">
                    🎛️ Preferences
                </h4>
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            className="rounded border-gray-600 bg-brand-background text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
                            defaultChecked
                        />
                        <span className="text-brand-text-muted">Show dice result overlays</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            className="rounded border-gray-600 bg-brand-background text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
                            defaultChecked
                        />
                        <span className="text-brand-text-muted">Auto-scroll chat to bottom</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            className="rounded border-gray-600 bg-brand-background text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
                        />
                        <span className="text-brand-text-muted">Enable sound effects</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Layout;
