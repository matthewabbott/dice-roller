# Implementation Plan: TTRPG Dice Roller Widget

## Project Overview
The TTRPG Dice Roller is a web-based widget that allows users to roll virtual dice and view results in real-time, with a shared chat-like log visible to all users. It features interactive 3D dice powered by Three.js and real-time updates via GraphQL subscriptions. The widget is styled with Tailwind CSS to create a cinematic, immersive experience tailored to AlchemyRPG’s storytelling focus.

## Key Features
1. **Dice Rolling Input**: Users can input dice expressions (e.g., “2d6+3”) or select die types (e.g., d20) and roll them.
2. **Real-Time Roll Log**: A chat-like interface displays all users’ rolls in real-time.
3. **Interactive 3D Dice**: Users can interact with 3D dice (e.g., click to roll a d20) with animations.
4. **GraphQL Subscriptions**: Real-time updates for dice rolls using Apollo GraphQL.
5. **Cinematic UI**: Styled with Tailwind CSS for a dark, immersive TTRPG aesthetic.

## Tech Stack
- **Front-End**: React, TypeScript, Tailwind CSS, Three.js (via react-three-fiber)
- **Back-End**: GraphQL (Apollo Client, graphql-yoga for mock server)
- **Real-Time**: GraphQL subscriptions

## Design Philosophy
The widget should enhance AlchemyRPG’s mission of making tabletop RPGs effortless and unforgettable:
- **Intuitive UX**: Simple inputs and clear feedback for rolls.
- **Cinematic Visuals**: Dark, immersive theme with bold typography and animations.
- **Storytelling Focus**: Roll log as a shared narrative to enrich the TTRPG experience.
- **Performance**: Smooth interactions, especially for 3D rendering.

## Best Practices
- Use functional React components with hooks.
- Ensure type safety with TypeScript.
- Optimize 3D rendering for performance.
- Follow component-based architecture for reusability.
- Use Tailwind CSS for rapid, consistent styling.

---

## Step-by-Step Feature Implementation

### 1. Set Up Project Structure
- **Tooling**: Use Vite for a fast React + TypeScript setup.
  ```bash
  npm create vite@latest dice-roller -- --template react-ts
  cd dice-roller
  npm install
  ```
- **Dependencies**:
  ```bash
  npm install tailwindcss postcss autoprefixer @apollo/client graphql graphql-yoga @react-three/fiber @react-three/drei three
  npm install -D concurrently
  ```
- **Tailwind CSS Setup**:
  ```bash
  npx tailwindcss init -p
  ```
  - Configure `tailwind.config.js`:
    ```javascript
    module.exports = {
      content: ['./src/**/*.{js,jsx,ts,tsx}'],
      theme: { extend: {} },
      plugins: [],
    };
    ```

### 2. Build the Dice Rolling Input
- **Component**: `DiceRoller.tsx`
- **Features**:
  - Input field for dice expressions (e.g., “2d6+3”).
  - Buttons for common die types (d4, d6, d8, d10, d12, d20).
  - “Roll” button to trigger the roll.
- **Implementation**:
  - Use `useState` for input state.
  - Parse expressions and send a GraphQL mutation on roll.
  - Support basic expressions (e.g., “XdY+Z”).
- **Best Practices**:
  - Validate inputs to prevent errors.
  - Type roll data with TypeScript.

### 3. Implement the Real-Time Roll Log
- **Component**: `RollLog.tsx`
- **Features**:
  - Display rolls (e.g., “Player1 rolled 2d6+3: [4, 5] = 12”).
  - Update in real-time via subscriptions.
- **Implementation**:
  - Use Apollo’s `useSubscription` to listen for rolls.
  - Store rolls in state and update on new data.
  - Style with Tailwind (e.g., `bg-gray-800`, `text-white`).
- **Best Practices**:
  - Limit displayed rolls or use virtual scrolling.
  - Add fade-in animations for new rolls.

### 4. Create Interactive 3D Dice with Three.js
- **Component**: `DiceCanvas.tsx`
- **Features**:
  - Render a clickable 3D d20 with roll animation.
  - Sync result with the roll log.
- **Implementation**:
  - Use `react-three-fiber` for Three.js integration.
  - Use icosahedron geometry for d20.
  - Trigger roll animation and random result (1–20) on click.
- **Best Practices**:
  - Optimize with low-poly models and minimal lights.
  - Ensure responsive canvas sizing.

### 5. Set Up GraphQL Server with Subscriptions
- **Tool**: `graphql-yoga`
- **Features**:
  - Mutation to roll dice.
  - Subscription to broadcast rolls.
- **Implementation**:
  - Schema:
    ```graphql
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
    ```
  - Store rolls in memory for demo.
- **Best Practices**:
  - Use pub/sub for concurrency.
  - Add authentication in production.

### 6. Integrate Apollo Client for Real-Time Updates
- **Setup**:
  - Configure Apollo Client with HTTP and WebSocket links.
  - Use `split` for subscription routing.
- **Implementation**:
  - In `main.tsx`:
    ```typescript
    import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
    import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
    import { createClient } from 'graphql-ws';
    import { getMainDefinition } from '@apollo/client/utilities';

    const httpLink = new HttpLink({ uri: '/dice/graphql' });
    const wsLink = new GraphQLWsLink(createClient({ url: 'ws://localhost:4000/graphql' }));
    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
      },
      wsLink,
      httpLink
    );
    const client = new ApolloClient({ link: splitLink, cache: new InMemoryCache() });
    ```
- **Best Practices**:
  - Handle loading/error states.
  - Use `useMutation` and `useSubscription`.

### 7. Style the Widget with Tailwind CSS
- **Approach**:
  - Dark theme (`bg-gray-900`, `text-white`).
  - Responsive layout with grid/flexbox.
  - Add animations for rolls.
- **Best Practices**:
  - Ensure accessibility (contrast, focus states).
  - Use utility classes consistently.

### 8. Optimize and Test
- **Performance**:
  - Limit simultaneous 3D dice.
  - Use `React.memo` for static components.
- **Testing**:
  - Test real-time updates across tabs.
  - Verify 3D interactions on multiple devices.

---

## Potential Challenges and Solutions
- **3D Rendering Performance**: Use simpler geometries if slow.
- **Subscription Reliability**: Handle WebSocket reconnections.
- **Expression Parsing**: Use `dice-roller-parser` for accuracy.
- **Cross-Browser Compatibility**: Test WebGL on major browsers.

---

## Notes for AI Coding Agent
- **Component Structure**: Keep components small (e.g., `DiceRoller`, `RollLog`, `DiceCanvas`).
- **Type Safety**: Define interfaces (e.g., `Roll`, `DiceExpression`).
- **Code Organization**: Use folders (`/components`, `/graphql`, `/types`).
- **Documentation**: Comment GraphQL and Three.js sections.