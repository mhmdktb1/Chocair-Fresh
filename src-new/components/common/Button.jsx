import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'medium', onClick, className = '', ...props }) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size} ${className}`} 
      onClick={onClick}
      {...props}
    >
      <span className="btn-content">{children}</span>
      <span className="btn-ripple"></span>
    </button>
  );
};

export default Button;
