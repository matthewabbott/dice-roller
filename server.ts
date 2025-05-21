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
    const match = expression.toLowerCase().match(/^(\d+)d(\d+)$/);
    if (!match) {
        // TODO: more sophisticated error handling
        console.error(`Invalid dice expression format: ${expression}`);
        return { result: 0, rolls: [] };
    }

    const numDice = parseInt(match[1], 10);
    const dieType = parseInt(match[2], 10);
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
