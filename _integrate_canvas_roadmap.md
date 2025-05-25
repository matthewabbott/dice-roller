# Canvas Integration Roadmap: Unified Dice Rolling Experience

## Overview
This roadmap details the integration of the 3D dice physics canvas with the chat/activity system to create a unified collaborative TTRPG dice rolling experience. The goal is to merge the disparate client-side dice canvas and server-side chat/rolling systems into a cohesive real-time multiplayer experience.

---

## **Current State Analysis**

### **Existing Systems**
- ✅ **3D Dice Canvas**: Client-side physics simulation with all dice types (D4-D20)
- ✅ **Chat/Activity Feed**: Server-side GraphQL with real-time subscriptions
- ✅ **Dice Rolling**: Text-based `/roll` commands via GraphQL mutations
- ✅ **User Management**: Session-based users with colors and usernames

### **Current Limitations**
- 🔄 **Disconnected Systems**: Canvas and chat operate independently
- 🔄 **No Broadcast**: Dice movements are purely client-side
- 🔄 **Duplicate Controls**: Separate UI for canvas vs chat rolling
- 🔄 **No Visual Correlation**: Chat results don't correspond to canvas dice
- 🔄 **Limited Dice Support**: Canvas only supports standard TTRPG dice

---

## **Phase 1: Foundation - Unified Roll System** 🎯 **HIGH PRIORITY**
Merge the dice rolling systems and establish the core data flow.

### **Commit 1.1:** Extend GraphQL schema for canvas integration
- Add `DiceRoll` type with canvas-specific fields:
  - `canvasId: String!` - Unique identifier for canvas dice
  - `diceType: String!` - Physical dice type (d4, d6, d8, d10, d12, d20)
  - `position: Position` - 3D coordinates where dice landed
  - `isVirtual: Boolean!` - True for non-standard dice (1000d20, etc.)
  - `virtualRolls: [Int!]` - Individual roll results for virtual dice
- Add `Position` type: `{ x: Float!, y: Float!, z: Float! }`
- Extend `rollDice` mutation to return canvas data

### **Commit 1.2:** Create unified roll processing system
- Create `src/services/RollProcessor.ts`:
  - Parse dice expressions (2d6, 1000d20, etc.)
  - Determine physical vs virtual dice representation
  - Generate canvas instructions for dice spawning
  - Handle edge cases (massive rolls, non-standard dice)
- Add roll categorization logic:
  - **Physical**: Standard dice ≤ 10 dice of supported types
  - **Virtual**: Non-standard dice, massive quantities, or complex expressions

### **Commit 1.3:** Implement canvas-aware dice mutations
- Modify `rollDice` GraphQL resolver:
  - Process rolls through `RollProcessor`
  - Generate `canvasId` for each physical dice
  - Store canvas positioning data
  - Broadcast canvas instructions via subscriptions
- Add new subscription: `diceCanvasUpdated` for real-time canvas sync

### **Commit 1.4:** Create dice result correlation system
- Add `DiceResultManager` class:
  - Map canvas dice IDs to chat activity IDs
  - Track dice state (rolling, settled, highlighted)
  - Handle result highlighting and cross-referencing
- Implement bidirectional linking between canvas and chat

---

## **Phase 2: Chat Integration - Slash Commands** 🎯 **HIGH PRIORITY**
Replace separate roll inputs with unified chat `/roll` commands.

### **Commit 2.1:** Implement chat slash command parser
- Create `src/services/ChatCommandParser.ts`:
  - Parse `/roll` commands from chat input
  - Validate dice expressions
  - Support aliases: `/r`, `/dice`, `/d`
  - Handle malformed commands gracefully
- Add command help system: `/help roll`

### **Commit 2.2:** Modify chat input component
- Update `ChatInput.tsx`:
  - Detect slash commands before sending
  - Route `/roll` commands to dice mutation instead of chat
  - Show command preview/validation
  - Maintain chat history with roll commands
- Add visual indicators for command mode

### **Commit 2.3:** Unify roll button functionality
- Remove duplicate dice buttons from `DiceCanvas.tsx`
- Update `DiceRoller.tsx` buttons to use chat `/roll` commands
- Add quick-roll buttons that populate chat input: `/roll 1d20`, etc.
- Ensure all rolls go through unified chat → GraphQL → canvas flow

