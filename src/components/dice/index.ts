// Barrel exports for dice geometry components
export { DiceGeometry, calculateNormals, generateBasicUVs } from './DiceGeometry';
export type { DiceGeometryProps, DiceGeometryComponent } from './DiceGeometry';

export { D4Geometry } from './D4Geometry';
export { D6Geometry } from './D6Geometry';
export { D8Geometry } from './D8Geometry';
export { D10Geometry } from './D10Geometry';
export { D12Geometry } from './D12Geometry';
export { D20Geometry } from './D20Geometry';

// Dice geometry registry for easy lookup
export const DICE_GEOMETRIES = {
    d4: D4Geometry,
    d6: D6Geometry,
    d8: D8Geometry,
    d10: D10Geometry,
    d12: D12Geometry,
    d20: D20Geometry,
} as const;

export type DiceType = keyof typeof DICE_GEOMETRIES; 