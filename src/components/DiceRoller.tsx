import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ROLL_DICE_MUTATION } from '../graphql/operations';

const DiceRoller: React.FC = () => {
    const [expression, setExpression] = useState('');
    const [rollDice, { data, loading, error }] = useMutation(ROLL_DICE_MUTATION);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExpression(event.target.value);
    };

    const handleDieButtonClick = (dieType: number) => {
        setExpression(`1d${dieType}`);
    };

    const handleRollClick = async () => {
        if (!expression) return; // Don't roll if input is empty

        try {
            const result = await rollDice({
                variables: {
                    user: "UserX", // Placeholder: hardcoded user. TODO: fix this
                    expression,
                },
            });
            console.log('Mutation result:', result);
            setExpression(''); // Clear input after rolling
        } catch (err) {
            console.error('Error rolling dice:', err);
        }
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
