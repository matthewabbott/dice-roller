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

### Phase C: Extract Canvas Synchronization ✅ **COMPLETED**
**Goal**: Isolate multiplayer synchronization logic
**Impact**: Cleaner separation of local vs remote state
**Risk**: Medium - sync logic touches many parts

#### Commits:
- **C.1**: ✅ Create `src/components/sync/` and `src/hooks/sync/` directories
- **C.2**: ✅ Extract `RemoteDiceRenderer` component
- **C.3**: ✅ Extract `SyncStatusIndicator` component
- **C.4**: ✅ Create sync hooks (`useRemoteDice`, `useSyncStatus`, `useCanvasSync`)
- **C.5**: ✅ Update DiceCanvas to use new sync components

#### Completed Files:
```
src/components/sync/
├── RemoteDiceRenderer.tsx   # ✅ Render remote players' dice (25 lines)
├── SyncStatusIndicator.tsx  # ✅ Connection status UI (55 lines)
└── index.ts                 # ✅ Barrel exports

src/hooks/sync/
├── useRemoteDice.ts         # ✅ Remote dice state management (140 lines)
├── useSyncStatus.ts         # ✅ Connection status tracking (40 lines)
├── useCanvasSync.ts         # ✅ Enhanced sync hook wrapper (65 lines)
└── index.ts                 # ✅ Barrel exports
```

#### Results:
- **Lines Reduced**: ~164 lines of sync code extracted from DiceCanvas
- **TypeScript Errors**: No sync-related errors remaining
- **Maintainability**: Sync logic now cleanly separated from canvas rendering
- **Reusability**: Sync components and hooks can be used independently
- **Testing**: Sync functionality can now be unit tested in isolation
- **Performance**: Better React optimization with focused sync components

### Phase D: Extract UI & Controls ✅ **COMPLETED**
**Goal**: Separate UI controls from canvas logic
**Impact**: Reusable UI components, cleaner canvas
**Risk**: Medium - UI state is intertwined with canvas state

#### Commits:
- **D.1**: ✅ Create `src/components/controls/` directory
- **D.2**: ✅ Extract `DiceControlPanel` component
- **D.3**: ✅ Extract `CameraControls` component
- **D.4**: ✅ Extract `RollHistory` component

#### Completed Files:
```
src/components/controls/
├── DiceControlPanel.tsx     # ✅ Main dice controls (103 lines)
├── DiceTypeSelector.tsx     # ✅ Dice type selection (38 lines)
├── DiceCountDisplay.tsx     # ✅ Dice count and stats display (49 lines)
├── SpawnControls.tsx        # ✅ Dice spawning buttons (68 lines)
├── ActionButtons.tsx        # ✅ Roll/throw/clear buttons (53 lines)
├── CameraControls.tsx       # ✅ Camera control panel (46 lines)
├── CanvasOverlay.tsx        # ✅ Canvas overlay controls (101 lines)
├── InstructionsPanel.tsx    # ✅ Instructions and tooltips (44 lines)
├── RollHistory.tsx          # ✅ Roll history display (75 lines)
└── index.ts                 # ✅ Barrel exports

src/hooks/controls/
├── useDiceControls.ts       # ✅ Dice control logic (221 lines)
├── useCameraControls.ts     # ✅ Camera control logic (68 lines)
└── index.ts                 # ✅ Barrel exports
```

#### Results:
- **Lines Reduced**: ~600 lines of UI code extracted from DiceCanvas
- **TypeScript Errors**: No control-related errors remaining
- **Maintainability**: UI controls now cleanly separated from canvas rendering
- **Reusability**: Control components and hooks can be used independently
- **Testing**: Control logic can now be unit tested in isolation
- **Performance**: Better React optimization with focused control components

### Phase E: Extract Business Logic & Services 🟡 **MEDIUM RISK**
**Goal**: Extract business logic from hooks into testable service classes
**Impact**: Better separation of concerns, easier testing, more maintainable code
**Risk**: Medium - logic extraction without changing behavior

#### Commits:
- **E.1**: ✅ Create service infrastructure and directory structure
- **E.2**: ✅ Extract dice spawning and physics logic into DiceSpawningService
- **E.3**: ✅ Extract dice rolling and result logic into DiceRollingService
- **E.4**: ✅ Extract canvas event broadcasting into CanvasEventService
- **E.5**: ✅ Extract remote dice handling into RemoteDiceService
- **E.6**: Update hooks to use services while maintaining same interfaces

#### Files to Create:
```
src/services/dice/
├── DiceSpawningService.ts   # Dice creation and positioning logic
├── DiceRollingService.ts    # Roll execution and result calculation
├── DicePhysicsService.ts    # Physics body setup and management
└── index.ts

src/services/canvas/
├── CanvasEventService.ts    # Event broadcasting and handling
├── RemoteDiceService.ts     # Remote dice state management
└── index.ts

src/services/
└── index.ts                 # Main service exports
```

#### Benefits:
- **Testability**: Business logic can be unit tested independently of React
- **Maintainability**: Clear separation between business logic and UI logic
- **Reusability**: Services can be used across different components
- **Extensibility**: Easier to add new dice types, behaviors, or features
- **Debugging**: Clearer code flow and easier to trace issues

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

## Current Progress Summary

### ✅ **Phases A-D Completed Successfully**
- **Phase A**: Extracted ~800 lines of dice geometry code
- **Phase B**: Extracted ~400 lines of physics and interaction logic
- **Phase C**: Extracted ~164 lines of canvas synchronization code
- **Phase D**: Extracted ~600 lines of UI controls and camera logic
- **Legacy Cleanup**: Removed ~270 lines of unused legacy code

### 📊 **Refactoring Results**
- **Original DiceCanvas Size**: 2013 lines
- **Current DiceCanvas Size**: 297 lines
- **Total Lines Extracted**: ~2234 lines
- **Size Reduction**: 85.2% reduction in main component size
- **Components Created**: 20+ focused, reusable components
- **Hooks Created**: 8+ specialized hooks for different concerns
- **TypeScript Errors**: No regressions, all functionality maintained

### 🎯 **Next Steps**
- **Phase E**: Extract business logic & services (medium risk)
- **Phase F**: Create main canvas orchestrator (high risk)
- **Target**: Final DiceCanvas under 200 lines (orchestration only)