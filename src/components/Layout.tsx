import React from 'react';
import Header from './Header';
import DiceRoller from './DiceRoller';
import RollLog from './RollLog';
import UserList from './UserList';

const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-brand-background text-brand-text flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Dice Roller and User List */}
                <div className="flex flex-col space-y-4">
                    <DiceRoller />
                    <UserList />
                </div>

                {/* Middle Column: Roll Log */}
                <div className="flex flex-col">
                    <RollLog />
                </div>

                {/* Right Column: 3D Dice Canvas Placeholder (TODO: implement, Feature 5) */}
                <div className="card flex items-center justify-center">
                    <p className="text-brand-text-muted">3D Dice Canvas Placeholder (Feature 5)</p>
                </div>
            </main>
        </div>
    );
};

export default Layout;
