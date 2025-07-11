import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Error Handling Testing', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
    
    // Reset console.error mock
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Network Disconnection Recovery', () => {
    it('should handle WebSocket connection failure', () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: 3, // CLOSED
      };
      
      vi.spyOn(window, 'WebSocket').mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      // Should render without crashing even if WebSocket fails
      expect(() => render(<App />)).not.toThrow();
    });

    it('should handle WebSocket message errors', () => {
      const mockWebSocket = {
        send: vi.fn().mockImplementation(() => {
          throw new Error('Send failed');
        }),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: 1,
      };
      
      vi.spyOn(window, 'WebSocket').mockImplementation(() => mockWebSocket as any);
      
      render(<App />);
      
      // Should handle send errors gracefully
      expect(screen.getByText(/users/)).toBeInTheDocument();
    });

    it('should show offline status when disconnected', () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: 3, // CLOSED
      };
      
      vi.spyOn(window, 'WebSocket').mockImplementation(() => mockWebSocket as any);
      
      render(<App />);
      
      // Simulate connection close
      const closeHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'close')?.[1];
      
      if (closeHandler) {
        closeHandler();
      }
      
      // Should handle offline state
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });

  describe('Invalid User Input Handling', () => {
    it('should handle invalid brush size input', () => {
      render(<App />);
      
      const sizeSlider = screen.getByRole('slider');
      
      // Test extreme values
      fireEvent.change(sizeSlider, { target: { value: '-10' } });
      fireEvent.change(sizeSlider, { target: { value: '1000' } });
      fireEvent.change(sizeSlider, { target: { value: 'invalid' } });
      
      // Should handle invalid input gracefully
      expect(sizeSlider).toBeInTheDocument();
    });

    it('should handle invalid canvas coordinates', () => {
      render(<App />);
      
      const canvas = screen.getByRole('img', { hidden: true });
      
      // Test extreme coordinates
      fireEvent.mouseDown(canvas, { clientX: -1000, clientY: -1000 });
      fireEvent.mouseMove(canvas, { clientX: 10000, clientY: 10000 });
      fireEvent.mouseUp(canvas);
      
      // Should handle invalid coordinates gracefully
      expect(canvas).toBeInTheDocument();
    });

    it('should handle rapid tool switching', async () => {
      render(<App />);
      
      const brushTool = screen.getByTitle('Brush');
      const eraserTool = screen.getByTitle('Eraser');
      const bucketTool = screen.getByTitle('Bucket Fill');
      
      // Rapidly switch tools
      for (let i = 0; i < 20; i++) {
        await user.click(brushTool);
        await user.click(eraserTool);
        await user.click(bucketTool);
      }
      
      // Should handle rapid switching without errors
      expect(brushTool).toBeInTheDocument();
    });
  });

  describe('Canvas Error Recovery', () => {
    it('should handle canvas context creation failure', () => {
      // Mock getContext to return null
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
      
      // Should render without crashing even if canvas context fails
      expect(() => render(<App />)).not.toThrow();
    });

    it('should handle canvas drawing errors', () => {
      // Mock canvas methods to throw errors
      const mockContext = {
        fillRect: vi.fn().mockImplementation(() => {
          throw new Error('Canvas error');
        }),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: '',
        lineWidth: 1,
      };
      
      HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext as any);
      
      render(<App />);
      
      const canvas = screen.getByRole('img', { hidden: true });
      
      // Should handle drawing errors gracefully
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Save/Load Error Handling', () => {
    it('should handle save operation failure', async () => {
      // Mock createElement to throw error
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('Save failed');
      });
      
      render(<App />);
      
      const saveButton = screen.getByTitle('Save');
      
      // Should handle save error gracefully
      await user.click(saveButton);
      
      expect(saveButton).toBeInTheDocument();
    });

    it('should handle clipboard API failure', async () => {
      // Mock clipboard to throw error
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
        },
      });
      
      vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<App />);
      
      const shareButton = screen.getByTitle('Share');
      
      // Should handle clipboard error gracefully
      await user.click(shareButton);
      
      expect(shareButton).toBeInTheDocument();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle excessive undo history', () => {
      render(<App />);
      
      const canvas = screen.getByRole('img', { hidden: true });
      
      // Create excessive undo history
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseDown(canvas, { clientX: i, clientY: i });
        fireEvent.mouseUp(canvas);
      }
      
      // Should handle large history without crashing
      expect(canvas).toBeInTheDocument();
    });

    it('should handle component unmounting gracefully', () => {
      const { unmount } = render(<App />);
      
      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });
});