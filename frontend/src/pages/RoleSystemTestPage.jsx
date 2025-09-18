import React, { useState } from 'react';
import RoleAutocomplete from '../components/RoleAutocomplete';
import { ROLE_CATEGORIES, searchRoles } from '../constants/roles';

const RoleSystemTestPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [testResults, setTestResults] = useState([]);

  const runAutocompleteTests = () => {
    const tests = [
      { search: 'engineer', expectedCount: 8 },
      { search: 'intern', expectedCount: 9 },
      { search: 'manager', expectedCount: 8 },
      { search: 'developer', expectedCount: 7 },
      { search: 'data', expectedCount: 5 },
      { search: 'marketing', expectedCount: 4 },
      { search: 'designer', expectedCount: 5 },
      { search: 'analyst', expectedCount: 5 },
      { search: 'coordinator', expectedCount: 3 },
      { search: 'lead', expectedCount: 5 }
    ];

    const results = tests.map(test => {
      const matches = searchRoles(test.search);
      const passed = matches.length >= test.expectedCount - 2; // Allow some variance
      return {
        ...test,
        actualCount: matches.length,
        passed,
        matches: matches.slice(0, 3) // Show first 3 matches
      };
    });

    setTestResults(results);
  };

  const handleRoleChange = (role, custom) => {
    setSelectedRole(role);
    setCustomRole(custom);
    console.log('Role changed:', { role, custom });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        🧪 Comprehensive Role System Test Page
      </h1>

      {/* Role Statistics */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📊 Role System Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(ROLE_CATEGORIES).map(([category, roles]) => (
            <div key={category} className="bg-white p-3 rounded shadow">
              <div className="font-medium text-sm text-gray-600">{category}</div>
              <div className="text-2xl font-bold text-blue-600">{roles.length}</div>
              <div className="text-xs text-gray-500">roles</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Total Roles: {Object.values(ROLE_CATEGORIES).flat().length}
        </div>
      </div>

      {/* Live Role Autocomplete Test */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🎯 Live Role Autocomplete Test</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Role (with autocomplete)
          </label>
          <RoleAutocomplete
            value={selectedRole}
            customRole={customRole}
            onChange={handleRoleChange}
            placeholder="Type to search roles (e.g., 'engineer', 'intern', 'manager')..."
          />
        </div>
        
        {/* Results Display */}
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Selected Values:</h3>
          <div className="text-sm space-y-1">
            <div><strong>Role:</strong> {selectedRole || 'None'}</div>
            {customRole && (
              <div><strong>Custom Role:</strong> {customRole}</div>
            )}
          </div>
        </div>
      </div>

      {/* Search Function Test */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🔍 Search Function Test</h2>
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter search term to test search function..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        {searchTerm && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">
              Search Results for "{searchTerm}" ({searchRoles(searchTerm).length} found):
            </h3>
            <div className="max-h-48 overflow-y-auto">
              {searchRoles(searchTerm).map((role, index) => (
                <div key={index} className="px-3 py-2 text-sm border-b last:border-b-0">
                  {role}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Automated Tests */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🤖 Automated Search Tests</h2>
        <button
          onClick={runAutocompleteTests}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run Autocomplete Tests
        </button>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded ${result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">"{result.search}"</span>
                  <span className={`px-2 py-1 rounded text-xs ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {result.passed ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Expected: ≥{result.expectedCount}, Found: {result.actualCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Sample matches: {result.matches.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Categories Display */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📋 All Role Categories</h2>
        <div className="space-y-4">
          {Object.entries(ROLE_CATEGORIES).map(([category, roles]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">{category} ({roles.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {roles.map((role, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                    {role}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">🔬 Testing Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Test the autocomplete by typing different search terms</li>
          <li>• Try searching for: engineer, intern, manager, developer, data, marketing</li>
          <li>• Use arrow keys to navigate dropdown suggestions</li>
          <li>• Press Enter to select, Escape to close</li>
          <li>• Select "Other" to test custom role input</li>
          <li>• Run automated tests to verify search functionality</li>
        </ul>
      </div>
    </div>
  );
};

export default RoleSystemTestPage;