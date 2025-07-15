import React from 'react';

interface BrushSizeControlProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

export const BrushSizeControl: React.FC<BrushSizeControlProps> = ({ 
  brushSize, 
  onBrushSizeChange 
}) => {
  return (
    <div className="windows98-panel p-2">
      <div className="flex flex-col space-y-2">
        <label className="windows98-text text-xs">Brush Size: {brushSize}px</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span>1</span>
          <span>20</span>
        </div>
      </div>
    </div>
  );
};