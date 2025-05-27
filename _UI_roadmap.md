# UI Restructure Roadmap

## Overview
Transform the current 3-panel layout into a modern, resizable interface with:
- Full-screen canvas background
- Translucent, resizable sidebars overlaid on canvas
- Embedded chat in activity feed
- Bottom expandable local controls
- Tabbed lobby panel
- Enhanced UX with dice roll modal and help integration

## Current State Analysis

### Existing Components
- `Layout.tsx` - Main 3-panel layout (30% left, flexible center, 25% right)
- `ActivityFeed.tsx` - Chat activity with separate quick roll commands
- `DiceCanvas.tsx` - Square canvas with controls below
- `ChatInput.tsx` - Separate message input component
- `DiceControlPanel.tsx` - Below-canvas dice controls
- `CollapsibleSection.tsx` - Reusable collapsible component

### Current Color Scheme
```css
brand-background: #1a1f2c  // Deep dark blue/grey
brand-surface: #2c3243     // Slightly lighter surface
brand-card: #3a4154        // Card background
brand-primary: #e53e3e     // Red accent
```

## Implementation Phases

### Phase 1: Foundation Setup
**Goal**: Install dependencies and create base layout structure

#### 1.1 Install Dependencies
```bash
npm install react-resizable-panels
```

#### 1.2 Create Base Components
- [ ] `TranslucentSidebar.tsx` - Reusable translucent container
- [ ] `BottomExpandablePanel.tsx` - Bottom-up expanding panel
- [ ] `TabbedPanel.tsx` - Generic tabbed interface component
- [ ] `QuickRollModal.tsx` - Modal for dice roll commands

#### 1.3 Update Layout Structure
- [ ] Replace current Layout.tsx with PanelGroup structure
- [ ] Implement basic resizable panels without styling
- [ ] Ensure canvas takes full background space

### Phase 2: Canvas & Background
**Goal**: Make canvas full-screen background with proper colors

#### 2.1 Canvas Background Color
- [ ] Update DiceCanvas.tsx Canvas component background from black to `#1a1f2c`
- [ ] Test that dice visibility remains good with new background
- [ ] Adjust lighting if needed for better contrast

#### 2.2 Full-Screen Canvas Layout
- [ ] Remove aspect-square constraint from canvas container
- [ ] Make canvas fill entire viewport background
- [ ] Ensure canvas responds to window resize properly
- [ ] Update canvas sizing logic for resizable panels

### Phase 3: Translucent Sidebars
**Goal**: Create overlay sidebars with backdrop blur

#### 3.1 TranslucentSidebar Component
```tsx
interface TranslucentSidebarProps {
  children: React.ReactNode;
  side: 'left' | 'right';
  className?: string;
}

const TranslucentSidebar: React.FC<TranslucentSidebarProps> = ({
  children,
  side,
  className = ''
}) => (
  <div className={`
    h-full 
    bg-brand-background/80 
    backdrop-blur-sm 
    ${side === 'left' ? 'border-r' : 'border-l'} 
    border-white/10
    ${className}
  `}>
    {children}
  </div>
);
```

#### 3.2 Apply to Existing Sidebars
- [ ] Wrap ActivityFeed in TranslucentSidebar
- [ ] Wrap LobbyPanel in TranslucentSidebar
- [ ] Test backdrop-blur performance
- [ ] Adjust opacity/blur values for optimal readability

### Phase 4: Embedded Chat & Dice Modal
**Goal**: Move chat input into activity feed with dice button

#### 4.1 Restructure ActivityFeed
- [ ] Move ChatInput component into ActivityFeed bottom
- [ ] Remove separate ChatInput from Layout
- [ ] Update ActivityFeed layout to accommodate embedded chat
- [ ] Ensure proper flex layout for scrollable activity list

#### 4.2 Create QuickRollModal
```tsx
interface QuickRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickRoll: (command: string) => void;
}
```
- [ ] Extract quick roll commands from ActivityFeed
- [ ] Create modal with dice buttons (d4, d6, d8, d10, d12, d20)
- [ ] Add modal trigger button (🎲) next to chat input
- [ ] Implement modal open/close state management

#### 4.3 Update Chat Input Design
- [ ] Style chat input to match modern chat UX
- [ ] Add dice button (🎲) with proper spacing
- [ ] Ensure send button remains accessible
- [ ] Test keyboard navigation and accessibility

### Phase 5: Bottom Expandable Controls
**Goal**: Replace below-canvas controls with bottom expandable panel

#### 5.1 Create BottomExpandablePanel
```tsx
interface BottomExpandablePanelProps {
  title: string;
  icon?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  expandDirection?: 'up' | 'down';
}
```
- [ ] Create panel that expands upward from bottom
- [ ] Add smooth animation transitions
- [ ] Include collapse/expand toggle button
- [ ] Position absolutely over canvas

#### 5.2 Restructure Dice Controls
- [ ] Move DiceControlPanel content into BottomExpandablePanel
- [ ] Create half-width sub-panels layout:
  - Left: Quick Spawn Controls (dice type selector, spawn buttons)
  - Right: Camera Controls (lock, reset, fullscreen)
- [ ] Update title to "Local Sandbox Controls"
- [ ] Add warning notice about local vs shared dice

#### 5.3 Integration with Canvas
- [ ] Position panel at bottom of canvas area
- [ ] Ensure panel doesn't interfere with canvas interactions
- [ ] Test with fullscreen mode
- [ ] Adjust z-index layering

### Phase 6: Tabbed Lobby Panel
**Goal**: Convert lobby to tabbed interface

#### 6.1 Create TabbedPanel Component
```tsx
interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
}

interface TabbedPanelProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}
```

#### 6.2 Restructure Lobby Content
- [ ] Create "Lobby" tab with current lobby content
- [ ] Create "User Settings" tab with DiceRoller content
- [ ] Extract user settings from DiceRoller (username, color picker)
- [ ] Move active players list to Lobby tab
- [ ] Style tab navigation to match brand theme

#### 6.3 Update LobbyPanel Component
- [ ] Replace CollapsibleSection with TabbedPanel
- [ ] Implement tab switching state
- [ ] Ensure proper content organization
- [ ] Test tab accessibility (keyboard navigation)

### Phase 7: Help Integration
**Goal**: Add help button next to bottom controls

#### 7.1 Relocate Help Button
- [ ] Move HelpButton from canvas overlay to bottom panel area
- [ ] Position next to BottomExpandablePanel toggle
- [ ] Update help content to focus on camera controls
- [ ] Ensure help starts expanded as requested

#### 7.2 Update Help Content
- [ ] Review current camera control instructions
- [ ] Add any missing hotkey information
- [ ] Style help popup to match new design
- [ ] Test help visibility with new layout

### Phase 8: Resizable Panel Integration
**Goal**: Implement react-resizable-panels with persistence

#### 8.1 Panel Configuration
```tsx
<PanelGroup 
  direction="horizontal" 
  autoSaveId="dice-roller-layout"
  className="h-full"
>
  <Panel 
    id="activity-feed"
    defaultSize={25} 
    minSize={20} 
    maxSize={40}
    order={1}
  >
    <TranslucentSidebar side="left">
      <ActivityFeedWithEmbeddedChat />
    </TranslucentSidebar>
  </Panel>
  
  <PanelResizeHandle className="w-1 bg-white/20 hover:bg-white/40 transition-colors" />
  
  <Panel id="canvas" order={2}>
    <FullScreenCanvas />
    <BottomExpandableControls />
    <HelpButton />
  </Panel>
  
  <PanelResizeHandle className="w-1 bg-white/20 hover:bg-white/40 transition-colors" />
  
  <Panel 
    id="lobby"
    defaultSize={25} 
    minSize={20} 
    maxSize={40}
    order={3}
  >
    <TranslucentSidebar side="right">
      <TabbedLobbyPanel />
    </TranslucentSidebar>
  </Panel>
</PanelGroup>
```

#### 8.2 Handle Resize Events
- [ ] Update canvas sizing on panel resize
- [ ] Implement ResizeObserver for canvas dimensions
- [ ] Test canvas performance during resize
- [ ] Ensure Three.js viewport updates correctly

#### 8.3 Mobile Responsiveness
- [ ] Define mobile breakpoints for panel behavior
- [ ] Consider collapsing panels on small screens
- [ ] Test touch interactions on mobile devices
- [ ] Implement responsive panel sizes

### Phase 9: Polish & Optimization
**Goal**: Refine UX and fix edge cases

#### 9.1 Performance Optimization
- [ ] Test backdrop-blur performance on lower-end devices
- [ ] Optimize canvas rendering during panel resize
- [ ] Implement debounced resize handlers if needed
- [ ] Profile memory usage with new layout

#### 9.2 Accessibility Improvements
- [ ] Ensure sufficient contrast ratios with translucent backgrounds
- [ ] Test keyboard navigation through all panels
- [ ] Add proper ARIA labels for resizable handles
- [ ] Verify screen reader compatibility

#### 9.3 Visual Polish
- [ ] Fine-tune translucency levels for optimal readability
- [ ] Adjust resize handle styling and hover states
- [ ] Ensure consistent spacing and typography
- [ ] Test with various content lengths

#### 9.4 Edge Case Handling
- [ ] Test with very narrow panel widths
- [ ] Handle panel collapse/expand edge cases
- [ ] Ensure proper behavior in fullscreen mode
- [ ] Test with disabled JavaScript (graceful degradation)

## Technical Considerations

### State Management
- Existing hook system should work unchanged
- Panel resize state managed by react-resizable-panels
- Modal state for QuickRollModal needs new useState
- Tab state for lobby panel needs new useState

### Performance Implications
- Backdrop-blur can be expensive - monitor performance
- Canvas resize events should be debounced
- Consider virtualizing long activity feeds if needed

### Browser Compatibility
- Backdrop-blur requires modern browsers
- Provide fallback for older browsers (solid background)
- Test resize behavior across different browsers

### Accessibility Requirements
- Maintain keyboard navigation for all interactive elements
- Ensure proper focus management in modals
- Test with screen readers
- Maintain sufficient color contrast

## Success Criteria

### Functional Requirements
- [ ] Canvas takes full background space
- [ ] Sidebars are translucent and resizable
- [ ] Chat is embedded in activity feed with dice button
- [ ] Bottom controls expand upward from bottom
- [ ] Lobby has working tabs (Lobby/User Settings)
- [ ] Help button is positioned next to bottom controls
- [ ] All existing functionality preserved

### Performance Requirements
- [ ] Smooth 60fps animations
- [ ] No noticeable lag during panel resize
- [ ] Canvas maintains good performance
- [ ] Page load time under 3 seconds

### UX Requirements
- [ ] Intuitive panel resizing
- [ ] Clear visual hierarchy
- [ ] Accessible keyboard navigation
- [ ] Mobile-friendly interactions
- [ ] Consistent with modern UI patterns

## Risk Mitigation

### High Risk Items
1. **Canvas sizing with resizable panels** - Implement early and test thoroughly
2. **Performance with backdrop-blur** - Have fallback ready
3. **Mobile responsiveness** - Test on actual devices

### Fallback Plans
- Solid backgrounds if backdrop-blur performs poorly
- Fixed panels if resizing causes issues
- Simplified mobile layout if needed

## Timeline Estimate

- **Phase 1-2**: 1-2 days (Foundation & Canvas)
- **Phase 3-4**: 2-3 days (Sidebars & Chat)
- **Phase 5-6**: 2-3 days (Bottom Controls & Tabs)
- **Phase 7-8**: 2-3 days (Help & Resizable Panels)
- **Phase 9**: 1-2 days (Polish & Testing)

**Total Estimated Time**: 8-13 days

## Next Steps

1. Review and approve this roadmap
2. Begin with Phase 1: Install react-resizable-panels
3. Create base component structure
4. Implement phases incrementally with testing at each step
5. Regular check-ins to ensure alignment with vision

---

*This roadmap provides a structured approach to implementing the UI restructure while maintaining existing functionality and ensuring a smooth user experience.* 