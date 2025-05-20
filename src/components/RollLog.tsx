import React, { useState, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { ROLL_ADDED_SUBSCRIPTION } from '../graphql/operations';

interface Roll {
    id: string;
    user: string;
    expression: string;
    result: number;
    rolls: number[];
}

const RollLog: React.FC = () => {
    const [rolls, setRolls] = useState<Roll[]>([]);

    useSubscription(ROLL_ADDED_SUBSCRIPTION, {
        onSubscriptionData: ({ subscriptionData }) => {
            if (subscriptionData.data?.rollAdded) {
                // Add new roll to the beginning of the array
                setRolls(prevRolls => [subscriptionData.data.rollAdded, ...prevRolls]);
            }
        },
    });

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
                        <strong className="text-brand-text">{roll.user}:</strong> Rolled {roll.expression} ({roll.rolls.join(', ')}) = {roll.result}
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
