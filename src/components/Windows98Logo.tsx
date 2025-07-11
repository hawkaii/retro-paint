import React from 'react';

const Windows98Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 p-2">
      {/* Classic Windows 98 Logo */}
      <div className="relative">
        <svg width="32" height="32" viewBox="0 0 32 32" className="pixelated">
          {/* Red square */}
          <rect x="2" y="2" width="12" height="12" fill="#FF0000" className="pixel-border" />
          {/* Green square */}
          <rect x="18" y="2" width="12" height="12" fill="#00FF00" className="pixel-border" />
          {/* Blue square */}
          <rect x="2" y="18" width="12" height="12" fill="#0000FF" className="pixel-border" />
          {/* Yellow square */}
          <rect x="18" y="18" width="12" height="12" fill="#FFFF00" className="pixel-border" />
          
          {/* Pixelated separators */}
          <rect x="14" y="2" width="2" height="28" fill="#808080" />
          <rect x="2" y="14" width="28" height="2" fill="#808080" />
        </svg>
        
        {/* Drop shadow */}
        <div className="absolute top-1 left-1 w-8 h-8 bg-black opacity-25 -z-10 pixelated"></div>
      </div>
      
      {/* Windows 98 Text */}
      <div className="flex flex-col">
        <span className="windows98-text text-sm font-bold leading-none">Windows</span>
        <span className="windows98-text text-xs leading-none">98</span>
      </div>
    </div>
  );
};

export default Windows98Logo;