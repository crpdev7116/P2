import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  title = null,
  subtitle = null,
  footer = null,
  className = '',
  noPadding = false,
  ...props 
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${noPadding ? 'p-0' : 'p-6'} ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className={`${!noPadding ? 'mb-4' : 'p-6 pb-0'}`}>
          {title && (
            typeof title === 'string' 
              ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              : title
          )}
          {subtitle && (
            typeof subtitle === 'string'
              ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              : subtitle
          )}
        </div>
      )}
      
      <div className={noPadding && (title || subtitle) ? 'p-6 pt-4' : ''}>
        {children}
      </div>
      
      {footer && (
        <div className={`${!noPadding ? 'mt-4 pt-4 border-t border-gray-200' : 'p-6 pt-4 border-t border-gray-200'}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  footer: PropTypes.node,
  className: PropTypes.string,
  noPadding: PropTypes.bool
};

export default Card;
