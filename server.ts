import { createYoga, createPubSub } from 'graphql-yoga';
import { createServer } from 'node:http';
import { v4 as uuidv4 } from 'uuid';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';

// TODO: more sophisticated storage
interface Roll {
    id: string;
    user: string;
    expression: string;
    interpretedExpression: string;
    result: number;
    rolls: number[];
}

interface UserContext {
    sessionId: string;
    getUsername: () => string | undefined;
    setUsername: (username: string) => void;
    clearUsername: () => void;
}

const activeUsernames = new Set<string>();
const sessionToUsername = new Map<string, string>();
const usernameToSession = new Map<string, string>();

const rolls: Roll[] = [];

const pubsub = createPubSub();

const typeDefs = /* GraphQL */ `
  type Roll {
    id: ID!
    user: String!
    expression: String!
    interpretedExpression: String!
    result: Int!
    rolls: [Int!]!
  }

  type RegisterUsernameResponse {
    success: Boolean!
    username: String
    message: String
  }

  type Query {
    rolls: [Roll!]!
  }

  type Mutation {
    rollDice(user: String!, expression: String!): Roll!
    registerUsername(username: String!): RegisterUsernameResponse!
  }

  type Subscription {
    rollAdded: Roll!
  }
`;

function sanitizeUsername(username: string): string {
    let sanitizedUser = username.trim();
    if (sanitizedUser === '') {
        return 'Anonymous';
    }

    const allowedCharsRegex = /[^a-zA-Z0-9 _'.\-]/g; // Escaped hyphen
    sanitizedUser = sanitizedUser.replace(allowedCharsRegex, '');

    const maxLength = 60;
    if (sanitizedUser.length > maxLength) {
        sanitizedUser = sanitizedUser.slice(0, maxLength);
    }

    // If after all sanitization, username is empty, default to Anonymous
    if (sanitizedUser.trim() === '') {
        return 'Anonymous';
    }

    return sanitizedUser;
}

// Basic XdY dice parser
function parseAndRoll(expression: string): { result: number; rolls: number[]; interpretedExpression: string } {
    // Regex: capture number of dice (optional), 'd', and die type (ex: 10 = ten-sided die)
    // Allows for, eg, "d6" (read as 1d6) or stuff like "3d77"
    const match = expression.toLowerCase().match(/^(?:(\d+))?d(\d+)$/);

    if (!match) {
        // TODO: more sophisticated error handling for various invalid formats
        console.error(`Invalid dice expression format: ${expression}. Expected format like "XdY" or "dY".`);
        return { result: 0, rolls: [], interpretedExpression: "invalid" };
    }

    // match[1]: numDice (optional), match[2]: dieType
    let numDice = match[1] ? parseInt(match[1], 10) : 1; // Default to 1 if not specified
    let dieType = parseInt(match[2], 10);

    const MAX_DICE = 10001; // Surely you don't need to roll more than 10000 dice...

    if (numDice > MAX_DICE) {
        console.warn(`User attempted to roll ${numDice}d${dieType}. Capping at ${MAX_DICE} dice.`);
        numDice = MAX_DICE;
    }

    if (numDice <= 0) { // You have to roll at least one die. This makes you. (e.g. "0d6" becomes "1d6")
        console.warn(`User attempted to roll ${numDice} dice. Defaulting to 1 die.`);
        numDice = 1;
    }

    // dice can't have less than one side
    if (dieType < 1) {
        console.warn(`Invalid die type: ${dieType}. Defaulting to d1.`);
        dieType = 1;
    }

    const interpretedExpressionString = `${numDice}d${dieType}`;
    const rolledResults: number[] = [];
    let totalResult = 0;

    for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * dieType) + 1;
        rolledResults.push(roll);
        totalResult += roll;
    }

    return { result: totalResult, rolls: rolledResults, interpretedExpression: interpretedExpressionString };
}

const resolvers = {
    Query: {
        rolls: () => rolls,
    },
    Mutation: {
        rollDice: (_: any, { user, expression }: { user: string; expression: string }, context: UserContext) => {
            let sanitizedUser = sanitizeUsername(user);

            const { result, rolls: rolledResults, interpretedExpression } = parseAndRoll(expression);

            const newRoll: Roll = {
                id: uuidv4(),
                user: sanitizedUser,
                expression,
                interpretedExpression,
                result,
                rolls: rolledResults,
            };

            rolls.push(newRoll);
            pubsub.publish('ROLL_ADDED', newRoll);

            console.log(`Rolled dice: ${expression} (interpreted as ${interpretedExpression}) for user ${sanitizedUser}. Result: ${result}`);

            return newRoll;
        },
        registerUsername: (_: any, { username }: { username: string }, context: UserContext) => {
            const sanitizedUsername = sanitizeUsername(username);
            const sessionId = context.sessionId;
            console.log(`Session ${sessionId} attempting to register username: ${sanitizedUsername}`);

            const currentUsername = context.getUsername();

            // if user already has a registered non-Anonymous username, unregister
            if (currentUsername && currentUsername !== 'Anonymous') {
                console.log(`Session ${sessionId} changing name from '${currentUsername}' to '${sanitizedUsername}'`);
                activeUsernames.delete(currentUsername);
                usernameToSession.delete(currentUsername);
            }

            // ff registering as Anonymous, always allow
            if (sanitizedUsername === 'Anonymous') {
                context.setUsername('Anonymous');
                return {
                    success: true,
                    username: 'Anonymous',
                    message: 'Registered as Anonymous.'
                };
            }

            // check if username is taken by another session
            if (activeUsernames.has(sanitizedUsername)) {
                const existingSessionId = usernameToSession.get(sanitizedUsername);

                // if the same session is re-registering the same name, allow it
                if (existingSessionId === sessionId) {
                    console.log(`Session ${sessionId} reaffirming username: ${sanitizedUsername}`);
                    return {
                        success: true,
                        username: sanitizedUsername,
                        message: 'Username already registered to your session.'
                    };
                }

                console.log(`Username '${sanitizedUsername}' is taken by session ${existingSessionId}`);
                return {
                    success: false,
                    username: null,
                    message: `Username '${sanitizedUsername}' is already taken.`
                };
            }

            activeUsernames.add(sanitizedUsername);
            context.setUsername(sanitizedUsername);
            usernameToSession.set(sanitizedUsername, sessionId);

            console.log(`Session ${sessionId} registered username: ${sanitizedUsername}`);

            return {
                success: true,
                username: sanitizedUsername,
                message: 'Username registered successfully.'
            };
        }
    },
    Subscription: {
        rollAdded: {
            subscribe: () => pubsub.subscribe('ROLL_ADDED'),
            resolve: (payload: any) => payload,
        },
    },
};

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

