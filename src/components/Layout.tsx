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
            <main className="flex-grow flex flex-col">
                {/* Canvas - Primary Focus (70% of viewport height) */}
                <div className="flex-grow-[7] min-h-0 p-4">
                    <div className="h-full">
                        <DiceCanvas />
                    </div>
                </div>

                {/* Bottom Panel - Chat & Controls (30% of viewport height) */}
                <div className="flex-grow-[3] min-h-0 border-t border-brand-surface">
                    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                        {/* Left: Chat/Activity (spans 2 columns on large screens) */}
                        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
                            <div className="flex-grow min-h-0">
                                <ActivityFeed />
                            </div>
                            <div className="flex-shrink-0">
                                <ChatInput ref={chatInputRef} />
                            </div>
                        </div>

                        {/* Right: Controls/Users (1 column on large screens) */}
                        <div className="flex flex-col space-y-4 min-h-0">
                            <div className="flex-shrink-0">
                                <UserList />
                            </div>
                            <div className="flex-shrink-0">
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
