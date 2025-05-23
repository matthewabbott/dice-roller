import React, { useRef, useState } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DICE_COLORS } from '../constants/colors';

// Extend R3F with the geometry we need
extend({ EdgesGeometry: THREE.EdgesGeometry });

interface DiceCanvasProps {
    // TODO
}

// D6 Component with toy-like styling
const D6: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 0, 0] }) => {

    const dotSize = 0.1; // Bigger dots - was 0.06
    const faceOffset = 0.501; // Just outside the cube surface
    const spacing = 0.28; // Increased spacing between dots - was 0.2

    return (
        <group position={position}>
            {/* Main die body - bright white with slight roundness */}
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={DICE_COLORS.WHITE}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>

            {/* Thick black edges for toy-like look */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
                <lineBasicMaterial color={DICE_COLORS.EDGE_BLACK} linewidth={4} />
            </lineSegments>

            {/* Extra thick corner emphasis */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(1.01, 1.01, 1.01)]} />
                <lineBasicMaterial color={DICE_COLORS.EDGE_GRAY} linewidth={2} opacity={0.6} transparent />
            </lineSegments>

            {/* Face 1 (front face) - 1 dot center */}
            <mesh position={[0, 0, faceOffset]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>

            {/* Face 2 (right face) - 2 dots diagonal */}
            <mesh position={[faceOffset, spacing, -spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[faceOffset, -spacing, spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>

            {/* Face 3 (top face) - 3 dots diagonal */}
            <mesh position={[-spacing, faceOffset, spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[0, faceOffset, 0]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[spacing, faceOffset, -spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>

            {/* Face 4 (bottom face) - 4 dots corners */}
            <mesh position={[-spacing, -faceOffset, spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[spacing, -faceOffset, spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[-spacing, -faceOffset, -spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[spacing, -faceOffset, -spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>

            {/* Face 5 (left face) - 5 dots (4 corners + center) */}
            <mesh position={[-faceOffset, spacing, spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[-faceOffset, -spacing, spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[-faceOffset, 0, 0]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[-faceOffset, spacing, -spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[-faceOffset, -spacing, -spacing]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>

            {/* Face 6 (back face) - 6 dots (2 columns of 3) */}
            <mesh position={[-0.18, 0.3, -faceOffset]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[-0.18, 0, -faceOffset]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[-0.18, -0.3, -faceOffset]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[0.18, 0.3, -faceOffset]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[0.18, 0, -faceOffset]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
            <mesh position={[0.18, -0.3, -faceOffset]}>
                <sphereGeometry args={[dotSize, 8, 8]} />
                <meshStandardMaterial color={DICE_COLORS.DOT_BLACK} />
            </mesh>
        </group>
    );
};

const DiceCanvas: React.FC<DiceCanvasProps> = () => {
    const controlsRef = useRef<any>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

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
                >
                    <OrbitControls ref={controlsRef} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />

                    {/* Ground plane */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                        <planeGeometry args={[10, 10]} />
                        <meshStandardMaterial color={DICE_COLORS.TABLE_DARK} />
                    </mesh>

                    {/* D6 Dice */}
                    <D6 position={[0, 0.5, 0]} />
                </Canvas>

                {/* Full screen controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={resetCamera}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
                        title="Reset camera view"
                    >
                        🔄 Reset View
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
            >
                <OrbitControls ref={controlsRef} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />

                {/* Ground plane */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                    <planeGeometry args={[10, 10]} />
                    <meshStandardMaterial color={DICE_COLORS.TABLE_DARK} />
                </mesh>

                {/* D6 Dice */}
                <D6 position={[0, 0.5, 0]} />
            </Canvas>

            {/* Normal mode controls */}
            <div className="absolute top-2 right-2 flex gap-1">
                <button
                    onClick={resetCamera}
                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-70 hover:opacity-100"
                    title="Reset camera view"
                >
                    🔄
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