### **Commit 2.4:** Enhanced activity feed integration
- Update `ActivityFeed.tsx`:
  - Display roll commands as special activity types
  - Show dice type icons and results
  - Add click handlers for canvas navigation
  - Implement hover tooltips for expanded roll details

---

## **Phase 3: Real-time Canvas Synchronization** 🎯 **HIGH PRIORITY**
Broadcast dice movements and states to all connected users.

### **Commit 3.1:** Design canvas synchronization protocol
- Define canvas event types:
  - `DICE_SPAWN`: New dice added to canvas
  - `DICE_THROW`: Dice physics applied
  - `DICE_SETTLE`: Dice stopped moving with final result
  - `DICE_HIGHLIGHT`: Dice selected/highlighted
  - `DICE_REMOVE`: Dice cleared from canvas
- Create `CanvasEvent` GraphQL type and subscription

### **Commit 3.2:** Implement server-side canvas state management
- Add `CanvasStateManager` to server:
  - Track active dice for each room/session
  - Manage dice lifecycle (spawn → throw → settle → remove)
  - Handle user disconnections and cleanup
  - Broadcast state changes to all room participants

### **Commit 3.3:** Create canvas synchronization client
- Add `CanvasSyncManager` to `DiceCanvas.tsx`:
  - Subscribe to `canvasEventsUpdated` GraphQL subscription
  - Apply remote dice events to local canvas
  - Distinguish between local and remote dice
  - Handle conflict resolution for simultaneous actions

### **Commit 3.4:** Implement selective synchronization
- **Option A: Full Sync**: Broadcast all dice movements and physics
  - Pros: Perfect synchronization, shared physics playground
  - Cons: High bandwidth, complex conflict resolution
- **Option B: Result Sync**: Only broadcast spawn/settle events
  - Pros: Lower bandwidth, simpler implementation
  - Cons: Users see different intermediate physics
- **Recommended**: Start with Option B, upgrade to A if needed

---

## **Phase 4: Virtual Dice System** 🎯 **MEDIUM PRIORITY**
Handle non-standard and massive dice rolls with smart representation.

### **Commit 4.1:** Implement virtual dice detection
- Extend `RollProcessor` with virtual dice logic:
  - Detect massive rolls (>10 dice, >100 total)
  - Identify non-standard dice (d3, d100, d1000, etc.)
  - Calculate appropriate physical representation
- Add configuration for virtual dice thresholds

### **Commit 4.2:** Create virtual dice rendering system
- Add `VirtualDice` component:
  - Render single physical dice with virtual result overlay
  - Show "virtual" indicator (different color/effect)
  - Display summary result prominently
  - Hide individual roll details by default
- Integrate with existing `PhysicsDice` component

### **Commit 4.3:** Implement smart dice clustering
- For massive standard rolls (1000d20):
  - Spawn single representative dice
  - Show total result as overlay
  - Store individual rolls in hidden state
- For mixed expressions (2d6+1d20+5):
  - Spawn appropriate physical dice
  - Show modifier calculations separately

### **Commit 4.4:** Add virtual dice interaction
- Click virtual dice to expand individual results
- Show breakdown in modal or expandable panel
- Maintain correlation with chat activity
- Allow re-rolling virtual dice with same parameters

---

## **Phase 5: Cross-System Highlighting & Navigation** 🎯 **MEDIUM PRIORITY**
Implement bidirectional highlighting between canvas and chat.

### **Commit 5.1:** Create highlighting state management
- Add `HighlightManager` service:
  - Track highlighted dice and chat activities
  - Manage highlight states across components
  - Handle multiple simultaneous highlights
- Implement highlight persistence during session

### **Commit 5.2:** Canvas → Chat highlighting
- Add click handlers to canvas dice:
  - Highlight corresponding chat activity
  - Scroll activity feed to relevant message
  - Show visual connection (animation, color matching)
- Implement hover effects for preview highlighting

### **Commit 5.3:** Chat → Canvas navigation
- Add click handlers to activity feed roll results:
  - Focus camera on corresponding canvas dice
  - Highlight dice with visual effects
  - Smooth camera transitions with animation
- Handle cases where dice no longer exist

### **Commit 5.4:** Enhanced result display system
- **Canvas Side**:
  - Show result numbers floating above dice
  - Hide by default, show on hover/selection
  - Click to expand virtual dice details
