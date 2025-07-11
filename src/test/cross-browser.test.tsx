import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Cross-Browser Compatibility Testing', () => {
  beforeEach(() => {
    // Reset user agent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
  });

  describe('Chrome Compatibility', () => {
    it('should work with Chrome user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      
      render(<App />);
      
      expect(screen.getByText('MS Paint++ - Untitled')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should handle Chrome-specific canvas features', () => {
      // Mock Chrome-specific features
      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        imageSmoothingEnabled: true,
        webkitImageSmoothingEnabled: true,
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: '',
        lineWidth: 1,
      }));
      
      render(<App />);
      
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Firefox Compatibility', () => {
    it('should work with Firefox user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      });
      
      render(<App />);
      
      expect(screen.getByText('MS Paint++ - Untitled')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should handle Firefox-specific canvas features', () => {
      // Mock Firefox-specific features
      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        imageSmoothingEnabled: true,
        mozImageSmoothingEnabled: true,
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: '',
        lineWidth: 1,
      }));
      
      render(<App />);
      
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Safari Compatibility', () => {
    it('should work with Safari user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      });
      
      render(<App />);
      
      expect(screen.getByText('MS Paint++ - Untitled')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should handle Safari-specific clipboard limitations', () => {
      // Mock Safari clipboard behavior
      Object.assign(navigator, {
        clipboard: undefined, // Safari might not support clipboard API
      });
      
      render(<App />);
      
      // Should still render without clipboard support
      expect(screen.getByTitle('Share')).toBeInTheDocument();
    });
  });

  describe('Edge Compatibility', () => {
    it('should work with Edge user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      });
      
      render(<App />);
      
      expect(screen.getByText('MS Paint++ - Untitled')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Feature Detection', () => {
    it('should handle missing WebSocket support', () => {
      // Mock missing WebSocket
      const originalWebSocket = window.WebSocket;
      delete (window as any).WebSocket;
      
      render(<App />);
      
      // Should render without WebSocket support
      expect(screen.getByText('MS Paint++ - Untitled')).toBeInTheDocument();
      
      // Restore WebSocket
      window.WebSocket = originalWebSocket;
    });

    it('should handle missing Canvas support', () => {
      // Mock missing canvas support
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
      
      render(<App />);
      
      // Should handle missing canvas gracefully
      expect(screen.getByText('MS Paint++ - Untitled')).toBeInTheDocument();
    });

    it('should handle missing localStorage', () => {
      // Mock missing localStorage
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;
      
      render(<App />);
      
      // Should work without localStorage
      expect(screen.getByText('MS Paint++ - Untitled')).toBeInTheDocument();
      
      // Restore localStorage
      window.localStorage = originalLocalStorage;
    });
  });

  describe('Touch Device Support', () => {
    it('should handle touch events', () => {
      // Mock touch support
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5,
      });
      
      render(<App />);
      
      const canvas = screen.getByRole('img', { hidden: true });
      
      // Should render canvas for touch devices
      expect(canvas).toBeInTheDocument();
    });
  });
});