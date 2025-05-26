# Canvas Integration Roadmap: Unified Dice Rolling Experience

## Overview
This roadmap details the integration of the 3D dice physics canvas with the chat/activity system to create a unified collaborative TTRPG dice rolling experience. The goal is to merge the disparate client-side dice canvas and server-side chat/rolling systems into a cohesive real-time multiplayer experience.

**Status: Phases 1-4 completed via de-monolith refactoring. Ready for Phase 5 implementation.**

---

## **Current State Analysis (Post-Refactoring)**

### **✅ Completed Systems**
- ✅ **3D Dice Canvas**: Refactored into modular components with physics services
- ✅ **Chat/Activity Feed**: Server-side GraphQL with real-time subscriptions
- ✅ **Unified Roll System**: `/roll` commands via GraphQL with canvas integration
- ✅ **User Management**: Session-based users with colors and usernames
- ✅ **Real-time Synchronization**: Canvas events broadcast to all users
- ✅ **Virtual Dice System**: Smart representation for massive/non-standard rolls
- ✅ **Service Architecture**: Business logic extracted into testable services

### **🎯 Ready for Implementation**
- 🎯 **Cross-System Highlighting**: Canvas ↔ Chat correlation and navigation
- 🎯 **Enhanced UX Polish**: Cleanup strategies, roll history, performance optimization
- 🎯 **Advanced Features**: Room management, dice customization, analytics

### **🏗️ Refactored Architecture**
```
src/
├── components/
│   ├── dice/           # D4-D20 geometry components
│   ├── physics/        # Physics world and ground components  
│   ├── sync/           # Remote dice and sync status components
│   ├── controls/       # UI control panels and buttons
│   └── VirtualDice.tsx # Virtual dice overlay system
├── hooks/
│   ├── controls/       # useDiceControls, useCameraControls
│   ├── sync/           # useRemoteDice, useCanvasSync
│   └── physics/        # useDiceInteraction, usePhysicsSync
├── services/
│   ├── dice/           # DiceSpawningService, DiceRollingService
│   ├── canvas/         # CanvasEventService, RemoteDiceService
│   ├── RollProcessor.ts        # ✅ Unified roll parsing
│   ├── DiceResultManager.ts   # ✅ Canvas ↔ Chat correlation
│   ├── ChatCommandParser.ts   # ✅ /roll command parsing
│   └── CanvasStateManager.ts  # ✅ Server-side state management
```

---

## **✅ COMPLETED: Phases 1-4** 
*Implemented during de-monolith refactoring*

### **Phase 1: Foundation - Unified Roll System** ✅ **COMPLETED**
- ✅ Extended GraphQL schema with `CanvasData`, `DiceRoll`, `Position` types
- ✅ Created `RollProcessor` service for unified roll parsing and processing
- ✅ Implemented canvas-aware `rollDice` mutations with real-time events
- ✅ Created `DiceResultManager` for canvas ↔ chat correlation

### **Phase 2: Chat Integration - Slash Commands** ✅ **COMPLETED**
- ✅ Implemented `ChatCommandParser` with `/roll`, `/r`, `/dice`, `/d` commands
- ✅ Enhanced `ChatInput` with real-time command detection and validation
- ✅ Unified roll buttons to use chat `/roll` commands
- ✅ Enhanced activity feed with roll command display

### **Phase 3: Real-time Canvas Synchronization** ✅ **COMPLETED**
- ✅ Designed canvas synchronization protocol with `CanvasEvent` types
- ✅ Implemented `CanvasStateManager` for server-side state management
- ✅ Created `CanvasSyncManager` for client-side event processing
- ✅ Implemented selective synchronization (result-only vs full physics)

### **Phase 4: Virtual Dice System** ✅ **COMPLETED**
- ✅ Implemented sophisticated virtual dice detection with 6-tier system
- ✅ Created `VirtualDice` component system with purple styling
- ✅ Implemented smart dice clustering strategies
- ✅ Added virtual dice interaction with expandable details

---

## **🎯 PHASE 5: Cross-System Highlighting & Navigation** 
*Ready for immediate implementation*

### **Commit 5.1:** Create highlighting service integration
- **Extend existing `DiceResultManager` service:**
  - Add highlighting state management methods
  - Integrate with existing canvas ↔ chat correlation
  - Add highlight event broadcasting via `CanvasEventService`
  - Implement highlight persistence during session

