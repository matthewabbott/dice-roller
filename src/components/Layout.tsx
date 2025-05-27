import React, { useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Header from './Header';
import DiceRoller from './DiceRoller';
import ActivityFeed from './ActivityFeed';
import type { ChatInputRef } from './ChatInput';
import DiceCanvas from './DiceCanvas';
import { CollapsibleSection } from './controls/CollapsibleSection';
import TranslucentSidebar from './TranslucentSidebar';
import UnifiedBottomControls from './UnifiedBottomControls';

const Layout: React.FC = () => {
    const chatInputRef = useRef<ChatInputRef>(null);

    const handleQuickRoll = (command: string) => {
        if (chatInputRef.current) {
            chatInputRef.current.populateCommand(command);
        }
    };

    // Placeholder camera control functions - these will be replaced with proper integration later
    const handleToggleCameraLock = () => {
        console.log('Camera lock toggle - TODO: integrate with DiceCanvas');
    };

    const handleResetCamera = () => {
        console.log('Camera reset - TODO: integrate with DiceCanvas');
    };

    const handleToggleFullScreen = () => {
        console.log('Fullscreen toggle - TODO: integrate with DiceCanvas');
    };

    return (
        <div className="min-h-screen bg-brand-background text-brand-text flex flex-col">
            <Header />
            <main className="flex-grow h-0 relative">
                {/* Full-screen Canvas Background */}
                <div className="absolute inset-0">
                    <DiceCanvas />
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
                                {/* Unified Bottom Controls - Sandbox + Camera */}
                                <div className="absolute bottom-0 left-0 right-0" style={{ pointerEvents: 'auto' }}>
                                    <UnifiedBottomControls
                                        onQuickRoll={handleQuickRoll}
                                        isCameraLocked={false}
                                        onToggleCameraLock={handleToggleCameraLock}
                                        onResetCamera={handleResetCamera}
                                        onToggleFullScreen={handleToggleFullScreen}
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

// Lobby Panel Component (extracted user settings from DiceRoller)
const LobbyPanel: React.FC = () => {
    return (
        <div className="space-y-4">
            <CollapsibleSection
                title="Lobby"
                icon="👥"
                tooltip="Player lobby and user settings"
                defaultCollapsed={false}
                className="card"
            >
                <div className="space-y-4">
                    {/* User Settings (extracted from DiceRoller) */}
                    <div>
                        <h4 className="text-sm font-medium text-brand-text-muted mb-3">User Settings</h4>
                        <DiceRoller onQuickRoll={() => { }} hideQuickRollCommands={true} />
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );
};

export default Layout;
