import React, { useRef } from 'react';
import Header from './Header';
import DiceRoller from './DiceRoller';
import ActivityFeed from './ActivityFeed';
import UserList from './UserList';
import ChatInput from './ChatInput';
import type { ChatInputRef } from './ChatInput';
import DiceCanvas from './DiceCanvas';

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
            <main className="flex-grow flex">
                {/* Left Sidebar - Chat & Activity (40% width) */}
                <div className="w-2/5 min-w-0 border-r border-brand-surface">
                    <div className="h-full flex flex-col p-4 space-y-4">
                        {/* Activity Feed and Lobby - Takes most space */}
                        <div className="flex-grow min-h-0">
                            <ActivityFeed />
                        </div>

                        {/* Chat Input - Fixed at bottom */}
                        <div className="flex-shrink-0">
                            <ChatInput ref={chatInputRef} />
                        </div>
                    </div>
                </div>

                {/* Right Side - Canvas & Controls (60% width) */}
                <div className="w-3/5 min-w-0 flex flex-col">
                    {/* Square Canvas - Main focus */}
                    <div className="flex-grow flex items-center justify-center p-4">
                        <div className="aspect-square w-full max-w-2xl">
                            <DiceCanvas />
                        </div>
                    </div>

                    {/* Bottom Controls Panel */}
                    <div className="flex-shrink-0 border-t border-brand-surface p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* User Settings */}
                            <div>
                                <UserList />
                            </div>

                            {/* Local Dice Controls */}
                            <div>
                                <DiceRoller onQuickRoll={handleQuickRoll} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
