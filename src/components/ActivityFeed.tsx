import React, { useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { ACTIVITY_ADDED_SUBSCRIPTION, GET_ACTIVE_USERS_QUERY, USER_LIST_CHANGED_SUBSCRIPTION } from '../graphql/operations';
import { useHighlighting } from '../hooks/useHighlighting';
import { CollapsibleSection } from './controls/CollapsibleSection';
import ChatInput from './ChatInput';
import type { ChatInputRef } from './ChatInput';

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

interface ActivityFeedProps {
    onQuickRoll?: (command: string) => void;
    chatInputRef?: React.RefObject<ChatInputRef | null>;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ onQuickRoll, chatInputRef }) => {
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

    const handleDieButtonClick = (dieType: number) => {
        const command = `/roll 1d${dieType}`;
        if (onQuickRoll) {
            onQuickRoll(command);
        }
    };

    const commonDice = [4, 6, 8, 10, 12, 20];

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Activity Feed Section - Takes most space */}
            <div className="flex-grow min-h-0">
                <CollapsibleSection
                    title="Activity Feed"
                    icon="📜"
                    tooltip="View dice rolls, chat messages, and system notifications"
                    defaultCollapsed={false}
                    className="card h-full"
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

            {/* Quick Roll Commands - Above chat input */}
            <div className="flex-shrink-0">
                <CollapsibleSection
                    title="Quick Roll Commands"
                    icon="🎲"
                    tooltip="Quick roll commands that generate shared dice visible to all players"
                    defaultCollapsed={false}
                    className="card"
                >
                    <div className="space-y-3">
                        {/* Professional Notice */}
                        <div className="p-3 bg-blue-900/20 rounded border-l-4 border-blue-500">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-400 text-sm">🎲</span>
                                <div className="text-xs text-blue-300">
                                    <strong>Shared Dice Commands:</strong> These buttons generate <code>/roll</code> commands
                                    that create dice visible to all players in the session.
                                </div>
                            </div>
                        </div>

                        {/* Quick Roll Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            {commonDice.map((die) => (
                                <button
                                    key={die}
                                    className="btn-primary px-3 py-2 text-sm"
                                    onClick={() => handleDieButtonClick(die)}
                                    title={`Roll 1d${die} - creates shared dice visible to all players`}
                                >
                                    🎲 d{die}
                                </button>
                            ))}
                        </div>
                    </div>
                </CollapsibleSection>
            </div>

            {/* Chat Input - Fixed at bottom */}
            <div className="flex-shrink-0">
                <ChatInput ref={chatInputRef} hideHeader={true} />
            </div>
        </div>
    );
};

export default ActivityFeed; 