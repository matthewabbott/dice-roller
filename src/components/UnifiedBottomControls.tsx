import React, { useState } from 'react';
import CameraControlsPanel from './CameraControlsPanel';
import DiceControlsPanel from './DiceControlsPanel';

interface UnifiedBottomControlsProps {
    // Dice controls
    onQuickRoll?: (command: string) => void;

    // Camera controls
    isCameraLocked: boolean;
    onToggleCameraLock: () => void;
    onResetCamera: () => void;
    onToggleFullScreen: () => void;
}

/**
 * UnifiedBottomControls Component
 * Provides both dice and camera controls with hover-to-peek and click-to-expand functionality
 */
const UnifiedBottomControls: React.FC<UnifiedBottomControlsProps> = ({
    onQuickRoll,
    isCameraLocked,
    onToggleCameraLock,
    onResetCamera,
    onToggleFullScreen
}) => {
    const [expandedPanel, setExpandedPanel] = useState<'dice' | 'camera' | null>(null);
    const [hoveredPanel, setHoveredPanel] = useState<'dice' | 'camera' | null>(null);

    const togglePanel = (panel: 'dice' | 'camera') => {
        setExpandedPanel(expandedPanel === panel ? null : panel);
    };

    // Determine which panel should be shown (expanded takes priority over hovered)
    const activePanel = expandedPanel || hoveredPanel;
    const isExpanded = expandedPanel !== null;
    const isPeeking = !isExpanded && hoveredPanel !== null;

    return (
        <div className="absolute bottom-0 left-0 right-0 z-20">
            {/* Control Buttons Bar */}
            <div className="flex bg-brand-surface/90 backdrop-blur-sm border-t border-white/10">
                {/* Dice Controls Button */}
                <button
                    onClick={() => togglePanel('dice')}
                    onMouseEnter={() => setHoveredPanel('dice')}
                    onMouseLeave={() => setHoveredPanel(null)}
                    className={`
                        flex-1 px-4 py-3 flex items-center justify-center gap-2 text-left 
                        transition-all duration-200 border-r border-white/10
                        ${activePanel === 'dice'
                            ? 'bg-brand-surface text-brand-text shadow-lg'
                            : 'hover:bg-brand-surface/50 text-brand-text-muted hover:text-brand-text'
                        }
                    `}
                    title={expandedPanel === 'dice'
                        ? 'Collapse Dice Controls'
                        : isPeeking && hoveredPanel === 'dice'
                            ? 'Click to expand Dice Controls'
                            : 'Dice Controls (hover to peek)'
                    }
                >
                    <span className="text-lg">🎲</span>
                    <span className="font-medium">
                        {isPeeking && hoveredPanel === 'dice' ? 'Dice Controls (Click to expand)' : 'Dice Controls'}
                    </span>
                    <span
                        className={`transition-all duration-300 ml-auto ${expandedPanel === 'dice'
                            ? 'rotate-180 text-brand-text'
                            : isPeeking && hoveredPanel === 'dice'
                                ? 'rotate-90 text-brand-text-muted'
                                : 'rotate-0 text-brand-text-muted'
                            }`}
                    >
                        ▲
                    </span>
                </button>

                {/* Camera Controls Button */}
                <button
                    onClick={() => togglePanel('camera')}
                    onMouseEnter={() => setHoveredPanel('camera')}
                    onMouseLeave={() => setHoveredPanel(null)}
                    className={`
                        flex-1 px-4 py-3 flex items-center justify-center gap-2 text-left 
                        transition-all duration-200
                        ${activePanel === 'camera'
                            ? 'bg-brand-surface text-brand-text shadow-lg'
                            : 'hover:bg-brand-surface/50 text-brand-text-muted hover:text-brand-text'
                        }
                    `}
                    title={expandedPanel === 'camera'
                        ? 'Collapse Camera Controls'
                        : isPeeking && hoveredPanel === 'camera'
                            ? 'Click to expand Camera Controls'
                            : 'Camera Controls (hover to peek)'
                    }
                >
                    <span className="text-lg">📷</span>
                    <span className="font-medium">
                        {isPeeking && hoveredPanel === 'camera' ? 'Camera Controls (Click to expand)' : 'Camera Controls'}
                    </span>
                    <span
                        className={`transition-all duration-300 ml-auto ${expandedPanel === 'camera'
                            ? 'rotate-180 text-brand-text'
                            : isPeeking && hoveredPanel === 'camera'
                                ? 'rotate-90 text-brand-text-muted'
                                : 'rotate-0 text-brand-text-muted'
                            }`}
                    >
                        ▲
                    </span>
                </button>
            </div>

            {/* Expandable Content with improved animations */}
            <div
                className={`
                    overflow-hidden 
                    transition-all 
                    duration-500
                    ease-out
                    bg-brand-surface/90 
                    backdrop-blur-sm 
                    border-t 
                    border-white/10
                    ${activePanel
                        ? isExpanded
                            ? 'max-h-96 opacity-100 shadow-2xl'
                            : 'max-h-32 opacity-75 shadow-lg'
                        : 'max-h-0 opacity-0'
                    }
                `}
                onMouseEnter={() => {
                    // Keep hover state when mouse enters the content area
                    if (isPeeking) {
                        setHoveredPanel(activePanel);
                    }
                }}
                onMouseLeave={() => {
                    // Clear hover state when mouse leaves the content area
                    if (isPeeking) {
                        setHoveredPanel(null);
                    }
                }}
            >
                <div className={`p-4 transition-all duration-300 ${isPeeking ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
                    {activePanel === 'dice' && (
                        <DiceControlsPanel
                            onQuickRoll={onQuickRoll}
                            isPeeking={isPeeking}
                        />
                    )}
                    {activePanel === 'camera' && (
                        <CameraControlsPanel
                            isCameraLocked={isCameraLocked}
                            onToggleCameraLock={onToggleCameraLock}
                            onResetCamera={onResetCamera}
                            onToggleFullScreen={onToggleFullScreen}
                            isPeeking={isPeeking}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedBottomControls; 