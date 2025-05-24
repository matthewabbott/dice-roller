import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DICE_COLORS } from '../constants/colors';
import { DiceManager, DiceD6, DiceD4, PhysicsUtils } from '../physics';
import * as CANNON from 'cannon-es';

// Extend R3F with the geometry we need
extend({ EdgesGeometry: THREE.EdgesGeometry });

interface DiceCanvasProps {
    // TODO
}

// Define available dice types
type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
type DiceInstance = DiceD4 | DiceD6;

// Dice configuration
const DICE_CONFIG = {
    d4: {
        name: 'D4 (Tetrahedron)',
        emoji: '▲',
        min: 1,
        max: 4,
        color: '#ff6b6b',
        isAvailable: true,
        create: () => new DiceD4({ size: 1 })
    },
    d6: {
        name: 'D6 (Cube)',
        emoji: '⬜',
        min: 1,
        max: 6,
        color: '#4ecdc4',
        isAvailable: true,
        create: () => new DiceD6({ size: 1 })
    },
    d8: {
        name: 'D8 (Octahedron)',
        emoji: '🔸',
        min: 1,
        max: 8,
        color: '#45b7d1',
        isAvailable: false,
        create: () => null // Not implemented yet
    },
    d10: {
        name: 'D10 (Pentagonal)',
        emoji: '🔟',
        min: 1,
        max: 10,
        color: '#96ceb4',
        isAvailable: false,
        create: () => null // Not implemented yet
    },
    d12: {
        name: 'D12 (Dodecahedron)',
        emoji: '⬡',
        min: 1,
        max: 12,
        color: '#feca57',
        isAvailable: false,
        create: () => null // Not implemented yet
    },
    d20: {
        name: 'D20 (Icosahedron)',
        emoji: '🔴',
        min: 1,
        max: 20,
        color: '#ff9ff3',
        isAvailable: false,
        create: () => null // Not implemented yet
    }
};

// Enhanced Physics Dice Component that renders actual dice geometry
const PhysicsDice: React.FC<{ dice: DiceInstance }> = ({ dice }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Update mesh position/rotation from physics body every frame
    useFrame(() => {
        if (meshRef.current && dice) {
            // Sync with physics body
            dice.updateMesh();

            // Copy from the dice's internal Three.js object
            meshRef.current.position.copy(dice.object.position);
            meshRef.current.quaternion.copy(dice.object.quaternion);
        }
    });

    // Create a simple visible representation for now since the dice.object might have rendering issues
    // We'll render a simple colored shape that matches the dice type
    const isDiceD4 = dice.diceType === 'd4';

    if (isDiceD4) {
        // Simple tetrahedron geometry for D4
        return (
            <mesh ref={meshRef} castShadow receiveShadow>
                <tetrahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                    color="#ff6b6b"
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
        );
    } else {
        // Simple box geometry for D6
        return (
            <mesh ref={meshRef} castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color="#4ecdc4"
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
        );
    }
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial
                color={DICE_COLORS.TABLE_DARK}
                roughness={0.8}
                metalness={0.0}
            />
        </mesh>
    );
};