- **Create `HighlightManager` service:**
  ```typescript
  class HighlightManager {
    constructor(
      private diceResultManager: DiceResultManager,
      private canvasEventService: CanvasEventService
    ) {}
    
    highlightDiceFromChat(activityId: string): void
    highlightChatFromDice(diceId: string): void
    clearHighlights(): void
  }
  ```

### **Commit 5.2:** Implement canvas → chat highlighting
- **Enhance existing dice components:**
  - Add click handlers to `VirtualDice` and `PhysicsDice` components
  - Integrate with `HighlightManager` service
  - Add visual highlighting effects (glow, color change)
  - Implement hover effects for preview highlighting

- **Update `ActivityFeed` component:**
  - Add highlighting state management
  - Implement smooth scrolling to highlighted activities
  - Add visual connection animations
  - Handle multiple simultaneous highlights

### **Commit 5.3:** Implement chat → canvas navigation
- **Enhance `ActivityFeed` component:**
  - Add click handlers to roll result displays
  - Integrate with camera controls for smooth transitions
  - Handle cases where dice no longer exist
  - Add visual feedback for navigation actions

- **Update camera control system:**
  - Extend `useCameraControls` hook with focus methods
  - Implement smooth camera transitions to dice
  - Add zoom and framing for highlighted dice
  - Handle multiple dice highlighting scenarios

### **Commit 5.4:** Enhanced result display system
- **Canvas side enhancements:**
  - Add floating result numbers above dice (using existing overlay system)
  - Integrate with `VirtualDice` expandable details
  - Show/hide results based on highlight state
  - Add click-to-expand for virtual dice details

- **Chat side enhancements:**
  - Enhance activity display with hover tooltips
  - Show expanded roll breakdowns on hover
  - Add navigation indicators for canvas correlation
  - Implement result summary vs detailed view toggle

---

## **🎯 PHASE 6: UI/UX Polish & Edge Cases**
*Building on refactored architecture*

### **Commit 6.1:** Implement canvas cleanup strategies
- **Extend `CanvasStateManager` service:**
  - Add auto-cleanup timers for old dice
  - Implement "Clear All" functionality affecting all users
  - Add canvas overcrowding prevention with smart limits
  - Handle user disconnection cleanup

- **Update `DiceCanvas` component:**
  - Add cleanup UI controls using existing control components
  - Integrate with `CanvasEventService` for broadcast cleanup
  - Add visual feedback for cleanup operations

### **Commit 6.2:** Add roll history and replay system
- **Create `RollHistoryService`:**
  - Store recent rolls in session state
  - Implement roll bookmarking/favorites
  - Add roll statistics and pattern tracking
  - Integrate with existing `RollProcessor`

- **Enhance chat system:**
  - Add "Repeat Last Roll" functionality to `ChatInput`
  - Implement roll history dropdown
  - Add quick-access buttons for favorite rolls
  - Show roll statistics in user interface

### **Commit 6.3:** Enhanced error handling and sync status
- **Extend existing sync components:**
  - Enhance `SyncStatusIndicator` with detailed connection info
  - Add offline mode detection and sync-on-reconnect
  - Implement graceful degradation for network issues
  - Add user feedback for failed operations

- **Update error boundaries:**
  - Add canvas-specific error boundaries
  - Implement fallback UI for sync failures
  - Add retry mechanisms for failed operations

### **Commit 6.4:** Performance optimizations
- **Optimize existing services:**
  - Add canvas dice limits to `CanvasStateManager` (max 50 active dice)
  - Implement smart batching in `CanvasEventService`
  - Add LOD (Level of Detail) for distant dice
  - Optimize GraphQL subscription handling

- **Enhance rendering performance:**
  - Add React.memo to expensive components
  - Implement virtual scrolling for large activity feeds
  - Optimize physics simulation for many dice
  - Add performance monitoring and metrics

---

## **🚀 PHASE 7: Advanced Features**
*Future enhancements building on solid foundation*

### **Commit 7.1:** User permissions and room management
- **Extend `CanvasStateManager` with room features:**
  - Add room-based dice isolation
  - Implement moderator controls (clear all, mute dice)
  - Add private dice rolls (visible only to roller)
  - Create spectator mode (view-only canvas)

### **Commit 7.2:** Dice customization sync
- **Create `DiceCustomizationService`:**
  - Sync user dice colors/themes across clients
  - Add dice "ownership" indicators
  - Implement custom dice sets per user
  - Add dice sound preferences sync

### **Commit 7.3:** Advanced roll expressions
- **Enhance `RollProcessor` service:**
  - Support complex expressions: `(2d6+3)*2`
  - Add conditional rolls: `1d20 advantage/disadvantage`
  - Implement roll modifiers: `1d20+5 vs DC 15`
  - Add custom dice types: `1d[1,3,5,7,9]`

### **Commit 7.4:** Analytics and insights
- **Create `AnalyticsService`:**
  - Track roll statistics per user
  - Show probability distributions
  - Add "hot" and "cold" dice indicators
  - Implement roll pattern analysis

---

## **Technical Architecture (Updated)**

### **Data Flow**
```
User Input → ChatCommandParser → RollProcessor → GraphQL Mutation → 
CanvasStateManager → CanvasEventService → Real-time Broadcast → 
CanvasSyncManager → Canvas Update
```

### **Key Services (Existing)**
- ✅ **RollProcessor**: Unified roll parsing and virtual dice detection
- ✅ **DiceResultManager**: Cross-system correlation and state tracking
- ✅ **CanvasEventService**: Local event broadcasting and history
- ✅ **RemoteDiceService**: Remote dice state management
- ✅ **CanvasStateManager**: Server-side state and event broadcasting
- ✅ **ChatCommandParser**: Command parsing and validation

### **Key Services (To Implement)**
- 🎯 **HighlightManager**: Bidirectional highlighting system
- 🎯 **RollHistoryService**: Roll history and replay functionality
- 🚀 **DiceCustomizationService**: User preferences and themes
- 🚀 **AnalyticsService**: Statistics and insights

### **Component Architecture (Existing)**
- ✅ **Modular dice components**: D4-D20 geometry, physics, virtual dice
- ✅ **Control components**: Panels, buttons, camera controls
- ✅ **Sync components**: Remote dice, sync status, canvas overlay
- ✅ **Specialized hooks**: Controls, sync, physics, camera

---

## **Implementation Priority (Rebased)**

### **Sprint 1: Cross-System Integration** 🎯 **IMMEDIATE**
- Phase 5: Cross-System Highlighting & Navigation
- Leverage existing services and component architecture
- High user impact, moderate implementation complexity

### **Sprint 2: Polish & Optimization** 🎯 **SHORT TERM**
- Phase 6: UI/UX Polish & Edge Cases
- Build on solid service foundation
- Focus on user experience and performance

### **Sprint 3: Advanced Features** 🚀 **FUTURE**
- Phase 7: Advanced Features (as needed)
- Room management, customization, analytics
- Extend existing service architecture

---

## **Success Metrics (Updated)**

### **✅ Already Achieved**
- ✅ All dice rolls originate from unified chat `/roll` commands
- ✅ Canvas dice movements visible to all room participants  
- ✅ Perfect correlation between chat results and canvas dice
- ✅ Smooth handling of both standard and virtual dice
- ✅ Stable real-time synchronization with minimal lag
- ✅ Modular, testable, maintainable architecture

### **🎯 Next Targets**
- 🎯 Intuitive cross-system navigation and highlighting
- 🎯 Enhanced user experience with polish and optimization
- 🎯 Advanced features for power users and communities

---

## **Key Advantages of Refactored Architecture**

### **Service-Based Implementation**
- **Clean separation**: Business logic in services, UI logic in components
- **Easy testing**: Services can be unit tested independently
- **Reusable**: Services can be used across different components
- **Extensible**: New features integrate cleanly with existing services

### **Component Modularity**
- **Focused components**: Each component has single responsibility
- **Reusable**: Dice, controls, sync components work independently
- **Maintainable**: Easy to locate and fix issues
- **Performant**: Better React optimization opportunities

### **Simplified Implementation**
- **Phase 5**: Mostly UI integration work, services already exist
- **Phase 6**: Extend existing services, add UI polish
- **Phase 7**: Build on solid foundation, add advanced features

**The refactoring has dramatically simplified the remaining integration work!** 🎉

