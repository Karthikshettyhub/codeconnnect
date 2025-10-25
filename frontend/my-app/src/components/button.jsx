import React from 'react';
import './button.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  icon = false,
  className = '',
  ...props 
}) => {
  const buttonClass = `btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${icon ? 'btn-icon' : ''} ${className}`;

  return (
    <button 
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;