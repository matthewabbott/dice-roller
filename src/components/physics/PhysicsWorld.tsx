import React, { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { DiceManager } from '../../physics';

export interface PhysicsWorldProps {
    onInitialized?: (initialized: boolean) => void;
    children?: React.ReactNode;
}

/**
 * PhysicsWorld Component
 * Manages the physics world initialization and simulation stepping
 * Extracted from DiceCanvas for better separation of concerns
 */
export const PhysicsWorld: React.FC<PhysicsWorldProps> = ({ onInitialized, children }) => {
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize physics world
    useEffect(() => {
        const initPhysics = async () => {
            try {
                if (!DiceManager.isInitialized()) {
                    DiceManager.setWorld();

                    // Add air resistance/dampening to make dice behavior more controlled
                    const world = DiceManager.getWorld();
                    if (world) {
                        // Set global dampening to simulate air resistance
                        world.defaultContactMaterial.friction = 0.4; // Increase friction
                        world.defaultContactMaterial.restitution = 0.3; // Reduce bounciness

                        // Add linear and angular dampening to all bodies
                        world.addEventListener('addBody', (event: any) => {
                            const body = event.body;
                            if (body) {
                                body.linearDamping = 0.1;  // Air resistance for movement
                                body.angularDamping = 0.1; // Air resistance for rotation
                            }
                        });
                    }
                }
                setIsInitialized(true);
                onInitialized?.(true);
                console.log('🎲 Physics world initialized with dampening');
            } catch (error) {
                console.error('❌ Failed to initialize physics:', error);
                onInitialized?.(false);
            }
        };

        initPhysics();
    }, [onInitialized]);

    // Step the physics simulation every frame
    useFrame((_state, delta) => {
        if (isInitialized && DiceManager.isInitialized()) {
            DiceManager.step(delta);
        }
    });

    // Only render children when physics is initialized
    return isInitialized ? <>{children}</> : null;
};

