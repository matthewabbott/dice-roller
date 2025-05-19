### Project Roadmap: TTRPG Dice Roller Widget

#### **Feature 1: Project Initialization**
Set up the foundational structure and dependencies for the project.

- **Commit 1.1:** Initialize Git repository in the 'dice' folder.
  - Run `git init` to start version control.

- **Commit 1.2:** Create a new React project with TypeScript using Vite.
  - Execute `npm create vite@latest . -- --template react-ts` and follow prompts.

- **Commit 1.3:** Install necessary dependencies.
  - Install required libraries:
    ```bash
    npm install tailwindcss@3.4.16 postcss autoprefixer @apollo/client graphql graphql-yoga @react-three/fiber @react-three/drei three
    npm install -D concurrently
    ```

- **Commit 1.4:** Configure Tailwind CSS.
  - Initialize Tailwind with `npx tailwindcss init -p` and update `tailwind.config.js`:
    ```javascript
    module.exports = {
      content: ['./src/**/*.{js,jsx,ts,tsx}'],
      theme: { extend: {} },
      plugins: [],
    };
    ```
  - Add Tailwind directives to `src/index.css`.

- **Commit 1.5:** Set up basic folder structure.
  - Create `src/components`, `src/graphql`, `src/types`, and `src/styles` folders.

---

#### **Feature 2: GraphQL Server Setup**
Establish a GraphQL server to handle real-time dice rolling and chat functionality.

- **Commit 2.1:** Create a new file for the GraphQL server.
  - Add `server.ts` in the root directory.

- **Commit 2.2:** Define the GraphQL schema.
  - Define types, queries, mutations, and subscriptions in `server.ts`.

- **Commit 2.3:** Implement resolvers for the schema.
  - Add resolver logic for dice rolls and chat messages in `server.ts`.

- **Commit 2.4:** Set up the GraphQL server using graphql-yoga.
  - Configure the server with HTTP and WebSocket support in `server.ts`.

- **Commit 2.5:** Add a script to run the server.
  - Update `package.json` with:
    ```json
    "scripts": {
      "server": "ts-node server.ts"
    }
    ```

---

#### **Feature 3: Basic UI Components**
Build the core UI elements for the dice roller and roll log.

- **Commit 3.1:** Create a basic layout component.
  - Add `src/components/Layout.tsx` with placeholders for dice roller, roll log, and 3D canvas.

- **Commit 3.2:** Add a header component.
  - Create `src/components/Header.tsx` with a title like "TTRPG Dice Roller".

- **Commit 3.3:** Create a dice roller input component.
  - Add `src/components/DiceRoller.tsx` with inputs for dice expressions (e.g., "2d6") and roll buttons.

- **Commit 3.4:** Implement the roll log component.
  - Create `src/components/RollLog.tsx` to display a static list of rolls.

- **Commit 3.5:** Style components using Tailwind CSS.
  - Apply a dark theme (e.g., `bg-gray-900 text-white`) to all components.

---

#### **Feature 4: GraphQL Client Integration**
Integrate the front-end with the GraphQL server for real-time updates.

- **Commit 4.1:** Set up Apollo Client in the React app.
  - Add Apollo Client setup in `src/main.tsx`.

- **Commit 4.2:** Configure Apollo Client to connect to the GraphQL server.
  - Point Apollo Client to `http://localhost:4000/graphql` in `src/main.tsx`.

- **Commit 4.3:** Create GraphQL queries and mutations for dice rolling.
  - Add `src/graphql/dice.graphql` with roll-related operations.

- **Commit 4.4:** Implement subscription for real-time roll updates.
  - Update `src/graphql/dice.graphql` with a subscription and use it in `RollLog.tsx`.

- **Commit 4.5:** Connect the dice roller component to the GraphQL API.
  - Update `DiceRoller.tsx` to trigger mutations and display results in `RollLog.tsx`.

---

#### **Feature 5: 3D Dice Rendering**
Add 3D dice visualization using Three.js.

- **Commit 5.1:** Create a new component for the 3D dice canvas.
  - Add `src/components/DiceCanvas.tsx` for the 3D scene.

- **Commit 5.2:** Set up react-three-fiber in the component.
  - Configure `DiceCanvas.tsx` with a basic Three.js scene.

- **Commit 5.3:** Create a basic 3D scene with a dice model.
  - Add a simple d20 model (e.g., icosahedron) in `DiceCanvas.tsx`.

- **Commit 5.4:** Implement dice rolling animation.
  - Add rotation animation and random result logic in `DiceCanvas.tsx`.

- **Commit 5.5:** Sync the 3D dice result with the roll log.
  - Connect `DiceCanvas.tsx` to the GraphQL mutation and update `RollLog.tsx`.

---

#### **Feature 6: Chat Log**
Implement a chat system for multiplayer interaction.

- **Commit 6.1:** Create a chat input component.
  - Add `src/components/ChatInput.tsx` with a text input and send button.

- **Commit 6.2:** Add a chat log display component.
  - Create `src/components/ChatLog.tsx` to display messages.

- **Commit 6.3:** Implement GraphQL mutation for sending messages.
  - Add `src/graphql/chat.graphql` with a message-sending mutation.

- **Commit 6.4:** Set up subscription for real-time chat updates.
  - Update `src/graphql/chat.graphql` with a subscription and use it in `ChatLog.tsx`.

