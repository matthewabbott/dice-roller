import React from 'react';

// Placeholder
// TODO: Pull data from GraphQL subscription (Feature 4)
const staticRolls = [
    { id: '1', user: 'Player1', expression: '2d6', result: 7, rolls: [3, 4] },
    { id: '2', user: 'Player2', expression: '1d20+2', result: 15, rolls: [13] },
    { id: '3', user: 'Player3', expression: '3d4', result: 9, rolls: [2, 3, 4] },
];

const RollLog: React.FC = () => {
    return (
        <div className="p-4 bg-gray-800 rounded-md shadow-lg h-64 overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-3">Roll Log</h2>
            <p className="text-sm text-gray-400 mb-2">(Displaying static example data)</p> {/* UI Note */}
            <ul className="space-y-2 text-gray-300">
                {staticRolls.map((roll) => (
                    <li key={roll.id} className="bg-gray-700 p-2 rounded">
                        <strong className="text-white">{roll.user}:</strong> Rolled {roll.expression} ({roll.rolls.join(', ')}) = {roll.result}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RollLog;
