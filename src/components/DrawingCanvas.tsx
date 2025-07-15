import React from 'react';
import { ToolType } from '../types/canvas';
import UserPresence from './UserPresence';

interface DrawingCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasWidth: number;
  canvasHeight: number;
  activeTool: ToolType;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  users: any[];
  userId: string;
}

const getCursorClass = (tool: ToolType): string => {
  const cursorMap: Record<ToolType, string> = {
    brush: 'cursor-crosshair',
    eraser: 'cursor-crosshair',
    bucket: 'cursor-crosshair',
    rectangle: 'cursor-crosshair',
    circle: 'cursor-crosshair',
    triangle: 'cursor-crosshair',
    line: 'cursor-crosshair',
    text: 'cursor-text'
  };
  return cursorMap[tool] || 'cursor-default';
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canvasRef,
  canvasWidth,
  canvasHeight,
  activeTool,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  users,
  userId
}) => {
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className={`block pixelated border-2 border-gray-600 bg-white ${getCursorClass(activeTool)}`}
        style={{ borderStyle: 'inset' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        role="img"
        aria-label="Drawing canvas"
      />

      {/* User Presence Overlay */}
      <UserPresence
        users={users}
        currentUserId={userId}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    </div>
  );
};