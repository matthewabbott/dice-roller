import React, { useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Header from './Header';
import DiceRoller from './DiceRoller';
import ActivityFeed from './ActivityFeed';
import type { ChatInputRef } from './ChatInput';
import DiceCanvas from './DiceCanvas';
import { CollapsibleSection } from './controls/CollapsibleSection';
import TranslucentSidebar from './TranslucentSidebar';

const Layout: React.FC = () => {
    const chatInputRef = useRef<ChatInputRef>(null);

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
                    <DiceCanvas />
                </div>

                {/* Resizable Panel Overlay System */}
                <PanelGroup
                    direction="horizontal"
                    autoSaveId="dice-roller-layout"
                    className="h-full relative z-10"
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

                    <PanelResizeHandle className="w-1 bg-white/20 hover:bg-white/40 transition-colors relative z-20" />

                    {/* Center - Transparent spacer to allow canvas to show through */}
                    <Panel id="canvas-spacer" order={2}>
                        <div className="h-full relative">
                            {/* Canvas controls positioned over the transparent center */}
                            <div className="absolute bottom-4 left-4 z-10">
                                <HelpButton />
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-white/20 hover:bg-white/40 transition-colors relative z-20" />

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
            </main>
        </div>
    );
};

// Help Button Component
const HelpButton: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(true); // Start expanded as requested

    return (
        <div className="relative">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors"
                title="Camera controls help"
            >
                <span className="text-lg">?</span>
            </button>

            {isExpanded && (
                <div className="absolute bottom-12 left-0 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-xl min-w-80 max-w-96">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">Camera Controls</h4>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-400 hover:text-white ml-2"
                        >
                            ×
                        </button>
                    </div>
                    <div className="text-xs space-y-1 text-gray-300">
                        <div>• <strong>Left Click & Drag:</strong> Rotate camera view</div>
                        <div>• <strong>Right Click & Drag:</strong> Pan camera</div>
                        <div>• <strong>Mouse Wheel:</strong> Zoom in/out</div>
                        <div>• <strong>Space:</strong> Toggle camera lock</div>
                        <div>• <strong>V:</strong> Reset camera view</div>
                        <div>• <strong>F:</strong> Toggle fullscreen</div>
                        <div>• <strong>Shift + Click & Drag dice:</strong> Throw dice</div>
                    </div>
                </div>
            )}
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
