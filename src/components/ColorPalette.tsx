import React from 'react';
import { playClickSound } from '../utils/soundEffects';

const colors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#808080', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0'
];

interface ColorPaletteProps {
  activeColor: string;
  onColorChange: (color: string) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ activeColor, onColorChange }) => {
  const handleColorClick = (color: string) => {
    playClickSound();
    onColorChange(color);
  };

  return (
    <div className="windows98-panel p-2">
      <div className="grid grid-cols-8 gap-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            className={`w-6 h-6 border border-gray-400 ${
              activeColor === color ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};