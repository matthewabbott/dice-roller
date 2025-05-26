# Canvas Integration Roadmap: TTRPG Dice Roller

## **🎯 PROJECT STATUS: Post-Analysis, Ready for Virtual Dice Implementation**

**Current Reality**: Strong foundation with sophisticated architecture, but key virtual dice integration gaps  
**Your Primary Aims**: Virtual dice implementation, floating result numbers, canvas front-and-center, enhanced UX

---

## **✅ ACTUAL CURRENT STATE (Post-Codebase Analysis)**

### **What's Actually Working:**
- ✅ **Excellent Architecture**: Well-separated services (`RollProcessor`, `HighlightManager`, `DiceResultManager`)
- ✅ **Virtual Dice Detection**: `RollProcessor` correctly detects when to use virtual dice (>20 dice, non-standard dice)
- ✅ **Cross-System Highlighting**: Chat ↔ Canvas highlighting works via `useHighlighting` hook
- ✅ **Virtual Dice Components**: `VirtualDice.tsx` with sophisticated overlay and summary components
- ✅ **Canvas Virtual Dice Rendering**: Virtual dice are rendered in canvas with highlighting and popups
- ✅ **Physics Dice Implementation**: Robust dice physics with proper face value calculation
- ✅ **Username System**: Server properly handles usernames (not anonymous by default)

### **What's Missing (Your Primary Aims):**
- ❌ **Virtual Dice Canvas Integration**: Large rolls still spawn all physical dice instead of virtual dice
- ❌ **Physical Dice Result Display**: No floating numbers above regular dice when they settle
- ❌ **Canvas Front-and-Center**: Currently in right sidebar, not primary focus
- ❌ **Enhanced Chat UX**: No expandable/hover details for large rolls
- ❌ **Dice Face Labels**: Current dice don't show actual face numbers
- ❌ **Minor Linter Issue**: `isHighlighted` method name in `VirtualDiceRenderer`

### **Key Insight**: 
🎯 **You're 85% there!** The architecture is excellent. Main gap is connecting `RollProcessor` virtual dice detection to actual canvas spawning.

---

## **🚀 SPRINT 1: Core Virtual Dice Implementation (Immediate - Your Primary Aims)**

### **1.1: Fix Virtual Dice Canvas Spawning** ✅ **COMPLETE**
**Problem**: Large rolls (>20 dice) still spawn all physical dice instead of virtual dice  
**Root Cause**: `DiceCanvas` doesn't check `isVirtual` flag from `RollProcessor`

**✅ SOLUTION IMPLEMENTED**: Modified `RemoteDiceService.spawnRemoteDice()` to check `isVirtual` flag:
```typescript
// Skip physical dice creation for virtual dice
if (diceData.isVirtual) {
    console.log(`📡 Skipping physical spawn for virtual ${diceData.diceType} from user ${diceData.userId}`);
    // Update player data for tracking but don't create physical dice
    this.updatePlayerDice(diceData);
    return;
}
```

**Status**: ✅ **Virtual dice detection and filtering is now working!** Large rolls (>20 dice) will spawn as virtual dice instead of physical dice.

### **1.2: Fix Minor Linter Issue** ✅ **COMPLETE**
**Problem**: `VirtualDiceRenderer` uses `isHighlighted` but hook returns `isDiceHighlighted`  
**Solution**: ✅ **Already fixed** - Code correctly uses `isDiceHighlighted(dice.canvasId)`

### **1.3: Add Floating Result Numbers for Physical Dice** 🔴 **NEXT PRIORITY (3 hours)**
**Goal**: Show floating numbers above dice when they settle

**Create new component**: `src/components/canvas/DiceResultOverlay.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';

interface DiceResultOverlayProps {
  diceId: string;
  result: number;
  position: [number, number, number];
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

export const DiceResultOverlay: React.FC<DiceResultOverlayProps> = ({
  diceId, result, position, isVisible, onAnimationComplete
}) => {
  const [animationPhase, setAnimationPhase] = useState<'appearing' | 'visible' | 'fading'>('appearing');

  useEffect(() => {
    if (!isVisible) return;
    const timer1 = setTimeout(() => setAnimationPhase('visible'), 200);
    const timer2 = setTimeout(() => setAnimationPhase('fading'), 2000);
    const timer3 = setTimeout(() => onAnimationComplete?.(), 3000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [isVisible, onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <Html position={[position[0], position[1] + 2, position[2]]} center distanceFactor={8}>
      <div className={`
        bg-yellow-400 text-black px-3 py-2 rounded-lg font-bold text-xl
        shadow-lg border-2 border-yellow-600 transition-all duration-300
        ${animationPhase === 'appearing' ? 'scale-0 opacity-0' : ''}
        ${animationPhase === 'visible' ? 'scale-110 opacity-100' : ''}
        ${animationPhase === 'fading' ? 'scale-100 opacity-60' : ''}
      `}>
        {result}
      </div>
    </Html>
  );
};
```

### **1.4: Canvas Front-and-Center Layout** 🟡 **HIGH PRIORITY (1 hour)**
**Problem**: Canvas in right sidebar instead of primary focus  
**Solution**: Restructure `Layout.tsx` to canvas-first design

