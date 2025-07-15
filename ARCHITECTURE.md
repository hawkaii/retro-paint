# Refactored Architecture Documentation

## Overview
The Retro Paint application has been refactored from a monolithic `App.tsx` file into a modular, maintainable architecture with clear separation of concerns.

## New File Structure

### 📁 Types (`src/types/`)
- **`canvas.ts`** - TypeScript interfaces and types for canvas-related data structures

### 📁 Utilities (`src/utils/`)
- **`drawingUtils.ts`** - Pure functions for drawing operations
  - `FloodFill` class for bucket fill functionality
  - `drawShape()` function for geometric shapes
  - `getCanvasPosition()` helper for mouse coordinate conversion

### 📁 Custom Hooks (`src/hooks/`)
- **`useCanvasState.ts`** - Canvas state management
  - Canvas dimensions, history, undo/redo
  - Canvas initialization and persistence
  - History management with localStorage integration

- **`useDrawingState.ts`** - Drawing tool state management
  - Active tool, colors, brush size
  - Drawing modes (brush, shapes, text)
  - State reset and utility functions

- **`useCanvasEvents.ts`** - Canvas event handling
  - Mouse event handlers (click, move, drag)
  - Drawing logic for different tools
  - WebSocket integration for real-time collaboration

### 📁 Components (`src/components/`)
- **`ToolPalette.tsx`** - Tool selection UI
- **`ColorPalette.tsx`** - Color selection UI  
- **`BrushSizeControl.tsx`** - Brush size slider
- **`DrawingCanvas.tsx`** - Main canvas component with event handlers

### 📁 Main App (`src/`)
- **`AppRefactored.tsx`** - Clean, modular main component
- **`App.tsx`** - Original monolithic version (kept for reference)

## Key Benefits

### 🔧 **Maintainability**
- **Single Responsibility**: Each module has one clear purpose
- **Easy to Debug**: Issues can be isolated to specific modules
- **Clear Dependencies**: Import/export structure shows relationships

### 🧪 **Testability**
- **Unit Testing**: Individual hooks and utilities can be tested in isolation
- **Mocking**: WebSocket and canvas dependencies can be easily mocked
- **Pure Functions**: Drawing utilities are side-effect free

### 🚀 **Reusability**
- **Custom Hooks**: Can be reused across different canvas components
- **Utility Functions**: Drawing functions can be used in other contexts
- **Component Library**: UI components can be reused or themed

### 📈 **Scalability**
- **Easy to Extend**: New tools can be added by extending existing patterns
- **Performance**: Granular re-rendering with focused state management
- **Code Splitting**: Components can be lazy-loaded if needed

## Architecture Patterns

### **Custom Hooks Pattern**
```typescript
// State management separated by concern
const canvasState = useCanvasState(640, 480);
const drawingState = useDrawingState();
const canvasEvents = useCanvasEvents({...});
```

### **Utility-First Design**
```typescript
// Pure functions for business logic
export const drawShape = (context, startX, startY, endX, endY, shapeType) => {
  // Drawing logic isolated from React components
};
```

### **Component Composition**
```tsx
// Modular UI components
<ToolPalette activeTool={tool} onToolChange={setTool} />
<ColorPalette activeColor={color} onColorChange={setColor} />
<DrawingCanvas {...canvasProps} />
```

## Migration Benefits

### **Before (Monolithic)**
- 1 file, 1500+ lines
- Mixed concerns (UI, state, business logic)
- Hard to test individual features
- Difficult to modify without side effects

### **After (Modular)**
- 10+ focused files, ~200 lines each
- Clear separation of concerns
- Easy unit testing
- Isolated feature development

## Usage

The refactored app maintains the same external API while being internally modular:

```bash
# Start backend
cd backend && go run main.go

# Start frontend (uses AppRefactored.tsx)
npm run dev
```

## Future Enhancements

With this modular structure, adding new features becomes straightforward:

1. **New Drawing Tools**: Extend `drawingUtils.ts` and `useDrawingState.ts`
2. **Advanced Canvas Features**: Add new hooks like `useCanvasLayers.ts`
3. **UI Themes**: Component-based architecture supports easy theming
4. **Performance Optimizations**: Selective re-rendering through focused hooks
5. **Testing Suite**: Each module can have comprehensive unit tests

The refactored architecture provides a solid foundation for future development while maintaining the existing functionality and real-time collaboration features.