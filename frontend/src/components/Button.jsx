import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  fullWidth = false,
  icon = null,
  ...props 
}) => {
  const [isActive, setIsActive] = useState(false);
  
  // Handle click with animation
  const handleClick = (e) => {
    if (disabled || !onClick) return;
    
    setIsActive(true);
    setTimeout(() => setIsActive(false), 200);
    onClick(e);
  };
  
  // Base classes - square buttons with no border radius
  const baseClasses = 'inline-flex items-center justify-center transition-all duration-200 focus:outline-none font-medium';
  
  // Size classes
  const sizeClasses = {
    'sm': 'px-3 py-1.5 text-xs',
    'md': 'px-4 py-2 text-sm',
    'lg': 'px-5 py-2.5 text-base'
  };
  
  // Variant classes - Modern premium dark design with rounded corners
  const variantClasses = {
    'default': 'bg-black text-white border border-zinc-800 rounded-lg hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95',
    'active': 'bg-white text-black border border-zinc-800 rounded-lg active:scale-95',
    'secondary': 'bg-zinc-900 text-white border border-zinc-700 rounded-lg hover:bg-black hover:shadow-lg active:scale-95',
    'danger': 'bg-black text-red-500 border border-red-800 rounded-lg hover:shadow-lg hover:shadow-red-500/20 active:scale-95',
    'success': 'bg-black text-green-500 border border-green-800 rounded-lg hover:shadow-lg hover:shadow-green-500/20 active:scale-95',
    'ghost': 'bg-transparent text-white rounded-lg hover:bg-zinc-900 active:scale-95'
  };
  
  // Disabled classes
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Active state classes
  const activeStateClasses = isActive ? 'transform translate-x-[2px] translate-y-[2px]' : '';
  
  // Combine all classes
  const buttonClasses = [
    baseClasses,
    sizeClasses[size] || sizeClasses.md,
    variantClasses[variant] || variantClasses.default,
    disabledClasses,
    widthClasses,
    activeStateClasses,
    className
  ].join(' ');
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'active', 'secondary', 'danger', 'success', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  icon: PropTypes.node
};

export default Button;