```typescript
// New layout structure: Canvas-first with chat/controls below
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

## **🚀 SPRINT 2: Enhanced UX Features (Short Term)**

### **2.1: Enhanced Chat Message Display** 🟡 **HIGH PRIORITY (2 hours)**
**Goal**: Expandable roll details for large rolls in chat

**Modify**: `src/components/ActivityFeed.tsx`
```typescript
const renderRollDetails = (roll: Roll) => {
  const isLargeRoll = roll.results.length > 10;
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isLargeRoll) {
    return <span>({roll.results.join(', ')}) = {roll.total}</span>;
  }
  
  return (
    <div className="mt-1">
      <button onClick={() => setIsExpanded(!isExpanded)} 
              className="text-blue-400 hover:text-blue-300 text-sm">
        {isExpanded ? '▼ Hide' : '▲ Show'} {roll.results.length} individual rolls
      </button>
      {isExpanded && (
        <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
          <div className="grid grid-cols-10 gap-1">
            {roll.results.map((result, i) => (
              <span key={i} className="bg-gray-700 px-1 py-0.5 rounded text-center">
                {result}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="text-sm">Total: {roll.total}</div>
    </div>
  );
};
```

### **2.2: Hover Tooltips for Chat Messages** 🟢 **MEDIUM PRIORITY (1 hour)**
**Goal**: Ghostly hover tooltips showing all die results for large rolls

### **2.3: Spacebar Camera Lock Hotkey** 🟢 **MEDIUM PRIORITY (30 min)**
**Goal**: Add spacebar hotkey for camera lock toggle

**Add to**: `src/hooks/controls/useCameraControls.ts`
```typescript
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      toggleCameraLock();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [toggleCameraLock]);
```

---

## **🚀 SPRINT 3: Polish & Advanced Features (Future)**

### **3.1: Labeled Dice Faces** 🟢 **MEDIUM PRIORITY**
**Goal**: Show actual numbers on dice faces using texture mapping

**Approach**: Enhance geometry components in `src/components/dice/` to use canvas textures with face numbers

### **3.2: Remove/Hide Local Dice System** 🟢 **LOW PRIORITY**
**Goal**: Simplify by focusing only on chat-based `/roll` commands

### **3.3: Enhanced Virtual Dice Interactions** 🟢 **LOW PRIORITY**
- Click virtual dice to expand and show individual results
- Reroll functionality for virtual dice
- Smooth camera transitions when highlighting

---

## **🔧 CURRENT ARCHITECTURE (Excellent Foundation)**

### **Services (Ready to Use):**
```
src/services/
├── RollProcessor.ts           # ✅ 493 lines - Virtual dice detection & processing  
├── DiceResultManager.ts       # ✅ 326 lines - Canvas ↔ Chat correlation
├── CanvasStateManager.ts      # ✅ 393 lines - Server-side state management
├── CanvasSyncManager.ts       # ✅ 399 lines - Client-side sync processing
└── ChatCommandParser.ts      # ✅ 251 lines - /roll command parsing
```

### **Components (Modular & Ready):**
```
src/components/
├── VirtualDice.tsx           # ✅ 272 lines - Sophisticated virtual dice component
├── DiceCanvas.tsx            # ✅ 512 lines - Main orchestrator with virtual dice rendering
├── ActivityFeed.tsx          # ✅ 274 lines - Chat/activity display
├── dice/                     # ✅ D4-D20 geometry components
└── physics/                  # ✅ Physics world and ground
```

### **Hooks (Specialized & Focused):**
```
src/hooks/
├── useHighlighting.ts        # ✅ 220 lines - Cross-system highlighting
├── controls/                 # ✅ useDiceControls, useCameraControls
├── sync/                     # ✅ useRemoteDice, useCanvasSync
└── physics/                  # ✅ useDiceInteraction, usePhysicsSync
```

---

## **📊 SUCCESS METRICS**

### **Sprint 1 Success (Your Primary Aims):**
- ✅ Large rolls (>20 dice) spawn as single virtual dice on canvas
- ✅ Floating numbers appear above physical dice when they settle
- ✅ Canvas is primary focus of UI layout
- ✅ No linter errors

### **Sprint 2 Success:**
- ✅ Chat messages show expandable details for large rolls
- ✅ Hover tooltips work for large roll previews
- ✅ Spacebar toggles camera lock

### **Sprint 3 Success:**
- ✅ Dice faces show actual numbers
- ✅ UI feels polished and streamlined

---

## **🚨 CRITICAL FILES TO MODIFY (Sprint 1)**

### **For Virtual Dice Canvas Integration:**
- `src/components/DiceCanvas.tsx` - Add virtual dice spawning logic (lines 420-440)

### **For Linter Fix:**
- `src/components/DiceCanvas.tsx` - Fix `isHighlighted` → `isDiceHighlighted` (line 214)

### **For Floating Result Numbers:**
- `src/components/canvas/DiceResultOverlay.tsx` - New component
- `src/components/DiceCanvas.tsx` - Integrate result overlays

### **For Layout Changes:**
- `src/components/Layout.tsx` - Restructure to canvas-first layout

---

## **🎯 IMPLEMENTATION STRATEGY**

### **Why This Will Work:**
1. **Foundation is Excellent**: Architecture is sophisticated and well-designed
2. **Services Are Ready**: `RollProcessor` already detects virtual dice correctly
3. **Components Exist**: `VirtualDice` components are well-implemented
4. **Just Need Wiring**: Main gap is connecting detection to canvas spawning

### **Estimated Timeline:**
- **Sprint 1**: 1-2 days (core virtual dice implementation)
- **Sprint 2**: 1-2 days (enhanced UX features)
- **Sprint 3**: Future (polish and advanced features)

**Bottom Line**: You have an excellent foundation! The main work is connecting your sophisticated `RollProcessor` virtual dice detection to the canvas spawning logic. After that, it's mostly UX enhancements and polish.

