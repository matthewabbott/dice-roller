import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DICE_COLORS } from '../constants/colors';
import { DiceManager, DiceD6, PhysicsUtils } from '../physics';
import * as CANNON from 'cannon-es';

// Extend R3F with the geometry we need
extend({ EdgesGeometry: THREE.EdgesGeometry });

interface DiceCanvasProps {
    // TODO
}

// Simplified Physics-based D6 Component
const PhysicsD6: React.FC<{ dice: DiceD6 }> = ({ dice }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Update mesh position/rotation from physics body every frame
    useFrame(() => {
        if (meshRef.current && dice) {
            // Get position and rotation from the physics body directly (bypass DiceObject mesh)
            const position = PhysicsUtils.cannonVectorToThree(dice.body.position);
            const quaternion = PhysicsUtils.cannonQuaternionToThree(dice.body.quaternion);

            meshRef.current.position.copy(position);
            meshRef.current.quaternion.copy(quaternion);
        }
    });

    // Simple cube for testing - bypassing complex geometry for now
    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="white" />
        </mesh>
    );
};

// Ground plane component with physics
const PhysicsGround: React.FC = () => {
    useEffect(() => {
        // Create physics ground plane
        const groundShape = PhysicsUtils.createPlaneShape();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -0.5, 0);

        if (DiceManager.getMaterials()) {
            groundBody.material = DiceManager.getMaterials()!.floor;
        }

        DiceManager.addBody(groundBody);

        return () => {
            DiceManager.removeBody(groundBody);
        };
    }, []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color={DICE_COLORS.TABLE_DARK} />
        </mesh>
    );
};

// Physics simulation component
const PhysicsSimulation: React.FC<{ dice: DiceD6 | null }> = ({ dice: _dice }) => {
    useFrame((_state, delta) => {
        // Step the physics simulation
        if (DiceManager.isInitialized()) {
            DiceManager.step(delta);
        }
    });

    return null;
};

const DiceCanvas: React.FC<DiceCanvasProps> = () => {
    const controlsRef = useRef<any>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [dice, setDice] = useState<DiceD6 | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [currentValue, setCurrentValue] = useState<number | null>(null);

    // Initialize physics world and dice
    useEffect(() => {
        // Initialize physics world
        if (!DiceManager.isInitialized()) {
            DiceManager.setWorld();
            console.log('🎲 Physics world initialized for DiceCanvas');
        }

        // Create a D6 dice
        const newDice = new DiceD6({
            size: 1, // Use unit size for the scene
            fontColor: '#000000',
            backColor: '#ffffff'
        });

        // Position the dice above the ground
        newDice.setPosition(new THREE.Vector3(0, 2, 0));

        setDice(newDice);
        console.log('🎲 D6 dice created and added to scene', {
            position: newDice.getPosition(),
            size: newDice.options.size,
            body: newDice.body
        });

        return () => {
            // Cleanup
            if (newDice) {
                newDice.dispose();
            }
        };
    }, []);

    const rollDice = useCallback(async () => {
        if (!dice || isRolling) return;

        setIsRolling(true);
        setCurrentValue(null);

        try {
            console.log('🎲 Rolling dice...');

            // Throw the dice with physics
            dice.throwDice(1.5); // Medium force

            // Wait for the dice to settle and get the result
            const result = await DiceManager.rollSingle(dice, Math.floor(Math.random() * 6) + 1, 8000);

            setCurrentValue(result.value);
            console.log(`🎲 Dice settled on: ${result.value}`);

        } catch (error) {
            console.error('🎲 Error rolling dice:', error);
        } finally {
            setIsRolling(false);
        }
    }, [dice, isRolling]);

    const resetDice = useCallback(() => {
        if (!dice) return;

        // Reset position and clear velocities
        dice.setPosition(new THREE.Vector3(0, 2, 0));
        dice.body.velocity.set(0, 0, 0);
        dice.body.angularVelocity.set(0, 0, 0);

        setCurrentValue(null);
        setIsRolling(false);

        console.log('🎲 Dice reset');
    }, [dice]);

    const resetCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    if (isFullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-900">
                <Canvas
                    className="h-screen w-screen"
                    camera={{ position: [0, 5, 5], fov: 50 }}
                    gl={{ antialias: true, alpha: false }}
                >
                    <OrbitControls ref={controlsRef} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                    <directionalLight position={[-5, 5, -5]} intensity={0.5} />

                    {/* Physics Ground */}
                    <PhysicsGround />

                    {/* Physics D6 */}
                    {dice && <PhysicsD6 dice={dice} />}

                    {/* Physics Simulation */}
                    <PhysicsSimulation dice={dice} />
                </Canvas>

                {/* Full screen controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <div className="bg-gray-800 px-3 py-2 rounded text-white font-mono">
                        {isRolling ? 'Rolling...' : currentValue ? `Result: ${currentValue}` : 'Ready to roll'}
                    </div>
                    <button
                        onClick={rollDice}
                        disabled={isRolling}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
                        title="Roll the dice"
                    >
                        {isRolling ? '🎲 Rolling...' : '🎲 Roll Dice'}
                    </button>
                    <button
                        onClick={resetDice}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-2 rounded"
                        title="Reset dice position"
                    >
                        🔄 Reset
                    </button>
                    <button
                        onClick={resetCamera}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
                        title="Reset camera view"
                    >
                        📷 Reset View
                    </button>
                    <button
                        onClick={toggleFullScreen}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
                        title="Exit full screen"
                    >
                        ✕ Exit Full Screen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <Canvas
                className="w-full aspect-square"
                camera={{ position: [0, 5, 5], fov: 50 }}
                gl={{ antialias: true, alpha: false }}
            >
                <OrbitControls ref={controlsRef} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                <directionalLight position={[-5, 5, -5]} intensity={0.5} />

                {/* Physics Ground */}
                <PhysicsGround />

                {/* Physics D6 */}
                {dice && <PhysicsD6 dice={dice} />}

                {/* Physics Simulation */}
                <PhysicsSimulation dice={dice} />
            </Canvas>

            {/* Normal mode controls */}
            <div className="absolute top-2 right-2 flex gap-1">
                <div className="bg-gray-800 px-2 py-1 rounded text-white text-xs font-mono">
                    {isRolling ? 'Rolling...' : currentValue ? `${currentValue}` : 'Ready'}
                </div>
                <button
                    onClick={rollDice}
                    disabled={isRolling}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-xs px-2 py-1 rounded"
                    title="Roll the dice"
                >
                    🎲
                </button>
                <button
                    onClick={resetDice}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-2 py-1 rounded opacity-70 hover:opacity-100"
                    title="Reset dice"
                >
                    🔄
                </button>
                <button
                    onClick={resetCamera}
                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-70 hover:opacity-100"
                    title="Reset camera view"
                >
                    📷
                </button>
                <button
                    onClick={toggleFullScreen}
                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-70 hover:opacity-100"
                    title="Full screen"
                >
                    ⛶
                </button>
            </div>
        </div>
    );
};

export default DiceCanvas; 