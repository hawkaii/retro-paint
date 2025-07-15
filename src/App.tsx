import React, { useState, useRef, useEffect } from 'react';
import { 
  Undo, 
  Redo, 
  Users, 
  Wand2,
  Settings,
  Save
} from 'lucide-react';

// Components
import AIGenerationPanel from './components/AIGenerationPanel';
import Windows98Logo from './components/Windows98Logo';
import { ToolPalette } from './components/ToolPalette';
import { ColorPalette } from './components/ColorPalette';
import { BrushSizeControl } from './components/BrushSizeControl';
import { DrawingCanvas } from './components/DrawingCanvas';

// Hooks
import { useWebSocket, DrawingEvent, CanvasStateUpdate } from './hooks/useWebSocket';
import { useCanvasState } from './hooks/useCanvasState';
import { useDrawingState } from './hooks/useDrawingState';
import { useCanvasEvents } from './hooks/useCanvasEvents';
import { usePaste } from './hooks/usePaste';

// Utils
import { retroSoundEngine, playClickSound, playActionSound } from './utils/soundEffects';
import { persistenceManager } from './utils/persistence';
import { drawShape } from './utils/drawingUtils';

import './styles/windows98.css';

function App() {
  // UI State
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showRoomManager, setShowRoomManager] = useState(false);
  const [pasteError, setPasteError] = useState<string>('');

  // Refs
  const textInputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const canvasState = useCanvasState(640, 480);
  const drawingState = useDrawingState();
  
  // WebSocket connection
  const {
    sendDrawingEvent,
    sendPresenceUpdate,
    isConnected,
    userCount,
    currentRoom,
    users,
    userId,
    onDrawingEvent,
    onCanvasState,
    onUserListUpdate,
  } = useWebSocket('ws://localhost:8080/ws');

  // Canvas event handlers
  const canvasEvents = useCanvasEvents({
    drawingState,
    canvasState,
    sendDrawingEvent,
    isConnected,
    textInputRef
  });

  // Paste functionality
  usePaste({
    canvasRef: canvasState.canvasRef,
    contextRef: canvasState.contextRef,
    saveToHistory: canvasState.saveToHistory,
    onPasteError: setPasteError
  });

  // Initialize sound system
  useEffect(() => {
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
    };
  }, []);

  // Initialize canvas
  useEffect(() => {
    canvasState.initializeCanvas();
  }, [canvasState.canvasWidth, canvasState.canvasHeight, canvasState.canvasInitialized]);

  // Handle incoming drawing events from other users
  useEffect(() => {
    onDrawingEvent((event: DrawingEvent) => {
      applyRemoteDrawingEvent(event);
    });

    onCanvasState((canvasStateUpdate: CanvasStateUpdate) => {
      if (canvasStateUpdate.canvas.imageData) {
        console.log('Received canvas state from server');
        
        const localCanvas = persistenceManager.loadCanvas();
        const serverUpdated = canvasStateUpdate.canvas.lastUpdated || 0;
        const localUpdated = localCanvas?.lastUpdated || 0;
        
        if (serverUpdated > localUpdated || !localCanvas?.imageData) {
          console.log('Using server canvas state (newer or no local state)');
          canvasState.restoreCanvasFromDataURL(canvasStateUpdate.canvas.imageData);
          canvasState.setCanvasHistory(canvasStateUpdate.canvas.history || []);
          canvasState.setHistoryIndex(canvasStateUpdate.canvas.historyIndex || 0);
          
          persistenceManager.saveCanvas(
            canvasStateUpdate.canvas.imageData,
            canvasStateUpdate.canvas.history || [],
            canvasStateUpdate.canvas.historyIndex || 0
          );
        }
      }
    });

    onUserListUpdate((userList) => {
      console.log('User list updated:', userList.users);
    });
  }, [onDrawingEvent, onCanvasState, onUserListUpdate]);

  // Apply remote drawing events
  const applyRemoteDrawingEvent = (event: DrawingEvent) => {
    const canvas = canvasState.canvasRef.current;
    const context = canvasState.contextRef.current;
    if (!canvas || !context) return;

    const { drawingType, payload } = event;

    switch (drawingType) {
      case 'brush':
        if (payload.coordinates) {
          context.strokeStyle = payload.color || '#000000';
          context.lineWidth = payload.size || 2;
          context.beginPath();
          payload.coordinates.forEach((point: any, index: number) => {
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
        // Implement bucket fill for remote events
        break;

      case 'rectangle':
      case 'circle':
      case 'triangle':
      case 'line':
        if (payload.x !== undefined && payload.y !== undefined && 
            payload.endX !== undefined && payload.endY !== undefined) {
          drawShape(context, payload.x, payload.y, payload.endX, payload.endY, drawingType, payload.color || '#000000', payload.size || 2);
        }
        break;
    }
  };

  // Handle mouse move for presence updates
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasState.canvasRef.current?.getBoundingClientRect();
    if (rect && isConnected) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      sendPresenceUpdate(x, y, drawingState.activeColor, drawingState.activeTool);
    }
    
    canvasEvents.draw(e);
  };

  // Save canvas function
  const saveCanvas = () => {
    const canvas = canvasState.canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'retro-paint-artwork.png';
    link.href = canvas.toDataURL();
    link.click();
    
    // Play success sound for save
    playActionSound();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              canvasState.redo();
            } else {
              canvasState.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            canvasState.redo();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [canvasState.undo, canvasState.redo]);

  return (
    <div className="windows98-container">
      {/* Title Bar */}
      <div className="windows98-title-bar">
        <div className="flex items-center space-x-2">
          <Windows98Logo />
          <span className="windows98-text font-bold">Retro Paint</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Users size={12} />
            <span className="windows98-text">{userCount} users</span>
            <span className={`windows98-text mx-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
            {currentRoom && (
              <>
                <span className="windows98-text mx-1">•</span>
                <span className="windows98-text">Room: {currentRoom}</span>
              </>
            )}
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
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar */}
        <div className="flex flex-col space-y-2 p-2 bg-gray-200 border-r border-gray-400 w-64">
          {/* Tool Palette */}
          <ToolPalette
            activeTool={drawingState.activeTool}
            onToolChange={drawingState.setActiveTool}
          />

          {/* Color Palette */}
          <ColorPalette
            activeColor={drawingState.activeColor}
            onColorChange={drawingState.setActiveColor}
          />

          {/* Brush Size Control */}
          <BrushSizeControl
            brushSize={drawingState.brushSize}
            onBrushSizeChange={drawingState.setBrushSize}
          />

          {/* Action Buttons */}
          <div className="windows98-panel p-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  playActionSound();
                  canvasState.undo();
                }}
                className="windows98-button p-2"
                disabled={canvasState.historyIndex <= 0}
                title="Undo (Ctrl+Z)"
              >
                <Undo size={16} />
              </button>
              <button
                onClick={() => {
                  playActionSound();
                  canvasState.redo();
                }}
                className="windows98-button p-2"
                disabled={canvasState.historyIndex >= canvasState.canvasHistory.length - 1}
                title="Redo (Ctrl+Y)"
              >
                <Redo size={16} />
              </button>
            </div>
            
            <button
              onClick={() => {
                playClickSound();
                saveCanvas();
              }}
              className="windows98-button w-full p-2 flex items-center justify-center space-x-2"
              title="Save canvas as image"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
            
            <button
              onClick={() => {
                playClickSound();
                setShowRoomManager(!showRoomManager);
              }}
              className="windows98-button w-full p-2 flex items-center justify-center space-x-2"
            >
              <Settings size={16} />
              <span>Rooms</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setShowAIPanel(!showAIPanel);
              }}
              className="windows98-button w-full p-2 flex items-center justify-center space-x-2"
            >
              <Wand2 size={16} />
              <span>AI Generate</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-300 p-4">
          <div className="windows98-panel p-4 flex-1 overflow-auto">
            <DrawingCanvas
              canvasRef={canvasState.canvasRef}
              canvasWidth={canvasState.canvasWidth}
              canvasHeight={canvasState.canvasHeight}
              activeTool={drawingState.activeTool}
              onMouseDown={canvasEvents.handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={canvasEvents.stopDrawing}
              users={users}
              userId={userId}
            />

            {/* Text Input Overlay */}
            {drawingState.isTextMode && drawingState.textPosition && (
              <div
                className="absolute bg-white border border-gray-400 p-1"
                style={{
                  left: drawingState.textPosition.x,
                  top: drawingState.textPosition.y,
                  fontSize: `${drawingState.fontSize}px`,
                }}
              >
                <input
                  ref={textInputRef}
                  type="text"
                  value={drawingState.textInput}
                  onChange={(e) => drawingState.setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Handle text placement
                      const context = canvasState.contextRef.current;
                      if (context && drawingState.textPosition) {
                        context.font = `${drawingState.fontSize}px "MS Sans Serif", monospace, sans-serif`;
                        context.fillStyle = drawingState.activeColor;
                        context.fillText(
                          drawingState.textInput, 
                          drawingState.textPosition.x, 
                          drawingState.textPosition.y + drawingState.fontSize
                        );
                        canvasState.saveToHistory();
                      }
                      drawingState.setIsTextMode(false);
                      drawingState.setTextInput('');
                      drawingState.setTextPosition(null);
                    } else if (e.key === 'Escape') {
                      drawingState.setIsTextMode(false);
                      drawingState.setTextInput('');
                      drawingState.setTextPosition(null);
                    }
                  }}
                  className="bg-transparent border-none outline-none"
                  autoFocus
                />
              </div>
            )}
          </div>
          
          {/* Status Bar */}
          <div className="bg-gray-200 border-t border-gray-400 p-1 flex items-center justify-between windows98-text text-xs">
            <div className="flex items-center space-x-2">
              {pasteError && (
                <div className="windows98-statusbar-panel bg-red-200 text-red-800 border-red-400">
                  {pasteError}
                </div>
              )}
            </div>
            <div className="windows98-text opacity-75">Ctrl+V to paste images</div>
          </div>
        </div>
      </div>

      {/* Modal Overlays */}
      {showAIPanel && (
        <div className="fixed top-0 right-0 h-full z-50">
          <AIGenerationPanel
            onClose={() => setShowAIPanel(false)}
            onImageGenerated={(imageData) => {
              // Handle AI generated image
              canvasState.restoreCanvasFromDataURL(imageData);
              canvasState.saveToHistory();
              setShowAIPanel(false);
            }}
          />
        </div>
      )}

      {showRoomManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="windows98-panel p-4 max-w-md">
            <h3 className="windows98-text font-bold mb-2">Room Manager</h3>
            <p className="windows98-text mb-4">
              Currently in room: {currentRoom}
            </p>
            <p className="windows98-text mb-4">
              Connected users: {userCount}
            </p>
            <button
              onClick={() => setShowRoomManager(false)}
              className="windows98-button px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {pasteError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="windows98-panel p-4 max-w-md">
            <h3 className="windows98-text font-bold mb-2">Paste Error</h3>
            <p className="windows98-text mb-4">{pasteError}</p>
            <button
              onClick={() => setPasteError('')}
              className="windows98-button px-4 py-2"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;