- **Commit 6.5:** Integrate chat functionality with the UI.
  - Connect `ChatInput.tsx` to the mutation and display results in `ChatLog.tsx`.

---

#### **Feature 7: Testing and Optimization**
Polish the widget for reliability and performance.

- **Commit 7.1:** Write unit tests for critical components.
  - Add tests for `DiceRoller.tsx` and GraphQL operations using a testing library (e.g., Jest).

- **Commit 7.2:** Optimize 3D rendering performance.
  - Adjust `DiceCanvas.tsx` to limit dice complexity and improve frame rate.

- **Commit 7.3:** Ensure cross-browser compatibility.
  - Test and tweak CSS/JS in `src/` for Chrome, Firefox, and Safari.

- **Commit 7.4:** Add error handling and loading states.
  - Update components with loading spinners and error messages.

---

### Complete Roadmap as a Single Artifact

Here’s the full roadmap wrapped in a single artifact for easy reference:


# Project Roadmap: TTRPG Dice Roller Widget

## Feature 1: Project Initialization
- **Commit 1.1:** Initialize Git repository in the 'dice' folder.  
  - `git init`
- **Commit 1.2:** Create a new React project with TypeScript using Vite.  
  - `npm create vite@latest dice-roller -- --template react-ts`
- **Commit 1.3:** Install necessary dependencies.  
  - `npm install tailwindcss postcss autoprefixer @apollo/client graphql graphql-yoga @react-three/fiber @react-three/drei three`  
  - `npm install -D concurrently`
- **Commit 1.4:** Configure Tailwind CSS.  
  - `npx tailwindcss init -p`  
  - Update `tailwind.config.js` and `src/index.css`
- **Commit 1.5:** Set up basic folder structure.  
  - Create `src/components`, `src/graphql`, `src/types`, `src/styles`

## Feature 2: GraphQL Server Setup
- **Commit 2.1:** Create a new file for the GraphQL server.  
  - Add `server.ts`
- **Commit 2.2:** Define the GraphQL schema.  
  - Add schema in `server.ts`
- **Commit 2.3:** Implement resolvers for the schema.  
  - Add resolvers in `server.ts`
- **Commit 2.4:** Set up the GraphQL server using graphql-yoga.  
  - Configure server in `server.ts`
- **Commit 2.5:** Add a script to run the server.  
  - Update `package.json` with `"server": "ts-node server.ts"`

## Feature 3: Basic UI Components
- **Commit 3.1:** Create a basic layout component.  
  - Add `src/components/Layout.tsx`
- **Commit 3.2:** Add a header component.  
  - Add `src/components/Header.tsx`
- **Commit 3.3:** Create a dice roller input component.  
  - Add `src/components/DiceRoller.tsx`
- **Commit 3.4:** Implement the roll log component.  
  - Add `src/components/RollLog.tsx`
- **Commit 3.5:** Style components using Tailwind CSS.  
  - Apply styles to all components

## Feature 4: GraphQL Client Integration
- **Commit 4.1:** Set up Apollo Client in the React app.  
  - Update `src/main.tsx`
- **Commit 4.2:** Configure Apollo Client to connect to the GraphQL server.  
  - Update `src/main.tsx`
- **Commit 4.3:** Create GraphQL queries and mutations for dice rolling.  
  - Add `src/graphql/dice.graphql`
- **Commit 4.4:** Implement subscription for real-time roll updates.  
  - Update `src/graphql/dice.graphql` and `RollLog.tsx`
- **Commit 4.5:** Connect the dice roller component to the GraphQL API.  
  - Update `DiceRoller.tsx` and `RollLog.tsx`

## Feature 5: 3D Dice Rendering
- **Commit 5.1:** Create a new component for the 3D dice canvas.  
  - Add `src/components/DiceCanvas.tsx`
- **Commit 5.2:** Set up react-three-fiber in the component.  
  - Update `DiceCanvas.tsx`
- **Commit 5.3:** Create a basic 3D scene with a dice model.  
  - Update `DiceCanvas.tsx`
- **Commit 5.4:** Implement dice rolling animation.  
  - Update `DiceCanvas.tsx`
- **Commit 5.5:** Sync the 3D dice result with the roll log.  
  - Update `DiceCanvas.tsx` and `RollLog.tsx`

## Feature 6: Chat Log
- **Commit 6.1:** Create a chat input component.  
  - Add `src/components/ChatInput.tsx`
- **Commit 6.2:** Add a chat log display component.  
  - Add `src/components/ChatLog.tsx`
- **Commit 6.3:** Implement GraphQL mutation for sending messages.  
  - Add `src/graphql/chat.graphql`
- **Commit 6.4:** Set up subscription for real-time chat updates.  
  - Update `src/graphql/chat.graphql` and `ChatLog.tsx`
- **Commit 6.5:** Integrate chat functionality with the UI.  
  - Update `ChatInput.tsx` and `ChatLog.tsx`

## Feature 7: Testing and Optimization
- **Commit 7.1:** Write unit tests for critical components.  
  - Add tests in `src/`
- **Commit 7.2:** Optimize 3D rendering performance.  
  - Update `DiceCanvas.tsx`
- **Commit 7.3:** Ensure cross-browser compatibility.  
  - Test and tweak `src/`
- **Commit 7.4:** Add error handling and loading states.  
  - Update components in `src/`