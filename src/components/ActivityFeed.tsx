import React, { useState, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { ACTIVITY_ADDED_SUBSCRIPTION } from '../graphql/operations';

interface Roll {
    id: string;
    user: string;
    expression: string;
    interpretedExpression: string;
    result: number;
    rolls: number[];
}

interface Activity {
    id: string;
    type: 'ROLL' | 'SYSTEM_MESSAGE';
    timestamp: string;
    user?: string;
    message?: string;
    roll?: Roll;
}

const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);

    const { data, loading, error } = useSubscription<{ activityAdded: Activity }>(ACTIVITY_ADDED_SUBSCRIPTION, {
        onData: ({ data: subscriptionData }) => {
            const newActivity = subscriptionData?.data?.activityAdded;
            if (newActivity) {
                console.log('New activity from subscription:', newActivity);
                setActivities(prevActivities => [newActivity, ...prevActivities]);
            } else {
                console.log('Subscription data received, but no activityAdded field:', subscriptionData?.data);
            }
        },
        onError: (err) => {
            console.error('Error in activity subscription:', err);
        }
    });

    if (loading) console.log('Activity subscription loading...');
    if (error) console.error('Activity subscription hook error object:', error);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderActivity = (activity: Activity) => {
        if (activity.type === 'ROLL' && activity.roll) {
            const roll = activity.roll;
            return (
                <li key={activity.id} className="bg-brand-surface p-2 rounded">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                            <strong className="text-brand-text">{roll.user}:</strong> Rolled {roll.expression}
                            {roll.interpretedExpression && roll.interpretedExpression !== "invalid" && roll.expression !== roll.interpretedExpression && (
                                <span className="text-brand-text-muted"> (interpreted as {roll.interpretedExpression})</span>
                            )}
                            {roll.interpretedExpression === "invalid" && (
                                <span className="text-brand-error"> (invalid expression)</span>
                            )}
                            {' '}({roll.rolls.join(', ')}) = {roll.result}
                        </div>
                        <span className="text-xs text-brand-text-muted ml-2 flex-shrink-0">
                            {formatTimestamp(activity.timestamp)}
                        </span>
                    </div>
                </li>
            );
        } else if (activity.type === 'SYSTEM_MESSAGE' && activity.message) {
            return (
                <li key={activity.id} className="bg-brand-background p-2 rounded border-l-2 border-brand-primary">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                            <span className="text-brand-text-muted italic text-sm">
                                {activity.message}
                            </span>
                        </div>
                        <span className="text-xs text-brand-text-muted ml-2 flex-shrink-0">
                            {formatTimestamp(activity.timestamp)}
                        </span>
                    </div>
                </li>
            );
        }
        return null;
    };

    return (
        <div className="card h-64 overflow-y-auto">
            <h2 className="text-xl font-semibold text-brand-text mb-3">Activity Feed</h2>
            <ul className="space-y-2 text-brand-text-muted">
                {activities.map(renderActivity)}
                {activities.length === 0 && (
                    <li className="text-center text-brand-text-muted">No activity yet.</li>
                )}
            </ul>
        </div>
    );
};

export default ActivityFeed; 