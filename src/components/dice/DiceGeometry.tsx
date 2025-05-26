import React from 'react';
import * as THREE from 'three';

export interface DiceGeometryProps {
    size: number;
    color: string;
    isHovered?: boolean;
    onPointerDown?: (event: any) => void;
    onPointerMove?: (event: any) => void;
    onPointerUp?: (event: any) => void;
    onPointerEnter?: (event: any) => void;
    onPointerLeave?: (event: any) => void;
    meshRef?: React.RefObject<THREE.Mesh>;
}

export interface DiceGeometryComponent extends React.FC<DiceGeometryProps> {
    diceType: string;
}

/**
 * Base component for dice geometry rendering
 * Provides common material properties and interaction handling
 */
export const DiceGeometry: React.FC<DiceGeometryProps & {
    geometry?: THREE.BufferGeometry | null;
    children?: React.ReactNode;
}> = ({
    size,
    color,
    isHovered = false,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerEnter,
    onPointerLeave,
    meshRef,
    geometry,
    children
}) => {
        return (
            <mesh
                ref={meshRef}
                geometry={geometry}
                castShadow
                receiveShadow
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerEnter={onPointerEnter}
                onPointerLeave={onPointerLeave}
            >
                {children || (
                    <meshStandardMaterial
                        color={color}
                        roughness={isHovered ? 0.1 : 0.3}
                        metalness={isHovered ? 0.3 : 0.1}
                        emissive={isHovered ? color : '#000000'}
                        emissiveIntensity={isHovered ? 0.1 : 0}
                    />
                )}
            </mesh>
        );
    };

/**
 * Utility function to calculate normals for triangulated geometry
 */
export const calculateNormals = (vertices: Float32Array): Float32Array => {
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

    return normals;
};

/**
 * Utility function to generate basic UV coordinates for triangulated faces
 */
export const generateBasicUVs = (faceCount: number): Float32Array => {
    const uvs = new Float32Array(faceCount * 6); // triangles * 3 vertices * 2 coords

    for (let i = 0; i < faceCount; i++) {
        const baseIndex = i * 6;
        uvs[baseIndex] = 0; uvs[baseIndex + 1] = 0;      // Vertex 1
        uvs[baseIndex + 2] = 1; uvs[baseIndex + 3] = 0;  // Vertex 2  
        uvs[baseIndex + 4] = 0.5; uvs[baseIndex + 5] = 1; // Vertex 3
    }

    return uvs;
}; 