// Physics simulation component
const PhysicsSimulation: React.FC<{ dice: DiceInstance | null }> = ({ dice: _dice }) => {
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
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>('d6');
    const [dice, setDice] = useState<DiceInstance | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [currentValue, setCurrentValue] = useState<number | null>(null);
    const [rollHistory, setRollHistory] = useState<{ type: DiceType; value: number; timestamp: number }[]>([]);
    const [isPhysicsInitialized, setIsPhysicsInitialized] = useState(false);

    // Initialize physics world
    useEffect(() => {
        if (!DiceManager.isInitialized()) {
            try {
                DiceManager.setWorld();
                setIsPhysicsInitialized(true);
                console.log('🎲 Physics world initialized for DiceCanvas');
            } catch (error) {
                console.error('🎲 Failed to initialize physics world:', error);
            }
        } else {
            setIsPhysicsInitialized(true);
        }

        return () => {
            // Cleanup when component unmounts
            if (dice) {
                dice.dispose();
            }
        };
    }, []); // Empty dependency array for initialization only

    // Create dice when type changes (only after physics is initialized)
    useEffect(() => {
        if (!isPhysicsInitialized) return;

        // Clean up existing dice
        if (dice) {
            dice.dispose();
        }

        // Create new dice of selected type
        const config = DICE_CONFIG[selectedDiceType];
        if (config.isAvailable && config.create) {
            try {
                const newDice = config.create();
                if (newDice) {
                    // Position the dice above the ground
                    newDice.setPosition(new THREE.Vector3(0, 2, 0));
                    setDice(newDice);
                    setCurrentValue(null);

                    console.log(`🎲 ${selectedDiceType.toUpperCase()} dice created and added to scene`, {
                        type: selectedDiceType,
                        position: newDice.getPosition(),
                        size: newDice.options.size
                    });
                }
            } catch (error) {
                console.error(`🎲 Failed to create ${selectedDiceType} dice:`, error);
                setDice(null);
            }
        } else {
            setDice(null);
            console.log(`🎲 ${selectedDiceType.toUpperCase()} not implemented yet`);
        }
    }, [selectedDiceType, isPhysicsInitialized]); // Depend on both selectedDiceType and physics initialization

    // Cleanup effect for when dice changes
    useEffect(() => {
        return () => {
            // Cleanup current dice when it changes or component unmounts
            if (dice) {
                dice.dispose();
            }
        };
    }, [dice]);

    const rollDice = useCallback(async () => {
        if (!dice || isRolling) return;

        setIsRolling(true);
        setCurrentValue(null);

        try {
            console.log(`🎲 Rolling ${selectedDiceType.toUpperCase()}...`);

            // Throw the dice with physics
            dice.throwDice(1.2); // Medium force

            // Wait for the dice to settle and get the result
            const config = DICE_CONFIG[selectedDiceType];
            const targetValue = Math.floor(Math.random() * config.max) + config.min;
            const result = await DiceManager.rollSingle(dice, targetValue, 10000);

            setCurrentValue(result.value);

            // Add to history
            setRollHistory(prev => [
                { type: selectedDiceType, value: result.value, timestamp: Date.now() },
                ...prev.slice(0, 4) // Keep last 5 rolls
            ]);

            console.log(`🎲 ${selectedDiceType.toUpperCase()} settled on: ${result.value}`);

        } catch (error) {
            console.error(`🎲 Error rolling ${selectedDiceType}:`, error);
        } finally {
            setIsRolling(false);
        }
    }, [dice, isRolling, selectedDiceType]);

    const resetDice = useCallback(() => {
        if (!dice) return;

        // Reset position and clear velocities
        dice.setPosition(new THREE.Vector3(0, 2, 0));
        dice.body.velocity.set(0, 0, 0);
        dice.body.angularVelocity.set(0, 0, 0);
        dice.body.wakeUp();

        setCurrentValue(null);
        setIsRolling(false);

        console.log(`🎲 ${selectedDiceType.toUpperCase()} reset`);
    }, [dice, selectedDiceType]);

    const resetCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    const canvasContent = (
        <>
            <Canvas
                className={isFullScreen ? "h-screen w-screen" : "w-full aspect-square"}
                camera={{ position: [0, 5, 5], fov: 50 }}
                gl={{ antialias: true, alpha: false }}
                shadows
            >
                <OrbitControls ref={controlsRef} />

                {/* Improved lighting setup */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-far={50}
                    shadow-camera-left={-10}
                    shadow-camera-right={10}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-10}
                />
                <directionalLight position={[-5, 5, -5]} intensity={0.3} />
                <pointLight position={[0, 5, 0]} intensity={0.5} />

                {/* Physics Ground */}
                <PhysicsGround />

                {/* Physics Dice */}
                {dice && <PhysicsDice dice={dice} />}

                {/* Physics Simulation */}
                <PhysicsSimulation dice={dice} />
            </Canvas>

            {/* Canvas Controls */}
            <div className={`absolute ${isFullScreen ? 'top-4 right-4' : 'top-2 right-2'} flex gap-2`}>
                <div className={`bg-gray-800 px-3 py-2 rounded text-white font-mono ${isFullScreen ? 'text-base' : 'text-xs'}`}>
                    {isRolling ? 'Rolling...' : currentValue ? `${selectedDiceType.toUpperCase()}: ${currentValue}` : 'Ready to roll'}
                </div>
                <button
                    onClick={rollDice}
                    disabled={isRolling || !dice}
                    className={`bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded font-semibold ${isFullScreen ? 'px-4 py-2' : 'text-xs px-2 py-1'
                        }`}
                    title="Roll the dice"
                >
                    {isRolling ? '🎲 Rolling...' : `🎲 Roll ${selectedDiceType.toUpperCase()}`}
                </button>
                <button
                    onClick={resetDice}
                    className={`bg-yellow-600 hover:bg-yellow-500 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                        }`}
                    title="Reset dice position"
                >
                    🔄 Reset
                </button>
                <button
                    onClick={resetCamera}
                    className={`bg-gray-700 hover:bg-gray-600 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                        }`}
                    title="Reset camera view"
                >
                    📷 Reset View
                </button>
                <button
                    onClick={toggleFullScreen}
                    className={`bg-gray-700 hover:bg-gray-600 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                        }`}
                    title={isFullScreen ? "Exit full screen" : "Full screen"}
                >
                    {isFullScreen ? '✕ Exit Full Screen' : '⛶'}
                </button>
            </div>
        </>
    );

    if (isFullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-900">
                {canvasContent}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 3D Canvas */}
            <div className="relative">
                {canvasContent}

                {/* Physics Loading Overlay */}
                {!isPhysicsInitialized && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                            <div className="animate-spin text-3xl mb-2">🎲</div>
                            <div className="text-gray-900 dark:text-white">Initializing Physics...</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dice Selection Panel */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Select Dice Type
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {Object.entries(DICE_CONFIG).map(([type, config]) => {
                        const isAvailable = config.isAvailable && isPhysicsInitialized;
                        const isSelected = selectedDiceType === type;

                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedDiceType(type as DiceType)}
                                disabled={!isAvailable}
                                className={`p-3 rounded-lg border-2 transition-all ${isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : isAvailable
                                        ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                        : 'border-gray-100 dark:border-gray-700 opacity-50'
                                    } ${!isAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-1">{config.emoji}</div>
                                    <div className={`font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                        {type.toUpperCase()}
                                    </div>
                                    <div className={`text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {config.min}-{config.max}
                                    </div>
                                    {!config.isAvailable && (
                                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                            Coming Soon
                                        </div>
                                    )}
                                    {config.isAvailable && !isPhysicsInitialized && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Loading...
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Roll Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={rollDice}
                        disabled={isRolling || !dice || !isPhysicsInitialized}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        {!isPhysicsInitialized ? (
                            <>
                                <span className="animate-spin mr-2">🎲</span>
                                Initializing Physics...
                            </>
                        ) : isRolling ? (
                            <>
                                <span className="animate-spin mr-2">🎲</span>
                                Rolling {selectedDiceType.toUpperCase()}...
                            </>
                        ) : (
                            <>
                                🎲 Roll {selectedDiceType.toUpperCase()}
                                {currentValue && ` (Last: ${currentValue})`}
                            </>
                        )}
                    </button>

                    <button
                        onClick={resetDice}
                        disabled={!dice || !isPhysicsInitialized}
                        className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors"
                        title="Reset dice position"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Roll History */}
            {rollHistory.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                        Recent Rolls
                    </h4>
                    <div className="space-y-2">
                        {rollHistory.map((roll, index) => (
                            <div
                                key={roll.timestamp}
                                className={`flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
                                    }`}
                            >
                                <span className="font-mono text-sm">
                                    {DICE_CONFIG[roll.type].emoji} {roll.type.toUpperCase()}
                                </span>
                                <span className="font-bold text-lg" style={{ color: DICE_CONFIG[roll.type].color }}>
                                    {roll.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiceCanvas; 