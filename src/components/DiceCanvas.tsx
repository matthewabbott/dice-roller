import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
// import { DICE_COLORS } from '../constants/colors'; // Unused for now
import { DiceManager, DiceD6, DiceD4, DiceD8, DiceD10, DiceD12, DiceD20, PhysicsUtils } from '../physics';
import * as CANNON from 'cannon-es';
import { useCanvasSync, type CanvasSyncCallbacks, type RemoteDiceData } from '../services/CanvasSyncManager';
// import { VirtualDice, VirtualDiceSummary } from './VirtualDice'; // Unused for now
// import type { DiceRoll } from '../types/canvas'; // Unused for now
import { DICE_GEOMETRIES } from './dice';

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

    // Update mesh position/rotation from physics body every frame
    useFrame((state) => {
        // Store camera and canvas references for use in event handlers
        cameraRef.current = state.camera;
        canvasRef.current = state.gl.domElement;

        if (meshRef.current && dice) {
            // Sync with physics body
            dice.updateMesh();

            // Copy from the dice's internal Three.js object
            meshRef.current.position.copy(dice.object.position);
            meshRef.current.quaternion.copy(dice.object.quaternion);
        }
    });

    // Click and drag throwing system with mouse following
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number; time: number; worldPos: THREE.Vector3 } | null>(null);
    const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [originalPosition, setOriginalPosition] = useState<THREE.Vector3 | null>(null);
    const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
    const [velocity, setVelocity] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    const [positionHistory, setPositionHistory] = useState<Array<{ pos: THREE.Vector3; time: number }>>([]);

    const handlePointerDown = useCallback((event: any) => {
        // Only handle dice throwing if Shift key is held down
        if (!event.shiftKey) {
            return; // Let camera controls handle normal clicks
        }

        event.stopPropagation();

        // Store original position for physics restoration
        const currentPos = new THREE.Vector3(
            dice.body.position.x,
            dice.body.position.y,
            dice.body.position.z
        );
        setOriginalPosition(currentPos);

        // Get world position of the dice when drag starts
        const worldPos = new THREE.Vector3();
        if (meshRef.current) {
            meshRef.current.getWorldPosition(worldPos);
        }

        setIsDragging(true);
        setDragStart({
            x: event.clientX,
            y: event.clientY,
            time: Date.now(),
            worldPos: worldPos
        });
        setDragCurrent({ x: event.clientX, y: event.clientY });
        setTargetPosition(worldPos.clone());
        setVelocity(new THREE.Vector3(0, 0, 0));
        setPositionHistory([{ pos: worldPos.clone(), time: Date.now() }]);

        // Make dice kinematic (not affected by physics) during drag
        dice.body.type = CANNON.Body.KINEMATIC;
        dice.body.velocity.set(0, 0, 0);
        dice.body.angularVelocity.set(0, 0, 0);

        // Capture pointer for consistent drag behavior
        if (event.target.setPointerCapture) {
            event.target.setPointerCapture(event.pointerId);
        }
    }, [dice]);

    const handlePointerMove = useCallback((event: any) => {
        if (isDragging && dragStart && meshRef.current && cameraRef.current && canvasRef.current) {
            setDragCurrent({ x: event.clientX, y: event.clientY });

            // Get canvas and camera from stored refs
            const camera = cameraRef.current;
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();

            // Calculate mouse movement in pixels
            const deltaX = event.clientX - dragStart.x;
            const deltaY = event.clientY - dragStart.y;

            // Convert pixel movement to normalized movement (-1 to 1 range)
            const normalizedDeltaX = (deltaX / rect.width) * 2;
            const normalizedDeltaY = -(deltaY / rect.height) * 2; // Negative because screen Y is inverted

            // Get camera's right and up vectors (these define the camera's view plane)
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);

            // Calculate right vector (camera's local X axis) - FIXED: reversed for correct direction
            const right = new THREE.Vector3();
            right.crossVectors(cameraDirection, camera.up).normalize(); // Swapped order to fix left/right

            // Calculate up vector (camera's local Y axis)
            const up = new THREE.Vector3();
            up.crossVectors(right, cameraDirection).normalize();

            // Scale movement based on distance from camera for natural feel
            const distanceFromCamera = camera.position.distanceTo(dragStart.worldPos);
            const movementScale = distanceFromCamera * 0.5;

            // Calculate target position in world space using camera's right and up vectors
            const worldMovement = new THREE.Vector3();
            worldMovement.addScaledVector(right, normalizedDeltaX * movementScale);
            worldMovement.addScaledVector(up, normalizedDeltaY * movementScale);

            // Calculate new target position
            const newTargetPosition = dragStart.worldPos.clone();
            newTargetPosition.add(worldMovement);

            // Keep target above the table but remove restrictive bounds during dragging
            newTargetPosition.y = Math.max(newTargetPosition.y, 0.5);
            // Remove the X and Z constraints to allow free dragging

            setTargetPosition(newTargetPosition);

            // Update position history for velocity calculation
            const currentTime = Date.now();
            setPositionHistory(prev => {
                const newHistory = [...prev, { pos: newTargetPosition.clone(), time: currentTime }];
                // Keep only last 10 positions (for velocity calculation)
                return newHistory.slice(-10);
            });
        }
    }, [isDragging, dragStart, dice]);

    // Update dice position with lag/momentum during drag
    useFrame(() => {
        if (isDragging && targetPosition && dice.body) {
            const currentPos = new THREE.Vector3(
                dice.body.position.x,
                dice.body.position.y,
                dice.body.position.z
            );

            // Calculate lag - dice follows target with some delay (like a heavy object)
            const lagFactor = 0.15; // Lower = more lag, higher = more responsive
            const newPos = currentPos.clone();
            newPos.lerp(targetPosition, lagFactor);

            // Calculate velocity for momentum
            const newVelocity = new THREE.Vector3();
            newVelocity.subVectors(newPos, currentPos);
            newVelocity.multiplyScalar(60); // Convert to per-second velocity
            setVelocity(newVelocity);

            // Update physics body position
            dice.body.position.set(newPos.x, newPos.y, newPos.z);

            // Add rotation based on movement velocity for realistic feel
            const movementSpeed = newVelocity.length();
            if (movementSpeed > 0.1) {
                const rotationAxis = new CANNON.Vec3(
                    newVelocity.z,   // Z velocity affects X rotation
                    0,               // No Y rotation during drag
                    -newVelocity.x   // X velocity affects Z rotation
                ).unit();
                const rotationSpeed = movementSpeed * 0.02;
                dice.body.quaternion.setFromAxisAngle(rotationAxis, rotationSpeed);
            }
        }

        // Normal physics sync when not dragging
        if (!isDragging && meshRef.current && dice) {
            dice.updateMesh();
            meshRef.current.position.copy(dice.object.position);
            meshRef.current.quaternion.copy(dice.object.quaternion);
        }
    });

    const handlePointerUp = useCallback((event: any) => {
        if (isDragging && dragStart && dragCurrent && dice.body) {
            // Restore physics body to dynamic
            dice.body.type = CANNON.Body.DYNAMIC;

            // Calculate throwing velocity based on recent movement history
            let throwVelocity = new THREE.Vector3(0, 0, 0);

            if (positionHistory.length >= 2) {
                // Use position history to calculate average velocity over last few frames
                const recentHistory = positionHistory.slice(-5); // Last 5 positions
                const timeSpan = recentHistory[recentHistory.length - 1].time - recentHistory[0].time;

                if (timeSpan > 0) {
                    const positionDelta = new THREE.Vector3();
                    positionDelta.subVectors(
                        recentHistory[recentHistory.length - 1].pos,
                        recentHistory[0].pos
                    );

                    // Convert to velocity (units per second)
                    throwVelocity = positionDelta.multiplyScalar(1000 / timeSpan);

                    // Reduce throwing force for more controlled behavior
                    const throwMultiplier = 1.0; // Reduced from 2.0
                    throwVelocity.multiplyScalar(throwMultiplier);

                    // Add much less upward force to reduce the "jink" effect
                    const horizontalSpeed = Math.sqrt(throwVelocity.x * throwVelocity.x + throwVelocity.z * throwVelocity.z);
                    if (horizontalSpeed > 2) { // Only add upward force for faster horizontal movement
                        throwVelocity.y += Math.min(horizontalSpeed * 0.15, 4); // Reduced from 0.3 and capped at 4
                    }
                }
            }

            // If no significant movement, just let it drop gently
            if (throwVelocity.length() < 0.5) {
                throwVelocity.set(0, -1, 0); // Gentler downward velocity
            }

            // Cap maximum throwing velocity to prevent dice from flying too far
            const maxThrowSpeed = 12; // Reasonable maximum
            if (throwVelocity.length() > maxThrowSpeed) {
                throwVelocity.normalize().multiplyScalar(maxThrowSpeed);
            }

            // Apply the calculated velocity
            dice.body.velocity.set(throwVelocity.x, throwVelocity.y, throwVelocity.z);

            // Add rotational velocity based on throw direction and speed (reduced intensity)
            const throwSpeed = throwVelocity.length();
            const rotationIntensity = Math.min(throwSpeed * 0.3, 10); // Reduced from 0.5 and capped at 10

            dice.body.angularVelocity.set(
                (Math.random() - 0.5) * rotationIntensity + throwVelocity.z * 0.05, // Reduced influence
                (Math.random() - 0.5) * rotationIntensity,
                (Math.random() - 0.5) * rotationIntensity - throwVelocity.x * 0.05  // Reduced influence
            );

            dice.body.wakeUp();

            console.log('🎲 Dice thrown with controlled physics:', {
                throwVelocity: throwVelocity.toArray(),
                throwSpeed: throwSpeed,
                rotationIntensity: rotationIntensity
            });
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        setOriginalPosition(null);
        setTargetPosition(null);
        setVelocity(new THREE.Vector3(0, 0, 0));
        setPositionHistory([]);

        // Release pointer capture
        if (event.target.releasePointerCapture) {
            event.target.releasePointerCapture(event.pointerId);
        }
    }, [isDragging, dragStart, dragCurrent, dice, positionHistory]);

    const handlePointerEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handlePointerLeave = useCallback(() => {
        setIsHovered(false);
        // If dragging is interrupted by leaving the mesh, clean up
        if (isDragging && dice.body) {
            dice.body.type = CANNON.Body.DYNAMIC;
            setIsDragging(false);
            setDragStart(null);
            setDragCurrent(null);
            setOriginalPosition(null);
        }
    }, [isDragging, dice]);

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
                isHovered={isHovered}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color="#888888"
                    roughness={isHovered ? 0.1 : 0.3}
                    metalness={isHovered ? 0.3 : 0.1}
                    emissive={isHovered ? '#888888' : '#000000'}
                    emissiveIntensity={isHovered ? 0.1 : 0}
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
        // Position ground plane lower to ensure dice don't clip through
        groundBody.position.set(0, -1, 0);

        if (DiceManager.getMaterials()) {
            groundBody.material = DiceManager.getMaterials()!.floor;
        }

        DiceManager.addBody(groundBody);

        // Create much larger invisible walls to contain dice
        const wallHeight = 20; // Much taller walls
        const wallThickness = 1;
        const tableSize = 80; // 10x larger sandbox (was 8)

        const walls = [
            // North wall
            { pos: [0, wallHeight / 2 - 1, -tableSize / 2], size: [tableSize, wallHeight, wallThickness] },
            // South wall  
            { pos: [0, wallHeight / 2 - 1, tableSize / 2], size: [tableSize, wallHeight, wallThickness] },
            // East wall
            { pos: [tableSize / 2, wallHeight / 2 - 1, 0], size: [wallThickness, wallHeight, tableSize] },
            // West wall
            { pos: [-tableSize / 2, wallHeight / 2 - 1, 0], size: [wallThickness, wallHeight, tableSize] },
        ];

        const wallBodies: CANNON.Body[] = [];
        walls.forEach((wall) => {
            const wallShape = new CANNON.Box(new CANNON.Vec3(wall.size[0] / 2, wall.size[1] / 2, wall.size[2] / 2));
            const wallBody = new CANNON.Body({ mass: 0 });
            wallBody.addShape(wallShape);
            wallBody.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);

            if (DiceManager.getMaterials()) {
                wallBody.material = DiceManager.getMaterials()!.floor;
            }

            DiceManager.addBody(wallBody);
            wallBodies.push(wallBody);
        });

        console.log('🎲 Enhanced large sandbox created:', {
            ground: 'Y: -1',
            walls: wallBodies.length,
            tableSize,
            wallHeight
        });

        return () => {
            DiceManager.removeBody(groundBody);
            wallBodies.forEach(wall => DiceManager.removeBody(wall));
        };
    }, []);

    // Create a high-quality grid texture
    const gridTexture = React.useMemo(() => {
        // Create a texture that tiles perfectly - 320x320 for 5x5 grid squares
        const canvas = document.createElement('canvas');
        canvas.width = 320; // 5 grid squares * 64px each
        canvas.height = 320;
        const ctx = canvas.getContext('2d')!;

        // Dark cyberspace background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 320, 320);

        const gridSize = 64; // Each grid square is 64px
        const majorGridSpacing = gridSize * 5; // Major grid every 5 squares (320px)

        // Keep smoothing enabled for better line quality
        ctx.imageSmoothingEnabled = true;

        // First, draw the thin gray lines (regular grid)
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;

        // Draw vertical gray lines (every 64px, but not at the edges to avoid doubling)
        for (let i = gridSize; i < 320; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 320);
            ctx.stroke();
        }

        // Draw horizontal gray lines (every 64px, but not at the edges to avoid doubling)
        for (let i = gridSize; i < 320; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(320, i);
            ctx.stroke();
        }

        // Now draw the major grid lines (thicker, brighter, at the edges and center)
        ctx.strokeStyle = '#cc3333'; // Darker red for major grid lines
        ctx.lineWidth = 4; // Thicker lines
        ctx.globalAlpha = 0.7; // Slightly translucent

        // Draw major vertical grid lines (at 0 and 320, which will tile seamlessly)
        for (let i = 0; i <= 320; i += majorGridSpacing) {
            // Draw glow effect first (wider, more transparent)
            ctx.strokeStyle = '#cc3333';
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 320);
            ctx.stroke();

            // Draw main line (narrower, more opaque)
            ctx.strokeStyle = '#dd4444';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 320);
            ctx.stroke();
        }

        // Draw major horizontal grid lines (at 0 and 320, which will tile seamlessly)
        for (let i = 0; i <= 320; i += majorGridSpacing) {
            // Draw glow effect first (wider, more transparent)
            ctx.strokeStyle = '#cc3333';
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(320, i);
            ctx.stroke();

            // Draw main line (narrower, more opaque)
            ctx.strokeStyle = '#dd4444';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(320, i);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // Use linear filtering for smooth appearance
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;

        // Repeat the 320x320 texture to cover the 80x80 plane (80/16 = 5 repeats)
        texture.repeat.set(5, 5);

        return texture;
    }, []);

    return (
        <group>
            {/* Large Cyberspace Mesh Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <planeGeometry args={[80, 80]} />
                <meshStandardMaterial
                    map={gridTexture}
                    color="#ffffff" // Bright white to enhance the grid lines
                    roughness={0.7}
                    metalness={0.0}
                    transparent={false} // Remove transparency for brighter appearance
                    emissive="#111111" // Slight glow effect
                />
            </mesh>

            {/* Visible Wall Borders (cyberspace style) */}
            {[
                // North border
                { pos: [0, 0, -40] as [number, number, number], size: [80, 4, 1] as [number, number, number] },
                // South border
                { pos: [0, 0, 40] as [number, number, number], size: [80, 4, 1] as [number, number, number] },
                // East border
                { pos: [40, 0, 0] as [number, number, number], size: [1, 4, 80] as [number, number, number] },
                // West border
                { pos: [-40, 0, 0] as [number, number, number], size: [1, 4, 80] as [number, number, number] },
            ].map((border, index) => (
                <mesh key={index} position={border.pos} receiveShadow castShadow>
                    <boxGeometry args={border.size} />
                    <meshStandardMaterial
                        color="#444444"
                        roughness={0.8}
                        metalness={0.2}
                        transparent={true}
                        opacity={0.8}
                    />
                </mesh>
            ))}
        </group>
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
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>('d20');
    const [dice, setDice] = useState<DiceInstance[]>([]);
    const [isRolling, setIsRolling] = useState(false);
    const [rollResult, setRollResult] = useState<number | null>(null);
    const [rollHistory] = useState<{ type: DiceType; value: number; timestamp: number }[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isCameraLocked, setIsCameraLocked] = useState(false);

    // Canvas synchronization state
    const [remoteDice, setRemoteDice] = useState<Map<string, DiceInstance>>(new Map());
    const [syncStatus, setSyncStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

    // Virtual dice state (Phase 4.4) - Commented out for now
    // const [virtualDice, setVirtualDice] = useState<DiceRoll[]>([]);
    // const [expandedVirtualDice, setExpandedVirtualDice] = useState<Set<string>>(new Set());
    // const [highlightedVirtualDice, setHighlightedVirtualDice] = useState<Set<string>>(new Set());

    // Virtual dice interaction handlers (Phase 4.4) - Commented out for now
    /*
    const handleVirtualDiceExpand = useCallback((diceId: string) => {
        setExpandedVirtualDice(prev => new Set(prev.add(diceId)));
        console.log(`🎲 Expanded virtual dice: ${diceId}`);
    }, []);

    const handleVirtualDiceCollapse = useCallback((diceId: string) => {
        setExpandedVirtualDice(prev => {
            const newSet = new Set(prev);
            newSet.delete(diceId);
            return newSet;
        });
        console.log(`🎲 Collapsed virtual dice: ${diceId}`);
    }, []);

    const handleVirtualDiceHighlight = useCallback((diceId: string) => {
        setHighlightedVirtualDice(prev => {
            const newSet = new Set(prev);
            if (newSet.has(diceId)) {
                newSet.delete(diceId);
            } else {
                newSet.add(diceId);
            }
            return newSet;
        });
        console.log(`🎲 Toggled highlight for virtual dice: ${diceId}`);
    }, []);

    const handleVirtualDiceReroll = useCallback((diceId: string) => {
        // TODO: Implement virtual dice rerolling
        console.log(`🎲 Rerolling virtual dice: ${diceId}`);
        // This would trigger a new roll with the same parameters
    }, []);

    const clearVirtualDice = useCallback(() => {
        setVirtualDice([]);
        setExpandedVirtualDice(new Set());
        setHighlightedVirtualDice(new Set());
        console.log('🎲 Cleared all virtual dice');
    }, []);
    */

    // Remote dice handling functions for canvas synchronization
    const spawnRemoteDice = useCallback(async (diceData: RemoteDiceData) => {
        if (!isInitialized) return;

        try {
            let newDice: DiceInstance;
            const options = { size: 1 };

            // Create dice based on type
            switch (diceData.diceType as DiceType) {
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

            // Set position from remote data
            newDice.body.position.set(
                diceData.position.x,
                diceData.position.y,
                diceData.position.z
            );

            // Add random rotation for visual variety
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
            newDice.body.linearDamping = 0.1;
            newDice.body.angularDamping = 0.1;

            // Store in remote dice map
            setRemoteDice(prev => new Map(prev.set(diceData.canvasId, newDice)));

            console.log(`📡 Spawned remote ${diceData.diceType} from user ${diceData.userId} at:`, diceData.position);

        } catch (error) {
            console.error(`❌ Failed to spawn remote ${diceData.diceType}:`, error);
        }
    }, [isInitialized]);

    const applyRemoteDiceThrow = useCallback((diceId: string, velocity: { x: number; y: number; z: number }) => {
        const remoteDie = remoteDice.get(diceId);
        if (remoteDie) {
            remoteDie.body.velocity.set(velocity.x, velocity.y, velocity.z);
            remoteDie.body.wakeUp();
            console.log(`📡 Applied remote throw to dice ${diceId}`);
        }
    }, [remoteDice]);

    const applyRemoteDiceSettle = useCallback((diceId: string, position: { x: number; y: number; z: number }, result: number) => {
        const remoteDie = remoteDice.get(diceId);
        if (remoteDie) {
            // Smoothly move to final position
            remoteDie.body.position.set(position.x, position.y, position.z);
            remoteDie.body.velocity.set(0, 0, 0);
            remoteDie.body.angularVelocity.set(0, 0, 0);
            console.log(`📡 Settled remote dice ${diceId} at result ${result}`);
        }
    }, [remoteDice]);

    const applyRemoteDiceHighlight = useCallback((diceId: string, color: string) => {
        // TODO: Implement visual highlighting
        console.log(`📡 Highlighting dice ${diceId} with color ${color}`);
    }, []);

    const removeRemoteDice = useCallback((diceId: string) => {
        const remoteDie = remoteDice.get(diceId);
        if (remoteDie) {
            DiceManager.removeBody(remoteDie.body);
            setRemoteDice(prev => {
                const newMap = new Map(prev);
                newMap.delete(diceId);
                return newMap;
            });
            console.log(`📡 Removed remote dice ${diceId}`);
        }
    }, [remoteDice]);

    const clearRemoteDice = useCallback(() => {
        remoteDice.forEach(die => {
            DiceManager.removeBody(die.body);
        });
        setRemoteDice(new Map());
        console.log('📡 Cleared all remote dice');
    }, [remoteDice]);

    // Canvas synchronization callbacks
    const canvasSyncCallbacks: CanvasSyncCallbacks = {
        onDiceSpawn: useCallback((diceData: RemoteDiceData) => {
            console.log(`📡 Remote dice spawn: ${diceData.diceType} from user ${diceData.userId}`);
            spawnRemoteDice(diceData);
        }, [spawnRemoteDice]),

        onDiceThrow: useCallback((diceId: string, velocity, userId: string) => {
            console.log(`📡 Remote dice throw: ${diceId} from user ${userId}`);
            applyRemoteDiceThrow(diceId, velocity);
        }, [applyRemoteDiceThrow]),

        onDiceSettle: useCallback((diceId: string, position, result: number, userId: string) => {
            console.log(`📡 Remote dice settle: ${diceId} = ${result} from user ${userId}`);
            applyRemoteDiceSettle(diceId, position, result);
        }, [applyRemoteDiceSettle]),

        onDiceHighlight: useCallback((diceId: string, color: string, userId: string) => {
            console.log(`📡 Remote dice highlight: ${diceId} color ${color} from user ${userId}`);
            applyRemoteDiceHighlight(diceId, color);
        }, [applyRemoteDiceHighlight]),

        onDiceRemove: useCallback((diceId: string, userId: string) => {
            console.log(`📡 Remote dice remove: ${diceId} from user ${userId}`);
            removeRemoteDice(diceId);
        }, [removeRemoteDice]),

        onCanvasClear: useCallback((userId: string) => {
            console.log(`📡 Remote canvas clear from user ${userId}`);
            clearRemoteDice();
        }, [clearRemoteDice])
    };

    // Initialize canvas synchronization
    const { isConnected, error, stats } = useCanvasSync(canvasSyncCallbacks);

    // Update sync status
    useEffect(() => {
        if (error) {
            setSyncStatus('error');
        } else if (isConnected) {
            setSyncStatus('connected');
        } else {
            setSyncStatus('connecting');
        }
    }, [isConnected, error]);

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
                console.log('🎲 Physics world initialized with dampening');
            } catch (error) {
                console.error('❌ Failed to initialize physics:', error);
            }
        };

        initPhysics();

        return () => {
            // Cleanup when component unmounts
            dice.forEach(die => {
                if (die.body) {
                    DiceManager.removeBody(die.body);
                }
            });
        };
    }, []);

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

                {/* Physics Ground */}
                <PhysicsGround />

                {/* Physics Dice */}
                {dice.map((die, index) => (
                    <PhysicsDice key={`dice-${index}`} dice={die} />
                ))}

                {/* Remote Dice */}
                {Array.from(remoteDice.entries()).map(([diceId, die]) => (
                    <PhysicsDice key={`remote-${diceId}`} dice={die} />
                ))}

                {/* Physics Simulation */}
                <PhysicsSimulation dice={dice.length > 0 ? dice[0] : null} />
            </Canvas>

            {/* Canvas Controls */}
            <div className={`absolute ${isFullScreen ? 'top-4 right-4' : 'top-2 right-2'} flex gap-2`}>
                {/* Sync Status Indicator */}
                <div className={`px-2 py-1 rounded text-xs font-mono ${syncStatus === 'connected' ? 'bg-green-600 text-white' :
                    syncStatus === 'connecting' ? 'bg-yellow-600 text-white' :
                        'bg-red-600 text-white'
                    }`}>
                    {syncStatus === 'connected' ? '📡 Synced' :
                        syncStatus === 'connecting' ? '📡 Connecting...' :
                            '📡 Offline'}
                </div>

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
                    {syncStatus === 'connected' && stats && (
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