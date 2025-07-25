import React, { useState } from 'react';
import { Wand2, X, Loader2, RefreshCw, Settings } from 'lucide-react';

interface AIGenerationPanelProps {
  onImageGenerated: (imageUrl: string) => void;
  onClose: () => void;
}

const artStyles = [
  { value: '', label: 'Default' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'anime', label: 'Anime' },
  { value: 'sketch', label: 'Sketch' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'oil painting', label: 'Oil Painting' },
  { value: 'digital art', label: 'Digital Art' },
  { value: 'pixel art', label: 'Pixel Art' },
  { value: 'abstract', label: 'Abstract' },
];

const colorPalettes = [
  { value: '', label: 'Default' },
  { value: 'vibrant colors', label: 'Vibrant' },
  { value: 'pastel colors', label: 'Pastel' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'warm colors', label: 'Warm Tones' },
  { value: 'cool colors', label: 'Cool Tones' },
  { value: 'neon colors', label: 'Neon' },
  { value: 'earth tones', label: 'Earth Tones' },
];

const detailLevels = [
  { value: '', label: 'Default' },
  { value: 'simple', label: 'Simple' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'highly detailed', label: 'Highly Detailed' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'intricate', label: 'Intricate' },
];

const AIGenerationPanel: React.FC<AIGenerationPanelProps> = ({ onImageGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [artStyle, setArtStyle] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [detailLevel, setDetailLevel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState('');

  const generateImage = async (inputPrompt: string) => {
    if (!inputPrompt.trim()) {
      setError('Please enter a prompt to generate an image');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Build enhanced prompt with style options
      let enhancedPrompt = inputPrompt.trim();
      
      if (artStyle) {
        enhancedPrompt += `, ${artStyle} style`;
      }
      
      if (colorPalette) {
        enhancedPrompt += `, ${colorPalette}`;
      }
      
      if (detailLevel) {
        enhancedPrompt += `, ${detailLevel}`;
      }

      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${Date.now()}`;
      
      console.log('Generating image with URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('Invalid response: Expected image but received ' + contentType);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (lastGeneratedUrl) {
        URL.revokeObjectURL(lastGeneratedUrl);
      }
      
      setLastGeneratedUrl(objectUrl);
      onImageGenerated(objectUrl);
      
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    generateImage(prompt);
  };

  const handleRegenerate = () => {
    if (prompt.trim()) {
      generateImage(prompt);
    }
  };

  const presetSizes = [
    { label: '512x512', width: 512, height: 512 },
    { label: '768x768', width: 768, height: 768 },
    { label: '1024x1024', width: 1024, height: 1024 },
    { label: '1024x768', width: 1024, height: 768 },
    { label: '768x1024', width: 768, height: 1024 },
  ];

  return (
    <div className="bg-gray-200 border-2 border-gray-400 w-80 flex flex-col" style={{ fontFamily: 'MS Sans Serif, monospace' }}>
      {/* Header */}
      <div className="bg-gray-300 border-b border-gray-400 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wand2 size={16} />
          <span className="text-sm font-bold">AI Image Generator</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 bg-gray-200 border border-gray-400 hover:bg-gray-300 flex items-center justify-center text-xs"
        >
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 overflow-y-auto">
        {/* Prompt Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1">Describe your image:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A beautiful sunset over mountains..."
            className="w-full h-20 p-2 border border-gray-400 text-xs resize-none"
            disabled={isGenerating}
          />
        </div>

        {/* Size Presets */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1">Size:</label>
          <div className="grid grid-cols-2 gap-1 mb-2">
            {presetSizes.map((size) => (
              <button
                key={size.label}
                onClick={() => {
                  setWidth(size.width);
                  setHeight(size.height);
                }}
                className={`p-1 border text-xs ${
                  width === size.width && height === size.height
                    ? 'border-gray-600 bg-gray-300'
                    : 'border-gray-400 bg-gray-200 hover:bg-gray-300'
                }`}
                disabled={isGenerating}
              >
                {size.label}
              </button>
            ))}
          </div>
          
          {/* Custom Size */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Math.max(256, Math.min(1024, parseInt(e.target.value) || 512)))}
                className="w-full p-1 border border-gray-400 text-xs"
                min="256"
                max="1024"
                disabled={isGenerating}
              />
              <div className="text-xs text-gray-600 text-center">Width</div>
            </div>
            <div className="text-xs self-center">×</div>
            <div className="flex-1">
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Math.max(256, Math.min(1024, parseInt(e.target.value) || 512)))}
                className="w-full p-1 border border-gray-400 text-xs"
                min="256"
                max="1024"
                disabled={isGenerating}
              />
              <div className="text-xs text-gray-600 text-center">Height</div>
            </div>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-2 border border-gray-400 bg-gray-200 hover:bg-gray-300 text-xs flex items-center justify-center space-x-1 mb-3"
          disabled={isGenerating}
        >
          <Settings size={12} />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-3 mb-4">
            {/* Art Style */}
            <div>
              <label className="block text-xs font-bold mb-1">Art Style:</label>
              <select
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value)}
                className="w-full p-1 border border-gray-400 text-xs"
                disabled={isGenerating}
              >
                {artStyles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-bold mb-1">Color Palette:</label>
              <select
                value={colorPalette}
                onChange={(e) => setColorPalette(e.target.value)}
                className="w-full p-1 border border-gray-400 text-xs"
                disabled={isGenerating}
              >
                {colorPalettes.map((palette) => (
                  <option key={palette.value} value={palette.value}>
                    {palette.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Detail Level */}
            <div>
              <label className="block text-xs font-bold mb-1">Detail Level:</label>
              <select
                value={detailLevel}
                onChange={(e) => setDetailLevel(e.target.value)}
                className="w-full p-1 border border-gray-400 text-xs"
                disabled={isGenerating}
              >
                {detailLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-400 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Generate Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full p-2 border-2 border-gray-400 bg-blue-200 hover:bg-blue-300 disabled:bg-gray-300 disabled:text-gray-500 text-sm font-bold flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 size={16} />
                <span>Generate Image</span>
              </>
            )}
          </button>

          {lastGeneratedUrl && (
            <button
              onClick={handleRegenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full p-2 border border-gray-400 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-300 disabled:text-gray-500 text-xs flex items-center justify-center space-x-2"
            >
              <RefreshCw size={12} />
              <span>Regenerate</span>
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 p-2 bg-yellow-100 border border-yellow-400 text-xs">
          <div className="font-bold mb-1">💡 Tips:</div>
          <ul className="text-xs space-y-1">
            <li>• Be specific in your descriptions</li>
            <li>• Try different art styles for variety</li>
            <li>• Use the regenerate button for variations</li>
            <li>• Generated images blend with paint tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIGenerationPanel;