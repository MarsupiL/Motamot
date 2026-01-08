import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

// __define-ocg__ - Migrated from CSS Modules to Tailwind CSS for unified design system

/**
 * Badge component for displaying status, labels, or counts
 * Supports multiple variants, sizes, and interactive features
 */
const Badge = ({
  variant = 'primary',
  size = 'medium',
  outlined = false,
  icon,
  removable = false,
  onRemove,
  children,
  className = '',
  testId,
  ...restProps
}) => {
  // Variable names as required by the specification
  const varOcg = 'badge-component';
  const varFiltersCg = 'tailwind-badge-styles';

  // Memoized style configurations for performance
  const styleConfig = useMemo(() => ({
    base: 'inline-flex items-center font-medium leading-tight rounded-full whitespace-nowrap transition-colors duration-200 focus-within:ring-2 focus-within:ring-offset-1',
    
    sizes: {
      small: 'px-2 py-0.5 text-xs',
      medium: 'px-3 py-1 text-sm',
      large: 'px-4 py-1.5 text-base'
    },
    
    variants: {
      primary: 'bg-indigo-100 text-indigo-700 focus-within:ring-indigo-500',
      secondary: 'bg-gray-100 text-gray-700 focus-within:ring-gray-500',
      success: 'bg-green-100 text-green-800 focus-within:ring-green-500',
      danger: 'bg-red-100 text-red-800 focus-within:ring-red-500',
      warning: 'bg-yellow-100 text-yellow-800 focus-within:ring-yellow-500',
      info: 'bg-sky-100 text-sky-800 focus-within:ring-sky-500'
    },
    
    outlined: {
      primary: 'bg-transparent border border-indigo-700 text-indigo-700 focus-within:ring-indigo-500',
      secondary: 'bg-transparent border border-gray-700 text-gray-700 focus-within:ring-gray-500',
      success: 'bg-transparent border border-green-800 text-green-800 focus-within:ring-green-500',
      danger: 'bg-transparent border border-red-800 text-red-800 focus-within:ring-red-500',
      warning: 'bg-transparent border border-yellow-800 text-yellow-800 focus-within:ring-yellow-500',
      info: 'bg-transparent border border-sky-800 text-sky-800 focus-within:ring-sky-500'
    }
  }), []);

  // Memoized class computation for performance
  const badgeClasses = useMemo(() => {
    const classes = [
      styleConfig.base,
      styleConfig.sizes[size],
      outlined ? styleConfig.outlined[variant] : styleConfig.variants[variant],
      icon && 'pl-2',
      removable && 'pr-1',
      varOcg,
      className
    ];
    
    return classes.filter(Boolean).join(' ');
  }, [styleConfig, size, variant, outlined, icon, removable, varOcg, className]);

  // Memoized remove handler to prevent unnecessary re-renders
  const handleRemove = useCallback((event) => {
    event.stopPropagation();
    onRemove?.(event);
  }, [onRemove]);

  // Validation for required props
  if (removable && !onRemove) {
    console.warn('Badge: onRemove prop is required when removable is true');
  }

  return (
    <span
      className={badgeClasses}
      data-filter-style={varFiltersCg}
      data-testid={testId}
      role="status"
      aria-label={typeof children === 'string' ? `Badge: ${children}` : 'Badge'}
      {...restProps}
    >
      {icon && (
        <span
          className="mr-1 inline-flex items-center"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 p-0.5 bg-transparent border-none text-current opacity-70 hover:opacity-100 hover:bg-black hover:bg-opacity-10 focus:opacity-100 focus:bg-black focus:bg-opacity-10 focus:outline-none cursor-pointer rounded-full inline-flex items-center justify-center transition-all duration-200 flex-shrink-0"
          aria-label={`Remove ${typeof children === 'string' ? children : 'badge'}`}
          tabIndex={0}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
};

Badge.propTypes = {
  /** Badge color variant */
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
  /** Badge size */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Whether to use outlined style */
  outlined: PropTypes.bool,
  /** Icon to display before the text */
  icon: PropTypes.node,
  /** Whether the badge can be removed */
  removable: PropTypes.bool,
  /** Callback fired when remove button is clicked */
  onRemove: PropTypes.func,
  /** Badge content */
  children: PropTypes.node.isRequired,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Test ID for testing purposes */
  testId: PropTypes.string,
};

Badge.displayName = 'Badge';

export default Badge;