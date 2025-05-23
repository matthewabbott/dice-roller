import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { ROLL_DICE_MUTATION, REGISTER_USERNAME_MUTATION, GET_ACTIVE_USERS_QUERY, USER_LIST_CHANGED_SUBSCRIPTION } from '../graphql/operations';
import ColorPicker from './ColorPicker';
import { PRESET_COLORS } from '../constants/colors';
import { getSessionId } from '../utils/sessionId';

interface User {
    sessionId: string;
    username: string;
    color?: string;
    isActive: boolean;
}

const DiceRoller: React.FC = () => {
    const [expression, setExpression] = useState('');
    const [username, setUsername] = useState('Anonymous');
    const [pendingUsername, setPendingUsername] = useState('');
    const [isUsernameRegistered, setIsUsernameRegistered] = useState(true); // Anonymous is always registered
    const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [userColor, setUserColor] = useState<string>(() => {
        return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    });
    const [users, setUsers] = useState<User[]>([]);

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

    const [rollDice, { data, loading, error }] = useMutation(ROLL_DICE_MUTATION, {
        onCompleted: (data) => {
            console.log('Roll mutation completed:', data);
            setExpression('');
        },
        onError: (apolloError) => {
            console.error('Roll mutation error:', apolloError);
        }
    });

    const [registerUsername, { loading: registerLoading, error: registerError }] = useMutation(REGISTER_USERNAME_MUTATION, {
        onCompleted: (data) => {
            console.log('Username registration completed:', data);
            const { success, username: registeredName, message } = data.registerUsername;

            if (success) {
                setUsername(registeredName || 'Anonymous');
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
        if (pendingUsername && pendingUsername !== 'Anonymous' && pendingUsername !== username) {
            if (usernameDebounceTimer.current) {
                clearTimeout(usernameDebounceTimer.current);
            }

            setRegistrationStatus('loading');
            setRegistrationMessage('Checking username availability...');

            usernameDebounceTimer.current = setTimeout(() => {
                attemptUsernameRegistration(pendingUsername);
            }, 800); // 800ms debounce
        }
    }, [pendingUsername]);

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

    const handleExpressionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExpression(event.target.value);
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
        setExpression(`1d${dieType}`);
    };

    const handleRollClick = () => {
        if (!expression) return;

        if (!isUsernameRegistered && username !== 'Anonymous') {
            setRegistrationMessage('Please choose a valid username before rolling dice.');
            return;
        }


        rollDice({
            variables: {
                user: username,
                expression,
            },
        });
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
            <h2 className="text-xl font-semibold text-brand-text mb-3">Roll Dice</h2>

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
            <div className="mb-3">
                <ColorPicker currentColor={userColor} onColorChange={setUserColor} />
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
                    disabled={loading || (!isUsernameRegistered && username !== 'Anonymous')}
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
