import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { SEND_CHAT_MESSAGE_MUTATION, ROLL_DICE_MUTATION, GET_ACTIVE_USERS_QUERY } from '../graphql/operations';
import { ChatCommandParser } from '../services/ChatCommandParser';
import { getSessionId } from '../utils/sessionId';

interface User {
    sessionId: string;
    username: string;
    color?: string;
    isActive: boolean;
}

export interface ChatInputRef {
    populateCommand: (command: string) => void;
}

const ChatInput = forwardRef<ChatInputRef>((props, ref) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [commandPreview, setCommandPreview] = useState<string | null>(null);
    const [commandError, setCommandError] = useState<string | null>(null);

    const currentSessionId = getSessionId();

    // Get current user info
    const { data: usersData } = useQuery<{ activeUsers: User[] }>(GET_ACTIVE_USERS_QUERY);
    const currentUser = usersData?.activeUsers.find(user => user.sessionId === currentSessionId);
    const currentUsername = currentUser?.username || 'Anonymous';

    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
        populateCommand: (command: string) => {
            setMessage(command);
            // Trigger command parsing for the new message
            handleMessageChange({ target: { value: command } } as React.ChangeEvent<HTMLInputElement>);
        }
    }));

    const [sendChatMessage, { loading: chatLoading, error: chatError }] = useMutation(SEND_CHAT_MESSAGE_MUTATION, {
        onCompleted: () => {
            console.log('Chat message sent successfully');
            setMessage('');
            setIsSubmitting(false);
            setCommandPreview(null);
            setCommandError(null);
        },
        onError: (apolloError) => {
            console.error('Chat message error:', apolloError);
            setIsSubmitting(false);
        }
    });

    const [rollDice, { loading: rollLoading, error: rollError }] = useMutation(ROLL_DICE_MUTATION, {
        onCompleted: (data) => {
            console.log('Dice roll completed:', data);
            setMessage('');
            setIsSubmitting(false);
            setCommandPreview(null);
            setCommandError(null);
        },
        onError: (apolloError) => {
            console.error('Dice roll error:', apolloError);
            setIsSubmitting(false);
        }
    });

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMessage = e.target.value;
        setMessage(newMessage);

        // Parse command and show preview
        if (ChatCommandParser.isCommand(newMessage)) {
            const parsed = ChatCommandParser.parseMessage(newMessage);

            if (parsed.error) {
                setCommandError(parsed.error);
                setCommandPreview(null);
            } else {
                setCommandError(null);

                if (parsed.command === 'roll' || parsed.command === 'r' || parsed.command === 'dice' || parsed.command === 'd') {
                    setCommandPreview(`🎲 Roll ${parsed.diceExpression} as ${currentUsername}`);
                } else if (parsed.command === 'help' || parsed.command === 'h' || parsed.command === '?') {
                    if (parsed.args && parsed.args.length > 0) {
                        setCommandPreview(`❓ Show help for: ${parsed.args[0]}`);
                    } else {
                        setCommandPreview('❓ Show all available commands');
                    }
                } else {
                    setCommandPreview(`⚡ Execute command: /${parsed.command}`);
                }
            }
        } else {
            setCommandPreview(null);
            setCommandError(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedMessage = message.trim();
        if (!trimmedMessage || isSubmitting) return;

        setIsSubmitting(true);

        // Check if it's a command
        if (ChatCommandParser.isCommand(trimmedMessage)) {
            const parsed = ChatCommandParser.parseMessage(trimmedMessage);

            if (parsed.error) {
                setCommandError(parsed.error);
                setIsSubmitting(false);
                return;
            }

            // Handle roll commands
            if (parsed.command === 'roll' || parsed.command === 'r' || parsed.command === 'dice' || parsed.command === 'd') {
                if (parsed.diceExpression) {
                    rollDice({
                        variables: {
                            expression: parsed.diceExpression
                        }
                    });
                } else {
                    setCommandError('Roll command requires a dice expression');
                    setIsSubmitting(false);
                }
                return;
            }

            // Handle help commands
            if (parsed.command === 'help' || parsed.command === 'h' || parsed.command === '?') {
                const helpInfo = parsed.args && parsed.args.length > 0
                    ? ChatCommandParser.getHelp(parsed.args[0])
                    : ChatCommandParser.getHelp();

                const helpMessage = ChatCommandParser.formatHelp(helpInfo);

                // Send help as a chat message
                sendChatMessage({
                    variables: {
                        message: helpMessage
                    }
                });
                return;
            }

            // Unknown command - show error
            setCommandError(parsed.error || 'Unknown command');
            setIsSubmitting(false);
            return;
        }

        // Regular chat message
        sendChatMessage({
            variables: {
                message: trimmedMessage
            }
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const isLoading = chatLoading || rollLoading || isSubmitting;
    const error = chatError || rollError;

    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-brand-text mb-3">Send Message</h3>

            <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        className="input-field flex-grow"
                        placeholder="Type your message or /roll 2d6..."
                        value={message}
                        onChange={handleMessageChange}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        maxLength={1000}
                    />
                    <button
                        type="submit"
                        className="btn-primary px-4 py-2"
                        disabled={isLoading || !message.trim()}
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </div>

                {/* Command Preview */}
                {commandPreview && (
                    <div className="text-sm text-brand-text-muted bg-brand-surface p-2 rounded border-l-2 border-brand-primary">
                        <span className="font-medium">Preview:</span> {commandPreview}
                    </div>
                )}

                {/* Command Error */}
                {commandError && (
                    <div className="text-sm text-brand-primary bg-red-900/20 p-2 rounded border-l-2 border-red-500">
                        <span className="font-medium">Error:</span> {commandError}
                    </div>
                )}

                {/* GraphQL Error */}
                {error && (
                    <p className="text-sm text-brand-primary">
                        Error: {error.message}
                    </p>
                )}

                {/* Help Hint */}
                {!message && (
                    <div className="text-xs text-brand-text-muted">
                        💡 Try <code>/roll 2d6</code>, <code>/r d20</code>, or <code>/help</code> for commands
                    </div>
                )}
            </form>
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 