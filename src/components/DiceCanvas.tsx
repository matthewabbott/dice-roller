import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface DiceCanvasProps {
    // TODO
}

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
                        <meshStandardMaterial color="#2a2a2a" />
                    </mesh>

                    {/* Test cube to verify 3D setup */}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial color="orange" />
                    </mesh>
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
                    <meshStandardMaterial color="#2a2a2a" />
                </mesh>

                {/* Test cube to verify 3D setup */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="orange" />
                </mesh>
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