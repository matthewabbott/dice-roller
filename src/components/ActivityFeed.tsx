import React, { useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { ACTIVITY_ADDED_SUBSCRIPTION, GET_ACTIVE_USERS_QUERY, USER_LIST_CHANGED_SUBSCRIPTION } from '../graphql/operations';

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
    type: 'ROLL' | 'SYSTEM_MESSAGE' | 'CHAT_MESSAGE';
    timestamp: string;
    user?: string;
    message?: string;
    roll?: Roll;
}

interface User {
    sessionId: string;
    username: string;
    color?: string;
    isActive: boolean;
}

const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [showRolls, setShowRolls] = useState(true);
    const [showSystemMessages, setShowSystemMessages] = useState(true);
    const [showChatMessages, setShowChatMessages] = useState(true);

    const { data: usersData } = useQuery<{ activeUsers: User[] }>(GET_ACTIVE_USERS_QUERY, {
        onCompleted: (data) => {
            setUsers(data.activeUsers);
        }
    });

    // keep colors up to date
    useSubscription<{ userListChanged: User[] }>(USER_LIST_CHANGED_SUBSCRIPTION, {
        onData: ({ data: subscriptionData }) => {
            const updatedUsers = subscriptionData?.data?.userListChanged;
            if (updatedUsers) {
                setUsers(updatedUsers);
            }
        }
    });

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

    const getUserColor = (username: string): string | undefined => {
        return users.find(user => user.username === username)?.color;
    };

    const renderActivity = (activity: Activity) => {
        // Filter activities based on user preferences
        if (activity.type === 'ROLL' && !showRolls) return null;
        if (activity.type === 'SYSTEM_MESSAGE' && !showSystemMessages) return null;
        if (activity.type === 'CHAT_MESSAGE' && !showChatMessages) return null;

        if (activity.type === 'ROLL' && activity.roll) {
            const roll = activity.roll;
            const userColor = getUserColor(roll.user);

            return (
                <li key={activity.id} className="bg-brand-surface p-2 rounded">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                            <strong
                                className="font-medium"
                                style={{ color: userColor || '#ffffff' }}
                            >
                                {roll.user}:
                            </strong>
                            <span className="text-brand-text"> Rolled {roll.expression}</span>
                            {roll.interpretedExpression && roll.interpretedExpression !== "invalid" && roll.expression !== roll.interpretedExpression && (
                                <span className="text-brand-text-muted"> (interpreted as {roll.interpretedExpression})</span>
                            )}
                            {roll.interpretedExpression === "invalid" && (
                                <span className="text-brand-error"> (invalid expression)</span>
                            )}
                            <span className="text-brand-text"> ({roll.rolls.join(', ')}) = {roll.result}</span>
                        </div>
                        <span className="text-xs text-brand-text-muted ml-2 flex-shrink-0">
                            {formatTimestamp(activity.timestamp)}
                        </span>
                    </div>
                </li>
            );
        }

        if (activity.type === 'CHAT_MESSAGE' && activity.message && activity.user) {
            const userColor = getUserColor(activity.user);

            return (
                <li key={activity.id} className="bg-brand-surface p-2 rounded">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                            <strong
                                className="font-medium"
                                style={{ color: userColor || '#ffffff' }}
                            >
                                {activity.user}:
                            </strong>
                            <span className="text-brand-text ml-1">{activity.message}</span>
                        </div>
                        <span className="text-xs text-brand-text-muted ml-2 flex-shrink-0">
                            {formatTimestamp(activity.timestamp)}
                        </span>
                    </div>
                </li>
            );
        }

        if (activity.type === 'SYSTEM_MESSAGE' && activity.message) {
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

    const filteredActivities = activities.filter(activity => {
        if (activity.type === 'ROLL' && !showRolls) return false;
        if (activity.type === 'SYSTEM_MESSAGE' && !showSystemMessages) return false;
        if (activity.type === 'CHAT_MESSAGE' && !showChatMessages) return false;
        return true;
    });

    return (
        <div className="card h-96 overflow-y-auto">
            <div className="mb-3">
                <h2 className="text-xl font-semibold text-brand-text mb-3">Activity Feed</h2>

                {/* Filter Toggle Buttons */}
                <div className="flex space-x-2">
                    <button
                        className={`px-3 py-1 rounded text-sm transition-colors ${showRolls
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-surface text-brand-text-muted hover:bg-brand-background'
                            }`}
                        onClick={() => setShowRolls(!showRolls)}
                        title="Toggle dice rolls"
                    >
                        🎲 Rolls
                    </button>
                    <button
                        className={`px-3 py-1 rounded text-sm transition-colors ${showChatMessages
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-surface text-brand-text-muted hover:bg-brand-background'
                            }`}
                        onClick={() => setShowChatMessages(!showChatMessages)}
                        title="Toggle chat messages"
                    >
                        💬 Chat
                    </button>
                    <button
                        className={`px-3 py-1 rounded text-sm transition-colors ${showSystemMessages
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-surface text-brand-text-muted hover:bg-brand-background'
                            }`}
                        onClick={() => setShowSystemMessages(!showSystemMessages)}
                        title="Toggle system messages"
                    >
                        ℹ️ System
                    </button>
                </div>
            </div>

            <ul className="space-y-2 text-brand-text-muted">
                {filteredActivities.map(renderActivity)}
                {filteredActivities.length === 0 && (
                    <li className="text-center text-brand-text-muted">
                        {activities.length === 0 ? 'No activity yet.' : 'No activities match current filters.'}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default ActivityFeed; 