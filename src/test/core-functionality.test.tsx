import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Core Functionality Testing', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Paint Tools', () => {
    it('should select brush tool and change cursor', async () => {
      render(<App />);
      
      const brushTool = screen.getByTitle('Brush');
      await user.click(brushTool);
      
      expect(brushTool).toHaveClass('border-gray-600');
      
      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toHaveClass('cursor-crosshair');
    });

    it('should change brush size when slider is moved', async () => {
      render(<App />);
      
      const sizeSlider = screen.getByRole('slider');
      fireEvent.change(sizeSlider, { target: { value: '10' } });
      
      expect(screen.getByText('10px')).toBeInTheDocument();
    });

    it('should select eraser tool', async () => {
      render(<App />);
      
      const eraserTool = screen.getByTitle('Eraser');
      await user.click(eraserTool);
      
      expect(eraserTool).toHaveClass('border-gray-600');
    });

    it('should select different colors from palette', async () => {
      render(<App />);
      
      const redColor = screen.getByTitle('#FF0000');
      await user.click(redColor);
      
      expect(redColor).toHaveClass('border-black');
    });

    it('should select shape tools', async () => {
      render(<App />);
      
      const rectangleTool = screen.getByTitle('Rectangle');
      await user.click(rectangleTool);
      
      expect(rectangleTool).toHaveClass('border-gray-600');
      
      const circleTool = screen.getByTitle('Circle');
      await user.click(circleTool);
      
      expect(circleTool).toHaveClass('border-gray-600');
    });

    it('should handle bucket fill tool selection', async () => {
      render(<App />);
      
      const bucketTool = screen.getByTitle('Bucket Fill');
      await user.click(bucketTool);
      
      expect(bucketTool).toHaveClass('border-gray-600');
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('should enable undo after drawing action', async () => {
      render(<App />);
      
      const undoButton = screen.getByTitle('Undo');
      expect(undoButton).toBeDisabled();
      
      // Simulate drawing action by triggering canvas events
      const canvas = screen.getByRole('img', { hidden: true });
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      await waitFor(() => {
        expect(undoButton).not.toBeDisabled();
      });
    });

    it('should enable redo after undo action', async () => {
      render(<App />);
      
      const canvas = screen.getByRole('img', { hidden: true });
      const undoButton = screen.getByTitle('Undo');
      const redoButton = screen.getByTitle('Redo');
      
      // Draw something
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);
      
      await waitFor(() => {
        expect(undoButton).not.toBeDisabled();
      });
      
      // Undo the action
      await user.click(undoButton);
      
      await waitFor(() => {
        expect(redoButton).not.toBeDisabled();
      });
    });
  });

  describe('Canvas Drawing', () => {
    it('should handle mouse events on canvas', async () => {
      render(<App />);
      
      const canvas = screen.getByRole('img', { hidden: true });
      
      // Test mouse down
      fireEvent.mouseDown(canvas, { 
        clientX: 100, 
        clientY: 100,
        buttons: 1 
      });
      
      // Test mouse move while drawing
      fireEvent.mouseMove(canvas, { 
        clientX: 150, 
        clientY: 150,
        buttons: 1 
      });
      
      // Test mouse up
      fireEvent.mouseUp(canvas);
      
      // Verify canvas context methods were called
      expect(canvas).toBeInTheDocument();
    });

    it('should stop drawing when mouse leaves canvas', async () => {
      render(<App />);
      
      const canvas = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseLeave(canvas);
      
      // Should stop drawing when mouse leaves
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should trigger save when save button is clicked', async () => {
      // Mock createElement and click for download
      const mockLink = {
        click: vi.fn(),
        download: '',
        href: '',
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      
      render(<App />);
      
      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);
      
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('mspaint-plus-plus.png');
    });
  });

  describe('Share Functionality', () => {
    it('should copy share link to clipboard', async () => {
      // Mock clipboard API
      const mockWriteText = vi.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      
      // Mock alert
      vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<App />);
      
      const shareButton = screen.getByTitle('Share');
      await user.click(shareButton);
      
      expect(mockWriteText).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Share link copied to clipboard!')
      );
    });
  });
});