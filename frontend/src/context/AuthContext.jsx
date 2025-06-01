import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookie from 'js-cookie';
import axiosInstance from '../axiosConfig'; // Assuming this path is correct
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

// Helper function to fetch user data without setting state
const fetchUserDataOnly = async (userId, role, token) => {
  try {
    if (!token) return null; // Return null if no token

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const endpoint = `/user/${userId}`; // Assuming this endpoint is correct
    const response = await axiosInstance.get(endpoint, config);

    if (!response.data) return null; // Return null if no data

    // Return a structured user object
    return {
      id: response.data._id || userId,
      role: role,
      name: response.data.name || '',
      email: response.data.email || '',
      profilePictureUrl: response.data.profilePictureUrl || '',
      phone: response.data.phone || '',
      address: response.data.address || '',
      isActive: response.data.isActive || false,
      professionalProfileId: response.data.professionalProfileId || '',
      professionalPaid: response.data.professionalPaid || '',
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: null,
    role: null,
    name: null,
    email: null,
    profilePictureUrl: null,
    phone: null,
    address: null,
    isActive: null,
    professionalProfileId: null,
    professionalPaid: null
  });
  const [loading, setLoading] = useState(true);

  // Modified useEffect for initialization
  useEffect(() => {
    const initializeUser = async () => {
      const token = Cookie.get('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const { id, role } = decoded;
        // Fetch data first
        const fetchedUser = await fetchUserDataOnly(id, role, token);
        if (fetchedUser) {
          // Set state only if user data was successfully fetched
          setUser(fetchedUser);
        } else {
          // Handle case where fetching failed (e.g., invalid token, network error)
          Cookie.remove('token');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        Cookie.remove('token'); // Remove potentially invalid token
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
    // Intentionally empty dependency array to run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modified login function
  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/user/signin', { email, password });
      const { token } = response.data;
      const decoded = jwtDecode(token);
      const { id, role } = decoded;

      // Fetch user data immediately after getting the token
      const fetchedUser = await fetchUserDataOnly(id, role, token);

      if (!fetchedUser) {
        // Handle error: User data couldn't be fetched even after successful login
        console.error('Login successful but failed to fetch user data.');
        throw new Error('Failed to retrieve user details after login.');
      }

      // *** CRITICAL FIX: Check isActive from fetched data BEFORE setting cookie ***
      if (fetchedUser.isActive) {
        Cookie.set('token', token, { expires: 1 }); // Set cookie based on fetched data
      } else {
        // Optional: Handle inactive user login attempt if needed
        console.warn('Login attempt by inactive user:', email);
        // Do not set the cookie for inactive users
      }

      // Now update the state with the fetched user data
      setUser(fetchedUser);

      // Return the fetched user data along with the token
      return { ...response.data, user: fetchedUser };

    } catch (error) {
      console.error('Login error:', error);
      // Clear any potentially stale user state on login failure
      setUser({
        id: null, role: null, name: null, email: null, profilePictureUrl: null,
        phone: null, address: null, isActive: null, professionalProfileId: null, professionalPaid: null
      });
      Cookie.remove('token'); // Ensure no invalid token remains
      throw error; // Re-throw the error to be caught by the calling component
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
      phone: null,
      address: null,
      isActive: null,
      professionalProfileId: null,
      professionalPaid: null,
    });
    // Optional: Redirect to login page or home page after logout
    // window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user?.id && !!Cookie.get('token'), // Check both state and cookie
    updateUser: (newUserData) => {
      setUser((prev) => ({
        ...prev,
        ...newUserData,
      }));
    },
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
