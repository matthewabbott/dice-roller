import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ROLL_DICE_MUTATION } from '../graphql/operations';

// TODO: advanced user management stuff:
// - enforce username uniqueness (except for "Anonymous").
// - display a list of users in the lobby/room.
// - show a message when a username changes. (resolver needed?)
// - allow username color selection.
// - username input sanitization.

const DiceRoller: React.FC = () => {
    const [expression, setExpression] = useState('');
    const [username, setUsername] = useState('Anonymous')
    const [rollDice, { data, loading, error }] = useMutation(ROLL_DICE_MUTATION);

    const handleExpressionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExpression(event.target.value);
    };

    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(event.target.value);
    };

    const handleDieButtonClick = (dieType: number) => {
        setExpression(`1d${dieType}`);
    };

    const handleRollClick = async () => {
        if (!expression) return; // Don't roll if expression input is empty
        const userToRoll = username.trim() === '' ? 'Anonymous' : username; // Default to Anonymous if username is empty

        try {
            const result = await rollDice({
                variables: {
                    user: userToRoll,
                    expression,
                },
            });
            console.log('Mutation result:', result);
            setExpression('');
        } catch (err) {
            console.error('Error rolling dice:', err);
        }
    };

    const commonDice = [4, 6, 8, 10, 12, 20];

    return (
        <div className="card">
            <h2 className="text-xl font-semibold text-brand-text mb-3">Roll Dice</h2>
            {/* Username Input */}
            <div className="mb-3">
                <label htmlFor="username" className="block text-sm font-medium text-brand-text-muted mb-1">
                    Username
                </label>
                <input
                    type="text"
                    id="username"
                    className="input-field w-full"
                    placeholder="Enter your name"
                    value={username}
                    onChange={handleUsernameChange}
                />
            </div>

            {/* Dice Buttons */}
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

            {/* Expression Input and Roll Button */}
            <div className="flex space-x-2">
                <input
                    type="text"
                    className="input-field flex-grow"
                    placeholder="e.g., 2d6+3"
                    value={expression}
                    onChange={handleExpressionChange}
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
