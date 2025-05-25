import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DICE_COLORS } from '../constants/colors';
import { DiceManager, DiceD6, DiceD4, DiceD8, DiceD10, DiceD12, DiceD20, PhysicsUtils } from '../physics';
import * as CANNON from 'cannon-es';

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

    // Click and drag throwing system
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number; time: number } | null>(null);
    const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

    const handlePointerDown = useCallback((event: any) => {
        event.stopPropagation();
        setIsDragging(true);
        setDragStart({
            x: event.clientX,
            y: event.clientY,
            time: Date.now()
        });
        setDragCurrent({ x: event.clientX, y: event.clientY });

        // Capture pointer for consistent drag behavior
        if (event.target.setPointerCapture) {
            event.target.setPointerCapture(event.pointerId);
        }
    }, []);

    const handlePointerMove = useCallback((event: any) => {
        if (isDragging && dragStart) {
            setDragCurrent({ x: event.clientX, y: event.clientY });
        }
    }, [isDragging, dragStart]);

    const handlePointerUp = useCallback((event: any) => {
        if (isDragging && dragStart && dragCurrent && dice.body) {
            const deltaX = dragCurrent.x - dragStart.x;
            const deltaY = dragCurrent.y - dragStart.y;
            const deltaTime = Date.now() - dragStart.time;

            // Calculate throw force based on drag distance and speed
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const speed = distance / Math.max(deltaTime, 50); // Prevent division by very small numbers

            // Convert screen coordinates to world coordinates
            const forceMultiplier = 0.02; // Adjust this to tune throwing sensitivity
            const maxForce = 15; // Cap maximum force

            const forceX = Math.max(-maxForce, Math.min(maxForce, deltaX * forceMultiplier));
            const forceZ = Math.max(-maxForce, Math.min(maxForce, deltaY * forceMultiplier)); // Y screen -> Z world
            const forceY = Math.max(2, Math.min(8, speed * 2)); // Always throw upward, scale with speed

            // Apply throwing force
            dice.body.velocity.set(forceX, forceY, forceZ);

            // Add rotational velocity based on throw direction
            const rotationMultiplier = 0.3;
            dice.body.angularVelocity.set(
                (Math.random() - 0.5) * 20 + deltaY * rotationMultiplier,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20 + deltaX * rotationMultiplier
            );

            dice.body.wakeUp();

            // Create throw data for potential multiplayer broadcasting
            const throwData = {
                diceType: dice.diceType,
                force: { x: forceX, y: forceY, z: forceZ },
                angularVelocity: {
                    x: dice.body.angularVelocity.x,
                    y: dice.body.angularVelocity.y,
                    z: dice.body.angularVelocity.z
                },
                position: {
                    x: dice.body.position.x,
                    y: dice.body.position.y,
                    z: dice.body.position.z
                },
                timestamp: Date.now(),
                dragDistance: distance,
                dragTime: deltaTime
            };

            console.log('🎲 Dice thrown via drag:', throwData);

            // TODO: This throwData can be sent to GraphQL for multiplayer broadcasting
            // Example: broadcastDiceThrow(throwData)
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);

        // Release pointer capture
        if (event.target.releasePointerCapture) {
            event.target.releasePointerCapture(event.pointerId);
        }
    }, [isDragging, dragStart, dragCurrent, dice]);

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
        } else if (diceType === 'd10') {
            // Create custom D10 pentagonal trapezohedron geometry that matches our physics vertices exactly
            const d10Geometry = new THREE.BufferGeometry();

            // Generate D10 vertices programmatically (same as D10Geometry.ts)
            const d10Vertices = [];

            // Generate 10 vertices in a circle with alternating Z heights
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 / 10) * i; // 36 degrees apart
                const x = Math.cos(angle);
                const y = Math.sin(angle);
                // Alternate between +0.105 and -0.105 for Z coordinate
                const z = 0.105 * (i % 2 ? 1 : -1);
                d10Vertices.push([x, y, z]);
            }

            // Add top and bottom vertices
            d10Vertices.push([0, 0, -1]); // Bottom vertex (index 10)
            d10Vertices.push([0, 0, 1]);  // Top vertex (index 11)

            // D10 faces (20 faces total: 10 kite + 10 triangular) - exact layout from original threejs-dice
            const d10Faces = [
                // Kite-shaped faces (numbered 1-10) - these are the main dice faces
                [5, 7, 11, 0],   // Face 0 (value 1) - kite shape
                [4, 2, 10, 1],   // Face 1 (value 2) - kite shape  
                [1, 3, 11, 2],   // Face 2 (value 3) - kite shape
                [0, 8, 10, 3],   // Face 3 (value 4) - kite shape
                [7, 9, 11, 4],   // Face 4 (value 5) - kite shape
                [8, 6, 10, 5],   // Face 5 (value 6) - kite shape
                [9, 1, 11, 6],   // Face 6 (value 7) - kite shape
                [2, 0, 10, 7],   // Face 7 (value 8) - kite shape
                [3, 5, 11, 8],   // Face 8 (value 9) - kite shape
                [6, 4, 10, 9],   // Face 9 (value 10) - kite shape

                // Triangular connector faces (no numbers) - these complete the geometry
                [1, 0, 2],       // Face 10 - triangular connector
                [1, 2, 3],       // Face 11 - triangular connector
                [3, 2, 4],       // Face 12 - triangular connector
                [3, 4, 5],       // Face 13 - triangular connector
                [5, 4, 6],       // Face 14 - triangular connector
                [5, 6, 7],       // Face 15 - triangular connector
                [7, 6, 8],       // Face 16 - triangular connector
                [7, 8, 9],       // Face 17 - triangular connector
                [9, 8, 0],       // Face 18 - triangular connector
                [9, 0, 1],       // Face 19 - triangular connector
            ];

            // Triangulate mixed face types (kite-shaped and triangular)
            const triangulatedFaces = [];
            const faceGroups = []; // Track which original face each triangle belongs to
            for (let i = 0; i < d10Faces.length; i++) {
                const face = d10Faces[i];

                if (face.length === 4) {
                    // Kite-shaped face: triangulate as [v0,v1,v2] and [v0,v2,v3]
                    triangulatedFaces.push([face[0], face[1], face[2]]);
                    triangulatedFaces.push([face[0], face[2], face[3]]);
                    faceGroups.push(i); // Both triangles belong to the same kite face
                    faceGroups.push(i);
                } else if (face.length === 3) {
                    // Triangular face: use as-is
                    triangulatedFaces.push([face[0], face[1], face[2]]);
                    faceGroups.push(i);
                }
            }

            // Pre-calculate face normals for each original face (to smooth kite faces)
            const faceNormals = [];
            for (let i = 0; i < d10Faces.length; i++) {
                const face = d10Faces[i];

                // Calculate normal using first 3 vertices of the face
                const v1 = new THREE.Vector3(
                    d10Vertices[face[0]][0] * size * 0.9,
                    d10Vertices[face[0]][1] * size * 0.9,
                    d10Vertices[face[0]][2] * size * 0.9
                );
                const v2 = new THREE.Vector3(
                    d10Vertices[face[1]][0] * size * 0.9,
                    d10Vertices[face[1]][1] * size * 0.9,
                    d10Vertices[face[1]][2] * size * 0.9
                );
                const v3 = new THREE.Vector3(
                    d10Vertices[face[2]][0] * size * 0.9,
                    d10Vertices[face[2]][1] * size * 0.9,
                    d10Vertices[face[2]][2] * size * 0.9
                );

                const normal = new THREE.Vector3()
                    .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
                    .normalize();

                faceNormals.push(normal);
            }

            // Build vertices array for triangulated D10
            const vertices = new Float32Array(triangulatedFaces.length * 9); // triangles * 3 vertices * 3 coords
            for (let faceIndex = 0; faceIndex < triangulatedFaces.length; faceIndex++) {
                const face = triangulatedFaces[faceIndex];
                for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                    const vertex = d10Vertices[face[vertexIndex]];
                    const arrayIndex = faceIndex * 9 + vertexIndex * 3;
                    // Apply size scaling and geometry scale factor (0.9 for D10)
                    vertices[arrayIndex] = vertex[0] * size * 0.9;     // X
                    vertices[arrayIndex + 1] = vertex[1] * size * 0.9; // Y
                    vertices[arrayIndex + 2] = vertex[2] * size * 0.9; // Z
                }
            }

            // Calculate normals using the pre-calculated face normals (this smooths kite faces)
            const normals = new Float32Array(vertices.length);
            for (let i = 0; i < triangulatedFaces.length; i++) {
                const originalFaceIndex = faceGroups[i];
                const faceNormal = faceNormals[originalFaceIndex];

                const normalOffset = i * 9;

                // Apply the same face normal to all three vertices of this triangle
                // This ensures kite faces appear smooth (both triangles share the same normal)
                normals[normalOffset] = faceNormal.x;
                normals[normalOffset + 1] = faceNormal.y;
                normals[normalOffset + 2] = faceNormal.z;
                normals[normalOffset + 3] = faceNormal.x;
                normals[normalOffset + 4] = faceNormal.y;
                normals[normalOffset + 5] = faceNormal.z;
                normals[normalOffset + 6] = faceNormal.x;
                normals[normalOffset + 7] = faceNormal.y;
                normals[normalOffset + 8] = faceNormal.z;
            }

            // Basic UV coordinates for texture mapping
            const uvs = new Float32Array(triangulatedFaces.length * 6); // triangles * 3 vertices * 2 coords
            for (let i = 0; i < triangulatedFaces.length; i++) {
                const baseIndex = i * 6;
                uvs[baseIndex] = 0; uvs[baseIndex + 1] = 0;      // Vertex 1
                uvs[baseIndex + 2] = 1; uvs[baseIndex + 3] = 0;  // Vertex 2  
                uvs[baseIndex + 4] = 0.5; uvs[baseIndex + 5] = 1; // Vertex 3
            }

            d10Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            d10Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
            d10Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

            return d10Geometry;
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
                    // Apply size scaling and geometry scale factor (0.75 for D12 - smaller than original 0.9)
                    vertices[arrayIndex] = vertex[0] * size * 0.75;     // X
                    vertices[arrayIndex + 1] = vertex[1] * size * 0.75; // Y
                    vertices[arrayIndex + 2] = vertex[2] * size * 0.75; // Z
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <meshStandardMaterial
                    color={diceConfig.color}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
        );
    } else if (dice.diceType === 'd10' && geometry) {
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                geometry={geometry}
                castShadow
                receiveShadow
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
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

        // Create invisible walls to contain dice
        const wallHeight = 2;
        const wallThickness = 0.5;
        const tableSize = 8;

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
        walls.forEach((wall, index) => {
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

        console.log('🎲 Enhanced sandbox created:', {
            ground: 'Y: -1',
            walls: wallBodies.length,
            tableSize
        });

        return () => {
            DiceManager.removeBody(groundBody);
            wallBodies.forEach(wall => DiceManager.removeBody(wall));
        };
    }, []);

    return (
        <group>
            {/* Tiled Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <planeGeometry args={[8, 8]} />
                <meshStandardMaterial
                    color={DICE_COLORS.TABLE_DARK}
                    roughness={0.8}
                    metalness={0.0}
                >
                    {/* Add a subtle grid texture */}
                    <primitive
                        object={(() => {
                            const canvas = document.createElement('canvas');
                            canvas.width = 512;
                            canvas.height = 512;
                            const ctx = canvas.getContext('2d')!;

                            // Dark background
                            ctx.fillStyle = '#2a2a2a';
                            ctx.fillRect(0, 0, 512, 512);

                            // Grid lines
                            ctx.strokeStyle = '#404040';
                            ctx.lineWidth = 2;
                            const gridSize = 64; // 8x8 grid

                            for (let i = 0; i <= 512; i += gridSize) {
                                ctx.beginPath();
                                ctx.moveTo(i, 0);
                                ctx.lineTo(i, 512);
                                ctx.stroke();

                                ctx.beginPath();
                                ctx.moveTo(0, i);
                                ctx.lineTo(512, i);
                                ctx.stroke();
                            }

                            const texture = new THREE.CanvasTexture(canvas);
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;
                            texture.repeat.set(1, 1);
                            return texture;
                        })()}
                        attach="map"
                    />
                </meshStandardMaterial>
            </mesh>

            {/* Visible Wall Borders (low height for visual reference) */}
            {[
                // North border
                { pos: [0, -0.9, -4] as [number, number, number], size: [8, 0.2, 0.1] as [number, number, number] },
                // South border
                { pos: [0, -0.9, 4] as [number, number, number], size: [8, 0.2, 0.1] as [number, number, number] },
                // East border
                { pos: [4, -0.9, 0] as [number, number, number], size: [0.1, 0.2, 8] as [number, number, number] },
                // West border
                { pos: [-4, -0.9, 0] as [number, number, number], size: [0.1, 0.2, 8] as [number, number, number] },
            ].map((border, index) => (
                <mesh key={index} position={border.pos} receiveShadow>
                    <boxGeometry args={border.size} />
                    <meshStandardMaterial
                        color="#555555"
                        roughness={0.7}
                        metalness={0.1}
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
    const [rollHistory, setRollHistory] = useState<{ type: DiceType; value: number; timestamp: number }[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize physics world
    useEffect(() => {
        const initPhysics = async () => {
            try {
                if (!DiceManager.isInitialized()) {
                    DiceManager.setWorld();
                }
                setIsInitialized(true);
                console.log('🎲 Physics world initialized');
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
                {dice.map((die, index) => (
                    <PhysicsDice key={`dice-${index}`} dice={die} />
                ))}

                {/* Physics Simulation */}
                <PhysicsSimulation dice={dice.length > 0 ? dice[0] : null} />
            </Canvas>

            {/* Canvas Controls */}
            <div className={`absolute ${isFullScreen ? 'top-4 right-4' : 'top-2 right-2'} flex gap-2`}>
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
                    <div className="text-xl font-bold">{dice.length}</div>
                    {rollResult && (
                        <div className="text-sm text-green-400 mt-1">
                            Last Total: {rollResult}
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

                {/* Multi-dice Instructions */}
                {dice.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded text-sm">
                        <div className="font-medium mb-1">💡 Multi-Dice Tips:</div>
                        <ul className="text-xs space-y-1 text-blue-200">
                            <li>• Click and drag any dice to throw it</li>
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