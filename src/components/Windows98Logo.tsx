import React from 'react';

const Windows98Logo: React.FC = () => {
  return (
    <div className="windows98-logo">
      {/* Classic Windows 98 Logo */}
      <div className="windows98-logo-squares">
        <div className="windows98-logo-square red"></div>
        <div className="windows98-logo-square green"></div>
        <div className="windows98-logo-square blue"></div>
        <div className="windows98-logo-square yellow"></div>
      </div>
      
      {/* Windows 98 Text */}
      <div className="flex flex-col">
        <span className="windows98-text text-xs font-bold leading-none">MS Paint++</span>
      </div>
    </div>
  );
};

export default Windows98Logo;