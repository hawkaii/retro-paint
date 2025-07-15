import { useCallback } from 'react';
import { FloodFill, drawShape, getCanvasPosition } from '../utils/drawingUtils';
import { useDrawingState } from './useDrawingState';
import { useCanvasState } from './useCanvasState';
import { DrawingEvent } from './useWebSocket';
import { playActionSound, playToolSound } from '../utils/soundEffects';

interface UseCanvasEventsProps {
  drawingState: ReturnType<typeof useDrawingState>;
  canvasState: ReturnType<typeof useCanvasState>;
  sendDrawingEvent: (event: Omit<DrawingEvent, 'type' | 'userId' | 'roomId' | 'timestamp'>) => void;
  isConnected: boolean;
  textInputRef?: React.RefObject<HTMLInputElement>;
}

export const useCanvasEvents = ({
  drawingState,
  canvasState,
  sendDrawingEvent,
  isConnected,
  textInputRef
}: UseCanvasEventsProps) => {
  const {
    activeTool,
    activeColor,
    brushSize,
    isDrawing,
    setIsDrawing,
    isShapeDrawing,
    setIsShapeDrawing,
    shapeStartPos,
    setShapeStartPos,
    startShapeDrawing,
    startTextMode,
    isShapeTool
  } = drawingState;

  const {
    canvasRef,
    contextRef,
    saveToHistory
  } = canvasState;

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const position = getCanvasPosition(e, canvas);
    if (!position) return;

    const { x, y } = position;

    if (activeTool === 'bucket') {
      const context = contextRef.current;
      if (!context) return;

      const floodFill = new FloodFill(context, Math.floor(x), Math.floor(y), activeColor);
      const filledImageData = floodFill.fill(Math.floor(x), Math.floor(y));
      context.putImageData(filledImageData, 0, 0);
      
      playActionSound();
      
      // Send bucket fill event to other users
      if (isConnected) {
        sendDrawingEvent({
          drawingType: 'bucket',
          payload: {
            x: Math.floor(x),
            y: Math.floor(y),
            fillColor: activeColor,
          },
        });
      }
      
      saveToHistory();
    } else if (activeTool === 'text') {
      startTextMode(x, y);
      playToolSound();
      
      // Focus the text input after a brief delay
      setTimeout(() => {
        textInputRef?.current?.focus();
      }, 10);
    } else {
      startDrawing(e);
    }
  }, [activeTool, activeColor, canvasRef, contextRef, isConnected, sendDrawingEvent, saveToHistory, startTextMode, textInputRef]);

  const startDrawing = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!context || !canvas || activeTool === 'text' || activeTool === 'bucket') return;
    
    const position = getCanvasPosition(e, canvas);
    if (!position) return;

    const { x, y } = position;

    // Handle shape tools
    if (isShapeTool()) {
      startShapeDrawing(x, y);
      return;
    }
    
    setIsDrawing(true);

    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = activeColor;
    context.lineWidth = brushSize;
  }, [activeTool, activeColor, brushSize, canvasRef, contextRef, isShapeTool, setIsDrawing, startShapeDrawing]);

  const draw = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context || activeTool === 'text' || activeTool === 'bucket') return;

    if (isShapeDrawing) {
      // Handle shape preview logic here if needed
      return;
    }

    if (!isDrawing) return;

    const position = getCanvasPosition(e, canvas);
    if (!position) return;

    const { x, y } = position;

    if (activeTool === 'brush') {
      context.lineTo(x, y);
      context.stroke();
      
      // Send drawing event to other users
      if (isConnected) {
        sendDrawingEvent({
          drawingType: 'brush',
          payload: {
            coordinates: [{ x, y }],
            color: activeColor,
            size: brushSize,
          },
        });
      }
    } else if (activeTool === 'eraser') {
      context.clearRect(x - brushSize/2, y - brushSize/2, brushSize, brushSize);
      
      // Send eraser event to other users
      if (isConnected) {
        sendDrawingEvent({
          drawingType: 'eraser',
          payload: {
            x,
            y,
            size: brushSize,
          },
        });
      }
    }
  }, [activeTool, activeColor, brushSize, canvasRef, contextRef, isConnected, isDrawing, isShapeDrawing, sendDrawingEvent]);

  const stopDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context || activeTool === 'text' || activeTool === 'bucket') return;

    if (isShapeDrawing && shapeStartPos) {
      setIsShapeDrawing(false);
      
      // For now, just draw a simple shape at the start position
      // In a real implementation, you'd track mouse movement for the end position
      const endX = shapeStartPos.x + 100;
      const endY = shapeStartPos.y + 100;
      
      drawShape(context, shapeStartPos.x, shapeStartPos.y, endX, endY, activeTool, activeColor, brushSize);
      
      // Send shape drawing event to other users
      if (isConnected) {
        sendDrawingEvent({
          drawingType: activeTool as any,
          payload: {
            x: shapeStartPos.x,
            y: shapeStartPos.y,
            endX,
            endY,
            color: activeColor,
            size: brushSize,
          },
        });
      }
      
      setShapeStartPos(null);
      saveToHistory();
      return;
    }

    setIsDrawing(false);
    context.beginPath();
    
    // Save to history
    saveToHistory();
  }, [activeTool, activeColor, brushSize, canvasRef, contextRef, isConnected, isShapeDrawing, saveToHistory, sendDrawingEvent, setIsDrawing, setIsShapeDrawing, setShapeStartPos, shapeStartPos]);

  return {
    handleCanvasClick,
    startDrawing,
    draw,
    stopDrawing
  };
};