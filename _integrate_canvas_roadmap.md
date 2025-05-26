# Canvas Integration Roadmap: TTRPG Dice Roller

## **🎯 PROJECT STATUS: Ready for Canvas Front-and-Center Implementation**

**Current Reality**: Floating result overlays complete, virtual dice working, ready for layout restructure  
**Your Primary Aims**: Canvas front-and-center, enhanced UX with collapsible controls, hotkeys, expandable sections

---

## **✅ COMPLETED FEATURES**

### **Sprint 1 - Core Virtual Dice Implementation: ✅ COMPLETE**
- ✅ **Virtual Dice Canvas Integration**: Large rolls (>20 dice) spawn as virtual dice
- ✅ **Floating Result Numbers**: Physical dice show floating overlays when settling
- ✅ **Result Synchronization**: Chat results perfectly synced with canvas results
- ✅ **Group Sum Display**: Multiple dice from same roll show group total
- ✅ **No Console Spam**: Clean overlay system with proper state management

---

## **🚀 SPRINT 2: Canvas Front-and-Center Layout (CURRENT PRIORITY)**

### **2.1: Canvas-First Layout Restructure** 🔴 **IMMEDIATE (1-2 hours)**
**Goal**: Make canvas the primary focus instead of sidebar placement

**New Layout Structure**:
```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Canvas (Large, Primary Focus)       │
│ - 70% of viewport height            │
│ - Full width                        │
├─────────────────┬───────────────────┤
│ Chat/Activity   │ Controls/Users    │
│ (Left 60%)      │ (Right 40%)       │
│ - Expandable    │ - Collapsible     │
└─────────────────┴───────────────────┘
```

**Implementation**:
- **Modify**: `src/components/Layout.tsx` - Complete restructure
- **Responsive**: Mobile-first design with collapsible sections
- **Animations**: Smooth transitions for expand/collapse

### **2.2: Enhanced Local Dice Controls** 🔴 **IMMEDIATE (1 hour)**
**Goal**: Professional local dice controls with clear labeling

**Features**:
- **Label**: "Local Dice Controls" with clear section header
- **Collapsed by Default**: Expandable section with toggle
- **Professional Tooltip**: "Local dice are for testing and practice only. They are not shared with other players in the session."
- **Visual Distinction**: Different styling to show they're separate from chat rolls

**Implementation**:
- **Modify**: `src/components/DiceRoller.tsx` - Add collapsible section
- **Add**: Professional tooltip component
- **Style**: Distinct visual treatment

### **2.3: Canvas Controls with Hotkeys** 🔴 **IMMEDIATE (2 hours)**
**Goal**: All canvas controls collapsed by default with hotkey support

**Hotkey Assignments**:
- **Space**: Toggle camera lock (most common action)
- **R**: Roll all dice
- **C**: Clear all dice
- **F**: Toggle fullscreen
- **V**: Reset camera view
- **T**: Throw all dice (physics)

**Smart Input Detection**:
- **No hotkeys when typing**: Detect focus on username input, chat input
- **Visual indicators**: Show hotkey hints in UI
- **Escape to unfocus**: Clear input focus to enable hotkeys

**Implementation**:
- **Create**: `src/hooks/useGlobalHotkeys.ts` - Global hotkey system
- **Modify**: `src/components/controls/CanvasOverlay.tsx` - Add hotkey hints
- **Modify**: `src/components/controls/DiceControlPanel.tsx` - Collapsible by default

### **2.4: Expandable Chat Sections** 🔴 **IMMEDIATE (1-2 hours)**
**Goal**: Better organization of chat area with expandable sections

**Lobby Section**:
- **Expandable User List**: Click to expand/collapse
- **Enhanced User Info**: Show last activity, dice count, connection status
- **User Actions**: Quick actions per user (highlight their dice, etc.)

**Activity Controls**:
- **Expandable Filters**: Show/hide rolls, system messages, chat
- **Activity Settings**: Auto-scroll, timestamp format, etc.
- **Export Options**: Save activity log, clear history

**Implementation**:
- **Modify**: `src/components/ActivityFeed.tsx` - Add expandable sections
- **Modify**: `src/components/UserList.tsx` - Enhanced expandable lobby
- **Add**: `src/components/controls/ActivityControls.tsx` - New controls component

### **2.5: Warning Colors for Incomplete Rolls** 🟡 **QUICK FIX (30 minutes)**
**Goal**: Change incomplete /roll tooltips from error red to warning orange/yellow

**Changes**:
- **ChatInput.tsx**: Change `border-red-500` to `border-orange-500`
- **Error styling**: Change `bg-red-900/20` to `bg-orange-900/20`
- **Border color**: Change `border-red-500` to `border-orange-500`
- **Text color**: Change error red to warning orange

**Implementation**:
- **Modify**: `src/components/ChatInput.tsx` - Update error styling
- **Consistent**: Ensure all incomplete command feedback uses warning colors

---

## **🚀 SPRINT 3: Enhanced UX Features (Next Phase)**

### **3.1: Advanced Hotkey System** 🟢 **MEDIUM PRIORITY (1 hour)**
**Goal**: More sophisticated hotkey management

**Features**:
- **Hotkey Help**: Press `?` to show all hotkeys
- **Customizable**: Allow users to change hotkey assignments
- **Context Aware**: Different hotkeys in different modes
- **Visual Feedback**: Show hotkey activation with brief animations

### **3.2: Enhanced Chat Message Display** 🟢 **MEDIUM PRIORITY (2 hours)**
**Goal**: Better handling of large rolls in chat

**Features**:
- **Expandable Details**: Click to show all individual dice results
- **Hover Tooltips**: Quick preview without expanding
- **Roll Statistics**: Show min/max/average for large rolls
- **Visual Grouping**: Better visual distinction between roll types

### **3.3: Advanced Canvas Controls** 🟢 **MEDIUM PRIORITY (1 hour)**
**Goal**: More sophisticated canvas interaction

**Features**:
- **Camera Presets**: Save/load camera positions
- **Dice Grouping**: Select multiple dice for group actions
- **Advanced Physics**: Gravity settings, bounce settings
- **Visual Effects**: Particle effects, better lighting controls

---

## **🔧 IMPLEMENTATION DETAILS**

### **Critical Files to Modify (Sprint 2)**:

#### **Layout Restructure**:
```typescript
// src/components/Layout.tsx - New structure
<div className="min-h-screen bg-brand-background text-brand-text flex flex-col">
    <Header />
    <main className="flex-grow flex flex-col">
        {/* Canvas - Primary Focus (70% height) */}
        <div className="flex-grow-[7] min-h-0">
            <DiceCanvas />
        </div>
        
        {/* Bottom Panel - Chat & Controls (30% height) */}
        <div className="flex-grow-[3] min-h-0 grid grid-cols-3 gap-4 p-4">
            {/* Left: Chat/Activity (60%) */}
            <div className="col-span-2 flex flex-col space-y-4">
                <ExpandableActivityFeed />
                <ChatInput />
            </div>
            
            {/* Right: Controls/Users (40%) */}
            <div className="flex flex-col space-y-4">
                <ExpandableUserList />
                <CollapsibleDiceRoller />
            </div>
        </div>
    </main>
</div>
```

#### **Global Hotkeys Hook**:
```typescript
// src/hooks/useGlobalHotkeys.ts
export const useGlobalHotkeys = (actions: HotkeyActions) => {
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Skip if typing in input fields
            if (isInputFocused()) return;
            
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    actions.toggleCameraLock();
                    break;
                case 'KeyR':
                    actions.rollAllDice();
                    break;
                // ... more hotkeys
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [actions]);
};
```

