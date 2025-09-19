/**
 * Defensive Array Utilities
 * Automatically handles undefined/null arrays to prevent ".map is not a function" errors
 */

/**
 * Safe map function that ensures the array is valid before mapping
 * @param {any} array - The array to map (can be undefined/null)
 * @param {Function} callback - The mapping function
 * @param {any[]} fallback - Fallback array if original is invalid (default: [])
 * @returns {any[]} - Mapped array or empty array
 */
export const safeMap = (array, callback, fallback = []) => {
  if (!Array.isArray(array)) {
    return Array.isArray(fallback) ? fallback : [];
  }
  return array.map(callback);
};

/**
 * Safe filter function with automatic validation
 * @param {any} array - The array to filter
 * @param {Function} callback - The filter function
 * @param {any[]} fallback - Fallback array if original is invalid
 * @returns {any[]} - Filtered array or fallback
 */
export const safeFilter = (array, callback, fallback = []) => {
  if (!Array.isArray(array)) {
    return Array.isArray(fallback) ? fallback : [];
  }
  return array.filter(callback);
};

/**
 * Safe reduce function with automatic validation
 * @param {any} array - The array to reduce
 * @param {Function} callback - The reducer function
 * @param {any} initialValue - Initial value for reduction
 * @param {any} fallback - Fallback value if array is invalid
 * @returns {any} - Reduced value or fallback
 */
export const safeReduce = (array, callback, initialValue, fallback = initialValue) => {
  if (!Array.isArray(array)) {
    return fallback;
  }
  return array.reduce(callback, initialValue);
};

/**
 * Safe forEach function with automatic validation
 * @param {any} array - The array to iterate
 * @param {Function} callback - The iteration function
 */
export const safeForEach = (array, callback) => {
  if (Array.isArray(array)) {
    array.forEach(callback);
  }
};

/**
 * Ensures a value is an array, converting if necessary
 * @param {any} value - Value to ensure is an array
 * @param {any[]} fallback - Fallback array if conversion fails
 * @returns {any[]} - Valid array
 */
export const ensureArray = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  // Try to convert to array
  try {
    return Array.from(value);
  } catch {
    return fallback;
  }
};

/**
 * React Hook for safe array state management
 * Automatically ensures state is always an array
 * @param {any[]} initialValue - Initial array value
 * @returns {[any[], Function]} - [safeArray, setSafeArray]
 */
export const useSafeArrayState = (initialValue = []) => {
  const [state, setState] = useState(ensureArray(initialValue));
  
  const setSafeState = (newValue) => {
    if (typeof newValue === 'function') {
      setState(prev => ensureArray(newValue(prev)));
    } else {
      setState(ensureArray(newValue));
    }
  };
  
  return [state, setSafeState];
};

// Import React for the hook
import { useState } from 'react';

/**
 * Higher-order component that adds defensive array handling to props
 * @param {React.Component} Component - Component to wrap
 * @param {string[]} arrayProps - Names of props that should be treated as arrays
 * @returns {React.Component} - Wrapped component with safe array props
 */
export const withSafeArrays = (Component, arrayProps = []) => {
  return function SafeArrayComponent(props) {
    const safeProps = { ...props };
    
    arrayProps.forEach(propName => {
      if (propName in props) {
        safeProps[propName] = ensureArray(props[propName]);
      }
    });
    
    return <Component {...safeProps} />;
  };
};

/**
 * Defensive map for React rendering with automatic key generation
 * @param {any} array - Array to map
 * @param {Function} renderFunction - Function that returns JSX
 * @param {string} keyPrefix - Prefix for React keys
 * @returns {JSX.Element[]} - Array of JSX elements
 */
export const safeRenderMap = (array, renderFunction, keyPrefix = 'item') => {
  return safeMap(array, (item, index) => {
    const key = item?.id || item?._id || `${keyPrefix}-${index}`;
    return renderFunction(item, index, key);
  });
};

// Export all functions as default object for easier importing
export default {
  safeMap,
  safeFilter,
  safeReduce,
  safeForEach,
  ensureArray,
  useSafeArrayState,
  withSafeArrays,
  safeRenderMap
};