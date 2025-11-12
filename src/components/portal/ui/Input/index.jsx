'use client';

import { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Input component with support for prefix icons and custom styling
 */
export const Input = forwardRef(({ 
  placeholder, 
  value, 
  onChange, 
  onKeyDown,
  className = '',
  classNames = {},
  prefix = null,
  ...rest 
}, ref) => {
  const rootClassName = `flex items-center gap-2 ${classNames.root || ''}`;
  const inputClassName = `w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-dark-600 dark:bg-dark-800 dark:text-white ${classNames.input || ''} ${className}`;

  return (
    <div className={rootClassName}>
      {prefix && <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">{prefix}</span>}
      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={inputClassName}
        {...rest}
      />
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  className: PropTypes.string,
  classNames: PropTypes.shape({
    root: PropTypes.string,
    input: PropTypes.string,
  }),
  prefix: PropTypes.node,
};

export default Input;
