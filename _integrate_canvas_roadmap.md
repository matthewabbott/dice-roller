# Canvas Integration Roadmap: TTRPG Dice Roller

## **🎯 PROJECT STATUS: Post-Refactoring, Ready for Integration**

**Current Reality**: Excellent refactoring foundation completed, but key integrations missing  
**Your Primary Aims**: Cross-system highlighting, virtual dice integration, canvas front-and-center, bug fixes

---

## **✅ ACTUAL CURRENT STATE (Post-Codebase Analysis)**

### **What's Actually Working:**
- ✅ **De-Monolith Refactoring**: DiceCanvas reduced from 2013 → 298 lines (85% reduction)
- ✅ **Modular Architecture**: 20+ focused components, 6+ business logic services
- ✅ **Basic Chat/Canvas Integration**: `/roll` commands create canvas dice with real-time sync
- ✅ **Service Infrastructure**: `HighlightManager`, `RollProcessor`, `VirtualDice` component all exist

### **What's Missing (Your Primary Aims):**
- ❌ **Cross-System Highlighting**: Services exist but no UI click handlers
- ❌ **Virtual Dice Integration**: Component exists but not rendered in canvas
- ❌ **Dice Result Display**: No floating numbers above dice
- ❌ **Canvas Front-and-Center**: Currently in right sidebar, not primary focus
- ❌ **Anonymous Roll Bug**: Rolls show "anonymous" instead of username

### **Key Insight**: 
🎯 **You're 80% there!** The hard architectural work is done. Just need to connect services to UI components.

---

## **🚀 SPRINT 1: Core Integration (Immediate - Your Primary Aims)**

### **1.1: Fix Anonymous Roll Bug** 🔴 **CRITICAL (30 min)**
**Problem**: Dice rolls show as "anonymous" instead of username  
**Solution**: Fix user context in server mutation

**Files to check/modify:**
- `server.ts`: Ensure `rollDice` mutation uses proper user context
- `src/components/ChatInput.tsx`: Verify user context passed with commands

### **1.2: Integrate Virtual Dice in Canvas** 🟡 **HIGH PRIORITY (2 hours)**
**Problem**: Large rolls (>20 dice) still spawn all physical dice instead of single virtual dice  
**Solution**: Make canvas respect `isVirtual` flag from `RollProcessor`

**Files to modify:**
```typescript
// src/components/DiceCanvas.tsx - Add virtual dice rendering
{diceState.dice.map((die, index) => 
  die.isVirtual ? (
    <VirtualDice key={`virtual-${index}`} diceData={die} />
  ) : (
    <PhysicsDice key={`dice-${index}`} dice={die} />
  )
)}

// src/hooks/controls/useDiceControls.ts - Check isVirtual flag
const processRollResult = (rollResult) => {
  rollResult.canvasData.diceRolls.forEach(diceRoll => {
    if (diceRoll.isVirtual) {
      // Create virtual dice representation
    } else {
      // Create physical dice as before
    }
  });
};
```

### **1.3: Add Cross-System Click Handlers** 🟡 **HIGH PRIORITY (3 hours)**
**Problem**: `HighlightManager` service exists but no UI components use it  
**Solution**: Add click handlers to connect chat ↔ canvas

**Files to modify:**
```typescript
// src/components/ActivityFeed.tsx - Add click handlers to roll items
const handleRollClick = (activity: Activity) => {
  if (activity.roll?.canvasData?.dice) {
    highlightManager.highlightActivity(activity.id);
  }
};

// src/components/DiceCanvas.tsx - Add click handlers to dice
const handleDiceClick = (diceId: string) => {
  highlightManager.highlightDice(diceId);
};
```

**Create new hook:**
```typescript
// src/hooks/useHighlighting.ts
export const useHighlighting = () => {
  const highlightManager = useContext(HighlightManagerContext);
  
  const highlightFromChat = useCallback((activityId: string) => {
    highlightManager.highlightActivity(activityId);
    highlightManager.requestCameraFocus(activityId);
  }, [highlightManager]);
  
  const highlightFromCanvas = useCallback((diceId: string) => {
    highlightManager.highlightDice(diceId);
    highlightManager.requestActivityScroll(diceId);
  }, [highlightManager]);
  
  return { highlightFromChat, highlightFromCanvas };
};
```

### **1.4: Canvas Front-and-Center Layout** 🟢 **MEDIUM PRIORITY (1 hour)**
**Problem**: Canvas in right sidebar instead of primary focus  
**Solution**: Restructure layout to make canvas prominent

**File to modify:**
```typescript
// src/components/Layout.tsx - New layout structure
// Current: 3-column with canvas on right
// New: Canvas-first with chat/controls below

┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Canvas (Large, Primary)             │
│                                     │
├─────────────────┬───────────────────┤
│ Chat/Activity   │ Controls/Users    │
│ (Left)          │ (Right)           │
└─────────────────┴───────────────────┘
```

