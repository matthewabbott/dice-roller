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
        <div className="card h-64 overflow-y-auto">
            <h2 className="text-xl font-semibold text-brand-text mb-3">Roll Log</h2>
            <p className="text-sm text-brand-text-muted mb-2">(Displaying static example data)</p>
            <ul className="space-y-2 text-brand-text-muted">
                {staticRolls.map((roll) => (
                    <li key={roll.id} className="bg-brand-surface p-2 rounded">
                        <strong className="text-brand-text">{roll.user}:</strong> Rolled {roll.expression} ({roll.rolls.join(', ')}) = {roll.result}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RollLog;
