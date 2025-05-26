import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { REGISTER_USERNAME_MUTATION, GET_ACTIVE_USERS_QUERY, USER_LIST_CHANGED_SUBSCRIPTION } from '../graphql/operations';
import ColorPicker from './ColorPicker';
import { CollapsibleSection } from './controls/CollapsibleSection';
import { PRESET_COLORS } from '../constants/colors';
import { getSessionId } from '../utils/sessionId';

interface User {
    sessionId: string;
    username: string;
    color?: string;
    isActive: boolean;
}

interface DiceRollerProps {
    onQuickRoll?: (command: string) => void;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ onQuickRoll }) => {
    const [username, setUsername] = useState('Anonymous');
    const [pendingUsername, setPendingUsername] = useState('');
    const [isUsernameRegistered, setIsUsernameRegistered] = useState(true); // Anonymous is always registered
    const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [userColor, setUserColor] = useState<string>(() => {
        return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    });
    const [users, setUsers] = useState<User[]>([]);
    const [isLocalDiceExpanded, setIsLocalDiceExpanded] = useState(false);

    const currentSessionId = getSessionId();
    const usernameDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Query active users to get current user's color
    const { data: usersData } = useQuery<{ activeUsers: User[] }>(GET_ACTIVE_USERS_QUERY, {
        onCompleted: (data) => {
            setUsers(data.activeUsers);
            const currentUser = data.activeUsers.find(user => user.sessionId === currentSessionId);
            if (currentUser && currentUser.color) {
                setUserColor(currentUser.color);
            }
        }
    });

    // Subscribe to user list changes to keep color in sync
    useSubscription<{ userListChanged: User[] }>(USER_LIST_CHANGED_SUBSCRIPTION, {
        onData: ({ data: subscriptionData }) => {
            const updatedUsers = subscriptionData?.data?.userListChanged;
            if (updatedUsers) {
                setUsers(updatedUsers);
                const currentUser = updatedUsers.find(user => user.sessionId === currentSessionId);
                if (currentUser && currentUser.color) {
                    setUserColor(currentUser.color);
                }
            }
        }
    });

    const [registerUsername, { loading: registerLoading }] = useMutation(REGISTER_USERNAME_MUTATION, {
        onCompleted: (data) => {
            console.log('Username registration completed:', data);
            const { success, username: registeredUsername, message } = data.registerUsername;

            if (success) {
                setUsername(registeredUsername);
                setIsUsernameRegistered(true);
                setRegistrationStatus('success');
            } else {
                setIsUsernameRegistered(false);
                setRegistrationStatus('error');
            }

            setRegistrationMessage(message);
        },
        onError: (apolloError) => {
            console.error('Username registration error:', apolloError);
            setIsUsernameRegistered(false);
            setRegistrationStatus('error');
            setRegistrationMessage('Error registering username. Please try again.');
        }
    });

    useEffect(() => {
        if (usernameDebounceTimer.current) {
            clearTimeout(usernameDebounceTimer.current);
        }

        if (pendingUsername && pendingUsername !== username && pendingUsername !== 'Anonymous') {
            usernameDebounceTimer.current = setTimeout(() => {
                attemptUsernameRegistration(pendingUsername);
            }, 1000);
        }

        return () => {
            if (usernameDebounceTimer.current) {
                clearTimeout(usernameDebounceTimer.current);
            }
        };
    }, [pendingUsername, username]);

    const attemptUsernameRegistration = (usernameToRegister: string) => {
        if (!usernameToRegister || usernameToRegister === '') {
            usernameToRegister = 'Anonymous';
        }

        registerUsername({
            variables: {
                username: usernameToRegister
            }
        });
    };

    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newUsername = event.target.value;

        // Regex: Allow letters, numbers, spaces, and _'. -
        //    Remove anything else
        const allowedCharsRegex = /[^a-zA-Z0-9 _'.\-]/g;
        newUsername = newUsername.replace(allowedCharsRegex, '');

        const maxLength = 60;
        if (newUsername.length > maxLength) {
            newUsername = newUsername.slice(0, maxLength);
        }

        setPendingUsername(newUsername);

        // If switching to Anonymous, immediately set
        if (newUsername === 'Anonymous') {
            setUsername('Anonymous');
            setIsUsernameRegistered(true);
            setRegistrationStatus('success');
            setRegistrationMessage('Using Anonymous name.');
        } else {
            // For non-Anonymous, mark as unregistered until confirmed
            setIsUsernameRegistered(false);
        }
    };

    const handleDieButtonClick = (dieType: number) => {
        const command = `/roll 1d${dieType}`;
        if (onQuickRoll) {
            onQuickRoll(command);
        }
    };

    const getRegistrationStatusColor = () => {
        switch (registrationStatus) {
            case 'success': return 'text-green-500';
            case 'error': return 'text-red-500';
            case 'loading': return 'text-yellow-500';
            default: return 'text-brand-text-muted';
        }
    };

    const commonDice = [4, 6, 8, 10, 12, 20];

    return (
        <div className="card">
            <h2 className="text-xl font-semibold text-brand-text mb-3">User Settings</h2>

            {/* Username Input */}
            <div className="mb-3">
                <label htmlFor="username" className="block text-sm font-medium text-brand-text-muted mb-1">
                    Username
                </label>
                <div className="space-y-1">
                    <input
                        type="text"
                        id="username"
                        className={`input-field w-full ${!isUsernameRegistered && username !== 'Anonymous' ? 'border-red-500' : ''}`}
                        placeholder="Enter your name"
                        value={pendingUsername || username}
                        onChange={handleUsernameChange}
                        disabled={registerLoading}
                    />
                    {registrationMessage && (
                        <p className={`text-xs ${getRegistrationStatusColor()}`}>
                            {registrationStatus === 'loading' && <span className="inline-block animate-pulse mr-1">⋯</span>}
                            {registrationMessage}
                        </p>
                    )}
                </div>
            </div>

            {/* Color Picker */}
            <div className="mb-4">
                <ColorPicker currentColor={userColor} onColorChange={setUserColor} />
            </div>

            {/* Local Dice Controls - Collapsible Section */}
            <div className="border-t border-brand-surface pt-3">
                <button
                    onClick={() => setIsLocalDiceExpanded(!isLocalDiceExpanded)}
                    className="w-full flex items-center justify-between p-2 hover:bg-brand-surface rounded transition-colors"
                    title="Local dice controls for testing and practice"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-brand-text-muted">Local Dice Controls</span>
                        <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded border border-orange-500/30">
                            Testing Only
                        </span>
                    </div>
                    <span className="text-brand-text-muted">
                        {isLocalDiceExpanded ? '▼' : '▶'}
                    </span>
                </button>

                {isLocalDiceExpanded && (
                    <div className="mt-3 space-y-3">
                        {/* Professional Notice */}
                        <div className="p-3 bg-orange-900/20 rounded border-l-4 border-orange-500">
                            <div className="flex items-start gap-2">
                                <span className="text-orange-400 text-sm">ℹ️</span>
                                <div className="text-xs text-orange-300">
                                    <strong>Local Testing Mode:</strong> These dice are for testing and practice only.
                                    They are not shared with other players in the session. Use the chat's <code>/roll</code>
                                    command to roll dice that everyone can see.
                                </div>
                            </div>
                        </div>

                        {/* Quick Roll Buttons */}
                        <div>
                            <h3 className="text-sm font-medium text-brand-text-muted mb-2">Quick Roll Dice</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {commonDice.map((die) => (
                                    <button
                                        key={die}
                                        className="btn-secondary px-3 py-2 text-sm"
                                        onClick={() => handleDieButtonClick(die)}
                                        title={`Roll 1d${die} - populates chat with /roll 1d${die}`}
                                    >
                                        🎲 d{die}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-brand-text-muted mt-2">
                                💡 These buttons populate the chat input with <code>/roll</code> commands
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiceRoller;
