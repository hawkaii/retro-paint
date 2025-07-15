export interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  cursor: string;
}

export type ToolType = 'brush' | 'eraser' | 'bucket' | 'rectangle' | 'circle' | 'triangle' | 'line' | 'text';

export interface CanvasState {
  width: number;
  height: number;
  history: string[];
  historyIndex: number;
  initialized: boolean;
}

export interface DrawingState {
  isDrawing: boolean;
  activeTool: ToolType;
  activeColor: string;
  brushSize: number;
  fontSize: number;
}

export interface ShapeDrawingState {
  isShapeDrawing: boolean;
  shapeStartPos: { x: number; y: number } | null;
}

export interface TextState {
  isTextMode: boolean;
  textInput: string;
  textPosition: { x: number; y: number } | null;
}

export interface CanvasPosition {
  x: number;
  y: number;
}