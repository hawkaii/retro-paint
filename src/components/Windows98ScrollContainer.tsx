import React from 'react';

interface Windows98ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Windows98ScrollContainer: React.FC<Windows98ScrollContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`windows98-scroll-container ${className}`}>
      <div className="windows98-scroll-content">
        {children}
      </div>
    </div>
  );
};

export default Windows98ScrollContainer;