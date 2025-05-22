import React, { useState, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { ROLL_ADDED_SUBSCRIPTION } from '../graphql/operations';

// TODO: don't spam the chat on rolls with lots of dice (compress with, eg, collapsible, summary, histogram).
// TODO: display how input was actually interpreted by the server if it was modified (e.g., '0d6' became '1d6'). Likely requires changing resolvers.

interface Roll {
    id: string;
    user: string;
    expression: string;
    interpretedExpression: string;
    result: number;
    rolls: number[];
}

const RollLog: React.FC = () => {
    const [rolls, setRolls] = useState<Roll[]>([]);

    const { data, loading, error } = useSubscription<{ rollAdded: Roll }>(ROLL_ADDED_SUBSCRIPTION, {
        onData: ({ data: subscriptionData }) => {
            const newRoll = subscriptionData?.data?.rollAdded;
            if (newRoll) {
                console.log('New roll from subscription:', newRoll);
                setRolls(prevRolls => [newRoll, ...prevRolls]);
            } else {
                console.log('Subscription data received, but no rollAdded field:', subscriptionData?.data);
            }
        },
        onError: (err) => {
            console.error('Error in GraphQL subscription:', err);
        }
    });

    if (loading) console.log('Subscription loading...');
    if (error) console.error('Subscription hook error object:', error);

    // (Debug) log rolls when changed
    // useEffect(() => {
    //     console.log('Current rolls state:', rolls);
    // }, [rolls]);

    return (
        <div className="card h-64 overflow-y-auto">
            <h2 className="text-xl font-semibold text-brand-text mb-3">Roll Log</h2>
            <ul className="space-y-2 text-brand-text-muted">
                {rolls.map((roll) => (
                    <li key={roll.id} className="bg-brand-surface p-2 rounded">
                        <strong className="text-brand-text">{roll.user}:</strong> Rolled {roll.expression}
                        {roll.interpretedExpression && roll.interpretedExpression !== "invalid" && roll.expression !== roll.interpretedExpression && (
                            <span className="text-brand-text-muted"> (interpreted as {roll.interpretedExpression})</span>
                        )}
                        {roll.interpretedExpression === "invalid" && (
                            <span className="text-brand-error"> (invalid expression)</span>
                        )}
                        {' '}({roll.rolls.join(', ')}) = {roll.result}
                    </li>
                ))}
                {rolls.length === 0 && ( // Display message if no rolls yet
                    <li className="text-center text-brand-text-muted">No rolls yet.</li>
                )}
            </ul>
        </div>
    );
};

export default RollLog;
