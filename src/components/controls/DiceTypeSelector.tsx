import React from 'react';
import type { DiceType } from '../../hooks/controls/useDiceControls';

export interface DiceTypeSelectorProps {
    selectedDiceType: DiceType;
    onDiceTypeChange: (type: DiceType) => void;
    disabled?: boolean;
}

/**
 * DiceTypeSelector Component
 * Provides a dropdown for selecting dice types
 * Extracted from DiceCanvas for better separation of concerns
 */
export const DiceTypeSelector: React.FC<DiceTypeSelectorProps> = ({
    selectedDiceType,
    onDiceTypeChange,
    disabled = false
}) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Dice Type:</label>
            <select
                value={selectedDiceType}
                onChange={(e) => onDiceTypeChange(e.target.value as DiceType)}
                disabled={disabled}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="d4">D4 (Tetrahedron)</option>
                <option value="d6">D6 (Cube)</option>
                <option value="d8">D8 (Octahedron)</option>
                <option value="d10">D10 (Pentagonal Trapezohedron)</option>
                <option value="d12">D12 (Dodecahedron)</option>
                <option value="d20">D20 (Icosahedron)</option>
            </select>
        </div>
    );
}; 