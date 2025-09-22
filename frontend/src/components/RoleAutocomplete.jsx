import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Users } from 'lucide-react';
import { searchRoles, getRoleCategory, ALL_ROLES } from '../constants/roles';

const RoleAutocomplete = ({ 
  value = '', 
  onChange, 
  onCustomRoleChange,
  customRole = '',
  placeholder = "Type to search roles...",
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Defensive programming: initialize with ALL_ROLES if available, otherwise empty array
  const [filteredRoles, setFilteredRoles] = useState(Array.isArray(ALL_ROLES) ? ALL_ROLES : []);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const filtered = searchRoles(searchQuery);
    // Defensive programming: ensure filtered is always an array
    setFilteredRoles(Array.isArray(filtered) ? filtered : []);
    setHighlightedIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsOpen(true);
    
    // If user is typing and current value is not in the list, clear selection
    if (query) {
      const searchResults = searchRoles(query);
      const validRoles = Array.isArray(searchResults) ? searchResults : [];
      if (!validRoles.includes(value)) {
        onChange('');
      }
    }
  };

  const handleRoleSelect = (role) => {
    onChange(role);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    // Clear custom role when switching away from "Other"
    if (role !== 'Other' && onCustomRoleChange) {
      onCustomRoleChange('');
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          Array.isArray(filteredRoles) && filteredRoles.length > 0 ? 
          (prev < filteredRoles.length - 1 ? prev + 1 : 0) : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          Array.isArray(filteredRoles) && filteredRoles.length > 0 ? 
          (prev > 0 ? prev - 1 : filteredRoles.length - 1) : 0
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && Array.isArray(filteredRoles) && filteredRoles[highlightedIndex]) {
          handleRoleSelect(filteredRoles[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const displayValue = value || searchQuery;

  return (
    <div className={`relative ${className}`}>
      {/* Main Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-10 py-3 h-11 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
        />
        <ChevronDown 
          className={`absolute right-3 top-3 h-4 w-4 text-gray-400 transition-transform cursor-pointer ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* Selected Role Display */}
      {value && !isOpen && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">{value}</span>
            <span className="ml-2 text-xs text-blue-600">
              ({getRoleCategory(value)})
            </span>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {Array.isArray(filteredRoles) && filteredRoles.length > 0 ? (
            <div className="py-1">
              {filteredRoles.map((role, index) => (
                <div
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    index === highlightedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${
                    role === value ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <span className="flex-1">{role}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {getRoleCategory(role)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
              No roles found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Custom Role Input (appears when "Other" is selected) */}
      {value === 'Other' && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Specify Custom Role *
          </label>
          <input
            type="text"
            value={customRole}
            onChange={(e) => onCustomRoleChange && onCustomRoleChange(e.target.value)}
            placeholder="Enter your specific role..."
            required
            className="w-full px-3 py-2 h-11 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Please specify your exact role title
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleAutocomplete;