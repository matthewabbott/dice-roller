import React, { useState } from 'react';
import LocalSandboxControls from './LocalSandboxControls';
import CameraControlsPanel from './CameraControlsPanel';

interface UnifiedBottomControlsProps {
    // Sandbox controls
    onQuickRoll?: (command: string) => void;

    // Camera controls
    isCameraLocked: boolean;
    onToggleCameraLock: () => void;
    onResetCamera: () => void;
    onToggleFullScreen: () => void;
}

/**
 * UnifiedBottomControls Component
 * Provides a unified bottom bar with both sandbox and camera controls
 * Features hover expansion and click-to-expand functionality
 */
const UnifiedBottomControls: React.FC<UnifiedBottomControlsProps> = ({
    onQuickRoll,
    isCameraLocked,
    onToggleCameraLock,
    onResetCamera,
    onToggleFullScreen
}) => {
    const [expandedPanel, setExpandedPanel] = useState<'sandbox' | 'camera' | null>(null);

    const togglePanel = (panel: 'sandbox' | 'camera') => {
        setExpandedPanel(expandedPanel === panel ? null : panel);
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 z-20">
            {/* Control Buttons Bar */}
            <div className="flex bg-brand-surface/90 backdrop-blur-sm border-t border-white/10">
                {/* Sandbox Controls Button */}
                <button
                    onClick={() => togglePanel('sandbox')}
                    className="flex-1 px-4 py-3 flex items-center justify-center gap-2 text-left hover:bg-brand-surface transition-colors border-r border-white/10"
                    title={`${expandedPanel === 'sandbox' ? 'Collapse' : 'Expand'} Local Sandbox Controls`}
                >
                    <span className="text-lg">🛝</span>
                    <span className="font-medium text-brand-text">Local Controls</span>
                    <span
                        className={`text-brand-text-muted transition-transform duration-200 ml-auto ${expandedPanel === 'sandbox' ? 'rotate-180' : 'rotate-0'
                            }`}
                    >
                        ▲
                    </span>
                </button>

                {/* Camera Controls Button */}
                <button
                    onClick={() => togglePanel('camera')}
                    className="flex-1 px-4 py-3 flex items-center justify-center gap-2 text-left hover:bg-brand-surface transition-colors"
                    title={`${expandedPanel === 'camera' ? 'Collapse' : 'Expand'} Camera Controls`}
                >
                    <span className="text-lg">📷</span>
                    <span className="font-medium text-brand-text">Camera Controls</span>
                    <span
                        className={`text-brand-text-muted transition-transform duration-200 ml-auto ${expandedPanel === 'camera' ? 'rotate-180' : 'rotate-0'
                            }`}
                    >
                        ▲
                    </span>
                </button>
            </div>

            {/* Expandable Content */}
            <div
                className={`
                    overflow-hidden 
                    transition-all 
                    duration-300 
                    ease-in-out 
                    bg-brand-surface/90 
                    backdrop-blur-sm 
                    border-t 
                    border-white/10
                    ${expandedPanel ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="p-4">
                    {expandedPanel === 'sandbox' && (
                        <LocalSandboxControls onQuickRoll={onQuickRoll} />
                    )}
                    {expandedPanel === 'camera' && (
                        <CameraControlsPanel
                            isCameraLocked={isCameraLocked}
                            onToggleCameraLock={onToggleCameraLock}
                            onResetCamera={onResetCamera}
                            onToggleFullScreen={onToggleFullScreen}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedBottomControls; 