- **Chat Side**:
  - Show summary results by default
  - Hover to show expanded roll breakdown
  - Click to navigate to canvas dice

---

## **Phase 6: UI/UX Polish & Edge Cases** 🎯 **LOW PRIORITY**
Handle edge cases and improve user experience.

### **Commit 6.1:** Implement canvas cleanup strategies
- Auto-remove old dice after time limit
- Manual "Clear All" button affects all users
- Handle user disconnection cleanup
- Prevent canvas overcrowding with smart limits

### **Commit 6.2:** Add roll history and replay
- Store recent rolls in session state
- Add "Repeat Last Roll" functionality
- Implement roll bookmarking/favorites
- Show roll statistics and patterns

### **Commit 6.3:** Enhanced error handling
- Handle network disconnections gracefully
- Show sync status indicators
- Implement offline mode with sync on reconnect
- Add user feedback for failed operations

### **Commit 6.4:** Performance optimizations
- Implement canvas dice limits (max 50 active dice)
- Add LOD for distant dice
- Optimize GraphQL subscriptions
- Implement smart batching for rapid rolls

---

## **Phase 7: Advanced Features** 🎯 **FUTURE ENHANCEMENTS**
Optional advanced features for enhanced experience.

### **Commit 7.1:** User permissions and room management
- Add room-based dice isolation
- Implement moderator controls (clear all, mute dice)
- Add private dice rolls (visible only to roller)
- Create spectator mode (view-only canvas)

### **Commit 7.2:** Dice customization sync
- Sync user dice colors/themes across clients
- Add dice "ownership" indicators
- Implement custom dice sets per user
- Add dice sound preferences sync

### **Commit 7.3:** Advanced roll expressions
- Support complex expressions: `(2d6+3)*2`
- Add conditional rolls: `1d20 advantage/disadvantage`
- Implement roll modifiers: `1d20+5 vs DC 15`
- Add custom dice types: `1d[1,3,5,7,9]`

### **Commit 7.4:** Analytics and insights
- Track roll statistics per user
- Show probability distributions
- Add "hot" and "cold" dice indicators
- Implement roll pattern analysis

---

## **Technical Architecture**

### **Data Flow**
```
User Input → Chat Command → GraphQL Mutation → Server Processing → 
Canvas Instructions → Real-time Broadcast → All Clients → Canvas Update
```

### **Key Components**
- **RollProcessor**: Unified roll parsing and processing
- **CanvasSyncManager**: Real-time canvas synchronization
- **DiceResultManager**: Cross-system correlation and highlighting
- **VirtualDice**: Smart representation for complex rolls
- **HighlightManager**: Bidirectional highlighting system

### **GraphQL Schema Extensions**
```graphql
type DiceRoll {
  canvasId: String!
  diceType: String!
  position: Position
  isVirtual: Boolean!
  virtualRolls: [Int!]
}

type Position {
  x: Float!
  y: Float!
  z: Float!
}

type CanvasEvent {
  type: String!
  diceId: String!
  userId: String!
  data: JSON
}

subscription canvasEventsUpdated {
  canvasEventsUpdated {
    type
    diceId
    userId
    data
  }
}
```

---

## **Implementation Priority**

### **Sprint 1: Core Integration**
- Phase 1: Unified Roll System
- Phase 2: Chat Integration

### **Sprint 2: Real-time Sync**
- Phase 3: Canvas Synchronization
- Basic virtual dice (Phase 4.1-4.2)

### **Sprint 3: Enhanced UX**
- Phase 4: Complete Virtual Dice System
- Phase 5: Cross-System Highlighting

### **Sprint 4: Polish & Advanced**
- Phase 6: Edge Cases & Polish
- Phase 7: Advanced Features (as needed)

---

## **Success Metrics**

- ✅ All dice rolls originate from unified chat `/roll` commands
- ✅ Canvas dice movements visible to all room participants
- ✅ Perfect correlation between chat results and canvas dice
- ✅ Smooth handling of both standard and virtual dice
- ✅ Intuitive cross-system navigation and highlighting
- ✅ Stable real-time synchronization with minimal lag

This integration will transform your TTRPG dice roller from a collection of separate tools into a cohesive, collaborative experience that brings the tactile joy of physical dice rolling into the digital multiplayer space. 