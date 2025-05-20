import React, { useState } from 'react';

const DiceRoller: React.FC = () => {
    const [expression, setExpression] = useState('');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExpression(event.target.value);
    };

    const handleDieButtonClick = (dieType: number) => {
        setExpression(`1d${dieType}`);
    };

    const handleRollClick = () => {
        // TODO: Implement GraphQL mutation (Feature 4)
        console.log(`Rolling: ${expression}`);
        setExpression(''); // Clear input after "rolling"
    };

    const commonDice = [4, 6, 8, 10, 12, 20];

    return (
        <div className="p-4 bg-gray-700 rounded-md shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Roll Dice</h2>
            <div className="flex space-x-2 mb-3">
                {commonDice.map((die) => (
                    <button
                        key={die}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        onClick={() => handleDieButtonClick(die)}
                    >
                        d{die}
                    </button>
                ))}
            </div>
            <div className="flex space-x-2">
                <input
                    type="text"
                    className="flex-grow px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 2d6+3"
                    value={expression}
                    onChange={handleInputChange}
                />
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    onClick={handleRollClick}
                >
                    Roll
                </button>
            </div>
        </div>
    );
};

export default DiceRoller;
