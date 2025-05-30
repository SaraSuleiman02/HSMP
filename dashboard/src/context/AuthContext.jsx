import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookie from 'js-cookie';
import axiosInstance from '../axiosConfig';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: null,
    role: null,
    name: null,
    email: null,
    profilePictureUrl: null,
    phone: null
  });
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId, role) => {
    try {
      const token = Cookie.get('token');
      if (!token) return;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const endpoint = `/admin/${userId}`;
        

      const response = await axiosInstance.get(endpoint, config);

      if (!response.data) return;

      setUser({
        id: response.data._id || userId,
        role: role,
        name: response.data.name || '',
        email: response.data.email || '',
        profilePictureUrl: response.data.profilePictureUrl || '',
        phone: response.data.phone || ''
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      const token = Cookie.get('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const { id, role } = decoded;

          setUser(prev => ({
            ...prev,
            id,
            role
          }));

          await fetchUserData(id, role);

        } catch (error) {
          console.error('Error initializing user:', error);
          Cookie.remove('token');
        }
      }
      setLoading(false);
    };

    initializeUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post("/admin/signin", {
        email,
        password,
      });
      
      Cookie.set("token", response.data.token, { expires: 1 });
      
      const decoded = jwtDecode(response.data.token);
      const { id, role } = decoded;

      setUser(prev => ({
        ...prev,
        id,
        role
      }));

      await fetchUserData(id, role);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    Cookie.remove('token');
    setUser({
      id: null,
      role: null,
      name: null,
      email: null,
      profilePictureUrl: null,
      phone: null
    });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user?.id,
    updateUser: (newUserData) => {
      setUser(prev => ({
        ...prev,
        ...newUserData
      }));
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 