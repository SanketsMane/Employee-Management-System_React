import React, { useState } from 'react';
import RoleAutocomplete from '../components/RoleAutocomplete';
import { ALL_ROLES, searchRoles } from '../constants/roles';

const RoleDebugPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [debugInfo, setDebugInfo] = useState({});

  const handleRoleChange = (role) => {
    console.log('Role changed:', role);
    setSelectedRole(role);
    
    // Debug info
    setDebugInfo({
      role,
      allRolesLength: ALL_ROLES?.length || 0,
      allRolesType: typeof ALL_ROLES,
      isArray: Array.isArray(ALL_ROLES),
      searchTest: searchRoles('data'),
      timestamp: new Date().toISOString()
    });
  };

  const handleCustomRoleChange = (customRole) => {
    console.log('Custom role changed:', customRole);
    setCustomRole(customRole);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🐛 Role Selection Debug Page
        </h1>
        
        <div className="space-y-6">
          {/* Role Autocomplete Test */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Test Role Selection:</h2>
            <RoleAutocomplete
              value={selectedRole}
              onChange={handleRoleChange}
              onCustomRoleChange={handleCustomRoleChange}
              customRole={customRole}
              placeholder="Type to search roles..."
              required
            />
          </div>

          {/* Debug Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Debug Information:</h3>
            <div className="text-sm space-y-1">
              <div><strong>Selected Role:</strong> {selectedRole || 'None'}</div>
              <div><strong>Custom Role:</strong> {customRole || 'None'}</div>
              <div><strong>ALL_ROLES Length:</strong> {debugInfo.allRolesLength}</div>
              <div><strong>ALL_ROLES Type:</strong> {debugInfo.allRolesType}</div>
              <div><strong>Is Array:</strong> {String(debugInfo.isArray)}</div>
              <div><strong>Search Test:</strong> {JSON.stringify(debugInfo.searchTest?.slice(0, 3))}</div>
              <div><strong>Last Update:</strong> {debugInfo.timestamp}</div>
            </div>
          </div>

          {/* Manual Test Buttons */}
          <div>
            <h3 className="font-medium mb-2">Manual Tests:</h3>
            <div className="space-x-2">
              <button 
                onClick={() => console.log('ALL_ROLES:', ALL_ROLES)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Log ALL_ROLES
              </button>
              <button 
                onClick={() => console.log('searchRoles test:', searchRoles('engineer'))}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
              >
                Test searchRoles
              </button>
              <button 
                onClick={() => setSelectedRole('Engineer')}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
              >
                Set Engineer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDebugPage;