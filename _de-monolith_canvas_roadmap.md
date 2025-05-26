# DiceCanvas De-Monolith Refactoring Roadmap

## Overview
The `DiceCanvas.tsx` component has grown to 2013 lines with too many responsibilities, making it difficult to maintain, test, and extend. This roadmap outlines a systematic approach to break it down into focused, reusable components.

## Current State Analysis

### File Size & Complexity
- **Total Lines**: 2013 lines
- **Main Component**: DiceCanvas (lines 1230-2013) - 783 lines
- **PhysicsDice Component**: (lines 82-1016) - 934 lines  
- **Supporting Components**: PhysicsGround, PhysicsSimulation - 200+ lines

### Current Responsibilities (Too Many!)
1. **3D Rendering & Scene Management** (Three.js/R3F)
2. **Physics Simulation** (Cannon.js integration)
3. **Dice Geometry Generation** (~800 lines of complex geometry)
4. **Dice Interaction Logic** (Click, drag, throw mechanics)
5. **Canvas Synchronization** (Real-time multiplayer sync)
6. **Virtual Dice Management** (Phase 4 functionality)
7. **UI Controls & State Management** (Buttons, selectors, overlays)
8. **Camera Controls** (OrbitControls, fullscreen, locking)
9. **Physics World Management** (Initialization, cleanup)
10. **Remote Dice Handling** (Multiplayer dice from other users)
11. **Roll History & Statistics** (Local state management)

## Refactoring Strategy: 6-Phase Approach

### Phase A: Extract Dice Geometry Components ✅ **COMPLETED**
**Goal**: Move dice geometry generation to dedicated components
**Impact**: ~800 lines reduction, improved reusability
**Risk**: Low - geometry is self-contained

#### Commits:
- **A.1**: ✅ Create `src/components/dice/` directory structure
- **A.2**: ✅ Extract `DiceGeometry` base component and individual dice geometry components
- **A.3**: ✅ Update `PhysicsDice` to use new geometry components
- **A.4**: ✅ Clean up and test geometry extraction

#### Completed Files:
```
src/components/dice/
├── DiceGeometry.tsx          # ✅ Base geometry component with utilities
├── D4Geometry.tsx           # ✅ Tetrahedron geometry (51 lines)
├── D6Geometry.tsx           # ✅ Cube geometry (23 lines)
├── D8Geometry.tsx           # ✅ Octahedron geometry (58 lines)
├── D10Geometry.tsx          # ✅ Pentagonal trapezohedron (155 lines)
├── D12Geometry.tsx          # ✅ Dodecahedron geometry (98 lines)
├── D20Geometry.tsx          # ✅ Icosahedron geometry (99 lines)
└── index.ts                 # ✅ Barrel exports
```

#### Results:
- **Lines Reduced**: ~800 lines of geometry code extracted from DiceCanvas
- **TypeScript Errors**: Reduced from 53 to 34 (geometry errors eliminated)
- **Maintainability**: Each dice type now has its own focused component
- **Reusability**: Geometry components can be used independently
- **Performance**: Geometry generation properly memoized with React.useMemo
- **Testing**: All dice types render correctly in the canvas

### Phase B: Extract Physics & Interaction Logic ✅ **COMPLETED**
**Goal**: Separate physics simulation from rendering
**Impact**: Better separation of concerns, easier testing
**Risk**: Medium - physics and rendering are tightly coupled

#### Commits:
- **B.1**: ✅ Create `src/components/physics/` directory
- **B.2**: ✅ Extract `PhysicsWorld` component for world management
- **B.3**: ✅ Extract `DicePhysics` component for dice-specific physics
- **B.4**: ✅ Extract interaction hooks (`useDiceInteraction`, `usePhysicsSync`)

#### Completed Files:
```
src/components/physics/
├── PhysicsWorld.tsx         # ✅ Physics world management (78 lines)
├── PhysicsGround.tsx        # ✅ Ground/table physics (219 lines)
└── index.ts                 # ✅ Barrel exports

src/hooks/
├── useDiceInteraction.ts    # ✅ Click/drag interaction logic (271 lines)
├── usePhysicsSync.ts        # ✅ Physics-render synchronization (68 lines)
└── index.ts                 # ✅ Barrel exports
```

#### Results:
- **Lines Reduced**: ~400 lines of physics code extracted from DiceCanvas
- **TypeScript Errors**: Reduced from 31 to 28 (physics errors eliminated)
- **Maintainability**: Physics logic now separated from rendering
- **Reusability**: Physics components and hooks can be used independently
- **Testing**: Physics logic can now be unit tested separately
- **Performance**: Better React optimization opportunities with focused components

### Phase C: Extract Canvas Synchronization 🟡 **MEDIUM RISK**
**Goal**: Isolate multiplayer synchronization logic
**Impact**: Cleaner separation of local vs remote state
**Risk**: Medium - sync logic touches many parts

#### Commits:
- **C.1**: Create `src/components/sync/` directory
- **C.2**: Extract `RemoteDiceRenderer` component
- **C.3**: Extract `SyncStatusIndicator` component
- **C.4**: Refactor sync hooks and state management

#### Files to Create:
```
src/components/sync/
├── RemoteDiceRenderer.tsx   # Render remote players' dice
├── SyncStatusIndicator.tsx  # Connection status UI
├── SyncControls.tsx         # Sync-related controls
└── index.ts

src/hooks/
├── useRemoteDice.ts         # Remote dice state management
└── useSyncStatus.ts         # Connection status tracking
```

### Phase D: Extract UI & Controls 🟡 **MEDIUM RISK**
**Goal**: Separate UI controls from canvas logic
**Impact**: Reusable UI components, cleaner canvas
**Risk**: Medium - UI state is intertwined with canvas state

#### Commits:
- **D.1**: Create `src/components/controls/` directory
- **D.2**: Extract `DiceControlPanel` component
- **D.3**: Extract `CameraControls` component
- **D.4**: Extract `RollHistory` component

#### Files to Create:
```
src/components/controls/
├── DiceControlPanel.tsx     # Main dice controls
├── DiceTypeSelector.tsx     # Dice type selection
├── SpawnControls.tsx        # Dice spawning buttons
├── ActionButtons.tsx        # Roll/throw/clear buttons
├── CameraControls.tsx       # Camera control panel
├── RollHistory.tsx          # Roll history display
└── index.ts

src/hooks/
├── useDiceControls.ts       # Dice control logic
└── useCameraControls.ts     # Camera control logic
```

### Phase E: Extract State Management 🔴 **HIGH RISK**
**Goal**: Centralize and organize state management
**Impact**: Better state organization, easier debugging
**Risk**: High - state is core to component functionality

#### Commits:
- **E.1**: Create centralized state management with Context/Zustand
- **E.2**: Extract dice state management
- **E.3**: Extract UI state management
- **E.4**: Implement state persistence and recovery

#### Files to Create:
```
src/stores/
├── diceStore.ts             # Dice state management
├── canvasStore.ts           # Canvas state management
├── uiStore.ts               # UI state management
└── index.ts

src/contexts/
├── DiceCanvasContext.tsx    # Canvas context provider
└── index.ts
```

### Phase F: Create Main Canvas Orchestrator 🔴 **HIGH RISK**
**Goal**: Slim main component that orchestrates sub-components
**Impact**: Clean, maintainable main component
**Risk**: High - requires careful coordination of all parts

#### Commits:
- **F.1**: Create new streamlined `DiceCanvas` component
- **F.2**: Implement component composition and coordination
- **F.3**: Add error boundaries and fallbacks
- **F.4**: Performance optimization and cleanup

#### Final Structure:
```
src/components/DiceCanvas.tsx  # ~200 lines - orchestration only
├── dice/                      # Geometry components
├── physics/                   # Physics simulation
├── sync/                      # Multiplayer sync
├── controls/                  # UI controls
└── canvas/                    # Core canvas components
```

## Benefits of Refactoring

### 🧪 **Testability**
- Individual components can be unit tested
- Physics logic can be tested separately from rendering
- UI interactions can be tested in isolation

### 🔧 **Maintainability**
- Single responsibility principle
- Easier to locate and fix bugs
- Clear component boundaries

### 🚀 **Performance**
- Better React optimization opportunities
- Selective re-rendering of components
- Easier to implement memoization

### 🔄 **Reusability**
- Dice geometry components can be reused elsewhere
- Physics components can power other 3D scenes
- UI controls can be used in different contexts

### 📈 **Extensibility**
- Easier to add new dice types
- Simpler to add new physics features
- Cleaner integration points for new functionality

## Phase 5 Integration Benefits

After refactoring, Phase 5 (Cross-System Highlighting) will be much easier:
- **Highlighting logic** can be cleanly integrated into individual dice components
- **Camera focus** can be handled by dedicated camera control components
- **Activity correlation** can be managed by sync components
- **UI updates** can be handled by control panel components

## Risk Mitigation

### 🟢 **Low Risk Phases (A)**
- Start with geometry extraction - most isolated
- Extensive testing at each step
- Maintain backward compatibility

### 🟡 **Medium Risk Phases (B, C, D)**
- Incremental changes with frequent testing
- Feature flags for new vs old implementations
- Rollback plans for each commit

### 🔴 **High Risk Phases (E, F)**
- Comprehensive integration testing
- Performance benchmarking
- User acceptance testing

## Success Metrics

### Code Quality
- [ ] Main component under 300 lines
- [ ] No component over 500 lines
- [ ] 90%+ test coverage on new components
- [ ] Zero regression in functionality

### Performance
- [ ] No performance degradation
- [ ] Improved React DevTools profiling
- [ ] Faster development builds

### Developer Experience
- [ ] Easier to add new features
- [ ] Clearer error messages
- [ ] Better TypeScript support

## Implementation Plan

1. **Start with Phase A** (Geometry extraction) - lowest risk, highest impact
2. **Pause after each phase** for testing and validation
3. **User testing** at Phases A, C, and F milestones
4. **Performance benchmarking** at each phase
5. **Documentation updates** throughout process