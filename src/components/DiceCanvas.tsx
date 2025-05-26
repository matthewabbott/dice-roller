import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { DiceManager, DiceD6, DiceD4, DiceD8, DiceD10, DiceD12, DiceD20 } from '../physics';

import { DICE_GEOMETRIES } from './dice';
import { PhysicsWorld, PhysicsGround } from './physics';
import { RemoteDiceRenderer } from './sync';
import { DiceControlPanel, CanvasOverlay, InstructionsPanel, RollHistory } from './controls';
import { useDiceInteraction, usePhysicsSync, useCanvasSync, useDiceControls, useCameraControls } from '../hooks';

// Extend R3F with the geometry we need
extend({ EdgesGeometry: THREE.EdgesGeometry });

interface DiceCanvasProps {
    // TODO
}

// Define available dice types (now imported from hooks)
import type { DiceType } from '../hooks/controls/useDiceControls';
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
    const [isInitialized, setIsInitialized] = useState(false);

    // Use the new control hooks
    const [diceState, diceOperations] = useDiceControls({ isInitialized });
    const [cameraState, cameraOperations, controlsRef] = useCameraControls();

    // Canvas synchronization using new sync hooks
    const { remoteDice, syncStatus, stats } = useCanvasSync({ isInitialized });

    // Physics initialization is now handled by PhysicsWorld component
    const handlePhysicsInitialized = useCallback((initialized: boolean) => {
        setIsInitialized(initialized);
    }, []);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            diceState.dice.forEach(die => {
                if (die.body) {
                    DiceManager.removeBody(die.body);
                }
            });
        };
    }, [diceState.dice]);



    const canvasContent = (
        <>
            <Canvas
                className={cameraState.isFullScreen ? "h-screen w-screen" : "w-full aspect-square"}
                camera={{ position: [0, 5, 5], fov: 50 }}
                gl={{ antialias: true, alpha: false }}
                shadows
            >
                <OrbitControls ref={controlsRef} enabled={!cameraState.isCameraLocked} />

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
                    {diceState.dice.map((die, index) => (
                        <PhysicsDice key={`dice-${index}`} dice={die} />
                    ))}

                    {/* Remote Dice */}
                    <RemoteDiceRenderer
                        remoteDice={remoteDice}
                        PhysicsDiceComponent={PhysicsDice}
                    />
                </PhysicsWorld>
            </Canvas>

            {/* Canvas Overlay Controls */}
            <CanvasOverlay
                isFullScreen={cameraState.isFullScreen}
                isRolling={diceState.isRolling}
                rollResult={diceState.rollResult}
                syncStatus={syncStatus.status}
                stats={stats}
                isCameraLocked={cameraState.isCameraLocked}
                diceCount={diceState.dice.length}
                onRollAllDice={diceOperations.rollAllDice}
                onToggleCameraLock={cameraOperations.toggleCameraLock}
                onClearAllDice={diceOperations.clearAllDice}
                onResetCamera={cameraOperations.resetCamera}
                onToggleFullScreen={cameraOperations.toggleFullScreen}
            />

            {/* Instructions Panel */}
            <InstructionsPanel
                diceCount={diceState.dice.length}
                isFullScreen={cameraState.isFullScreen}
            />
        </>
    );

    if (cameraState.isFullScreen) {
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
            <DiceControlPanel
                diceState={diceState}
                diceOperations={diceOperations}
                cameraState={cameraState}
                cameraOperations={cameraOperations}
                remoteDiceCount={remoteDice.size}
                syncStatus={syncStatus.status}
                stats={stats}
                isInitialized={isInitialized}
            />

            {/* Roll History */}
            <RollHistory rollHistory={diceState.rollHistory} />
        </div>
    );
};

export default DiceCanvas;