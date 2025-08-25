import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Set user immediately from localStorage for better UX
          setUser(parsedUser);
          
          // Verify token is still valid in the background
          const response = await api.get('/auth/me');
          if (response.data.success) {
            // Update with fresh user data from server
            setUser(response.data.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
          }
        } catch (error) {
          // Handle different types of errors
          if (error.response?.status === 401) {
            // Token is invalid/expired, clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          } else if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500) {
            // Network error or server error - keep user logged in with cached data
            try {
              const parsedUser = JSON.parse(savedUser);
              setUser(parsedUser);
            } catch (parseError) {
              // If we can't parse saved user, clear everything
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            }
          } else {
            // Other errors - clear auth for safety
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const responseData = response.data;

      if (responseData.success) {
        const { token, data } = responseData;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: responseData.message || 'Login failed' };
      }
    } catch (error) {
      // Handle different types of errors more gracefully
      let errorMessage = 'Login failed';
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = async (silent = false) => {
    try {
      if (!silent) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      // Silently handle logout errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Function to handle automatic logout (e.g., token expiration)
  const handleTokenExpiration = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, data } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const hasPermission = (requiredRoles) => {
    if (!user) return false;
    if (typeof requiredRoles === 'string') {
      requiredRoles = [requiredRoles];
    }
    return requiredRoles.includes(user.role);
  };

  const isAdmin = () => hasPermission(['Admin']);
  const isHR = () => hasPermission(['HR', 'Admin']);
  const isManager = () => hasPermission(['Manager', 'HR', 'Admin']);
  const isTeamLead = () => hasPermission(['Team Lead', 'Manager', 'HR', 'Admin']);

  const value = {
    user,
    login,
    logout,
    register,
    updateUser,
    loading,
    darkMode,
    toggleDarkMode,
    hasPermission,
    isAdmin,
    isHR,
    isManager,
    isTeamLead,
    handleTokenExpiration
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
