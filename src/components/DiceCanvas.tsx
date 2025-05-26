import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { DiceManager, DiceD6, DiceD4, DiceD8, DiceD10, DiceD12, DiceD20 } from '../physics';

import { DICE_GEOMETRIES } from './dice';
import { PhysicsWorld, PhysicsGround } from './physics';
import { SyncStatusIndicator, RemoteDiceRenderer } from './sync';
import { useDiceInteraction, usePhysicsSync, useCanvasSync } from '../hooks';

// Extend R3F with the geometry we need
extend({ EdgesGeometry: THREE.EdgesGeometry });

interface DiceCanvasProps {
    // TODO
}

// Define available dice types
type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
type DiceInstance = DiceD4 | DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20;

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
        isAvailable: true,
        create: () => new DiceD8({ size: 1 })
    },
    d10: {
        name: 'D10 (Pentagonal Trapezohedron)',
        emoji: '🔟',
        min: 1,
        max: 10,
        color: '#96ceb4',
        isAvailable: true,
        create: () => new DiceD10({ size: 1 })
    },
    d12: {
        name: 'D12 (Dodecahedron)',
        emoji: '⬡',
        min: 1,
        max: 12,
        color: '#feca57',
        isAvailable: true,
        create: () => new DiceD12({ size: 1 })
    },
    d20: {
        name: 'D20 (Icosahedron)',
        emoji: '🔴',
        min: 1,
        max: 20,
        color: '#ff9ff3',
        isAvailable: true,
        create: () => new DiceD20({ size: 1 })
    }
};

// Enhanced Physics Dice Component that renders actual dice geometry
const PhysicsDice: React.FC<{ dice: DiceInstance }> = ({ dice }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const cameraRef = useRef<THREE.Camera | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Store camera and canvas references for use in event handlers
    useFrame((state) => {
        cameraRef.current = state.camera;
        canvasRef.current = state.gl.domElement;
    });

    // Use the new dice interaction hook
    const [interactionState, interactionHandlers] = useDiceInteraction({
        diceBody: dice.body,
        meshRef,
        cameraRef,
        canvasRef
    });

    // Use the new physics sync hook
    usePhysicsSync({
        diceBody: dice.body,
        meshRef,
        targetPosition: interactionState.targetPosition,
        isDragging: interactionState.isDragging
    });

    // Get dice configuration for colors and geometry
    const diceConfig = DICE_CONFIG[dice.diceType as DiceType];
    const GeometryComponent = DICE_GEOMETRIES[dice.diceType as DiceType];

    // Render using the new geometry components
    if (GeometryComponent) {
        return (
            <GeometryComponent
                key={`dice-${dice.diceType}`}
                size={dice.options.size}
                color={diceConfig.color}
                isHovered={interactionState.isHovered}
                onPointerDown={interactionHandlers.handlePointerDown}
                onPointerMove={interactionHandlers.handlePointerMove}
                onPointerUp={interactionHandlers.handlePointerUp}
                onPointerEnter={interactionHandlers.handlePointerEnter}
                onPointerLeave={interactionHandlers.handlePointerLeave}
                meshRef={meshRef as React.RefObject<THREE.Mesh>}
            />
        );
    } else {
        // Fallback for unknown dice types
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                castShadow
                receiveShadow
                onPointerDown={interactionHandlers.handlePointerDown}
                onPointerMove={interactionHandlers.handlePointerMove}
                onPointerUp={interactionHandlers.handlePointerUp}
                onPointerEnter={interactionHandlers.handlePointerEnter}
                onPointerLeave={interactionHandlers.handlePointerLeave}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color="#888888"
                    roughness={interactionState.isHovered ? 0.1 : 0.3}
                    metalness={interactionState.isHovered ? 0.3 : 0.1}
                    emissive={interactionState.isHovered ? '#888888' : '#000000'}
                    emissiveIntensity={interactionState.isHovered ? 0.1 : 0}
                />
            </mesh>
        );
    }
};

