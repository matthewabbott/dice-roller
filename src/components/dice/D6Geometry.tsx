import React from 'react';
import { DiceGeometry, DiceGeometryProps, DiceGeometryComponent } from './DiceGeometry';

/**
 * D6 Cube Geometry Component
 * Uses Three.js built-in BoxGeometry for simplicity and performance
 */
export const D6Geometry: DiceGeometryComponent = (props) => {
    return (
        <DiceGeometry {...props}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                color={props.color}
                roughness={props.isHovered ? 0.1 : 0.3}
                metalness={props.isHovered ? 0.3 : 0.1}
                emissive={props.isHovered ? props.color : '#000000'}
                emissiveIntensity={props.isHovered ? 0.1 : 0}
            />
        </DiceGeometry>
    );
};

D6Geometry.diceType = 'd6'; 