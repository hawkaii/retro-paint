import { useState, useCallback } from 'react';
import { ToolType } from '../types/canvas';

export const useDrawingState = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brushSize, setBrushSize] = useState(2);
  const [activeColor, setActiveColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(16);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Shape drawing state
  const [isShapeDrawing, setIsShapeDrawing] = useState(false);
  const [shapeStartPos, setShapeStartPos] = useState<{ x: number; y: number } | null>(null);
  
  // Text state
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);

  const resetDrawingState = useCallback(() => {
    setIsDrawing(false);
    setIsShapeDrawing(false);
    setShapeStartPos(null);
    setIsTextMode(false);
    setTextInput('');
    setTextPosition(null);
  }, []);

  const startShapeDrawing = useCallback((x: number, y: number) => {
    setIsShapeDrawing(true);
    setShapeStartPos({ x, y });
  }, []);

  const startTextMode = useCallback((x: number, y: number) => {
    setIsTextMode(true);
    setTextPosition({ x, y });
    setTextInput('');
  }, []);

  const isShapeTool = useCallback(() => {
    return ['rectangle', 'circle', 'triangle', 'line'].includes(activeTool);
  }, [activeTool]);

  return {
    // Tool state
    activeTool,
    setActiveTool,
    brushSize,
    setBrushSize,
    activeColor,
    setActiveColor,
    fontSize,
    setFontSize,
    
    // Drawing state
    isDrawing,
    setIsDrawing,
    
    // Shape state
    isShapeDrawing,
    setIsShapeDrawing,
    shapeStartPos,
    setShapeStartPos,
    startShapeDrawing,
    
    // Text state
    isTextMode,
    setIsTextMode,
    textInput,
    setTextInput,
    textPosition,
    setTextPosition,
    startTextMode,
    
    // Utilities
    resetDrawingState,
    isShapeTool
  };
};