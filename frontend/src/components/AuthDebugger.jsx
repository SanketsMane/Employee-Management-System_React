import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebugger = () => {
  const { user, loading } = useAuth();

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'yellow', 
      padding: '10px', 
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Token: {localStorage.getItem('token') ? 'exists' : 'null'}</div>
    </div>
  );
};

export default AuthDebugger;
