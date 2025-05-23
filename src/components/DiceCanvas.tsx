import React from 'react';
import { Canvas } from '@react-three/fiber';

interface DiceCanvasProps {
    // TODO
}

const DiceCanvas: React.FC<DiceCanvasProps> = () => {
    return (
        <Canvas
            className="h-64 w-full"
            camera={{ position: [0, 5, 5], fov: 50 }}
        >
            <ambientLight intensity={0.5} />

            {/* Test cube to verify 3D setup */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="orange" />
            </mesh>
        </Canvas>
    );
};

export default DiceCanvas; 