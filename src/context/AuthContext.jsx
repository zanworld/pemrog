import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hybrid_library_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Configure axios to always send token if available
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('hybrid_library_token', token);
      
      // We could ideally fetch the user profile here if we only had the token
      // but for simplicity, we'll decode the JWT or rely on the login response to set the user state.
      // A quick JWT decode for frontend display (not for security):
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, name: payload.name, email: payload.email });
      } catch (e) {
        console.error("Invalid token format");
        logout();
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('hybrid_library_token');
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    if (response.data.success) {
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await axios.post('/api/auth/register', { name, email, password });
    if (response.data.success) {
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const updateUser = (newUser, newToken) => {
    setUser(newUser);
    if (newToken) setToken(newToken);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
