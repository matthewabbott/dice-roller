import { v4 as uuidv4 } from 'uuid';

// Generate and store a session ID in localStorage
export const getSessionId = (): string => {
    let sessionId = localStorage.getItem('dice-roller-session-id');
    if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('dice-roller-session-id', sessionId);
    }
    return sessionId;
}; 