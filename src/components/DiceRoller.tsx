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
        <div className="card">
            <h2 className="text-xl font-semibold text-brand-text mb-3">Roll Dice</h2>
            <div className="flex space-x-2 mb-3">
                {commonDice.map((die) => (
                    <button
                        key={die}
                        className="btn-secondary px-3 py-1"
                        onClick={() => handleDieButtonClick(die)}
                    >
                        d{die}
                    </button>
                ))}
            </div>
            <div className="flex space-x-2">
                <input
                    type="text"
                    className="input-field flex-grow"
                    placeholder="e.g., 2d6+3"
                    value={expression}
                    onChange={handleInputChange}
                />
                <button
                    className="btn-primary px-4 py-2"
                    onClick={handleRollClick}
                >
                    Roll
                </button>
            </div>
        </div>
    );
};

export default DiceRoller;