#### **Collapsible Controls**:
```typescript
// Enhanced controls with collapse state
const [isExpanded, setIsExpanded] = useState(false);

return (
    <div className="card">
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-brand-surface"
        >
            <span>Local Dice Controls</span>
            <span className="text-xs text-brand-text-muted">
                {isExpanded ? '▼' : '▶'} (Space: Camera Lock, R: Roll)
            </span>
        </button>
        
        {isExpanded && (
            <div className="p-3 border-t border-brand-surface">
                <div className="mb-2 p-2 bg-orange-900/20 rounded border-l-2 border-orange-500">
                    <span className="text-xs text-orange-300">
                        💡 Local dice are for testing and practice only. 
                        They are not shared with other players in the session.
                    </span>
                </div>
                {/* Existing controls */}
            </div>
        )}
    </div>
);
```

---

## **📊 SUCCESS METRICS**

### **Sprint 2 Success Criteria**:
- ✅ Canvas takes up 70% of viewport height as primary focus
- ✅ All controls collapsed by default with clear expand indicators
- ✅ Hotkeys work for all canvas actions (Space, R, C, F, V, T)
- ✅ Hotkeys disabled when typing in username or chat input
- ✅ Local dice controls clearly labeled with professional tooltip
- ✅ Chat has expandable lobby and activity controls sections
- ✅ Incomplete /roll commands show orange/yellow warnings instead of red errors
- ✅ Responsive design works on mobile/tablet
- ✅ Smooth animations for all expand/collapse actions

### **User Experience Goals**:
- **Immediate Focus**: Canvas is obviously the primary interface
- **Discoverability**: All controls are findable but not overwhelming
- **Efficiency**: Power users can use hotkeys for common actions
- **Clarity**: Local vs. shared dice distinction is crystal clear
- **Professional**: UI feels polished and intentional

---

## **🚨 IMPLEMENTATION ORDER**

### **Phase 1 (Immediate)**:
1. **Layout.tsx restructure** - Canvas front-and-center
2. **Warning colors** - Quick fix for incomplete rolls
3. **Local dice controls** - Label and collapse with tooltip

### **Phase 2 (Same Session)**:
4. **Global hotkeys** - Implement hotkey system
5. **Canvas controls** - Collapse and add hotkey hints
6. **Expandable sections** - Chat lobby and activity controls

### **Phase 3 (Polish)**:
7. **Responsive design** - Mobile/tablet optimization
8. **Animations** - Smooth transitions
9. **Testing** - Ensure all hotkeys and interactions work

---

## **🎯 TECHNICAL ARCHITECTURE**

### **New Components**:
```
src/components/
├── layout/
│   ├── ExpandableSection.tsx     # Reusable collapsible component
│   └── HotkeyHint.tsx           # Shows hotkey indicators
├── controls/
│   ├── ActivityControls.tsx      # Expandable activity settings
│   └── CollapsiblePanel.tsx     # Generic collapsible panel
└── lobby/
    └── ExpandableUserList.tsx   # Enhanced user list with actions
```

### **New Hooks**:
```
src/hooks/
├── useGlobalHotkeys.ts          # Global hotkey management
├── useInputFocus.ts             # Track input field focus
└── useCollapsibleState.ts       # Manage collapse/expand state
```

### **Enhanced Services**:
```
src/services/
└── HotkeyService.ts             # Centralized hotkey management
```

---

## **🔄 MIGRATION STRATEGY**

### **Backward Compatibility**:
- All existing functionality preserved
- Gradual enhancement approach
- Feature flags for testing

### **User Adaptation**:
- **Progressive Disclosure**: Start with essential controls visible
- **Onboarding**: Brief tooltip tour for new layout
- **Escape Hatch**: Always allow expanding to see all controls

### **Performance**:
- **Lazy Loading**: Only render expanded sections when needed
- **Efficient Hotkeys**: Minimal event listener overhead
- **Smooth Animations**: Use CSS transforms for performance

---

**Bottom Line**: This implementation will transform the dice roller from a sidebar-focused tool into a canvas-first application with professional UX patterns, efficient hotkey workflows, and clear distinction between local testing and shared gameplay.

