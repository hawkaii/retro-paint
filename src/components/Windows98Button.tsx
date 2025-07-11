import React from 'react';

interface Windows98ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  title?: string;
}

const Windows98Button: React.FC<Windows98ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  pressed = false,
  className = '',
  title 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        windows98-button
        ${pressed ? 'pressed' : ''}
        ${disabled ? 'disabled' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Windows98Button;