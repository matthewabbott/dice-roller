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
    const [rollDice, { data, loading, error }] = useMutation(ROLL_DICE_MUTATION, {
        onCompleted: (data) => {
            console.log('Mutation completed:', data);
            setExpression('');
        },
        onError: (apolloError) => {
            // callback triggered by Apollo Client when the mutation results in an error (GraphQL or network)
            console.error('useMutation onError callback:', apolloError);
            // The 'error' state variable from the hook should get populated.
            // The 'loading' state should automatically be set to false.
        }
    });

    const handleExpressionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExpression(event.target.value);
    };

    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(event.target.value);
    };

    const handleDieButtonClick = (dieType: number) => {
        setExpression(`1d${dieType}`);
    };

    const handleRollClick = () => {
        if (!expression) return;
        const userToRoll = username.trim() === '' ? 'Anonymous' : username;

        // Client will handle loading, error, and onCompleted states.
        rollDice({
            variables: {
                user: userToRoll,
                expression,
            },
        });
        // Omitting .then() or .catch() here. Relying on hook's state and callbacks.
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
                    disabled={loading}
                >
                    {loading ? 'Rolling...' : 'Roll'}
                </button>
            </div>
            {loading && <p className="text-sm text-brand-text-muted mt-2">Rolling...</p>}
            {error && <p className="text-sm text-brand-primary mt-2">Error rolling dice: {error.message}</p>}
        </div>
    );
};

export default DiceRoller;
