# Dice Physics Implementation Roadmap: Modern threejs-dice Port

## Overview
This roadmap details the step-by-step implementation of a modern dice physics system, porting the core functionality of threejs-dice to work with Three.js v0.176 and cannon-es. The implementation will provide realistic 3D dice rolling with physics simulation for the TTRPG Dice Roller.

---

## **Phase 1: Foundation Setup** ✅ **COMPLETE**
Establish the basic project structure and dependencies for dice physics.

### **Commit 1.1:** Install cannon-es physics engine ✅
- Add `cannon-es` and `@types/cannon-es` to package.json
- Update package dependencies to support modern physics simulation
```bash
npm install cannon-es @types/cannon-es
```

### **Commit 1.2:** Create dice physics directory structure ✅
- Create `src/physics/` directory for physics-related code
- Create `src/physics/dice/` subdirectory for specific dice implementations
- Create `src/physics/types/` subdirectory for TypeScript interfaces
- Add basic `index.ts` files for clean imports

### **Commit 1.3:** Define core physics interfaces and types ✅
- Create `src/physics/types/DiceTypes.ts` with:
  - `DiceOptions` interface
  - `DiceValuePair` interface  
  - `DiceVectors` interface
  - `PhysicsWorld` type definitions
- Add JSDoc documentation for all interfaces

### **Commit 1.4:** Create base DicePhysics utility functions ✅
- Create `src/physics/utils/PhysicsUtils.ts` with:
  - Geometry conversion helpers (THREE.js to Cannon-es)
  - Vector/quaternion conversion utilities
  - Shape creation helper functions
- Add comprehensive error handling and validation

---

## **Phase 2: Core Physics Engine** ✅ **COMPLETE**
Implement the main dice manager and base dice object classes.

### **Commit 2.1:** Implement DiceManager class foundation ✅
- Create `src/physics/DiceManager.ts` with:
  - World initialization and management
  - Material system setup (dice, floor, barrier materials)
  - Contact material configuration for realistic collisions
- Initialize basic world physics properties

### **Commit 2.2:** Add throw simulation logic to DiceManager ✅
- Implement `prepareValues()` method with Promise-based API
- Add stability checking algorithm for detecting when dice have settled
- Implement throw state management (throwRunning flag)
- Add event listener system for physics step monitoring

### **Commit 2.3:** Create base DiceObject abstract class ✅
- Create `src/physics/DiceObject.ts` with:
  - Constructor accepting DiceOptions
  - Abstract methods for geometry and materials
  - Basic physics body management
  - Position/rotation update methods

### **Commit 2.4:** Implement dice physics state management ✅
- Add `isFinished()` method to detect when dice have stopped moving
- Implement `getCurrentVectors()` and `setVectors()` for state preservation
- Add `updateMeshFromBody()` and `updateBodyFromMesh()` sync methods
- Include simulation running state tracking

### **Commit 2.5:** Add dice value manipulation system ✅
- Implement `getUpsideValue()` method to determine which face is up
- Add `shiftUpperValue()` method to ensure dice land on specific values
- Create face-to-value mapping system
- Add validation for valid dice values

---

## **Phase 3: Geometry and Rendering System** 🔄 **PARTIAL (D6 Complete)**
Build the modern geometry creation and material systems.

### **Commit 3.1:** Create modern BufferGeometry system ✅ (D6 Complete)
- Create `src/physics/geometry/GeometryBuilder.ts` with:
  - `createChamferGeometry()` for rounded dice edges
  - `buildBufferGeometry()` replacing deprecated THREE.Geometry
  - Modern face indexing system
- Convert vertex/face arrays to BufferGeometry format

### **Commit 3.2:** Implement material and texture system
- Create `src/physics/materials/DiceMaterials.ts` with:
  - Dynamic texture generation for dice faces
  - Canvas-based number/symbol rendering
  - Material array creation (replacing MultiMaterial)
- Add customizable colors and fonts

### **Commit 3.3:** Add Cannon-es shape generation
- Implement `createConvexPolyhedron()` for complex dice shapes
- Add `createBoxShape()`, `createSphereShape()` helpers
- Create shape-to-geometry mapping utilities
- Add proper half-extents calculation for boxes

### **Commit 3.4:** Create chamfering and edge rounding system
- Port original chamfering algorithm to modern TypeScript
- Implement edge softening for realistic dice appearance
- Add configurable chamfer values per dice type
- Optimize geometry creation for performance

### **Commit 3.5:** Add texture coordinate generation
- Implement UV mapping for dice faces
- Create texture coordinate calculation for chamfered geometry
- Add support for custom face textures and symbols
- Ensure proper texture alignment on all faces

---

## **Phase 4: Specific Dice Implementations** 🔄 **PARTIAL (D6 Complete)**
Create individual dice classes for each common dice type.

### **Commit 4.1:** Implement DiceD6 (six-sided die) ✅
- Create `src/physics/dice/DiceD6.ts` extending DiceObject
- Define cube vertices and face mappings
- Implement standard dot patterns (1-6)
- Add proper mass and inertia values for realistic rolling

### **Commit 4.2:** Implement DiceD20 (twenty-sided die) 
- Create `src/physics/dice/DiceD20.ts` with icosahedron geometry
- Define golden ratio-based vertex calculations
- Implement number face textures (1-20)
- Add appropriate physics properties for D20 shape

### **Commit 4.3:** Implement DiceD4 (four-sided die)
- Create `src/physics/dice/DiceD4.ts` with tetrahedron geometry
- Handle special case of inverted reading (bottom face up)
- Implement corner-based number placement
- Add custom texture generation for triangular faces

### **Commit 4.4:** Implement DiceD8 (eight-sided die)
- Create `src/physics/dice/DiceD8.ts` with octahedron geometry
- Define dual pyramid vertex structure
- Implement number placement on triangular faces
- Add balanced physics properties

### **Commit 4.5:** Implement DiceD10 and DiceD12
- Create `src/physics/dice/DiceD10.ts` with pentagonal trapezohedron
- Create `src/physics/dice/DiceD12.ts` with dodecahedron geometry
- Implement complex face numbering systems
- Add specialized physics properties for each shape

---

## **Phase 5: Integration with DiceCanvas** ✅ **COMPLETE**
Connect the physics system to the existing 3D canvas component.

### **Commit 5.1:** Set up physics world in DiceCanvas ✅
- Modify `src/components/DiceCanvas.tsx` to include:
  - Cannon-es world initialization
  - Ground plane physics body
  - Gravity and physics step configuration
- Add physics world to component state

### **Commit 5.2:** Create dice spawning system ✅
- Add `spawnDice()` method to DiceCanvas
- Implement dice positioning above the table
- Connect Three.js mesh to Cannon-es body
- Add dice to both scene and physics world

### **Commit 5.3:** Implement physics animation loop ✅
- Integrate physics step with React Three Fiber's useFrame
- Add mesh position/rotation syncing from physics bodies
- Implement smooth 60fps physics updates
- Add performance monitoring and optimization

### **Commit 5.4:** Add dice interaction controls ✅
- Create dice rolling trigger system
- Implement random initial velocity and rotation
- Add dice value selection for testing
- Create physics world reset functionality

### **Commit 5.5:** Connect to dice roller mutation system ✅
- Integrate physics rolling with GraphQL dice roll mutations
- Add dice value enforcement (land on specific numbers)
- Implement multiple dice rolling support
- Add rolling animation state management

---

## **Phase 6: Advanced Features and Polish**
Add enhanced features and optimize the system.

### **Commit 6.1:** Implement dice collision sounds
- Add Web Audio API integration for dice collision sounds
- Create realistic impact sound effects
- Implement volume and pitch variation based on collision force
- Add user preference controls for sound

### **Commit 6.2:** Add dice material and color customization
- Extend DiceOptions to include material properties
- Implement user color picker integration
- Add texture customization options
- Create preset dice theme system