---

## **🚀 SPRINT 2: Enhanced Features (Short Term)**

### **2.1: Dice Result Display System** 🟡 **HIGH PRIORITY**
**Goal**: Show floating numbers above dice when rolled

**Implementation:**
```typescript
// New component: src/components/canvas/DiceResultOverlay.tsx
const DiceResultOverlay = ({ dice, results }) => (
  <Html position={[dice.position.x, dice.position.y + 2, dice.position.z]}>
    <div className="bg-yellow-400 text-black px-2 py-1 rounded font-bold">
      {results[dice.id]}
    </div>
  </Html>
);
```

### **2.2: Group Highlighting for Multi-Dice Rolls** 🟢 **MEDIUM PRIORITY**
**Goal**: Highlight all dice from same roll together (e.g., 10d6 highlighted as group)

### **2.3: UI Cleanup and Polish** 🟢 **MEDIUM PRIORITY**
**Goal**: Remove redundant components, improve styling consistency

---

## **🚀 SPRINT 3: Advanced Features (Future)**

### **3.1: Enhanced Virtual Dice Interactions**
- Click virtual dice to expand and show individual results
- Reroll functionality for virtual dice

### **3.2: Smooth Camera Transitions**
- Smooth camera movement when highlighting dice
- Zoom and frame highlighted dice groups

### **3.3: Performance Optimization**
- Canvas cleanup strategies
- Memory management for many dice
- Performance monitoring

---

## **🔧 CURRENT ARCHITECTURE (Post-Refactoring)**

### **Services (Ready to Use):**
```
src/services/
├── HighlightManager.ts        # ✅ 544 lines - Full highlighting system
├── RollProcessor.ts           # ✅ Virtual dice detection & processing  
├── DiceResultManager.ts       # ✅ Canvas ↔ Chat correlation
├── CanvasStateManager.ts      # ✅ Server-side state management
├── CanvasSyncManager.ts       # ✅ Client-side sync processing
└── ChatCommandParser.ts      # ✅ /roll command parsing
```

### **Components (Modular & Ready):**
```
src/components/
├── dice/                      # ✅ D4-D20 geometry components
├── physics/                   # ✅ Physics world and ground
├── sync/                      # ✅ Remote dice and sync status
├── controls/                  # ✅ UI control panels
├── VirtualDice.tsx           # ✅ 272 lines - Virtual dice component
├── DiceCanvas.tsx            # ✅ 298 lines - Main orchestrator
└── ActivityFeed.tsx          # ✅ Chat/activity display
```

### **Hooks (Specialized & Focused):**
```
src/hooks/
├── controls/                  # ✅ useDiceControls, useCameraControls
├── sync/                      # ✅ useRemoteDice, useCanvasSync
└── physics/                   # ✅ useDiceInteraction, usePhysicsSync
```

---

## **📊 SUCCESS METRICS**

### **Sprint 1 Success (Your Primary Aims):**
- ✅ Dice rolls show correct username (not anonymous)
- ✅ Large rolls (>20 dice) spawn as single virtual dice on canvas
- ✅ Click chat message → canvas dice highlight
- ✅ Click canvas dice → chat message highlight  
- ✅ Canvas is primary focus of UI layout

### **Sprint 2 Success:**
- ✅ Floating numbers appear above dice when rolled
- ✅ Multi-dice rolls highlight as group
- ✅ UI feels polished and responsive

---

## **🚨 CRITICAL FILES TO MODIFY (Sprint 1)**

### **For Anonymous Bug Fix:**
- `server.ts` - Check user context in rollDice mutation
- `src/components/ChatInput.tsx` - Ensure user context passed

### **For Virtual Dice Integration:**
- `src/components/DiceCanvas.tsx` - Add virtual dice rendering logic
- `src/hooks/controls/useDiceControls.ts` - Check isVirtual flag

### **For Cross-System Highlighting:**
- `src/components/ActivityFeed.tsx` - Add click handlers for roll items
- `src/components/DiceCanvas.tsx` - Add click handlers for dice
- `src/hooks/useHighlighting.ts` - New hook to connect HighlightManager

### **For Layout Changes:**
- `src/components/Layout.tsx` - Restructure to canvas-first layout

---

## **🎯 IMPLEMENTATION STRATEGY**

### **Why This Will Work:**
1. **Foundation is Solid**: Refactoring created excellent service architecture
2. **Services Exist**: `HighlightManager`, `VirtualDice`, `RollProcessor` all implemented
3. **Just Need Wiring**: Connect existing services to UI components
4. **Quick Wins**: Most changes are small integrations, not major rewrites

### **Estimated Timeline:**
- **Sprint 1**: 1-2 days (your primary aims)
- **Sprint 2**: 2-3 days (polish and enhancement)
- **Sprint 3**: Future (advanced features)

**Bottom Line**: You're much closer than you thought! The hard architectural work is done - now just connect the pieces to achieve your primary aims.

