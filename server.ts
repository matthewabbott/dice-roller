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
    result: number;
    rolls: number[];
}

const rolls: Roll[] = [];

const pubsub = createPubSub();

const typeDefs = /* GraphQL */ `
  type Roll {
    id: ID!
    user: String!
    expression: String!
    result: Int!
    rolls: [Int!]!
  }

  type Query {
    rolls: [Roll!]!
  }

  type Mutation {
    rollDice(user: String!, expression: String!): Roll!
  }

  type Subscription {
    rollAdded: Roll!
  }
`;

// Basic XdY dice parser
function parseAndRoll(expression: string): { result: number; rolls: number[] } {
    // Regex: capture number of dice (optional), 'd', and die type (ex: 10 = ten-sided die)
    // Allows for "d6" (defaults to 1d6) or "2d6"
    const match = expression.toLowerCase().match(/^(?:(\d+))?d(\d+)$/);

    if (!match) {
        // TODO: more sophisticated error handling for various invalid formats
        console.error(`Invalid dice expression format: ${expression}. Expected format like "XdY" or "dY".`);
        return { result: 0, rolls: [] };
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

    const rolledResults: number[] = [];
    let totalResult = 0;

    for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * dieType) + 1;
        rolledResults.push(roll);
        totalResult += roll;
    }

    return { result: totalResult, rolls: rolledResults };
}

const resolvers = {
    Query: {
        rolls: () => rolls,
    },
    Mutation: {
        rollDice: (_: any, { user, expression }: { user: string; expression: string }) => {
            const { result, rolls: rolledResults } = parseAndRoll(expression);

            const newRoll: Roll = {
                id: uuidv4(),
                user,
                expression,
                result,
                rolls: rolledResults,
            };

            rolls.push(newRoll);
            pubsub.publish('ROLL_ADDED', newRoll);

            console.log(`Rolled dice: ${expression} for user ${user}. Result: ${result}`);

            return newRoll;
        },
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

const yoga = createYoga({
    schema,
    graphqlEndpoint: '/dice/graphql',
});

// HTTP
const server = createServer(yoga);

// WebSocket
const wsServer = new WebSocketServer({
    server, // same HTTP server
    path: '/dice/graphql',
});

useServer({ schema }, wsServer);

server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/dice/graphql');
});
