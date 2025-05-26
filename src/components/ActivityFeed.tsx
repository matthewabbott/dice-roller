import React, { useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { ACTIVITY_ADDED_SUBSCRIPTION, GET_ACTIVE_USERS_QUERY, USER_LIST_CHANGED_SUBSCRIPTION } from '../graphql/operations';
import { useHighlighting } from '../hooks/useHighlighting';
import { CollapsibleSection } from './controls/CollapsibleSection';

interface Roll {
    expression: string;
    results: number[];
    total: number;
    canvasData?: {
        dice: Array<{
            canvasId: string;
            diceType: string;
            position?: { x: number; y: number; z: number };
            isVirtual: boolean;
            virtualRolls?: number[];
            result?: number;
        }>;
        events: Array<{
            id: string;
            type: string;
            diceId: string;
            userId: string;
            timestamp: string;
        }>;
    };
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
    const [activities, setActivitiesState] = useState<Activity[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [showRolls, setShowRolls] = useState(true);
    const [showSystemMessages, setShowSystemMessages] = useState(true);
    const [showChatMessages, setShowChatMessages] = useState(true);

    // Add highlighting functionality
    const { highlightFromActivity, isActivityHighlighted, setActivities } = useHighlighting();

    // Share activities with the highlighting system
    useEffect(() => {
        setActivities(activities);
    }, [activities, setActivities]);

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
                if (newActivity.type === 'ROLL' && newActivity.roll?.canvasData) {
                    console.log('🎲 Roll activity with canvasData:', newActivity.roll.canvasData);
                    console.log('🎲 Dice in this roll:', newActivity.roll.canvasData.dice);
                }
                setActivitiesState(prevActivities => [newActivity, ...prevActivities]);
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

    const handleActivityClick = (activity: Activity) => {
        if (activity.type === 'ROLL') {
            highlightFromActivity(activity.id, activities);
        } else if (activity.type === 'CHAT_MESSAGE') {
            // For chat messages, just toggle the highlight state
            highlightFromActivity(activity.id, activities);
        }
    };

    const renderActivity = (activity: Activity) => {
        // Filter activities based on user preferences
        if (activity.type === 'ROLL' && !showRolls) return null;
        if (activity.type === 'SYSTEM_MESSAGE' && !showSystemMessages) return null;
        if (activity.type === 'CHAT_MESSAGE' && !showChatMessages) return null;

        const isHighlighted = isActivityHighlighted(activity.id);

        if (activity.type === 'ROLL' && activity.roll && activity.user) {
            const roll = activity.roll;
            const userColor = getUserColor(activity.user);

            return (
                <li
                    key={activity.id}
                    className={`p-2 rounded cursor-pointer transition-all duration-200 ${isHighlighted
                        ? 'bg-yellow-200 border-2 border-yellow-400 shadow-lg'
                        : 'bg-brand-surface hover:bg-brand-background'
                        }`}
                    onClick={() => handleActivityClick(activity)}
                    title="Click to highlight dice and jump camera to them"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                            <strong
                                className={`font-medium ${isHighlighted ? 'text-black' : ''}`}
                                style={{
                                    color: isHighlighted ? 'black' : (userColor || '#ffffff'),
                                    textShadow: isHighlighted && userColor ? `0 0 2px ${userColor}, 0 0 4px ${userColor}` : 'none'
                                }}
                            >
                                {activity.user}:
                            </strong>
                            <span className={`${isHighlighted ? 'text-black' : 'text-brand-text'}`}> Rolled {roll.expression}</span>
                            <span className={`${isHighlighted ? 'text-black' : 'text-brand-text'}`}> ({roll.results.join(', ')}) = {roll.total}</span>
                        </div>
                        <span className={`text-xs ml-2 flex-shrink-0 ${isHighlighted ? 'text-gray-700' : 'text-brand-text-muted'}`}>
                            {formatTimestamp(activity.timestamp)}
                        </span>
                    </div>
                </li>
            );
        }

        if (activity.type === 'CHAT_MESSAGE' && activity.message && activity.user) {
            const userColor = getUserColor(activity.user);

            return (
                <li
                    key={activity.id}
                    className={`p-2 rounded cursor-pointer transition-all duration-200 ${isHighlighted
                        ? 'bg-yellow-200 border-2 border-yellow-400 shadow-lg'
                        : 'bg-brand-surface hover:bg-brand-background'
                        }`}
                    onClick={() => handleActivityClick(activity)}
                    title="Click to toggle highlight"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                            <strong
                                className={`font-medium ${isHighlighted ? 'text-black' : ''}`}
                                style={{
                                    color: isHighlighted ? 'black' : (userColor || '#ffffff'),
                                    textShadow: isHighlighted && userColor ? `0 0 2px ${userColor}, 0 0 4px ${userColor}` : 'none'
                                }}
                            >
                                {activity.user}:
                            </strong>
                            <span className={`ml-1 ${isHighlighted ? 'text-black' : 'text-brand-text'}`}>
                                {activity.message}
                            </span>
                        </div>
                        <span className={`text-xs ml-2 flex-shrink-0 ${isHighlighted ? 'text-gray-700' : 'text-brand-text-muted'}`}>
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
                                {activity.user ? `${activity.user}: ` : ''}{activity.message}
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
        <div className="space-y-4">
            {/* Lobby Section */}
            <CollapsibleSection
                title="Lobby"
                icon="👥"
                tooltip="View active players and session information"
                defaultCollapsed={false}
                className="card"
            >
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-brand-text-muted">Active Players ({users.length})</h3>
                    <div className="space-y-2">
                        {users.map((user) => (
                            <div key={user.sessionId} className="flex items-center gap-2 p-2 bg-brand-surface rounded">
                                <div
                                    className="w-3 h-3 rounded-full border border-gray-400"
                                    style={{ backgroundColor: user.color || '#888888' }}
                                    title={`${user.username}'s color`}
                                />
                                <span className="text-brand-text text-sm">{user.username}</span>
                                {user.isActive && (
                                    <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                                        Online
                                    </span>
                                )}
                            </div>
                        ))}
                        {users.length === 0 && (
                            <div className="text-center text-brand-text-muted text-sm py-4">
                                No players connected
                            </div>
                        )}
                    </div>
                </div>
            </CollapsibleSection>

            {/* Activity Feed Section */}
            <CollapsibleSection
                title="Activity Feed"
                icon="📜"
                tooltip="View dice rolls, chat messages, and system notifications"
                defaultCollapsed={false}
                className="card"
                contentClassName="h-80 overflow-y-auto"
            >
                <div className="space-y-3">
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

                    <ul className="space-y-2 text-brand-text-muted">
                        {filteredActivities.map(renderActivity)}
                        {filteredActivities.length === 0 && (
                            <li className="text-center text-brand-text-muted">
                                {activities.length === 0 ? 'No activity yet.' : 'No activities match current filters.'}
                            </li>
                        )}
                    </ul>
                </div>
            </CollapsibleSection>
        </div>
    );
};

export default ActivityFeed; 