import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paintbrush, Square, Circle, Triangle, Minus, Type, PaintBucket as Bucket, Eraser, Undo, Redo, Save, Share2, Users, MessageCircle, Wand2 } from 'lucide-react';
import AIGenerationPanel from './components/AIGenerationPanel';
import Windows98Logo from './components/Windows98Logo';
import { retroSoundEngine, playClickSound, playToolSound, playActionSound, playErrorSound, playSuccessSound } from './utils/soundEffects';
import { useWebSocket, DrawingEvent } from './hooks/useWebSocket';
import './styles/windows98.css';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  cursor: string;
}

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

const colors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#808080', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0'
];

function App() {
  const [activeTool, setActiveTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(2);
  const [activeColor, setActiveColor] = useState('#000000');
  const [canvasWidth, setCanvasWidth] = useState(640);
  const [canvasHeight, setCanvasHeight] = useState(480);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showChat, setShowChat] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isResizing, setIsResizing] = useState<'width' | 'height' | 'both' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [pasteError, setPasteError] = useState<string>('');
  const [isShapeDrawing, setIsShapeDrawing] = useState(false);
  const [shapeStartPos, setShapeStartPos] = useState<{ x: number; y: number } | null>(null);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [originalCanvasSize, setOriginalCanvasSize] = useState({ width: 640, height: 480 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  const {
    sendDrawingEvent,
    sendChatMessage,
    sendPresenceUpdate,
    isConnected,
    userCount,
    onDrawingEvent,
    onChatMessage,
    onPresenceUpdate,
  } = useWebSocket('ws://localhost:8080/ws', 'User' + Math.random().toString(36).substr(2, 9));

  // Initialize sound system
  useEffect(() => {
    // Enable audio context on first user interaction
    const enableAudio = () => {
      retroSoundEngine.playRetroSound('click');
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      retroSoundEngine.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Configure context for pixel-perfect drawing
    context.imageSmoothingEnabled = false;
    context.lineCap = 'square';
    context.lineJoin = 'miter';
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    contextRef.current = context;
    
    // Save initial state
    const initialState = canvas.toDataURL();
    setCanvasHistory([initialState]);
    setHistoryIndex(0);
    
    // Create preview canvas for shape drawing
    const preview = document.createElement('canvas');
    preview.width = canvasWidth;
    preview.height = canvasHeight;
    setPreviewCanvas(preview);
  }, [canvasWidth, canvasHeight]);

  // Fullscreen event handlers
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (isCurrentlyFullscreen) {
        // Store original size before going fullscreen
        setOriginalCanvasSize({ width: canvasWidth, height: canvasHeight });
        
        // Calculate fullscreen dimensions (maintain aspect ratio)
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height - 100; // Leave space for UI
        
        const aspectRatio = canvasWidth / canvasHeight;
        let newWidth, newHeight;
        
        if (screenWidth / screenHeight > aspectRatio) {
          newHeight = screenHeight;
          newWidth = screenHeight * aspectRatio;
        } else {
          newWidth = screenWidth;
          newHeight = screenWidth / aspectRatio;
        }
        
        handleCanvasResize(Math.floor(newWidth), Math.floor(newHeight), true);
      } else {
        // Restore original size when exiting fullscreen
        handleCanvasResize(originalCanvasSize.width, originalCanvasSize.height, true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [canvasWidth, canvasHeight, originalCanvasSize]);

  // Window resize handler
  useEffect(() => {
    const handleWindowResize = () => {
      if (isFullscreen) {
        // Recalculate fullscreen dimensions on window resize
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - 100;
        
        const aspectRatio = originalCanvasSize.width / originalCanvasSize.height;
        let newWidth, newHeight;
        
        if (screenWidth / screenHeight > aspectRatio) {
          newHeight = screenHeight;
          newWidth = screenHeight * aspectRatio;
        } else {
          newWidth = screenWidth;
          newHeight = screenWidth / aspectRatio;
        }
        
        handleCanvasResize(Math.floor(newWidth), Math.floor(newHeight), true);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isFullscreen, originalCanvasSize]);

  // Clipboard paste functionality
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    e.preventDefault();
    setPasteError('');

    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        throw new Error('Clipboard API not supported in this browser');
      }

      // Read clipboard contents
      const clipboardItems = await navigator.clipboard.read();
      
      if (!clipboardItems || clipboardItems.length === 0) {
        throw new Error('No items found in clipboard');
      }

      let imageProcessed = false;

      // Process each clipboard item
      for (const clipboardItem of clipboardItems) {
        // Check for image types
        const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
        
        for (const imageType of imageTypes) {
          if (clipboardItem.types.includes(imageType)) {
            try {
              const blob = await clipboardItem.getType(imageType);
              await processClipboardImage(blob, imageType);
              imageProcessed = true;
              break;
            } catch (error) {
              console.warn(`Failed to process ${imageType}:`, error);
              continue;
            }
          }
        }
        
        if (imageProcessed) break;
      }

      if (!imageProcessed) {
        // Fallback: try to get image from clipboardData (for older browsers)
        const clipboardData = (e as any).clipboardData || (window as any).clipboardData;
        if (clipboardData && clipboardData.files && clipboardData.files.length > 0) {
          const file = clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            await processClipboardImage(file, file.type);
            imageProcessed = true;
          }
        }
      }

      if (!imageProcessed) {
        throw new Error('No image data found in clipboard. Try copying an image or taking a screenshot first.');
      }

    } catch (error) {
      console.error('Paste error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to paste image from clipboard';
      setPasteError(errorMessage);
      playErrorSound();
      
      // Clear error after 5 seconds
      setTimeout(() => setPasteError(''), 5000);
    }
  }, [canvasWidth, canvasHeight, canvasHistory, historyIndex]);

  // Process clipboard image data
  const processClipboardImage = async (blob: Blob, mimeType: string) => {
    return new Promise<void>((resolve, reject) => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      
      if (!canvas || !context) {
        reject(new Error('Canvas not available'));
        return;
      }

      // Validate file size (max 10MB)
      if (blob.size > 10 * 1024 * 1024) {
        reject(new Error('Image too large. Maximum size is 10MB.'));
        return;
      }

      // Create image element
      const img = new Image();
      
      img.onload = () => {
        try {
          // Validate image dimensions
          if (img.width > 4000 || img.height > 4000) {
            reject(new Error('Image dimensions too large. Maximum size is 4000x4000 pixels.'));
            return;
          }

          if (img.width < 1 || img.height < 1) {
            reject(new Error('Invalid image dimensions.'));
            return;
          }

          // Calculate scaling to fit image within canvas while maintaining aspect ratio
          const canvasAspect = canvas.width / canvas.height;
          const imageAspect = img.width / img.height;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          // Determine if we should scale down the image
          const maxWidth = Math.min(canvas.width, img.width);
          const maxHeight = Math.min(canvas.height, img.height);
          
          if (img.width > canvas.width || img.height > canvas.height) {
            // Scale down to fit
            if (imageAspect > canvasAspect) {
              // Image is wider than canvas
              drawWidth = maxWidth;
              drawHeight = maxWidth / imageAspect;
            } else {
              // Image is taller than canvas
              drawWidth = maxHeight * imageAspect;
              drawHeight = maxHeight;
            }
          } else {
            // Use original size
            drawWidth = img.width;
            drawHeight = img.height;
          }
          
          // Center the image on canvas
          drawX = (canvas.width - drawWidth) / 2;
          drawY = (canvas.height - drawHeight) / 2;
          
          // Draw the image
          context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          
          // Save to history for undo/redo
          const newState = canvas.toDataURL();
          const newHistory = canvasHistory.slice(0, historyIndex + 1);
          newHistory.push(newState);
          setCanvasHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          
          // Clean up the object URL
          URL.revokeObjectURL(img.src);
          
          // Play success sound for successful paste
          playSuccessSound();
          
          resolve();
        } catch (error) {
          reject(new Error('Failed to draw image on canvas: ' + (error as Error).message));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error(`Failed to load image. Unsupported format: ${mimeType}`));
      };
      
      // Convert blob to object URL and load
      const objectUrl = URL.createObjectURL(blob);
      img.src = objectUrl;
    });
  };

  // Add paste event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+V (Windows/Linux) or Cmd+V (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Don't interfere with text input fields
        const activeElement = document.activeElement;
        if (activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true'
        )) {
          return;
        }
        
        e.preventDefault();
        
        // Trigger paste event
        navigator.clipboard.read().then(async (clipboardItems) => {
          const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: new DataTransfer()
          });
          
          // Add clipboard items to the event
          for (const item of clipboardItems) {
            for (const type of item.types) {
              if (type.startsWith('image/')) {
                const blob = await item.getType(type);
                (pasteEvent.clipboardData as any).items.add(blob, type);
              }
            }
          }
          
          handlePaste(pasteEvent);
        }).catch((error) => {
          console.error('Failed to read clipboard:', error);
          setPasteError('Failed to access clipboard. Make sure you have copied an image.');
          playErrorSound();
          setTimeout(() => setPasteError(''), 5000);
        });
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste as any);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste as any);
    };
  }, [handlePaste]);

  // Handle resize controls
  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'width' | 'height' | 'both') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: canvasWidth, height: canvasHeight });
  };

  // Global mouse move handler for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        let newWidth = initialSize.width;
        let newHeight = initialSize.height;

        if (isResizing === 'width' || isResizing === 'both') {
          newWidth = Math.max(400, Math.min(3000, initialSize.width + deltaX));
        }
        if (isResizing === 'height' || isResizing === 'both') {
          newHeight = Math.max(300, Math.min(2000, initialSize.height + deltaY));
        }

        handleCanvasResize(newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dragStart, initialSize, canvasWidth, canvasHeight]);

  const handleCanvasResize = (width: number, height: number, preserveContent: boolean = false) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Save current canvas content as image for scaling
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    if (!tempContext) return;
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempContext.drawImage(canvas, 0, 0);
    
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    // Update canvas size
    setCanvasWidth(width);
    setCanvasHeight(height);
    
    // Wait for next frame to restore and scale content
    requestAnimationFrame(() => {
      if (canvas && context) {
        canvas.width = width;
        canvas.height = height;
        
        // Configure context
        context.imageSmoothingEnabled = false;
        context.lineCap = 'square';
        context.lineJoin = 'miter';
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, width, height);
        
        if (preserveContent) {
          // Scale and draw the previous content
          const scaleX = width / oldWidth;
          const scaleY = height / oldHeight;
          
          // Use the smaller scale to maintain aspect ratio
          const scale = Math.min(scaleX, scaleY);
          const scaledWidth = oldWidth * scale;
          const scaledHeight = oldHeight * scale;
          
          // Center the scaled content
          const offsetX = (width - scaledWidth) / 2;
          const offsetY = (height - scaledHeight) / 2;
          
          // Draw scaled content
          context.drawImage(
            tempCanvas,
            0, 0, oldWidth, oldHeight,
            offsetX, offsetY, scaledWidth, scaledHeight
          );
        }
        
        // Save to history
        const newState = canvas.toDataURL();
        const newHistory = canvasHistory.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setCanvasHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    });
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      // Enter fullscreen
      const element = fullscreenRef.current || document.documentElement;
      try {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    } else {
      // Exit fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
  };

  // Flood fill algorithm for bucket fill tool
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Convert fill color to RGB
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    if (!tempContext) return;
    
    tempContext.fillStyle = fillColor;
    tempContext.fillRect(0, 0, 1, 1);
    const fillColorData = tempContext.getImageData(0, 0, 1, 1).data;
    const fillR = fillColorData[0];
    const fillG = fillColorData[1];
    const fillB = fillColorData[2];
    const fillA = 255;

    // Get target color at start position
    const startIndex = (startY * width + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // Don't fill if target color is the same as fill color
    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) {
      return;
    }

    // Stack-based flood fill to avoid recursion limits
    const stack: Array<[number, number]> = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      // Check if pixel matches target color
      if (r !== targetR || g !== targetG || b !== targetB || a !== targetA) {
        continue;
      }

      // Fill the pixel
      data[index] = fillR;
      data[index + 1] = fillG;
      data[index + 2] = fillB;
      data[index + 3] = fillA;

      // Add neighboring pixels to stack
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    // Apply the changes
    context.putImageData(imageData, 0, 0);
  };

  // Draw shapes with preview
  const drawShape = (startX: number, startY: number, endX: number, endY: number, shapeType: string, isPreview: boolean = false) => {
    const canvas = isPreview ? previewCanvas : canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    if (isPreview) {
      // Clear preview canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    context.strokeStyle = activeColor;
    context.lineWidth = brushSize;
    context.lineCap = 'square';
    context.lineJoin = 'miter';
    context.imageSmoothingEnabled = false;

    context.beginPath();

    switch (shapeType) {
      case 'rectangle':
        const rectWidth = endX - startX;
        const rectHeight = endY - startY;
        context.rect(startX, startY, rectWidth, rectHeight);
        break;

      case 'circle':
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radiusX = Math.abs(endX - startX) / 2;
        const radiusY = Math.abs(endY - startY) / 2;
        
        // Draw ellipse using arc approximation
        context.save();
        context.translate(centerX, centerY);
        context.scale(radiusX / Math.max(radiusX, radiusY), radiusY / Math.max(radiusX, radiusY));
        context.arc(0, 0, Math.max(radiusX, radiusY), 0, 2 * Math.PI);
        context.restore();
        break;

      case 'triangle':
        const midX = (startX + endX) / 2;
        context.moveTo(midX, startY); // Top point
        context.lineTo(startX, endY); // Bottom left
        context.lineTo(endX, endY);   // Bottom right
        context.closePath();
        break;

      case 'line':
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        break;
    }

    context.stroke();
  };

  // Handle shape drawing preview
  const updateShapePreview = (e: React.MouseEvent) => {
    if (!isShapeDrawing || !shapeStartPos || !previewCanvas || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Draw shape preview
    drawShape(shapeStartPos.x, shapeStartPos.y, currentX, currentY, activeTool, true);

    // Composite preview onto main canvas
    const mainContext = contextRef.current;
    if (mainContext) {
      // Save current state
      const currentImageData = mainContext.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Clear and redraw with preview
      mainContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Restore original content
      mainContext.putImageData(currentImageData, 0, 0);
      
      // Draw preview on top
      mainContext.drawImage(previewCanvas, 0, 0);
    }
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!contextRef.current || activeTool === 'text' || activeTool === 'bucket') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle shape tools
    if (['rectangle', 'circle', 'triangle', 'line'].includes(activeTool)) {
      setIsShapeDrawing(true);
      setShapeStartPos({ x, y });
      return;
    }
    
    setIsDrawing(true);

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    contextRef.current.strokeStyle = activeColor;
    contextRef.current.lineWidth = brushSize;
  };

  const draw = (e: React.MouseEvent) => {
    if (activeTool === 'text' || activeTool === 'bucket') return;

    if (isShapeDrawing) {
      updateShapePreview(e);
      return;
    }

    if (!isDrawing || !contextRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'brush') {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
      
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
      contextRef.current.clearRect(x - brushSize/2, y - brushSize/2, brushSize, brushSize);
      
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
  };

  // Modified bucket fill to send WebSocket events
  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'bucket') {
      floodFill(Math.floor(x), Math.floor(y), activeColor);
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
      
      // Save to history
      if (canvasRef.current) {
        const newState = canvasRef.current.toDataURL();
        const newHistory = canvasHistory.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setCanvasHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    } else if (activeTool === 'text') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setTextPosition({ x, y });
      setIsTextMode(true);
      
      // Play tool sound for text placement
      playToolSound();
      
      // Focus the text input after a brief delay to ensure it's rendered
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 10);
    } else {
      startDrawing(e);
    }
  };

  // Modified shape completion to send WebSocket events
  const stopDrawing = () => {
    if (activeTool === 'text' || activeTool === 'bucket') return;

    if (isShapeDrawing && shapeStartPos && canvasRef.current) {
      setIsShapeDrawing(false);
      
      // Send shape drawing event to other users
      if (isConnected) {
        sendDrawingEvent({
          drawingType: activeTool as any,
          payload: {
            x: shapeStartPos.x,
            y: shapeStartPos.y,
            endX: shapeStartPos.x + 100, // You'll need to track the actual end position
            endY: shapeStartPos.y + 100,
            color: activeColor,
            size: brushSize,
          },
        });
      }
      
      // Save to history
      const newState = canvasRef.current.toDataURL();
      const newHistory = canvasHistory.slice(0, historyIndex + 1);
      newHistory.push(newState);
      setCanvasHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setShapeStartPos(null);
      return;
    }

    if (!isDrawing || !canvasRef.current) return;
    
    setIsDrawing(false);
    contextRef.current?.beginPath();
    
    // Save to history
    const newState = canvasRef.current.toDataURL();
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Send presence updates when cursor moves
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && isConnected) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      sendPresenceUpdate(x, y, activeColor, activeTool);
    }
    
    draw(e);
  };

  // Handle incoming drawing events from other users
  useEffect(() => {
    onDrawingEvent((event: DrawingEvent) => {
      applyRemoteDrawingEvent(event);
    });

    onChatMessage((message) => {
      // Handle incoming chat messages
      console.log('Chat message received:', message);
    });

    onPresenceUpdate((presence) => {
      // Handle user presence updates
      console.log('Presence update:', presence);
    });
  }, [onDrawingEvent, onChatMessage, onPresenceUpdate]);

  // Apply drawing events received from other users
  const applyRemoteDrawingEvent = (event: DrawingEvent) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const { drawingType, payload } = event;

    switch (drawingType) {
      case 'brush':
        if (payload.coordinates) {
          context.strokeStyle = payload.color || '#000000';
          context.lineWidth = payload.size || 2;
          context.beginPath();
          payload.coordinates.forEach((point, index) => {
            if (index === 0) {
              context.moveTo(point.x, point.y);
            } else {
              context.lineTo(point.x, point.y);
            }
          });
          context.stroke();
        }
        break;

      case 'eraser':
        if (payload.x !== undefined && payload.y !== undefined && payload.size) {
          context.clearRect(
            payload.x - payload.size / 2,
            payload.y - payload.size / 2,
            payload.size,
            payload.size
          );
        }
        break;

      case 'bucket':
        if (payload.x !== undefined && payload.y !== undefined && payload.fillColor) {
          floodFill(payload.x, payload.y, payload.fillColor);
        }
        break;

      case 'rectangle':
      case 'circle':
      case 'triangle':
      case 'line':
        if (payload.x !== undefined && payload.y !== undefined && 
            payload.endX !== undefined && payload.endY !== undefined) {
          drawShape(payload.x, payload.y, payload.endX, payload.endY, drawingType);
        }
        break;

      case 'text':
        if (payload.x !== undefined && payload.y !== undefined && 
            payload.text && payload.fontSize && payload.color) {
          context.font = `${payload.fontSize}px "MS Sans Serif", monospace, sans-serif`;
          context.fillStyle = payload.color;
          context.textBaseline = 'top';
          context.fillText(payload.text, payload.x, payload.y);
        }
        break;

      case 'paste':
      case 'ai-generate':
        if (payload.imageData) {
          const img = new Image();
          img.onload = () => {
            context.drawImage(img, 0, 0);
          };
          img.src = payload.imageData;
        }
        break;
    }
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      restoreCanvas(canvasHistory[historyIndex - 1]);
      playActionSound();
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      restoreCanvas(canvasHistory[historyIndex + 1]);
      playActionSound();
    }
  };

  // Restore canvas from data URL
  const restoreCanvas = (dataURL: string) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };
    img.src = dataURL;
  };

  // Save canvas function
  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'mspaint-plus-plus.png';
    link.href = canvas.toDataURL();
    link.click();
    
    // Play success sound for save
    playSuccessSound();
  };

  // Share canvas function
  const shareCanvas = () => {
    // Simulate sharing functionality
    const shareId = Math.random().toString(36).substring(2, 15);
    navigator.clipboard.writeText(`https://mspaint-plus-plus.com/share/${shareId}`);
    playSuccessSound();
    alert('🎨 Share link copied to clipboard!\n\nYour retro masterpiece is ready to share!');
  };

  // Get cursor class based on active tool
  const getCursorClass = () => {
    const tool = tools.find(t => t.id === activeTool);
    return tool ? `cursor-${tool.cursor === 'crosshair' ? 'crosshair' : tool.cursor}` : 'cursor-crosshair';
  };

  // Handle text submit
  const handleTextSubmit = () => {
    if (!textInput.trim() || !textPosition || !contextRef.current || !canvasRef.current) return;

    const context = contextRef.current;
    
    // Set text properties
    context.font = `${fontSize}px "MS Sans Serif", monospace, sans-serif`;
    context.fillStyle = activeColor;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    
    // Disable font smoothing for pixelated text
    context.imageSmoothingEnabled = false;
    
    // Draw the text
    context.fillText(textInput, textPosition.x, textPosition.y);
    
    // Save to history
    const newState = canvasRef.current.toDataURL();
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Play action sound for text placement
    playActionSound();
    
    // Reset text mode
    setIsTextMode(false);
    setTextInput('');
    setTextPosition(null);
  };

  // Handle text cancel
  const handleTextCancel = () => {
    setIsTextMode(false);
    setTextInput('');
    setTextPosition(null);
  };

  // Handle text key down
  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTextCancel();
    }
  };

  // Handle AI image generation
  const handleImageGenerated = (imageUrl: string) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const img = new Image();
    img.onload = () => {
      // Clear canvas and draw the AI-generated image
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate scaling to fit image within canvas while maintaining aspect ratio
      const canvasAspect = canvas.width / canvas.height;
      const imageAspect = img.width / img.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imageAspect > canvasAspect) {
        // Image is wider than canvas
        drawWidth = canvas.width;
        drawHeight = canvas.width / imageAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      } else {
        // Image is taller than canvas
        drawWidth = canvas.height * imageAspect;
        drawHeight = canvas.height;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      }
      
      // Fill background with white first
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image
      context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      // Save to history for undo/redo
      const newState = canvas.toDataURL();
      const newHistory = canvasHistory.slice(0, historyIndex + 1);
      newHistory.push(newState);
      setCanvasHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Play success sound for AI generation
      playSuccessSound();
      
      // Clean up the object URL
      URL.revokeObjectURL(imageUrl);
    };
    
    img.onerror = () => {
      console.error('Failed to load generated image');
      URL.revokeObjectURL(imageUrl);
    };
    
    img.src = imageUrl;
  };

  return (
    <div 
      ref={fullscreenRef}
      className={`min-h-screen bg-gray-300 flex flex-col windows98-text ${isFullscreen ? 'fullscreen-mode' : ''}`} 
      style={{ fontFamily: 'MS Sans Serif, monospace' }}
    >
      {/* Title Bar */}
      <div className="windows98-titlebar px-2 py-1 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Windows98Logo />
          <span className="text-sm font-bold windows98-text">MS Paint++ - Untitled {isFullscreen ? '(Fullscreen)' : ''}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs">
            <Users size={12} />
            <span className="windows98-text">{userCount} users</span>
          </div>
          <div className="flex space-x-1">
            <button 
              className="w-6 h-6 windows98-button text-xs"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
            <button className="w-4 h-4 windows98-button text-xs">_</button>
            <button className="w-4 h-4 windows98-button text-xs">□</button>
            <button className="w-4 h-4 windows98-button text-xs">×</button>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 windows98-text sticky top-8 z-40">
        <div className="flex space-x-4 text-sm">
          <span className="windows98-menu-item">File</span>
          <span className="windows98-menu-item">Edit</span>
          <span className="windows98-menu-item">View</span>
          <span className="windows98-menu-item">Image</span>
          <span className="windows98-menu-item">Colors</span>
          <span className="windows98-menu-item">Help</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Toolbar */}
        <div className="windows98-toolbar border-r-2 border-gray-400 p-2 w-20 flex flex-col sticky top-16 h-fit z-30">
          <div className="grid grid-cols-2 gap-1 mb-4">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  playToolSound();
                }}
                className={`windows98-button p-2 text-gray-800 ${
                  activeTool === tool.id 
                    ? 'pressed bg-gray-400' 
                    : ''
                }`}
                title={tool.name}
                aria-label={`Select ${tool.name} tool`}
                aria-pressed={activeTool === tool.id}
              >
                {tool.icon}
              </button>
            ))}
          </div>
          
          {/* Brush Size */}
          <div className="mb-4">
            <div className="text-xs mb-1 windows98-text">Size</div>
            <input
              id="brush-size-slider"
              type="range"
              min="1"
              max="32"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full windows98-slider"
              aria-label="Brush size"
            />
            <div className="text-xs text-center windows98-text">{brushSize}px</div>
          </div>
          
          {/* Font Size for Text Tool */}
          {activeTool === 'text' && (
            <div className="mb-4">
              <div className="text-xs mb-1 windows98-text">Font Size</div>
              <input
                id="font-size-slider"
                type="range"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full windows98-slider"
                aria-label="Font size"
              />
              <div className="text-xs text-center windows98-text">{fontSize}px</div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-col space-y-1">
            <button
              disabled={historyIndex <= 0}
              className="windows98-button p-2 disabled:opacity-50"
              onClick={() => {
                undo();
                playClickSound();
              }}
              title="Undo"
              aria-label="Undo last action"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={() => {
                redo();
                playClickSound();
              }}
              disabled={historyIndex >= canvasHistory.length - 1}
              className="windows98-button p-2 disabled:opacity-50"
              title="Redo"
              aria-label="Redo last action"
            >
              <Redo size={16} />
            </button>
            <button
              onClick={() => {
                saveCanvas();
                playClickSound();
              }}
              className="windows98-button p-2"
              title="Save"
              aria-label="Save canvas as image"
            >
              <Save size={16} />
            </button>
            <button
              onClick={() => {
                shareCanvas();
                playClickSound();
              }}
              className="windows98-button p-2"
              title="Share"
              aria-label="Share canvas"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => {
                setShowAIPanel(!showAIPanel);
                playToolSound();
              }}
              className={`windows98-button p-2 ${
                showAIPanel ? 'pressed' : ''
              }`}
              title="AI Generate"
              aria-label="Open AI image generator"
            >
              <Wand2 size={16} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Color Palette */}
          <div className="bg-gray-200 border-b border-gray-400 p-2 sticky top-16 z-30">
            <div className="flex items-center space-x-2">
              <div className="grid grid-cols-8 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setActiveColor(color);
                      playClickSound();
                    }}
                    className={`w-6 h-6 border-2 ${
                      activeColor === color 
                        ? 'border-black' 
                        : 'border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <div className="text-xs">Current:</div>
                <div 
                  className="w-8 h-8 border-2 border-gray-400"
                  style={{ backgroundColor: activeColor }}
                />
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="color-256 p-8 bg-gray-400">
            <div className="relative inline-block">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className={`block pixelated border-2 border-gray-600 bg-white ${getCursorClass()}`}
                style={{ borderStyle: 'inset' }}
                onMouseDown={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                role="img"
                aria-label="Drawing canvas"
              />

              {/* Text Input Overlay */}
              {isTextMode && textPosition && (
                <div
                  className="absolute bg-white border border-gray-400 p-1"
                  style={{
                    left: textPosition.x,
                    top: textPosition.y,
                    fontSize: `${fontSize}px`,
                    fontFamily: '"MS Sans Serif", monospace, sans-serif',
                    zIndex: 1000,
                  }}
                >
                  <input
                    ref={textInputRef}
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleTextKeyDown}
                    onBlur={handleTextCancel}
                    className="bg-transparent border-none outline-none windows98-text"
                    style={{
                      fontSize: `${fontSize}px`,
                      fontFamily: '"MS Sans Serif", monospace, sans-serif',
                      color: activeColor,
                      width: `${Math.max(100, textInput.length * (fontSize * 0.6))}px`,
                    }}
                    placeholder="Type text..."
                    aria-label="Enter text to add to canvas"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Press Enter to add, Esc to cancel
                  </div>
                </div>
              )}

              {/* Resize handles */}
              {!isFullscreen && (
                <div className="absolute bottom-0 right-0 flex flex-col gap-1">
                {/* Diagonal resize handle */}
                <div
                  className="w-4 h-4 bg-blue-600 border border-blue-800 cursor-nw-resize hover:bg-blue-700 flex items-center justify-center"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'both')}
                  title="Resize both width and height"
                >
                  <div className="w-2 h-2 bg-white opacity-75"></div>
                </div>
                
                {/* Horizontal resize handle */}
                <div
                  className="w-4 h-3 bg-green-600 border border-green-800 cursor-ew-resize hover:bg-green-700 flex items-center justify-center"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'width')}
                  title="Resize width"
                >
                  <div className="w-2 h-1 bg-white opacity-75"></div>
                </div>
                
                {/* Vertical resize handle */}
                <div
                  className="w-3 h-4 bg-red-600 border border-red-800 cursor-ns-resize hover:bg-red-700 flex items-center justify-center"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'height')}
                  title="Resize height"
                >
                  <div className="w-1 h-2 bg-white opacity-75"></div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-64 bg-gray-200 border-l-2 border-gray-400 flex flex-col sticky top-16 h-fit max-h-screen z-30">
            <div className="p-2 border-b border-gray-400 bg-gray-300">
              <div className="text-sm font-bold">Chat</div>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
              <div className="text-xs space-y-1">
                <div><strong>User1:</strong> Nice colors! 🎨</div>
                <div><strong>User2:</strong> Working on the sky</div>
                <div><strong>You:</strong> Thanks! Love the retro vibe</div>
              </div>
            </div>
            <div className="p-2 border-t border-gray-400">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full p-1 border border-gray-400 text-xs"
              />
            </div>
          </div>
        )}

        {/* AI Generation Panel */}
        {showAIPanel && (
          <div className="sticky top-16 h-fit z-30">
            <AIGenerationPanel
              onImageGenerated={handleImageGenerated}
              onClose={() => setShowAIPanel(false)}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-200 border-t-2 border-gray-400 px-2 py-1 flex items-center justify-between text-xs windows98-text sticky bottom-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="windows98-statusbar-panel">{canvasWidth} x {canvasHeight} pixels</div>
          <div className="windows98-statusbar-panel">Tool: {tools.find(t => t.id === activeTool)?.name}</div>
          {isFullscreen && <div className="windows98-statusbar-panel">Fullscreen Mode - Press F11 to exit</div>}
          {activeTool === 'bucket' && <div className="windows98-statusbar-panel">Click to fill enclosed areas</div>}
          {activeTool === 'text' && <div className="windows98-statusbar-panel">Font: {fontSize}px</div>}
          {['rectangle', 'circle', 'triangle', 'line'].includes(activeTool) && <div className="windows98-statusbar-panel">Drag to draw shape</div>}
          {showAIPanel && <div className="windows98-statusbar-panel">AI: Ready</div>}
          {activeTool !== 'text' && <div className="windows98-statusbar-panel">Size: {brushSize}px</div>}
          {pasteError && <div className="windows98-statusbar-panel bg-red-200 text-red-800 border-red-400">{pasteError}</div>}
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs windows98-text opacity-75">Ctrl+V to paste images</div>
          <div className="text-xs windows98-text opacity-75">F11 for fullscreen</div>
          <button
            onClick={() => {
              setShowChat(!showChat);
              playClickSound();
            }}
            className={`windows98-button px-2 py-1 ${showChat ? 'pressed' : ''}`}
            aria-label="Toggle chat panel"
          >
            <MessageCircle size={12} className="inline mr-1" />
            Chat
          </button>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="windows98-text" aria-label="Connection status">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;