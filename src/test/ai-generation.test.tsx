import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIGenerationPanel from '../components/AIGenerationPanel';

// Mock fetch for Pollinations.ai API
global.fetch = vi.fn();
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

describe('AI Image Generation Testing', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockOnImageGenerated: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    user = userEvent.setup();
    mockOnImageGenerated = vi.fn();
    mockOnClose = vi.fn();
    
    // Reset fetch mock
    vi.clearAllMocks();
  });

  describe('UI Components', () => {
    it('should render AI generation panel with all controls', () => {
      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      expect(screen.getByText('AI Image Generator')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('A beautiful sunset over mountains...')).toBeInTheDocument();
      expect(screen.getByText('Generate Image')).toBeInTheDocument();
      expect(screen.getByText('Show Advanced Options')).toBeInTheDocument();
    });

    it('should allow prompt input', async () => {
      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      await user.type(promptInput, 'A cute cat playing with yarn');
      
      expect(promptInput).toHaveValue('A cute cat playing with yarn');
    });

    it('should allow size selection from presets', async () => {
      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const preset1024 = screen.getByText('1024x1024');
      await user.click(preset1024);
      
      expect(preset1024).toHaveClass('border-gray-600');
    });

    it('should show advanced options when toggled', async () => {
      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const advancedToggle = screen.getByText('Show Advanced Options');
      await user.click(advancedToggle);
      
      expect(screen.getByText('Art Style:')).toBeInTheDocument();
      expect(screen.getByText('Color Palette:')).toBeInTheDocument();
      expect(screen.getByText('Detail Level:')).toBeInTheDocument();
    });
  });

  describe('Image Generation Process', () => {
    it('should generate image with basic prompt', async () => {
      // Mock successful API response
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      const generateButton = screen.getByText('Generate Image');
      
      await user.type(promptInput, 'A red apple');
      await user.click(generateButton);
      
      // Should show loading state
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      
      // Wait for generation to complete
      await waitFor(() => {
        expect(mockOnImageGenerated).toHaveBeenCalledWith('mock-object-url');
      });
    });

    it('should build enhanced prompt with style options', async () => {
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      // Enter prompt
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      await user.type(promptInput, 'A dog');
      
      // Show advanced options
      const advancedToggle = screen.getByText('Show Advanced Options');
      await user.click(advancedToggle);
      
      // Select style options
      const artStyleSelect = screen.getByDisplayValue('Default');
      await user.selectOptions(artStyleSelect, 'cartoon');
      
      const generateButton = screen.getByText('Generate Image');
      await user.click(generateButton);
      
      // Verify fetch was called with enhanced prompt
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('A%20dog%2C%20cartoon%20style')
        );
      });
    });

    it('should handle custom dimensions', async () => {
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      await user.type(promptInput, 'A tree');
      
      // Set custom dimensions
      const widthInput = screen.getByDisplayValue('512');
      const heightInput = screen.getByDisplayValue('512');
      
      await user.clear(widthInput);
      await user.type(widthInput, '768');
      await user.clear(heightInput);
      await user.type(heightInput, '1024');
      
      const generateButton = screen.getByText('Generate Image');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('width=768&height=1024')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error for empty prompt', async () => {
      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const generateButton = screen.getByText('Generate Image');
      await user.click(generateButton);
      
      expect(screen.getByText('Please enter a prompt to generate an image')).toBeInTheDocument();
    });

    it('should handle API failures gracefully', async () => {
      // Mock API failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      const generateButton = screen.getByText('Generate Image');
      
      await user.type(promptInput, 'A cat');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('should handle non-image responses', async () => {
      // Mock non-image response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('text/html'),
        },
      });

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      const generateButton = screen.getByText('Generate Image');
      
      await user.type(promptInput, 'Invalid prompt');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid response: Expected image/)).toBeInTheDocument();
      });
    });

    it('should handle HTTP errors', async () => {
      // Mock HTTP error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      const generateButton = screen.getByText('Generate Image');
      
      await user.type(promptInput, 'A dog');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/HTTP error! status: 429/)).toBeInTheDocument();
      });
    });
  });

  describe('Regeneration Feature', () => {
    it('should show regenerate button after successful generation', async () => {
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      const generateButton = screen.getByText('Generate Image');
      
      await user.type(promptInput, 'A flower');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Regenerate')).toBeInTheDocument();
      });
    });

    it('should regenerate with same prompt', async () => {
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      const generateButton = screen.getByText('Generate Image');
      
      await user.type(promptInput, 'A mountain');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Regenerate')).toBeInTheDocument();
      });
      
      const regenerateButton = screen.getByText('Regenerate');
      await user.click(regenerateButton);
      
      // Should call fetch again with different seed
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Memory Management', () => {
    it('should clean up object URLs', async () => {
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      render(
        <AIGenerationPanel 
          onImageGenerated={mockOnImageGenerated} 
          onClose={mockOnClose} 
        />
      );
      
      const promptInput = screen.getByPlaceholderText('A beautiful sunset over mountains...');
      const generateButton = screen.getByText('Generate Image');
      
      await user.type(promptInput, 'A bird');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(mockOnImageGenerated).toHaveBeenCalled();
      });
      
      // Generate another image to trigger cleanup
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      });
    });
  });
});