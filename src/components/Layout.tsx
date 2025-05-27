import React, { useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Header from './Header';
import DiceRoller from './DiceRoller';
import ActivityFeed from './ActivityFeed';
import type { ChatInputRef } from './ChatInput';
import DiceCanvas from './DiceCanvas';
import { CollapsibleSection } from './controls/CollapsibleSection';

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
            <main className="flex-grow h-0">
                <PanelGroup
                    direction="horizontal"
                    autoSaveId="dice-roller-layout"
                    className="h-full"
                >
                    {/* Left Sidebar - Activity Feed */}
                    <Panel
                        id="activity-feed"
                        defaultSize={25}
                        minSize={20}
                        maxSize={40}
                        order={1}
                    >
                        <div className="h-full flex flex-col p-4">
                            <ActivityFeed onQuickRoll={handleQuickRoll} chatInputRef={chatInputRef} />
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-white/20 hover:bg-white/40 transition-colors" />

                    {/* Center - Canvas Area */}
                    <Panel id="canvas" order={2}>
                        <div className="h-full flex flex-col relative">
                            {/* Full Canvas - No longer constrained to square */}
                            <div className="flex-grow relative">
                                <DiceCanvas />

                                {/* Help Button - Bottom Left of Canvas */}
                                <div className="absolute bottom-4 left-4">
                                    <HelpButton />
                                </div>
                            </div>

                            {/* Local Controls Panel - Below Canvas (temporary, will be moved to bottom overlay) */}
                            <div className="flex-shrink-0 border-t border-brand-surface p-4">
                                <CollapsibleSection
                                    title="Local Controls"
                                    icon="🎮"
                                    tooltip="Local dice controls - these don't generate dice on other clients"
                                    defaultCollapsed={true}
                                    className="card"
                                >
                                    <div className="bg-orange-900/20 rounded border-l-4 border-orange-500 p-3 mb-4">
                                        <div className="flex items-start gap-2">
                                            <span className="text-orange-400 text-sm">⚠️</span>
                                            <div className="text-xs text-orange-300">
                                                <strong>Local Controls:</strong> These controls only affect dice on your client.
                                                Other players won't see these dice. Use the Quick Roll Commands in the activity feed
                                                to create shared dice visible to all players.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-panels in half-width layout */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            {/* Dice spawn controls would go here */}
                                            <div className="card bg-brand-surface">
                                                <h4 className="text-sm font-medium text-brand-text-muted mb-2">Spawn Dice</h4>
                                                <p className="text-xs text-brand-text-muted">Local dice controls will be integrated here</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Dice action controls would go here */}
                                            <div className="card bg-brand-surface">
                                                <h4 className="text-sm font-medium text-brand-text-muted mb-2">Actions</h4>
                                                <p className="text-xs text-brand-text-muted">Roll/throw controls will be integrated here</p>
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-white/20 hover:bg-white/40 transition-colors" />

                    {/* Right Sidebar - Lobby */}
                    <Panel
                        id="lobby"
                        defaultSize={25}
                        minSize={20}
                        maxSize={40}
                        order={3}
                    >
                        <div className="h-full flex flex-col p-4">
                            <LobbyPanel />
                        </div>
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
