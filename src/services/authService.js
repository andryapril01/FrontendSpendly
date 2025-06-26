// src/services/authService.js

/**
 * Auth Service - Handles communication with auth backend
 */
const API_URL = process.env.REACT_APP_AUTH_URL;

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise} - API response
 */
export const register = async (userData) => {
     try {
       const response = await fetch(`${API_URL}/api/auth/register`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify(userData),
       });

       const data = await response.json();

       if (!response.ok) {
         throw new Error(data.error || "Registration failed");
       }
       return data;
     } catch (error) {
       throw error;
     }
   };

/**
 * Login user
 * @param {Object} credentials - User credentials
 * @returns {Promise} - API response with tokens
 */
export const login = async (credentials) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    // Store tokens in localStorage
    localStorage.setItem("accessToken", data.access_token);
    localStorage.setItem("refreshToken", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

/**
 * Get user profile
 * @returns {Promise} - User profile data
 */
export const getProfile = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${BASE_URL}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const success = await refreshToken();
        if (success) {
          return getProfile(); // Retry with new token
        } else {
          throw new Error("Session expired. Please login again.");
        }
      }
      throw new Error(data.error || "Failed to get profile");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise} - Updated profile
 */
export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${BASE_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const success = await refreshToken();
        if (success) {
          return updateProfile(profileData); // Retry with new token
        } else {
          throw new Error("Session expired. Please login again.");
        }
      }
      throw new Error(data.error || "Failed to update profile");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 * @returns {Promise<boolean>} - Success status
 */
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      logout();
      return false;
    }

    const data = await response.json();
    localStorage.setItem("accessToken", data.access_token);
    return true;
  } catch (error) {
    logout();
    return false;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} - Authentication status
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};

/**
 * Get current user
 * @returns {Object|null} - User data or null if not logged in
 */
export const getCurrentUser = () => {
  const userJson = localStorage.getItem("user");
  return userJson ? JSON.parse(userJson) : null;
};
