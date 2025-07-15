import { useCallback, useEffect } from 'react';
import { playActionSound } from '../utils/soundEffects';

interface UsePasteProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  contextRef: React.RefObject<CanvasRenderingContext2D>;
  saveToHistory: () => void;
  onPasteError: (error: string) => void;
}

export const usePaste = ({ 
  canvasRef, 
  contextRef, 
  saveToHistory, 
  onPasteError 
}: UsePasteProps) => {
  
  // Process clipboard image data
  const processClipboardImage = useCallback(async (blob: Blob, mimeType: string): Promise<void> => {
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
          saveToHistory();
          
          // Clean up the object URL
          URL.revokeObjectURL(img.src);
          
          // Play success sound
          playActionSound();
          
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
  }, [canvasRef, contextRef, saveToHistory]);

  // Handle paste events
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    e.preventDefault();
    onPasteError(''); // Clear any previous errors

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
      onPasteError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => onPasteError(''), 5000);
    }
  }, [processClipboardImage, onPasteError]);

  // Setup keyboard and paste event listeners
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
          onPasteError('Failed to access clipboard. Make sure you have copied an image.');
          setTimeout(() => onPasteError(''), 5000);
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
  }, [handlePaste, onPasteError]);

  return { handlePaste };
};