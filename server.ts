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
    connectionId: string;
    getUsername: () => string | undefined;
    setUsername: (username: string) => void;
    clearUsername: () => void;
}

const activeUsernames = new Set<string>();
const connectionToUsername = new Map<string, string>();

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

            const currentUsername = context.getUsername();

            if (currentUsername && currentUsername !== 'Anonymous') {
                activeUsernames.delete(currentUsername);
                console.log(`User changed name from '${currentUsername}' to '${sanitizedUsername}'`);
            }

            if (sanitizedUsername === 'Anonymous') {
                context.setUsername('Anonymous');
                return {
                    success: true,
                    username: 'Anonymous',
                    message: 'Registered as Anonymous.'
                };
            }

            if (activeUsernames.has(sanitizedUsername)) {
                return {
                    success: false,
                    username: null,
                    message: `Username '${sanitizedUsername}' is already taken.`
                };
            }

            activeUsernames.add(sanitizedUsername);
            context.setUsername(sanitizedUsername);

            console.log(`User registered with username: ${sanitizedUsername}`);

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

function createUserContext(connectionId: string): UserContext {
    return {
        connectionId,
        getUsername: () => connectionToUsername.get(connectionId),
        setUsername: (username: string) => {
            connectionToUsername.set(connectionId, username);
        },
        clearUsername: () => {
            const username = connectionToUsername.get(connectionId);
            if (username && username !== 'Anonymous') {
                activeUsernames.delete(username);
            }
            connectionToUsername.delete(connectionId);
        }
    };
}

const yoga = createYoga({
    schema,
    graphqlEndpoint: '/dice/graphql',
    context: ({ request }) => {
        const connectionId = uuidv4();
        return createUserContext(connectionId);
    }
});

// HTTP
const server = createServer(yoga);

// WebSocket
const wsServer = new WebSocketServer({
    server, // same HTTP server
    path: '/dice/graphql',
});

useServer({
    schema,
    context: (ctx) => {
        const connectionId = uuidv4();
        console.log(`New WebSocket connection established with ID: ${connectionId}`);
        return createUserContext(connectionId);
    },
    onDisconnect: (ctx, code, reason) => {
        // Access the context directly from the ctx object
        // TODO: check if this is right for this ver of graphql-ws
        if (ctx.extra && ctx.extra.context) {
            const context = ctx.extra.context as UserContext;
            const username = context.getUsername();
            if (username && username !== 'Anonymous') {
                console.log(`User '${username}' disconnected. Removing from active usernames.`);
                activeUsernames.delete(username);
            }
            connectionToUsername.delete(context.connectionId);
            console.log(`WebSocket connection ${context.connectionId} disconnected. Code: ${code}, Reason: ${reason}`);
        }
    }
}, wsServer);

server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/dice/graphql');
});
