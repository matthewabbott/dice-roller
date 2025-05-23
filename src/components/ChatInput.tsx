import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_CHAT_MESSAGE_MUTATION } from '../graphql/operations';

const ChatInput: React.FC = () => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [sendChatMessage, { loading, error }] = useMutation(SEND_CHAT_MESSAGE_MUTATION, {
        onCompleted: () => {
            console.log('Chat message sent successfully');
            setMessage('');
            setIsSubmitting(false);
        },
        onError: (apolloError) => {
            console.error('Chat message error:', apolloError);
            setIsSubmitting(false);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedMessage = message.trim();
        if (!trimmedMessage || isSubmitting) return;

        setIsSubmitting(true);
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

    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-brand-text mb-3">Send Message</h3>

            <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        className="input-field flex-grow"
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading || isSubmitting}
                        maxLength={1000}
                    />
                    <button
                        type="submit"
                        className="btn-primary px-4 py-2"
                        disabled={loading || isSubmitting || !message.trim()}
                    >
                        {loading || isSubmitting ? 'Sending...' : 'Send'}
                    </button>
                </div>

                {error && (
                    <p className="text-sm text-brand-primary">
                        Error sending message: {error.message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default ChatInput; 