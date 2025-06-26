// src/contexts/AuthContext.js (FINAL FIXED VERSION)

import React, { createContext, useState, useContext, useEffect } from "react";

// Create the context
const AuthContext = createContext(null);

// Base API URL with fallback
const API_URL = process.env.REACT_APP_AUTH_URL || "http://localhost:5001";

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokenRefreshInProgress, setTokenRefreshInProgress] = useState(false);

  // Enhanced token management
  const getStoredToken = () => {
    try {
      return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("auth_token")
      );
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  const getStoredRefreshToken = () => {
    try {
      return (
        localStorage.getItem("refresh_token") ||
        sessionStorage.getItem("refresh_token")
      );
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  };

  const getStoredUser = () => {
    try {
      const userStr =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error getting stored user:", error);
      return null;
    }
  };

  const setStoredToken = (token, refreshToken = null, persistent = true) => {
    try {
      console.log("💾 Storing tokens...");

      if (persistent) {
        localStorage.setItem("access_token", token);
        localStorage.setItem("auth_token", token);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
        // Clear session storage
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("refresh_token");
      } else {
        sessionStorage.setItem("access_token", token);
        sessionStorage.setItem("auth_token", token);
        if (refreshToken) {
          sessionStorage.setItem("refresh_token", refreshToken);
        }
        // Clear local storage
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
      }

      console.log("✅ Tokens stored successfully");
    } catch (error) {
      console.error("Error setting tokens:", error);
    }
  };

  const clearTokens = () => {
    console.log("🧹 Clearing all tokens and user data");
    try {
      ["access_token", "auth_token", "refresh_token", "user"].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
    setUser(null);
    setIsLoggedIn(false);
    setError(null);
    setTokenRefreshInProgress(false);
  };

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime + 300; // 5 minute buffer
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  };

  // FIXED: Test backend connectivity with better error handling
  const testBackendConnection = async () => {
    try {
      console.log("🌐 Testing backend connection to:", API_URL);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_URL}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend is responding:", data.status);
        return true;
      } else {
        console.error(
          "❌ Backend health check failed:",
          response.status,
          response.statusText
        );
        return false;
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("❌ Backend connection timeout after 8 seconds");
      } else {
        console.error("❌ Backend connection error:", error.message);
      }
      return false;
    }
  };

  // Enhanced refresh token function
  const refreshToken = async () => {
    if (tokenRefreshInProgress) {
      console.log("🔄 Token refresh already in progress, waiting...");
      let attempts = 0;
      while (tokenRefreshInProgress && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      return getStoredToken();
    }

    setTokenRefreshInProgress(true);

    try {
      console.log("🔄 Attempting token refresh...");

      const refreshTokenValue = getStoredRefreshToken();
      if (!refreshTokenValue) {
        console.error("❌ No refresh token available");
        throw new Error("No refresh token available");
      }

      if (isTokenExpired(refreshTokenValue)) {
        console.error("❌ Refresh token has expired");
        throw new Error("Refresh token expired");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${refreshTokenValue}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Refresh token failed:", errorData);
        throw new Error(errorData.error || "Token refresh failed");
      }

      const data = await response.json();
      const persistent = !!localStorage.getItem("access_token");
      setStoredToken(data.access_token, refreshTokenValue, persistent);

      console.log("✅ Token refreshed successfully");
      return data.access_token;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      clearTokens();
      throw error;
    } finally {
      setTokenRefreshInProgress(false);
    }
  };

  // Enhanced API request with CORS and error handling
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getStoredToken();

    console.log(`🌐 Making authenticated request to: ${url}`);
    console.log(`🔑 Token available: ${!!token}`);

    if (!token) {
      console.error("❌ No authentication token available");
      throw new Error("No authentication token available");
    }

    // Check if token is about to expire and refresh if needed
    if (isTokenExpired(token)) {
      console.log("🔄 Token expired, refreshing before request...");
      try {
        token = await refreshToken();
        if (!token) {
          throw new Error("Failed to refresh token");
        }
      } catch (error) {
        console.error("Pre-request token refresh failed:", error);
        throw new Error("Authentication failed after token refresh");
      }
    }

    // Enhanced request options with CORS support
    const requestOptions = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    };

    try {
      // First attempt with current token
      let response = await fetch(url, requestOptions);

      // If 401, try refreshing token once
      if (response.status === 401) {
        console.log("🔄 Got 401, attempting token refresh...");

        try {
          const newToken = await refreshToken();
          if (!newToken) {
            throw new Error("Token refresh returned null");
          }

          // Retry with new token
          requestOptions.headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(url, requestOptions);

          if (response.status === 401) {
            throw new Error("Authentication failed after token refresh");
          }
        } catch (refreshError) {
          console.error("Token refresh in request failed:", refreshError);
          clearTokens();
          throw new Error("Authentication failed after token refresh");
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;

        try {
          const jsonError = JSON.parse(errorText);
          errorMessage =
            jsonError.error || jsonError.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      console.error("❌ Authenticated request failed:", error);

      if (
        error.message.includes("Authentication failed") ||
        error.message.includes("No authentication token available")
      ) {
        console.log("🚨 Authentication error detected");
      }

      throw error;
    }
  };

  // FINAL FIXED: Enhanced login function with comprehensive error handling
  const login = async (email, password, rememberMe = true) => {
    // Clear any existing errors first
    setError(null);
    setLoading(true);

    try {
      console.log("🔐 === LOGIN ATTEMPT START ===");
      console.log("Email:", email);
      console.log("API URL:", API_URL);
      console.log("Remember me:", rememberMe);

      // Validate inputs
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Test backend connectivity first
      console.log("🌐 Testing backend connection...");
      const backendOnline = await testBackendConnection();
      if (!backendOnline) {
        throw new Error(
          `Cannot connect to backend server at ${API_URL}. Please ensure the server is running on port 5001.`
        );
      }

      console.log("✅ Backend connection successful");

      // FIXED: Prepare login data
      const loginData = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      };

      console.log("🔐 Sending login request with data:", {
        email: loginData.email,
        password: "[HIDDEN]",
      });

      // FIXED: Enhanced fetch with comprehensive error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginData),
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("🔐 Login response status:", response.status);
      console.log(
        "🔐 Login response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // FIXED: Better response handling with detailed logging
      let data;
      const responseText = await response.text();
      console.log("🔐 Raw response text:", responseText);

      // Try to parse JSON response
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log("🔐 Parsed response data:", data);
        } catch (parseError) {
          console.error("❌ Failed to parse response JSON:", parseError);
          console.error("❌ Response text was:", responseText);
          throw new Error(
            `Server returned invalid JSON response. Status: ${response.status}`
          );
        }
      } else {
        console.error("❌ Empty response from server");
        throw new Error(
          `Empty response from server. Status: ${response.status}`
        );
      }

      // Check if request was successful
      if (!response.ok) {
        const errorMessage =
          data?.error ||
          data?.message ||
          `Login request failed with status ${response.status}`;
        console.error("❌ Login request failed:", errorMessage);
        console.error("❌ Full error response:", data);
        throw new Error(errorMessage);
      }

      // Validate response data structure
      if (!data) {
        console.error("❌ No data in successful response");
        throw new Error("No data received from server");
      }

      if (!data.access_token) {
        console.error("❌ No access token in response");
        console.error("❌ Response data:", data);
        throw new Error("No access token received from server");
      }

      console.log(
        "✅ Access token received:",
        data.access_token.substring(0, 50) + "..."
      );

      // Store tokens with consistent naming
      console.log("💾 Storing authentication data...");
      setStoredToken(data.access_token, data.refresh_token, rememberMe);

      // Validate and store user data
      if (data.user) {
        console.log("👤 User data received:", data.user);

        const userData = {
          ...data.user,
          name:
            `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() ||
            data.user.email,
        };

        console.log("👤 Processed user data:", userData);

        // Update React state
        setUser(userData);
        setIsLoggedIn(true);

        // Store user data in storage
        const userStr = JSON.stringify(userData);
        if (rememberMe) {
          localStorage.setItem("user", userStr);
          sessionStorage.removeItem("user");
        } else {
          sessionStorage.setItem("user", userStr);
          localStorage.removeItem("user");
        }

        console.log("✅ Login successful for user:", userData.email);
        console.log("✅ User state updated, isLoggedIn:", true);
      } else {
        console.error("❌ No user data in response");
        console.error("❌ Full response:", data);
        throw new Error("No user data received from server");
      }

      // Clear any existing errors
      setError(null);

      console.log("🎉 LOGIN COMPLETED SUCCESSFULLY");
      return data;
    } catch (err) {
      console.error("❌ LOGIN ERROR CAUGHT:", err);

      let errorMessage;

      if (err.name === "AbortError") {
        errorMessage =
          "Login request timeout. Please check your connection and try again.";
      } else if (err.message.includes("Cannot connect to backend")) {
        errorMessage = err.message;
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else {
        errorMessage = err.message || "Login failed due to unknown error";
      }

      console.error("❌ Final error message:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
      console.log("🔐 === LOGIN ATTEMPT END ===");
    }
  };

  // Enhanced register function
  const register = async (userData) => {
    setError(null);
    setLoading(true);

    try {
      console.log("📝 === REGISTRATION ATTEMPT ===");
      console.log("Registration data:", { ...userData, password: "[HIDDEN]" });

      const backendOnline = await testBackendConnection();
      if (!backendOnline) {
        throw new Error(
          `Cannot connect to backend server at ${API_URL}. Please ensure the server is running on port 5001.`
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(
          `Server returned invalid response: ${response.status} ${response.statusText}`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      console.log("✅ Registration successful");

      // If registration returns tokens, automatically log in
      if (data.access_token) {
        setStoredToken(data.access_token, data.refresh_token, true);

        if (data.user) {
          const user = {
            ...data.user,
            name: `${data.user.firstName} ${data.user.lastName}`,
          };
          setUser(user);
          setIsLoggedIn(true);
          localStorage.setItem("user", JSON.stringify(user));
        }
      }

      return data;
    } catch (err) {
      if (err.name === "AbortError") {
        const timeoutError =
          "Registration timeout. Please check your connection and try again.";
        setError(timeoutError);
        throw new Error(timeoutError);
      }
      console.error("❌ Registration error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced profile retrieval
  const getProfile = async () => {
    try {
      console.log("👤 Fetching user profile...");

      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/auth/profile`
      );
      const userData = await response.json();

      const user = {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
      };

      setUser(user);
      setIsLoggedIn(true);

      // Update stored user data
      const userStr = JSON.stringify(user);
      if (localStorage.getItem("access_token")) {
        localStorage.setItem("user", userStr);
      } else {
        sessionStorage.setItem("user", userStr);
      }

      console.log("✅ Profile retrieved for user:", userData.email);
      return user;
    } catch (error) {
      console.error("❌ Get profile error:", error);
      throw error;
    }
  };

  // Profile update function
  const updateProfile = async (profileData) => {
    try {
      console.log("👤 Updating user profile...");

      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/auth/profile`,
        {
          method: "PUT",
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();
      const updatedUser = {
        ...(data.user || data),
        name: `${data.user?.firstName || data.firstName} ${
          data.user?.lastName || data.lastName
        }`,
      };

      setUser(updatedUser);

      // Update stored user data
      const userStr = JSON.stringify(updatedUser);
      if (localStorage.getItem("access_token")) {
        localStorage.setItem("user", userStr);
      } else {
        sessionStorage.setItem("user", userStr);
      }

      console.log("✅ Profile updated successfully");
      return data;
    } catch (error) {
      console.error("❌ Update profile error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async (redirectToLogin = true) => {
    try {
      console.log("🚪 Logging out...");

      // Try to notify backend about logout
      const token = getStoredToken();
      if (token && !isTokenExpired(token)) {
        try {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          });
        } catch (error) {
          console.log("Logout notification failed (not critical):", error);
        }
      }
    } catch (error) {
      console.log("Logout error (not critical):", error);
    } finally {
      // Always clear tokens
      clearTokens();

      if (redirectToLogin) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    }
  };

  // Force logout without backend notification
  const forceLogout = () => {
    console.log("🚪 Force logout due to authentication failure");
    clearTokens();
    window.location.href = "/login";
  };

  // Check auth status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("🔍 Checking authentication status...");

        const token = getStoredToken();
        const storedUser = getStoredUser();

        console.log("🔍 Found token:", !!token);
        console.log("🔍 Found user:", !!storedUser);

        if (token && storedUser && !isTokenExpired(token)) {
          console.log("✅ Found valid existing token and user data");

          setUser(storedUser);
          setIsLoggedIn(true);

          console.log("✅ Authentication restored for:", storedUser.email);

          // Validate token in background
          try {
            await getProfile();
          } catch (error) {
            console.log("Background profile validation failed:", error);
            // Don't force logout here immediately
          }
        } else {
          console.log("⚠️ No valid authentication found");
          clearTokens();
        }
      } catch (error) {
        console.error("❌ Auth status check failed:", error);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Debug helper function
  const getAuthDebugInfo = () => {
    return {
      isLoggedIn,
      hasUser: !!user,
      userEmail: user?.email,
      hasToken: !!getStoredToken(),
      hasRefreshToken: !!getStoredRefreshToken(),
      tokenExpired: getStoredToken() ? isTokenExpired(getStoredToken()) : true,
      apiUrl: API_URL,
      localStorage: {
        access_token: !!localStorage.getItem("access_token"),
        auth_token: !!localStorage.getItem("auth_token"),
        refresh_token: !!localStorage.getItem("refresh_token"),
        user: !!localStorage.getItem("user"),
      },
      sessionStorage: {
        access_token: !!sessionStorage.getItem("access_token"),
        auth_token: !!sessionStorage.getItem("auth_token"),
        refresh_token: !!sessionStorage.getItem("refresh_token"),
        user: !!sessionStorage.getItem("user"),
      },
    };
  };

  // Context value with all functions
  const value = {
    user,
    isLoggedIn,
    loading,
    error,
    login,
    register,
    logout,
    forceLogout,
    getProfile,
    updateProfile,
    makeAuthenticatedRequest,
    refreshToken,
    clearError,
    testBackendConnection,
    clearTokens,
    getAuthDebugInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a hook for easy context use
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
