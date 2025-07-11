import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Move } from 'lucide-react';

interface ScrollableCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasWidth: number;
  canvasHeight: number;
  onCanvasResize: (width: number, height: number) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  className?: string;
}

const ScrollableCanvas: React.FC<ScrollableCanvasProps> = ({
  canvasRef,
  canvasWidth,
  canvasHeight,
  onCanvasResize,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState<'horizontal' | 'vertical' | null>(null);
  const [isResizing, setIsResizing] = useState<'width' | 'height' | 'both' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });

  const containerWidth = 600; // Visible area width
  const containerHeight = 400; // Visible area height
  const scrollbarSize = 16;

  const maxScrollX = Math.max(0, canvasWidth - containerWidth);
  const maxScrollY = Math.max(0, canvasHeight - containerHeight);

  const showHorizontalScrollbar = canvasWidth > containerWidth;
  const showVerticalScrollbar = canvasHeight > containerHeight;

  // Handle mouse wheel scrolling
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
    const deltaY = e.shiftKey ? 0 : e.deltaY;

    setScrollX(prev => Math.max(0, Math.min(maxScrollX, prev + deltaX)));
    setScrollY(prev => Math.max(0, Math.min(maxScrollY, prev + deltaY)));
  }, [maxScrollX, maxScrollY]);

  // Handle scrollbar dragging
  const handleScrollbarMouseDown = (e: React.MouseEvent, direction: 'horizontal' | 'vertical') => {
    e.preventDefault();
    setIsDraggingScrollbar(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle resize controls
  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'width' | 'height' | 'both') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: canvasWidth, height: canvasHeight });
  };

  // Handle scrollbar track clicks
  const handleScrollbarTrackClick = (e: React.MouseEvent, direction: 'horizontal' | 'vertical') => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (direction === 'horizontal') {
      const clickX = e.clientX - rect.left;
      const trackWidth = rect.width - scrollbarSize * 2;
      const thumbWidth = Math.max(20, (containerWidth / canvasWidth) * trackWidth);
      const newScrollX = ((clickX - scrollbarSize - thumbWidth / 2) / (trackWidth - thumbWidth)) * maxScrollX;
      setScrollX(Math.max(0, Math.min(maxScrollX, newScrollX)));
    } else {
      const clickY = e.clientY - rect.top;
      const trackHeight = rect.height - scrollbarSize * 2;
      const thumbHeight = Math.max(20, (containerHeight / canvasHeight) * trackHeight);
      const newScrollY = ((clickY - scrollbarSize - thumbHeight / 2) / (trackHeight - thumbHeight)) * maxScrollY;
      setScrollY(Math.max(0, Math.min(maxScrollY, newScrollY)));
    }
  };

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingScrollbar === 'horizontal') {
        const deltaX = e.clientX - dragStart.x;
        const trackWidth = containerWidth - scrollbarSize * 2;
        const thumbWidth = Math.max(20, (containerWidth / canvasWidth) * trackWidth);
        const scrollDelta = (deltaX / (trackWidth - thumbWidth)) * maxScrollX;
        setScrollX(prev => Math.max(0, Math.min(maxScrollX, prev + scrollDelta)));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isDraggingScrollbar === 'vertical') {
        const deltaY = e.clientY - dragStart.y;
        const trackHeight = containerHeight - scrollbarSize * 2;
        const thumbHeight = Math.max(20, (containerHeight / canvasHeight) * trackHeight);
        const scrollDelta = (deltaY / (trackHeight - thumbHeight)) * maxScrollY;
        setScrollY(prev => Math.max(0, Math.min(maxScrollY, prev + scrollDelta)));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        let newWidth = initialSize.width;
        let newHeight = initialSize.height;

        if (isResizing === 'width' || isResizing === 'both') {
          newWidth = Math.max(200, Math.min(2000, initialSize.width + deltaX));
        }
        if (isResizing === 'height' || isResizing === 'both') {
          newHeight = Math.max(200, Math.min(2000, initialSize.height + deltaY));
        }

        onCanvasResize(newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingScrollbar(null);
      setIsResizing(null);
    };

    if (isDraggingScrollbar || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingScrollbar, isResizing, dragStart, maxScrollX, maxScrollY, initialSize, canvasWidth, canvasHeight, onCanvasResize]);

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Calculate scrollbar positions and sizes
  const horizontalThumbWidth = Math.max(20, (containerWidth / canvasWidth) * (containerWidth - scrollbarSize * 2));
  const horizontalThumbLeft = scrollbarSize + (scrollX / maxScrollX) * (containerWidth - scrollbarSize * 2 - horizontalThumbWidth);

  const verticalThumbHeight = Math.max(20, (containerHeight / canvasHeight) * (containerHeight - scrollbarSize * 2));
  const verticalThumbTop = scrollbarSize + (scrollY / maxScrollY) * (containerHeight - scrollbarSize * 2 - verticalThumbHeight);

  return (
    <div className="relative bg-gray-400 p-2">
      {/* Main canvas container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-white border-2 border-gray-400"
        style={{
          width: containerWidth,
          height: containerHeight,
          borderStyle: 'inset'
        }}
      >
        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          className="relative"
          style={{
            transform: `translate(-${scrollX}px, -${scrollY}px)`,
            width: canvasWidth,
            height: canvasHeight
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className={`block pixelated ${className}`}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            style={{ cursor: 'crosshair' }}
          />

          {/* Resize handles */}
          <div className="absolute bottom-0 right-0 flex flex-col">
            {/* Diagonal resize handle */}
            <div
              className="w-4 h-4 bg-blue-600 border border-blue-800 cursor-nw-resize hover:bg-blue-700 flex items-center justify-center"
              onMouseDown={(e) => handleResizeMouseDown(e, 'both')}
              title="Resize both width and height"
            >
              <Move size={8} className="text-white" />
            </div>
            
            {/* Horizontal resize handle */}
            <div
              className="w-4 h-3 bg-green-600 border border-green-800 cursor-ew-resize hover:bg-green-700 flex items-center justify-center mt-1"
              onMouseDown={(e) => handleResizeMouseDown(e, 'width')}
              title="Resize width"
            >
              <ChevronLeft size={6} className="text-white" />
              <ChevronRight size={6} className="text-white" />
            </div>
            
            {/* Vertical resize handle */}
            <div
              className="w-3 h-4 bg-red-600 border border-red-800 cursor-ns-resize hover:bg-red-700 flex items-center justify-center mt-1"
              onMouseDown={(e) => handleResizeMouseDown(e, 'height')}
              title="Resize height"
            >
              <div className="flex flex-col">
                <ChevronUp size={6} className="text-white" />
                <ChevronDown size={6} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal scrollbar */}
      {showHorizontalScrollbar && (
        <div
          className="absolute bottom-0 left-2 bg-gray-300 border border-gray-500"
          style={{
            width: containerWidth,
            height: scrollbarSize,
            borderStyle: 'inset'
          }}
          onClick={(e) => handleScrollbarTrackClick(e, 'horizontal')}
        >
          {/* Left arrow */}
          <button
            className="absolute left-0 top-0 w-4 h-4 bg-gray-300 border border-gray-500 hover:bg-gray-400 flex items-center justify-center"
            style={{ borderStyle: 'outset' }}
            onClick={(e) => {
              e.stopPropagation();
              setScrollX(prev => Math.max(0, prev - 20));
            }}
          >
            <ChevronLeft size={8} />
          </button>

          {/* Right arrow */}
          <button
            className="absolute right-0 top-0 w-4 h-4 bg-gray-300 border border-gray-500 hover:bg-gray-400 flex items-center justify-center"
            style={{ borderStyle: 'outset' }}
            onClick={(e) => {
              e.stopPropagation();
              setScrollX(prev => Math.min(maxScrollX, prev + 20));
            }}
          >
            <ChevronRight size={8} />
          </button>

          {/* Thumb */}
          <div
            className="absolute top-0 bg-gray-300 border border-gray-500 cursor-pointer hover:bg-gray-400"
            style={{
              left: horizontalThumbLeft,
              width: horizontalThumbWidth,
              height: scrollbarSize,
              borderStyle: 'outset'
            }}
            onMouseDown={(e) => handleScrollbarMouseDown(e, 'horizontal')}
          />
        </div>
      )}

      {/* Vertical scrollbar */}
      {showVerticalScrollbar && (
        <div
          className="absolute top-2 right-0 bg-gray-300 border border-gray-500"
          style={{
            width: scrollbarSize,
            height: containerHeight,
            borderStyle: 'inset'
          }}
          onClick={(e) => handleScrollbarTrackClick(e, 'vertical')}
        >
          {/* Up arrow */}
          <button
            className="absolute left-0 top-0 w-4 h-4 bg-gray-300 border border-gray-500 hover:bg-gray-400 flex items-center justify-center"
            style={{ borderStyle: 'outset' }}
            onClick={(e) => {
              e.stopPropagation();
              setScrollY(prev => Math.max(0, prev - 20));
            }}
          >
            <ChevronUp size={8} />
          </button>

          {/* Down arrow */}
          <button
            className="absolute left-0 bottom-0 w-4 h-4 bg-gray-300 border border-gray-500 hover:bg-gray-400 flex items-center justify-center"
            style={{ borderStyle: 'outset' }}
            onClick={(e) => {
              e.stopPropagation();
              setScrollY(prev => Math.min(maxScrollY, prev + 20));
            }}
          >
            <ChevronDown size={8} />
          </button>

          {/* Thumb */}
          <div
            className="absolute left-0 bg-gray-300 border border-gray-500 cursor-pointer hover:bg-gray-400"
            style={{
              top: verticalThumbTop,
              width: scrollbarSize,
              height: verticalThumbHeight,
              borderStyle: 'outset'
            }}
            onMouseDown={(e) => handleScrollbarMouseDown(e, 'vertical')}
          />
        </div>
      )}

      {/* Corner piece when both scrollbars are visible */}
      {showHorizontalScrollbar && showVerticalScrollbar && (
        <div
          className="absolute bottom-0 right-0 bg-gray-300 border border-gray-500"
          style={{
            width: scrollbarSize,
            height: scrollbarSize,
            borderStyle: 'inset'
          }}
        />
      )}
    </div>
  );
};

export default ScrollableCanvas;