const DiceCanvas: React.FC<DiceCanvasProps> = () => {
    const controlsRef = useRef<any>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>('d20');
    const [dice, setDice] = useState<DiceInstance[]>([]);
    const [isRolling, setIsRolling] = useState(false);
    const [rollResult, setRollResult] = useState<number | null>(null);
    const [rollHistory] = useState<{ type: DiceType; value: number; timestamp: number }[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isCameraLocked, setIsCameraLocked] = useState(false);

    // Canvas synchronization using new sync hooks
    const { remoteDice, syncStatus, stats } = useCanvasSync({ isInitialized });

    // Physics initialization is now handled by PhysicsWorld component
    const handlePhysicsInitialized = useCallback((initialized: boolean) => {
        setIsInitialized(initialized);
    }, []);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            dice.forEach(die => {
                if (die.body) {
                    DiceManager.removeBody(die.body);
                }
            });
        };
    }, [dice]);

    // Update OrbitControls when camera lock state changes
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.enabled = !isCameraLocked;
        }
    }, [isCameraLocked]);

    // Toggle camera lock
    const toggleCameraLock = useCallback(() => {
        setIsCameraLocked(prev => !prev);
        console.log(`📷 Camera ${!isCameraLocked ? 'locked' : 'unlocked'}`);
    }, [isCameraLocked]);

    // Spawn a new dice of the selected type
    const spawnDice = useCallback(async (diceType: DiceType = selectedDiceType) => {
        if (!isInitialized) return;

        try {
            let newDice: DiceInstance;
            const options = { size: 1 };

            // Create dice based on type
            switch (diceType) {
                case 'd4':
                    newDice = new DiceD4(options);
                    break;
                case 'd6':
                    newDice = new DiceD6(options);
                    break;
                case 'd8':
                    newDice = new DiceD8(options);
                    break;
                case 'd10':
                    newDice = new DiceD10(options);
                    break;
                case 'd12':
                    newDice = new DiceD12(options);
                    break;
                case 'd20':
                    newDice = new DiceD20(options);
                    break;
                default:
                    newDice = new DiceD6(options);
            }

            // Position dice above table with some randomization to prevent stacking
            const existingDiceCount = dice.length;
            const spacing = 1.5;
            const gridSize = Math.ceil(Math.sqrt(existingDiceCount + 1));
            const row = Math.floor(existingDiceCount / gridSize);
            const col = existingDiceCount % gridSize;

            const offsetX = (col - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;
            const offsetZ = (row - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;

            // Higher starting position for larger dice
            const startY = diceType === 'd12' ? 4 : 3;

            newDice.body.position.set(offsetX, startY, offsetZ);
            newDice.body.quaternion.set(
                Math.random() * 0.5,
                Math.random() * 0.5,
                Math.random() * 0.5,
                Math.random() * 0.5
            );
            newDice.body.quaternion.normalize();

            // Add to physics world
            DiceManager.addBody(newDice.body);

            // Apply dampening for controlled behavior
            newDice.body.linearDamping = 0.1;  // Air resistance for movement
            newDice.body.angularDamping = 0.1; // Air resistance for rotation

            // Add to dice array
            setDice(prevDice => [...prevDice, newDice]);

            console.log(`🎲 Spawned ${diceType} at position:`, {
                x: offsetX,
                y: startY,
                z: offsetZ,
                totalDice: existingDiceCount + 1
            });

        } catch (error) {
            console.error(`❌ Failed to spawn ${diceType}:`, error);
        }
    }, [isInitialized, selectedDiceType, dice.length]);

    // Clear all dice from the scene
    const clearAllDice = useCallback(() => {
        dice.forEach(die => {
            DiceManager.removeBody(die.body);
        });
        setDice([]);
        setRollResult(null);
        console.log('🎲 Cleared all dice');
    }, [dice]);

    // Roll all dice simultaneously
    const rollAllDice = useCallback(async () => {
        if (dice.length === 0 || isRolling) return;

        setIsRolling(true);
        setRollResult(null);

        try {
            // Apply random forces to all dice
            dice.forEach((die, index) => {
                const force = 8 + Math.random() * 4; // Random force between 8-12
                const angle = (index / dice.length) * Math.PI * 2 + Math.random() * 0.5; // Spread dice in circle

                die.body.velocity.set(
                    Math.cos(angle) * force,
                    8 + Math.random() * 4, // Upward force
                    Math.sin(angle) * force
                );

                die.body.angularVelocity.set(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                );

                die.body.wakeUp();
            });

            // Wait for all dice to settle and get their values
            const diceValuePairs = dice.map(die => ({ dice: die, value: 1 })); // Initial values
            const results = await DiceManager.prepareValues(diceValuePairs);

            // Calculate total result
            const totalResult = results.reduce((sum, result) => sum + result.value, 0);
            setRollResult(totalResult);

            console.log('🎲 Multi-dice roll results:', {
                individual: results.map(r => r.value),
                total: totalResult,
                diceCount: dice.length
            });

        } catch (error) {
            console.error('❌ Failed to roll dice:', error);
        } finally {
            setIsRolling(false);
        }
    }, [dice, isRolling]);

    // Throw all dice with physics (alternative to rollAllDice)
    const throwAllDice = useCallback(() => {
        if (dice.length === 0) return;

        dice.forEach((die, index) => {
            // Create varied throwing patterns
            const throwAngle = (index / dice.length) * Math.PI * 2;
            const throwForce = 6 + Math.random() * 6;

            die.body.velocity.set(
                Math.cos(throwAngle) * throwForce,
                5 + Math.random() * 3,
                Math.sin(throwAngle) * throwForce
            );

            die.body.angularVelocity.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
            );

            die.body.wakeUp();
        });

        console.log(`🎲 Threw ${dice.length} dice with physics`);
    }, [dice]);

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
                <OrbitControls ref={controlsRef} enabled={!isCameraLocked} />

                {/* Improved lighting setup with larger shadow area */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={4096}
                    shadow-mapSize-height={4096}
                    shadow-camera-far={100}
                    shadow-camera-left={-50}
                    shadow-camera-right={50}
                    shadow-camera-top={50}
                    shadow-camera-bottom={-50}
                />
                <directionalLight position={[-5, 5, -5]} intensity={0.3} />
                <pointLight position={[0, 5, 0]} intensity={0.5} />

                {/* Physics World with Ground and Simulation */}
                <PhysicsWorld onInitialized={handlePhysicsInitialized}>
                    {/* Physics Ground */}
                    <PhysicsGround />

                    {/* Physics Dice */}
                    {dice.map((die, index) => (
                        <PhysicsDice key={`dice-${index}`} dice={die} />
                    ))}

                    {/* Remote Dice */}
                    <RemoteDiceRenderer
                        remoteDice={remoteDice}
                        PhysicsDiceComponent={PhysicsDice}
                    />
                </PhysicsWorld>
            </Canvas>

            {/* Canvas Controls */}
            <div className={`absolute ${isFullScreen ? 'top-4 right-4' : 'top-2 right-2'} flex gap-2`}>
                {/* Sync Status Indicator */}
                <SyncStatusIndicator
                    status={syncStatus.status}
                    isFullScreen={isFullScreen}
                    stats={stats}
                />

                <div className={`bg-gray-800 px-3 py-2 rounded text-white font-mono ${isFullScreen ? 'text-base' : 'text-xs'}`}>
                    {isRolling ? 'Rolling...' : rollResult ? `Total: ${rollResult}` : 'Ready to roll'}
                </div>

                <button
                    onClick={rollAllDice}
                    disabled={isRolling || dice.length === 0}
                    className={`bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded font-semibold ${isFullScreen ? 'px-4 py-2' : 'text-xs px-2 py-1'
                        }`}
                    title="Roll all dice"
                >
                    {isRolling ? '🎲 Rolling...' : `🎲 Roll All Dice`}
                </button>
                <button
                    onClick={toggleCameraLock}
                    className={`${isCameraLocked ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white rounded font-semibold ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1'
                        }`}
                    title={isCameraLocked ? "Unlock camera (enable rotation/pan)" : "Lock camera (disable rotation/pan)"}
                >
                    {isCameraLocked ? '🔒 Camera Locked' : '🔓 Camera Free'}
                </button>
                <button
                    onClick={clearAllDice}
                    className={`bg-yellow-600 hover:bg-yellow-500 text-white rounded ${isFullScreen ? 'px-3 py-2' : 'text-xs px-2 py-1 opacity-70 hover:opacity-100'
                        }`}
                    title="Clear all dice"
                >
                    🗑 Clear All
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

            {/* Dice Interaction Tooltip */}
            {dice.some(die => die.body) && (
                <div className={`absolute ${isFullScreen ? 'bottom-4 left-4' : 'bottom-2 left-2'} bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm pointer-events-none`}>
                    💡 <strong>Shift + Click & Drag</strong> dice to throw them
                </div>
            )}

            {/* Multi-dice Instructions */}
            {dice.length > 0 && (
                <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded text-sm">
                    <div className="font-medium mb-1">💡 Controls:</div>
                    <ul className="text-xs space-y-1 text-blue-200">
                        <li>• <strong>🔒 Lock Camera</strong> to click dice without moving the view</li>
                        <li>• <strong>Shift + Click & Drag</strong> any dice to throw it</li>
                        <li>• <strong>Left Click & Drag</strong> to rotate camera view (when unlocked)</li>
                        <li>• <strong>Right Click & Drag</strong> to pan camera (when unlocked)</li>
                        <li>• <strong>Mouse Wheel</strong> to zoom in/out</li>
                        <li>• Use "Roll All" for controlled results</li>
                        <li>• Use "🚀" for physics-based throwing</li>
                        <li>• Dice will collide and interact naturally</li>
                    </ul>
                </div>
            )}
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
                {!isInitialized && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                            <div className="animate-spin text-3xl mb-2">🎲</div>
                            <div className="text-gray-900 dark:text-white">Initializing Physics...</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dice Controls Panel */}
            <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-3">Dice Controls</h3>

                {/* Dice Type Selector */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Dice Type:</label>
                    <select
                        value={selectedDiceType}
                        onChange={(e) => setSelectedDiceType(e.target.value as DiceType)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                        <option value="d4">D4 (Tetrahedron)</option>
                        <option value="d6">D6 (Cube)</option>
                        <option value="d8">D8 (Octahedron)</option>
                        <option value="d10">D10 (Pentagonal Trapezohedron)</option>
                        <option value="d12">D12 (Dodecahedron)</option>
                        <option value="d20">D20 (Icosahedron)</option>
                    </select>
                </div>

                {/* Dice Count Display */}
                <div className="mb-4 p-3 bg-gray-800 rounded">
                    <div className="text-sm text-gray-300">Dice on Table:</div>
                    <div className="text-xl font-bold">{dice.length + remoteDice.size}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        Local: {dice.length} • Remote: {remoteDice.size}
                    </div>
                    {rollResult && (
                        <div className="text-sm text-green-400 mt-1">
                            Last Total: {rollResult}
                        </div>
                    )}
                    {syncStatus.status === 'connected' && stats && (
                        <div className="text-xs text-blue-400 mt-1">
                            Users: {Object.keys(stats.diceByUser).length}
                        </div>
                    )}
                </div>

                {/* Spawn Controls */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        onClick={() => spawnDice(selectedDiceType)}
                        disabled={!isInitialized}
                        className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-semibold py-2 px-3 rounded transition-colors"
                        title={`Spawn a ${selectedDiceType.toUpperCase()}`}
                    >
                        + Add {selectedDiceType.toUpperCase()}
                    </button>

                    <button
                        onClick={clearAllDice}
                        disabled={dice.length === 0}
                        className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white font-semibold py-2 px-3 rounded transition-colors"
                        title="Remove all dice"
                    >
                        🗑 Clear All
                    </button>
                </div>

                {/* Quick Spawn Buttons */}
                <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Quick Spawn:</div>
                    <div className="grid grid-cols-3 gap-1">
                        {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as DiceType[]).map(diceType => (
                            <button
                                key={diceType}
                                onClick={() => spawnDice(diceType)}
                                disabled={!isInitialized}
                                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white text-xs py-1 px-2 rounded transition-colors"
                                title={`Spawn ${diceType.toUpperCase()}`}
                            >
                                {diceType.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={rollAllDice}
                        disabled={isRolling || dice.length === 0}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        {isRolling ? (
                            <>
                                <span className="animate-spin mr-2">🎲</span>
                                Rolling All Dice...
                            </>
                        ) : (
                            <>
                                🎲 Roll All Dice
                                {rollResult && ` (Total: ${rollResult})`}
                            </>
                        )}
                    </button>

                    <button
                        onClick={throwAllDice}
                        disabled={dice.length === 0}
                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors"
                        title="Throw all dice with physics"
                    >
                        🚀
                    </button>
                </div>

                {/* Camera Controls */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm font-medium mb-2">Camera Controls:</div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleCameraLock}
                            className={`flex-1 ${isCameraLocked ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white font-semibold py-2 px-3 rounded transition-colors`}
                            title={isCameraLocked ? "Unlock camera (enable rotation/pan)" : "Lock camera (disable rotation/pan)"}
                        >
                            {isCameraLocked ? '🔒 Camera Locked' : '🔓 Camera Free'}
                        </button>
                        <button
                            onClick={resetCamera}
                            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded transition-colors"
                            title="Reset camera view"
                        >
                            📷 Reset View
                        </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        {isCameraLocked ?
                            "Camera is locked. Click dice freely without moving the camera." :
                            "Camera is free. Use mouse to rotate/pan view."
                        }
                    </div>
                </div>

                {/* Multi-dice Instructions */}
                {dice.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded text-sm">
                        <div className="font-medium mb-1">💡 Controls:</div>
                        <ul className="text-xs space-y-1 text-blue-200">
                            <li>• <strong>🔒 Lock Camera</strong> to click dice without moving the view</li>
                            <li>• <strong>Shift + Click & Drag</strong> any dice to throw it</li>
                            <li>• <strong>Left Click & Drag</strong> to rotate camera view (when unlocked)</li>
                            <li>• <strong>Right Click & Drag</strong> to pan camera (when unlocked)</li>
                            <li>• <strong>Mouse Wheel</strong> to zoom in/out</li>
                            <li>• Use "Roll All" for controlled results</li>
                            <li>• Use "🚀" for physics-based throwing</li>
                            <li>• Dice will collide and interact naturally</li>
                        </ul>
                    </div>
                )}
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