function createUserContext(sessionId: string): UserContext {
    return {
        sessionId,
        getUsername: () => sessionToUsername.get(sessionId),
        setUsername: (username: string) => {
            sessionToUsername.set(sessionId, username);
        },
        clearUsername: () => {
            const username = sessionToUsername.get(sessionId);
            if (username && username !== 'Anonymous') {
                activeUsernames.delete(username);
                usernameToSession.delete(username);
                console.log(`Cleared username '${username}' for session ${sessionId}`);
            }
            sessionToUsername.delete(sessionId);
        }
    };
}

const yoga = createYoga({
    schema,
    graphqlEndpoint: '/dice/graphql',
    context: ({ request }) => {
        // Extract session ID from request headers or generate new one if not provided
        const sessionId = request.headers.get('x-session-id') || uuidv4();
        console.log(`HTTP request from session: ${sessionId}`);
        return createUserContext(sessionId);
    }
});

// HTTP
const server = createServer(yoga);

// WebSocket
const wsServer = new WebSocketServer({
    server, // same HTTP server
    path: '/dice/graphql',
});

// Enhance WebSocketServer with connection tracking
const activeSessions = new Set<string>();

wsServer.on('connection', (socket, request) => {
    console.log(`Raw WebSocket connection received. Total connections: ${wsServer.clients.size}`);

    socket.on('close', (code, reason) => {
        console.log(`Raw WebSocket close event. Code: ${code}, Reason: ${Buffer.from(reason).toString()}`);
        console.log(`Remaining connections: ${wsServer.clients.size}`);
    });
});

useServer({
    schema,
    context: (ctx) => {
        // Extract session ID from connection params or generate new one if not provided
        const sessionId = ctx.connectionParams?.sessionId as string || uuidv4();
        console.log(`WebSocket connection established for session: ${sessionId}`);
        activeSessions.add(sessionId);
        console.log(`Active sessions: ${Array.from(activeSessions).join(', ')}`);
        return createUserContext(sessionId);
    },
    onDisconnect: (ctx, code, reason) => {
        console.log(`onDisconnect triggered. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
        console.log(`onDisconnect ctx details: ${JSON.stringify({
            connectionParams: ctx.connectionParams,
            hasExtra: !!ctx.extra,
            extraKeys: ctx.extra ? Object.keys(ctx.extra) : []
        }, null, 2)}`);

        // Use the session ID to clean up when WebSocket disconnects
        if (ctx.extra && ctx.extra.context) {
            const context = ctx.extra.context as UserContext;
            const username = context.getUsername();
            const sessionId = context.sessionId;

            activeSessions.delete(sessionId);
            console.log(`Session removed from active sessions. Remaining: ${Array.from(activeSessions).join(', ')}`);

            if (username && username !== 'Anonymous') {
                console.log(`Session ${sessionId} disconnected with username '${username}'. Removing from active usernames.`);
                activeUsernames.delete(username);
                usernameToSession.delete(username);
            }
            sessionToUsername.delete(sessionId);
            console.log(`WebSocket disconnected for session ${sessionId}. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
        } else {
            console.log(`Could not access context in onDisconnect. ctx.extra: ${ctx.extra ? 'exists' : 'undefined'}`);

            // Try to find session ID in connection params
            const sessionId = ctx.connectionParams?.sessionId as string;
            if (sessionId) {
                console.log(`Found sessionId ${sessionId} in connectionParams, attempting cleanup.`);
                const username = sessionToUsername.get(sessionId);
                if (username && username !== 'Anonymous') {
                    console.log(`Cleanup for session ${sessionId} with username '${username}'.`);
                    activeUsernames.delete(username);
                    usernameToSession.delete(username);
                }
                sessionToUsername.delete(sessionId);
                activeSessions.delete(sessionId);
            } else {
                console.log('Could not find sessionId in connectionParams.');
            }
        }
    }
}, wsServer);

server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/dice/graphql');
});
