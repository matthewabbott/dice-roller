import React from 'react';
import Header from './Header';
import DiceRoller from './DiceRoller';
import RollLog from './RollLog';

const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Dice Roller and Roll Log */}
                <div className="flex flex-col space-y-4">
                    <DiceRoller />
                    <RollLog />
                </div>

                {/* Right Column: 3D Dice Canvas Placeholder (Feature 5) */}
                <div className="bg-gray-700 rounded-md shadow-lg flex items-center justify-center">
                    <p className="text-gray-400">3D Dice Canvas Placeholder (Feature 5)</p>
                </div>
            </main>
        </div>
    );
};

export default Layout;
