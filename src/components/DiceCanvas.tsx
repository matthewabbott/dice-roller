import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DICE_COLORS } from '../constants/colors';
import { DiceManager, DiceD6, DiceD4, DiceD8, DiceD12, DiceD20, PhysicsUtils } from '../physics';
import * as CANNON from 'cannon-es';

// Extend R3F with the geometry we need
extend({ EdgesGeometry: THREE.EdgesGeometry });

interface DiceCanvasProps {
    // TODO
}

// Define available dice types
type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
type DiceInstance = DiceD4 | DiceD6 | DiceD8 | DiceD12 | DiceD20;

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

    // Always call useMemo to avoid hooks order violations
    const geometry = React.useMemo(() => {
        const diceType = dice.diceType;
        const size = dice.options.size;

        if (diceType === 'd4') {
            // Create custom D4 geometry that matches our physics vertices exactly
            const d4Geometry = new THREE.BufferGeometry();

            const vertices = new Float32Array([
                // Face 1: [0, 1, 2] - base triangle
                -0.5 * size, 0 * size, -0.289 * size,  // vertex 0
                0.5 * size, 0 * size, -0.289 * size,   // vertex 1
                0 * size, 0 * size, 0.577 * size,      // vertex 2

                // Face 2: [0, 3, 1] - front face
                -0.5 * size, 0 * size, -0.289 * size,  // vertex 0
                0 * size, 0.816 * size, 0 * size,      // vertex 3
                0.5 * size, 0 * size, -0.289 * size,   // vertex 1

                // Face 3: [1, 3, 2] - right face
                0.5 * size, 0 * size, -0.289 * size,   // vertex 1
                0 * size, 0.816 * size, 0 * size,      // vertex 3
                0 * size, 0 * size, 0.577 * size,      // vertex 2

                // Face 4: [2, 3, 0] - left face
                0 * size, 0 * size, 0.577 * size,      // vertex 2
                0 * size, 0.816 * size, 0 * size,      // vertex 3
                -0.5 * size, 0 * size, -0.289 * size,  // vertex 0
            ]);

            // Calculate normals for each triangle
            const normals = new Float32Array(vertices.length);
            for (let i = 0; i < vertices.length; i += 9) {
                const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
                const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
                const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

                const normal = new THREE.Vector3()
                    .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
                    .normalize();

                // Apply the same normal to all three vertices of this triangle
                normals[i] = normal.x; normals[i + 1] = normal.y; normals[i + 2] = normal.z;
                normals[i + 3] = normal.x; normals[i + 4] = normal.y; normals[i + 5] = normal.z;
                normals[i + 6] = normal.x; normals[i + 7] = normal.y; normals[i + 8] = normal.z;
            }

            // Basic UV coordinates for texture mapping
            const uvs = new Float32Array([
                0, 0, 1, 0, 0.5, 1,  // Face 1
                0, 0, 1, 0, 0.5, 1,  // Face 2
                0, 0, 1, 0, 0.5, 1,  // Face 3
                0, 0, 1, 0, 0.5, 1,  // Face 4
            ]);

            d4Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            d4Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
            d4Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

            return d4Geometry;
        } else if (diceType === 'd8') {
            // Create custom D8 octahedron geometry that matches our physics vertices exactly
            const d8Geometry = new THREE.BufferGeometry();

            // D8 octahedron vertices (from D8Geometry.ts)
            const octahedronVertices = [
                [0, 1, 0],     // 0: top vertex
                [1, 0, 0],     // 1: positive X
                [0, 0, 1],     // 2: positive Z
                [-1, 0, 0],    // 3: negative X
                [0, 0, -1],    // 4: negative Z
                [0, -1, 0],    // 5: bottom vertex
            ];

            // D8 faces (8 triangular faces) - corrected winding order (CCW from outside)
            const octahedronFaces = [
                [0, 2, 1], [0, 3, 2], [0, 4, 3], [0, 1, 4], // Upper pyramid - fixed winding
                [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1], // Lower pyramid - fixed winding
            ];

            // Build vertices array for triangulated octahedron
            const vertices = new Float32Array(octahedronFaces.length * 9); // 8 faces * 3 vertices * 3 coords
            for (let faceIndex = 0; faceIndex < octahedronFaces.length; faceIndex++) {
                const face = octahedronFaces[faceIndex];
                for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                    const vertex = octahedronVertices[face[vertexIndex]];
                    const arrayIndex = faceIndex * 9 + vertexIndex * 3;
                    vertices[arrayIndex] = vertex[0] * size;     // X
                    vertices[arrayIndex + 1] = vertex[1] * size; // Y
                    vertices[arrayIndex + 2] = vertex[2] * size; // Z
                }
            }

            // Calculate normals for each triangle
            const normals = new Float32Array(vertices.length);
            for (let i = 0; i < vertices.length; i += 9) {
                const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
                const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
                const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

                const normal = new THREE.Vector3()
                    .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
                    .normalize();

                // Apply the same normal to all three vertices of this triangle
                normals[i] = normal.x; normals[i + 1] = normal.y; normals[i + 2] = normal.z;
                normals[i + 3] = normal.x; normals[i + 4] = normal.y; normals[i + 5] = normal.z;
                normals[i + 6] = normal.x; normals[i + 7] = normal.y; normals[i + 8] = normal.z;
            }

            // Basic UV coordinates for texture mapping (8 triangular faces)
            const uvs = new Float32Array([
                0, 0, 1, 0, 0.5, 1,  // Face 0
                0, 0, 1, 0, 0.5, 1,  // Face 1
                0, 0, 1, 0, 0.5, 1,  // Face 2
                0, 0, 1, 0, 0.5, 1,  // Face 3
                0, 0, 1, 0, 0.5, 1,  // Face 4
                0, 0, 1, 0, 0.5, 1,  // Face 5
                0, 0, 1, 0, 0.5, 1,  // Face 6
                0, 0, 1, 0, 0.5, 1,  // Face 7
            ]);

            d8Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            d8Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
            d8Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

            return d8Geometry;
        } else if (diceType === 'd12') {
            // Create custom D12 dodecahedron geometry that matches our physics vertices exactly
            const d12Geometry = new THREE.BufferGeometry();

            // Golden ratio for dodecahedron calculations
            const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618033988749895
            const INVPHI = 1 / PHI; // ≈ 0.618033988749895

            // D12 dodecahedron vertices (from corrected D12Geometry.ts - original threejs-dice layout)
            const dodecahedronVertices = [
                // Original threejs-dice D12 vertices
                [0, INVPHI, PHI],        // 0
                [0, INVPHI, -PHI],       // 1
                [0, -INVPHI, PHI],       // 2
                [0, -INVPHI, -PHI],      // 3
                [PHI, 0, INVPHI],        // 4
                [PHI, 0, -INVPHI],       // 5
                [-PHI, 0, INVPHI],       // 6
                [-PHI, 0, -INVPHI],      // 7
                [INVPHI, PHI, 0],        // 8
                [INVPHI, -PHI, 0],       // 9
                [-INVPHI, PHI, 0],       // 10
                [-INVPHI, -PHI, 0],      // 11
                [1, 1, 1],               // 12
                [1, 1, -1],              // 13
                [1, -1, 1],              // 14
                [1, -1, -1],             // 15
                [-1, 1, 1],              // 16
                [-1, 1, -1],             // 17
                [-1, -1, 1],             // 18
                [-1, -1, -1],            // 19
            ];

            // D12 faces (12 pentagonal faces) - exact layout from original threejs-dice
            const dodecahedronFaces = [
                [2, 14, 4, 12, 0],       // Face 0 (value 1)
                [15, 9, 11, 19, 3],      // Face 1 (value 2)
                [16, 10, 17, 7, 6],      // Face 2 (value 3)
                [6, 7, 19, 11, 18],      // Face 3 (value 4)
                [6, 18, 2, 0, 16],       // Face 4 (value 5)
                [18, 11, 9, 14, 2],      // Face 5 (value 6)
                [1, 17, 10, 8, 13],      // Face 6 (value 7)
                [1, 13, 5, 15, 3],       // Face 7 (value 8)
                [13, 8, 12, 4, 5],       // Face 8 (value 9)
                [5, 4, 14, 9, 15],       // Face 9 (value 10)
                [0, 12, 8, 10, 16],      // Face 10 (value 11)
                [3, 19, 7, 17, 1],       // Face 11 (value 12)
            ];

            // Triangulate pentagonal faces (each pentagon becomes 3 triangles)
            const triangulatedFaces = [];
            for (const face of dodecahedronFaces) {
                // Pentagon with vertices [v0, v1, v2, v3, v4]
                // Triangulate as: [v0,v1,v2], [v0,v2,v3], [v0,v3,v4]
                triangulatedFaces.push([face[0], face[1], face[2]]);
                triangulatedFaces.push([face[0], face[2], face[3]]);
                triangulatedFaces.push([face[0], face[3], face[4]]);
            }

            // Build vertices array for triangulated dodecahedron
            const vertices = new Float32Array(triangulatedFaces.length * 9); // 36 triangles * 3 vertices * 3 coords
            for (let faceIndex = 0; faceIndex < triangulatedFaces.length; faceIndex++) {
                const face = triangulatedFaces[faceIndex];
                for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                    const vertex = dodecahedronVertices[face[vertexIndex]];
                    const arrayIndex = faceIndex * 9 + vertexIndex * 3;
                    // Apply size scaling and geometry scale factor (0.9 for D12)
                    vertices[arrayIndex] = vertex[0] * size * 0.9;     // X
                    vertices[arrayIndex + 1] = vertex[1] * size * 0.9; // Y
                    vertices[arrayIndex + 2] = vertex[2] * size * 0.9; // Z
                }
            }

            // Calculate normals for each triangle
            const normals = new Float32Array(vertices.length);
            for (let i = 0; i < vertices.length; i += 9) {
                const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
                const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
                const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

                const normal = new THREE.Vector3()
                    .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
                    .normalize();

                // Apply the same normal to all three vertices of this triangle
                normals[i] = normal.x; normals[i + 1] = normal.y; normals[i + 2] = normal.z;
                normals[i + 3] = normal.x; normals[i + 4] = normal.y; normals[i + 5] = normal.z;
                normals[i + 6] = normal.x; normals[i + 7] = normal.y; normals[i + 8] = normal.z;
            }

            // Basic UV coordinates for texture mapping (36 triangular faces from 12 pentagons)
            const uvs = new Float32Array(triangulatedFaces.length * 6); // 36 triangles * 3 vertices * 2 coords
            for (let i = 0; i < triangulatedFaces.length; i++) {
                const baseIndex = i * 6;
                uvs[baseIndex] = 0; uvs[baseIndex + 1] = 0;      // Vertex 1
                uvs[baseIndex + 2] = 1; uvs[baseIndex + 3] = 0;  // Vertex 2  
                uvs[baseIndex + 4] = 0.5; uvs[baseIndex + 5] = 1; // Vertex 3
            }

            d12Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            d12Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
            d12Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

            return d12Geometry;
        } else if (diceType === 'd20') {
            // Create custom D20 icosahedron geometry that matches our physics vertices exactly
            const d20Geometry = new THREE.BufferGeometry();

            // Golden ratio for icosahedron calculations
            const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618033988749895

            // D20 icosahedron vertices (from corrected D20Geometry.ts)
            const icosahedronVertices = [
                // Golden rectangles method for icosahedron vertices
                // First golden rectangle in XY plane
                [-1, PHI, 0],     // 0
                [1, PHI, 0],      // 1
                [-1, -PHI, 0],    // 2
                [1, -PHI, 0],     // 3

                // Second golden rectangle in YZ plane  
                [0, -1, PHI],     // 4
                [0, 1, PHI],      // 5
                [0, -1, -PHI],    // 6
                [0, 1, -PHI],     // 7

                // Third golden rectangle in XZ plane
                [PHI, 0, -1],     // 8
                [PHI, 0, 1],      // 9
                [-PHI, 0, -1],    // 10
                [-PHI, 0, 1],     // 11
            ];

            // D20 faces (20 triangular faces) - corrected winding order (CCW from outside)
            const icosahedronFaces = [
                // Top cap faces (around vertex with highest Y coordinate)
                [0, 11, 5],   // Face 0
                [0, 5, 1],    // Face 1  
                [0, 1, 7],    // Face 2
                [0, 7, 10],   // Face 3
                [0, 10, 11],  // Face 4

                // Upper band faces
                [1, 5, 9],    // Face 5
                [5, 11, 4],   // Face 6
                [11, 10, 2],  // Face 7
                [10, 7, 6],   // Face 8
                [7, 1, 8],    // Face 9

                // Lower band faces  
                [3, 9, 4],    // Face 10
                [3, 4, 2],    // Face 11
                [3, 2, 6],    // Face 12
                [3, 6, 8],    // Face 13
                [3, 8, 9],    // Face 14

                // Bottom cap faces (around vertex with lowest Y coordinate)
                [4, 9, 5],    // Face 15
                [2, 4, 11],   // Face 16
                [6, 2, 10],   // Face 17
                [8, 6, 7],    // Face 18
                [9, 8, 1],    // Face 19
            ];

            // Build vertices array for triangulated icosahedron
            const vertices = new Float32Array(icosahedronFaces.length * 9); // 20 faces * 3 vertices * 3 coords
            for (let faceIndex = 0; faceIndex < icosahedronFaces.length; faceIndex++) {
                const face = icosahedronFaces[faceIndex];
                for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                    const vertex = icosahedronVertices[face[vertexIndex]];
                    const arrayIndex = faceIndex * 9 + vertexIndex * 3;
                    // Apply size scaling and geometry scale factor (0.6 for D20)
                    vertices[arrayIndex] = vertex[0] * size * 0.6;     // X
                    vertices[arrayIndex + 1] = vertex[1] * size * 0.6; // Y
                    vertices[arrayIndex + 2] = vertex[2] * size * 0.6; // Z
                }
            }

            // Calculate normals for each triangle
            const normals = new Float32Array(vertices.length);
            for (let i = 0; i < vertices.length; i += 9) {
                const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
                const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
                const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

                const normal = new THREE.Vector3()
                    .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
                    .normalize();

                // Apply the same normal to all three vertices of this triangle
                normals[i] = normal.x; normals[i + 1] = normal.y; normals[i + 2] = normal.z;
                normals[i + 3] = normal.x; normals[i + 4] = normal.y; normals[i + 5] = normal.z;
                normals[i + 6] = normal.x; normals[i + 7] = normal.y; normals[i + 8] = normal.z;
            }

            // Basic UV coordinates for texture mapping (20 triangular faces)
            const uvs = new Float32Array(icosahedronFaces.length * 6); // 20 faces * 3 vertices * 2 coords
            for (let i = 0; i < icosahedronFaces.length; i++) {
                const baseIndex = i * 6;
                uvs[baseIndex] = 0; uvs[baseIndex + 1] = 0;      // Vertex 1
                uvs[baseIndex + 2] = 1; uvs[baseIndex + 3] = 0;  // Vertex 2  
                uvs[baseIndex + 4] = 0.5; uvs[baseIndex + 5] = 1; // Vertex 3
            }

            d20Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            d20Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
            d20Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

            return d20Geometry;
        } else {
            // For D6 and other dice, return null to use built-in geometry
            return null;
        }
    }, [dice.diceType, dice.options.size]);

    // Get dice configuration for colors
    const diceConfig = DICE_CONFIG[dice.diceType as DiceType];

    // Render based on dice type
    if (dice.diceType === 'd4' && geometry) {
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                geometry={geometry}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial
                    color={diceConfig.color}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
        );
    } else if (dice.diceType === 'd8' && geometry) {
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                geometry={geometry}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial
                    color={diceConfig.color}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
        );
    } else if (dice.diceType === 'd12' && geometry) {
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                geometry={geometry}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial
                    color={diceConfig.color}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
        );
    } else if (dice.diceType === 'd20' && geometry) {
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                geometry={geometry}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial
                    color={diceConfig.color}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
        );
    } else if (dice.diceType === 'd6') {
        // Simple box geometry for D6 (this works fine)
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={diceConfig.color}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
        );
    } else {
        // Fallback for other dice types
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color="#888888"
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
        // Position ground plane lower to ensure dice don't clip through
        groundBody.position.set(0, -1, 0);

        if (DiceManager.getMaterials()) {
            groundBody.material = DiceManager.getMaterials()!.floor;
        }

        DiceManager.addBody(groundBody);

        console.log('🎲 Ground plane created at Y:', groundBody.position.y);

        return () => {
            DiceManager.removeBody(groundBody);
        };
    }, []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
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
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>('d20');
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
                    // Position the dice well above the ground (ground is now at Y=-1)
                    // D12 needs extra height due to larger scale factor (0.9 vs 0.6 for D20)
                    const startHeight = selectedDiceType === 'd12' ? 4 : 3;
                    const startPosition = new THREE.Vector3(0, startHeight, 0);
                    newDice.setPosition(startPosition);
                    setDice(newDice);
                    setCurrentValue(null);

                    console.log(`🎲 ${selectedDiceType.toUpperCase()} dice created and positioned:`, {
                        type: selectedDiceType,
                        position: newDice.getPosition(),
                        bodyPosition: newDice.body.position,
                        size: newDice.options.size,
                        mass: newDice.body.mass,
                        shape: newDice.body.shapes[0].type,
                        startHeight
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

        // Reset position and clear velocities (ground is now at Y=-1, so start at Y=3 or Y=4 for D12)
        const startHeight = selectedDiceType === 'd12' ? 4 : 3;
        dice.setPosition(new THREE.Vector3(0, startHeight, 0));
        dice.body.velocity.set(0, 0, 0);
        dice.body.angularVelocity.set(0, 0, 0);
        dice.body.wakeUp();

        setCurrentValue(null);
        setIsRolling(false);

        console.log(`🎲 ${selectedDiceType.toUpperCase()} reset to position:`, dice.getPosition());
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