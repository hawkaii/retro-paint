import { useState, useRef, useCallback, useEffect } from 'react';
import { persistenceManager } from '../utils/persistence';

export const useCanvasState = (initialWidth = 640, initialHeight = 480) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [canvasWidth, setCanvasWidth] = useState(initialWidth);
  const [canvasHeight, setCanvasHeight] = useState(initialHeight);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Configure context for pixel-perfect drawing
    context.imageSmoothingEnabled = false;
    context.lineCap = 'square';
    context.lineJoin = 'miter';
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    contextRef.current = context;
    
    // Try to restore from localStorage first
    const savedCanvas = persistenceManager.loadCanvas();
    if (savedCanvas && !canvasInitialized) {
      console.log('Restoring canvas from localStorage');
      restoreCanvasFromDataURL(savedCanvas.imageData);
      setCanvasHistory(savedCanvas.history || []);
      setHistoryIndex(savedCanvas.historyIndex || 0);
      setCanvasInitialized(true);
    } else if (!canvasInitialized) {
      // Save initial blank state
      const initialState = canvas.toDataURL();
      setCanvasHistory([initialState]);
      setHistoryIndex(0);
      setCanvasInitialized(true);
      
      // Save to localStorage
      persistenceManager.saveCanvas(initialState, [initialState], 0);
    }
  }, [canvasWidth, canvasHeight, canvasInitialized]);

  const restoreCanvasFromDataURL = useCallback((dataURL: string) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };
    img.src = dataURL;
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newState = canvas.toDataURL();
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [canvasHistory, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreCanvasFromDataURL(canvasHistory[newIndex]);
    }
  }, [historyIndex, canvasHistory, restoreCanvasFromDataURL]);

  const redo = useCallback(() => {
    if (historyIndex < canvasHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreCanvasFromDataURL(canvasHistory[newIndex]);
    }
  }, [historyIndex, canvasHistory, restoreCanvasFromDataURL]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  }, [saveToHistory]);

  // Save canvas state to localStorage when history changes
  useEffect(() => {
    if (canvasInitialized && canvasHistory.length > 0) {
      const currentState = canvasHistory[historyIndex];
      if (currentState) {
        persistenceManager.saveCanvas(currentState, canvasHistory, historyIndex);
      }
    }
  }, [canvasHistory, historyIndex, canvasInitialized]);

  return {
    canvasRef,
    contextRef,
    canvasWidth,
    canvasHeight,
    canvasHistory,
    historyIndex,
    canvasInitialized,
    setCanvasWidth,
    setCanvasHeight,
    setCanvasHistory,
    setHistoryIndex,
    initializeCanvas,
    restoreCanvasFromDataURL,
    saveToHistory,
    undo,
    redo,
    clearCanvas
  };
};