### **Commit 6.3:** Implement dice throwing animations
- Add realistic throwing physics with arc trajectories
- Implement hand/cursor throwing motion
- Add throwing force and angle controls
- Create smooth camera follow during throws

### **Commit 6.4:** Add multi-dice physics interactions
- Implement dice-to-dice collision handling
- Add clustered dice throwing (multiple dice at once)
- Create dice stacking and collision resolution
- Optimize performance for multiple simultaneous dice

### **Commit 6.5:** Create physics debug visualization
- Add optional wireframe physics shape overlay
- Implement velocity and force vector visualization
- Create physics performance metrics display
- Add debug controls for physics parameters

---

## **Phase 7: Performance and Testing**
Optimize performance and add comprehensive testing.

### **Commit 7.1:** Implement physics performance optimizations
- Add object pooling for dice reuse
- Implement level-of-detail (LOD) for distant dice
- Add automatic physics body sleeping for stationary dice
- Optimize geometry complexity based on device capabilities

### **Commit 7.2:** Create comprehensive unit tests
- Add tests for `src/physics/__tests__/DiceManager.test.ts`
- Create tests for `src/physics/__tests__/DiceGeometry.test.ts`
- Implement dice value accuracy tests
- Add physics simulation consistency tests

### **Commit 7.3:** Add integration tests with DiceCanvas
- Create tests for physics-canvas integration
- Test dice spawning and removal
- Verify proper cleanup and memory management
- Add performance benchmark tests

### **Commit 7.4:** Implement error handling and fallbacks
- Add graceful degradation for physics failures
- Implement fallback static dice rolling
- Add error boundary for physics crashes
- Create user feedback for physics issues

### **Commit 7.5:** Add accessibility and mobile support
- Implement touch-friendly dice throwing controls
- Add keyboard shortcuts for dice operations
- Create screen reader announcements for dice results
- Optimize physics for mobile device performance

---

## **Phase 8: Documentation and Polish**
Complete the implementation with documentation and final touches.

### **Commit 8.1:** Create comprehensive API documentation
- Add JSDoc documentation for all public methods
- Create usage examples for each dice type
- Document physics configuration options
- Add troubleshooting guide

### **Commit 8.2:** Add user preferences and settings
- Create dice physics settings panel
- Add gravity, friction, and restitution controls
- Implement dice size and mass customization
- Add simulation speed controls

### **Commit 8.3:** Implement dice rolling history and replay
- Add system to record dice throw parameters
- Create replay functionality for specific throws
- Implement throw sharing between users
- Add throw result verification

### **Commit 8.4:** Create dice collection and customization
- Add system for unlockable dice designs
- Implement dice collection management
- Create custom dice material editor
- Add dice rarity and special effects

### **Commit 8.5:** Final integration and polish
- Integrate all physics features with existing UI
- Add smooth transitions and animations
- Implement final performance optimizations
- Add comprehensive error logging and analytics

---

## **Testing Milestones**

- **After Phase 2:** Basic dice physics and rolling functionality
- **After Phase 4:** All standard dice types working
- **After Phase 5:** Full integration with existing app
- **After Phase 7:** Production-ready performance and reliability
- **After Phase 8:** Complete feature set with polish

## **Estimated Timeline**

- **Phases 1-2:** 3-4 days (Foundation and Core Engine)
- **Phases 3-4:** 4-5 days (Geometry and Dice Types) 
- **Phase 5:** 2-3 days (DiceCanvas Integration)
- **Phases 6-7:** 3-4 days (Advanced Features and Optimization)
- **Phase 8:** 2-3 days (Documentation and Polish)

**Total Estimated Time:** 14-19 days for complete implementation

## **Dependencies and Prerequisites**

- ✅ Three.js v0.176+ 
- ✅ React Three Fiber setup
- ✅ TypeScript configuration
- ✅ Existing DiceCanvas component
- 🔄 cannon-es physics engine (to be installed)
- 🔄 Physics world integration (to be implemented)

This roadmap provides granular, commit-by-commit progress tracking while building toward a production-ready dice physics system that enhances your TTRPG dice roller with realistic 3D physics simulation.