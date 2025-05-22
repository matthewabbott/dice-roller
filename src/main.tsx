import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { ApolloClient, InMemoryCache, HttpLink, split, from, ApolloLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { ApolloProvider } from '@apollo/client';
import TimeoutLink from 'apollo-link-timeout';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/dice/graphql',
});

// Timeout link - e.g., 5 seconds (5000 milliseconds)
const timeoutLink = new TimeoutLink(5000);

// Chain timeoutLink and httpLink for HTTP requests
// timeoutLink is cast because its type definitions (Observable<unknown>)
// are not directly compatible with Apollo Client 3's expected Link types (Observable<FetchResult>).
// so not ideal... but works for now
const httpLinkWithTimeout = from([timeoutLink as ApolloLink, httpLink]);

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/dice/graphql',
  })
);

// Queries/mutations to HTTP endpoint (with timeout), subscriptions to WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLinkWithTimeout
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>
);
