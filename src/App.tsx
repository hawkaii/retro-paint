import React, { useState, useRef, useEffect } from 'react';
import { Paintbrush, Square, Circle, Type, PaintBucket as Bucket, Eraser, Undo, Redo, Save, Share2, Users, MessageCircle, Wand2 } from 'lucide-react';
import AIGenerationPanel from './components/AIGenerationPanel';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  cursor: string;
}

const tools: Tool[] = [
  { id: 'brush', name: 'Brush', icon: <Paintbrush size={16} />, cursor: 'crosshair' },
  { id: 'eraser', name: 'Eraser', icon: <Eraser size={16} />, cursor: 'crosshair' },
  { id: 'bucket', name: 'Bucket Fill', icon: <Bucket size={16} />, cursor: 'crosshair' },
  { id: 'rectangle', name: 'Rectangle', icon: <Square size={16} />, cursor: 'crosshair' },
  { id: 'circle', name: 'Circle', icon: <Circle size={16} />, cursor: 'crosshair' },
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connectedUsers] = useState(3);
  const [showChat, setShowChat] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
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
  }, []);

  const startDrawing = (e: React.MouseEvent) => {
    if (!contextRef.current) return;
    
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    contextRef.current.strokeStyle = activeColor;
    contextRef.current.lineWidth = brushSize;
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !contextRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'brush') {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    } else if (activeTool === 'eraser') {
      contextRef.current.clearRect(x - brushSize/2, y - brushSize/2, brushSize, brushSize);
    }
  };

  const stopDrawing = () => {
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

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      restoreCanvas(canvasHistory[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      restoreCanvas(canvasHistory[historyIndex + 1]);
    }
  };

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

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'mspaint-plus-plus.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareCanvas = () => {
    // Simulate sharing functionality
    const shareId = Math.random().toString(36).substring(2, 15);
    navigator.clipboard.writeText(`https://mspaint-plus-plus.com/share/${shareId}`);
    alert('🎨 Share link copied to clipboard!\n\nYour retro masterpiece is ready to share!');
  };

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
      
      // Clean up the object URL
      URL.revokeObjectURL(imageUrl);
    };
    
    img.onerror = () => {
      console.error('Failed to load generated image');
      URL.revokeObjectURL(imageUrl);
    };
    
    img.src = imageUrl;
  };

  const getCursorClass = () => {
    const tool = tools.find(t => t.id === activeTool);
    return tool ? `cursor-${tool.cursor === 'crosshair' ? 'crosshair' : tool.cursor}` : 'cursor-crosshair';
  };

  return (
    <div className="h-screen bg-gray-300 flex flex-col" style={{ fontFamily: 'MS Sans Serif, monospace' }}>
      {/* Title Bar */}
      <div className="bg-gray-200 border-b-2 border-gray-400 px-2 py-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
          <span className="text-sm font-bold">MS Paint++ - Untitled</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs">
            <Users size={12} />
            <span>{connectedUsers} users</span>
          </div>
          <div className="flex space-x-1">
            <button className="w-4 h-4 bg-gray-300 border border-gray-400 text-xs">_</button>
            <button className="w-4 h-4 bg-gray-300 border border-gray-400 text-xs">□</button>
            <button className="w-4 h-4 bg-gray-300 border border-gray-400 text-xs">×</button>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1">
        <div className="flex space-x-4 text-sm">
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">File</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">Edit</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">View</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">Image</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">Colors</span>
          <span className="hover:bg-gray-300 px-2 py-1 cursor-pointer">Help</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Toolbar */}
        <div className="bg-gray-200 border-r-2 border-gray-400 p-2 w-20 flex flex-col">
          <div className="grid grid-cols-2 gap-1 mb-4">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`p-2 border-2 text-gray-800 hover:bg-gray-300 ${
                  activeTool === tool.id 
                    ? 'border-gray-600 bg-gray-300' 
                    : 'border-gray-300 bg-gray-200'
                }`}
                title={tool.name}
              >
                {tool.icon}
              </button>
            ))}
          </div>
          
          {/* Brush Size */}
          <div className="mb-4">
            <div className="text-xs mb-1">Size</div>
            <input
              type="range"
              min="1"
              max="32"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-center">{brushSize}px</div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 border border-gray-400 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              title="Undo"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= canvasHistory.length - 1}
              className="p-2 border border-gray-400 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              title="Redo"
            >
              <Redo size={16} />
            </button>
            <button
              onClick={saveCanvas}
              className="p-2 border border-gray-400 bg-gray-200 hover:bg-gray-300"
              title="Save"
            >
              <Save size={16} />
            </button>
            <button
              onClick={shareCanvas}
              className="p-2 border border-gray-400 bg-gray-200 hover:bg-gray-300"
              title="Share"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`p-2 border border-gray-400 hover:bg-gray-300 ${
                showAIPanel ? 'bg-gray-300' : 'bg-gray-200'
              }`}
              title="AI Generate"
            >
              <Wand2 size={16} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Color Palette */}
          <div className="bg-gray-200 border-b border-gray-400 p-2">
            <div className="flex items-center space-x-2">
              <div className="grid grid-cols-8 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-6 h-6 border-2 ${
                      activeColor === color 
                        ? 'border-black' 
                        : 'border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
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
          <div className="flex-1 bg-gray-400 p-2 overflow-auto">
            <div className="bg-white border-2 border-gray-600 inline-block">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className={`block ${getCursorClass()}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-64 bg-gray-200 border-l-2 border-gray-400 flex flex-col">
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
          <AIGenerationPanel
            onImageGenerated={handleImageGenerated}
            onClose={() => setShowAIPanel(false)}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-200 border-t-2 border-gray-400 px-2 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span>800 x 600 pixels</span>
          <span>Tool: {tools.find(t => t.id === activeTool)?.name}</span>
          {showAIPanel && <span>AI: Ready</span>}
          <span>Size: {brushSize}px</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`px-2 py-1 border border-gray-400 ${showChat ? 'bg-gray-300' : 'bg-gray-200'} hover:bg-gray-300`}
          >
            <MessageCircle size={12} className="inline mr-1" />
            Chat
          </button>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;