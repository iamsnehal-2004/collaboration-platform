import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { initializeSocket, disconnectSocket } from '../utils/socket';

/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);

          // Initialize socket connection
          initializeSocket(storedToken);

          // Verify token is still valid
          try {
            const response = await authAPI.getProfile();
            setUser(response.data.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
          } catch (error) {
            // Token invalid, clear auth
            logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token: userToken } = response.data.data;

      // Save to state
      setUser(userData);
      setToken(userToken);
      setIsAuthenticated(true);

      // Save to localStorage
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Initialize socket connection
      initializeSocket(userToken);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    }
  };

  /**
   * Signup new user
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const signup = async (name, email, password) => {
    try {
      const response = await authAPI.signup({ name, email, password });
      const { user: userData, token: userToken } = response.data.data;

      // Save to state
      setUser(userData);
      setToken(userToken);
      setIsAuthenticated(true);

      // Save to localStorage
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Initialize socket connection
      initializeSocket(userToken);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Disconnect socket
      disconnectSocket();
    }
  };

  /**
   * Update user profile
   * @param {Object} data - Updated user data
   */
  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.data.user;

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

// Made with Bob
