import React from 'react';
import { 
  Paintbrush, 
  Square, 
  Circle, 
  Triangle, 
  Minus, 
  Type, 
  PaintBucket as Bucket, 
  Eraser
} from 'lucide-react';
import { Tool, ToolType } from '../types/canvas';
import { playClickSound } from '../utils/soundEffects';

const tools: Tool[] = [
  { id: 'brush', name: 'Brush', icon: <Paintbrush size={16} />, cursor: 'crosshair' },
  { id: 'eraser', name: 'Eraser', icon: <Eraser size={16} />, cursor: 'crosshair' },
  { id: 'bucket', name: 'Fill Tool', icon: <Bucket size={16} />, cursor: 'crosshair' },
  { id: 'rectangle', name: 'Rectangle', icon: <Square size={16} />, cursor: 'crosshair' },
  { id: 'circle', name: 'Circle', icon: <Circle size={16} />, cursor: 'crosshair' },
  { id: 'triangle', name: 'Triangle', icon: <Triangle size={16} />, cursor: 'crosshair' },
  { id: 'line', name: 'Line', icon: <Minus size={16} />, cursor: 'crosshair' },
  { id: 'text', name: 'Text', icon: <Type size={16} />, cursor: 'text' },
];

interface ToolPaletteProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({ activeTool, onToolChange }) => {
  const handleToolClick = (toolId: string) => {
    playClickSound();
    onToolChange(toolId as ToolType);
  };

  return (
    <div className="windows98-panel p-2">
      <div className="grid grid-cols-2 gap-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`windows98-button p-2 ${
              activeTool === tool.id ? 'windows98-button-pressed' : ''
            }`}
            title={tool.name}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
};