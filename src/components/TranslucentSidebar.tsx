import React from 'react';

interface TranslucentSidebarProps {
    children: React.ReactNode;
    side: 'left' | 'right';
    className?: string;
}

/**
 * TranslucentSidebar Component
 * Provides a translucent overlay sidebar with backdrop blur effect
 * Used for activity feed and lobby panels that overlay the canvas
 */
const TranslucentSidebar: React.FC<TranslucentSidebarProps> = ({
    children,
    side,
    className = ''
}) => {
    return (
        <div
            className={`
        h-full 
        bg-brand-background/80 
        backdrop-blur-sm 
        ${side === 'left' ? 'border-r' : 'border-l'} 
        border-white/10
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default TranslucentSidebar; 