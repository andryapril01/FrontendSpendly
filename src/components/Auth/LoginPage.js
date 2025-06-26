// src/components/Auth/LoginPage.js (FINAL FIXED VERSION)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { useAuth } from "../../contexts/AuthContext";

const LoginPage = ({ onLoginSuccess }) => {
  const {
    login,
    error: authError,
    clearError,
    isLoggedIn,
    testBackendConnection,
  } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "admin@spendly.com", // Default untuk testing
    password: "Admin123!", // Default untuk testing
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking");

  // Test backend on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isOnline = await testBackendConnection();
        setBackendStatus(isOnline ? "online" : "offline");
        console.log("Backend status updated:", isOnline ? "online" : "offline");
      } catch (error) {
        console.error("Backend check error:", error);
        setBackendStatus("offline");
      }
    };

    checkBackend();
  }, [testBackendConnection]);

  // Clear auth errors when component mounts or unmounts
  useEffect(() => {
    if (clearError) clearError();

    return () => {
      if (clearError) clearError();
    };
  }, [clearError]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      console.log("User is already logged in, redirecting to dashboard...");
      navigate("/dashboard", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear form-level errors when user makes changes
    if (errors.submit) {
      setErrors((prev) => ({
        ...prev,
        submit: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Enhanced submit handler with better error handling
  const handleSubmit = async (e) => {
    // Prevent default if this is called from form submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    console.log("🔐 === FORM SUBMIT TRIGGERED ===");

    // Clear previous errors and debug info
    setErrors({});
    setDebugInfo(null);
    if (clearError) clearError();

    // Validate form first
    if (!validateForm()) {
      console.log("❌ Form validation failed");
      return;
    }

    // Check backend status before attempting login
    if (backendStatus === "offline") {
      const offlineError =
        "Backend server tidak dapat diakses. Silakan jalankan server terlebih dahulu.";
      console.log("❌ Backend offline:", offlineError);
      setErrors({ submit: offlineError });
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Starting login process...");
      console.log("Email:", formData.email);
      console.log("Remember Me:", formData.rememberMe);

      // Call the login function from AuthContext
      const response = await login(
        formData.email,
        formData.password,
        formData.rememberMe
      );

      console.log("✅ Login function completed, response:", response);

      // Set successful debug info
      setDebugInfo({
        success: true,
        message: "Login successful!",
        hasToken: !!response?.access_token,
        hasUser: !!response?.user,
        userEmail: response?.user?.email,
      });

      // Verify we got the expected response
      if (response?.access_token) {
        console.log("✅ Access token confirmed in response");
        console.log("✅ User data:", response.user);

        // Additional token storage (for compatibility)
        if (formData.rememberMe) {
          localStorage.setItem("auth_token", response.access_token);
          sessionStorage.removeItem("auth_token");
          console.log("✅ Token saved to localStorage");
        } else {
          sessionStorage.setItem("auth_token", response.access_token);
          localStorage.removeItem("auth_token");
          console.log("✅ Token saved to sessionStorage");
        }

        // Call the onLoginSuccess callback if provided
        if (onLoginSuccess) {
          try {
            onLoginSuccess(response.access_token);
            console.log("✅ onLoginSuccess callback completed");
          } catch (callbackError) {
            console.error("⚠️ onLoginSuccess callback error:", callbackError);
            // Don't fail the login for callback errors
          }
        }

        console.log("🚀 Preparing to navigate to dashboard...");

        // Small delay to ensure state is updated
        setTimeout(() => {
          console.log("🚀 Navigating to dashboard...");
          navigate("/dashboard", { replace: true });
        }, 500);
      } else {
        console.error("❌ No access token in response");
        throw new Error("Login berhasil tetapi tidak ada token yang diterima");
      }
    } catch (error) {
      console.error("❌ LOGIN ERROR CAUGHT:", error);

      // Set error debug info
      setDebugInfo({
        success: false,
        message: error.message || "Unknown error",
        error: error.toString(),
        stack: error.stack,
      });

      let errorMessage;

      // Handle specific error messages
      if (error.message.includes("Cannot connect to backend")) {
        errorMessage =
          error.message +
          "\n\n💡 Untuk menjalankan backend:\n" +
          "1. Buka terminal di folder backend\n" +
          "2. Jalankan: python auth_simple.py\n" +
          "3. Tunggu hingga server berjalan di port 5001\n" +
          "4. Klik tombol 'Test Backend' untuk memverifikasi";
      } else if (error.message.includes("timeout")) {
        errorMessage =
          "Request timeout. Periksa koneksi internet atau status server backend.";
      } else if (error.message.includes("Network error")) {
        errorMessage =
          "Gagal terhubung ke server. Pastikan server backend berjalan.";
      } else if (error.message.includes("Invalid email or password")) {
        errorMessage = "Email atau password salah. Silakan periksa kembali.";
      } else {
        errorMessage = error.message || "Login gagal. Silakan coba lagi.";
      }

      console.error("❌ Setting error message:", errorMessage);
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setLoading(false);
      console.log("🔐 === LOGIN ATTEMPT COMPLETED ===");
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleGoToRegister = () => {
    navigate("/register");
  };

  const handleGoogleLogin = () => {
    alert("Google OAuth login - will be implemented");
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // Manual backend test button
  const handleTestBackend = async () => {
    setBackendStatus("checking");
    try {
      const isOnline = await testBackendConnection();
      setBackendStatus(isOnline ? "online" : "offline");

      if (isOnline) {
        // Clear any backend-related errors
        if (
          errors.submit &&
          errors.submit.includes("Backend server tidak dapat diakses")
        ) {
          setErrors({});
        }
      }
    } catch (error) {
      console.error("Manual backend test error:", error);
      setBackendStatus("offline");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading && backendStatus === "online") {
      handleSubmit();
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <button onClick={handleBackToHome} className="back-button">
            <svg
              className="back-icon"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali ke Beranda
          </button>
          <h2 className="login-title">Masuk ke Spendly</h2>
          <p className="login-subtitle">Kelola keuanganmu dengan mudah</p>
        </div>

        {/* Backend Status */}
        <div
          style={{
            padding: "0.75rem 1rem",
            margin: "1rem 0",
            borderRadius: "0.375rem",
            backgroundColor:
              backendStatus === "online"
                ? "#f0fdf4"
                : backendStatus === "offline"
                ? "#fef2f2"
                : "#fef3c7",
            border: `1px solid ${
              backendStatus === "online"
                ? "#bbf7d0"
                : backendStatus === "offline"
                ? "#fee2e2"
                : "#fde68a"
            }`,
            color:
              backendStatus === "online"
                ? "#16a34a"
                : backendStatus === "offline"
                ? "#dc2626"
                : "#d97706",
            fontSize: "0.875rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            Backend Status:{" "}
            {backendStatus === "online"
              ? "✅ Online"
              : backendStatus === "offline"
              ? "❌ Offline"
              : "🔄 Checking..."}
          </span>
          <button
            onClick={handleTestBackend}
            style={{
              padding: "0.25rem 0.5rem",
              border: "1px solid currentColor",
              borderRadius: "0.25rem",
              background: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
            disabled={loading}
          >
            Test Backend
          </button>
        </div>

        {/* Login Form */}
        <div className="login-form-container">
          <form onSubmit={handleSubmit} className="login-form">
            {/* Error Messages */}
            {(errors.submit || authError) && (
              <div className="error-message" style={{ whiteSpace: "pre-line" }}>
                {errors.submit || authError}
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div
                className={`debug-info ${
                  debugInfo.success ? "debug-success" : "debug-error"
                }`}
                style={{
                  backgroundColor: debugInfo.success ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${
                    debugInfo.success ? "#bbf7d0" : "#fee2e2"
                  }`,
                  color: debugInfo.success ? "#16a34a" : "#dc2626",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.375rem",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                <strong>Debug Info:</strong> {debugInfo.message}
                {debugInfo.hasToken !== undefined && (
                  <div>Token received: {debugInfo.hasToken ? "Yes" : "No"}</div>
                )}
                {debugInfo.hasUser !== undefined && (
                  <div>User data: {debugInfo.hasUser ? "Yes" : "No"}</div>
                )}
                {debugInfo.userEmail && (
                  <div>User email: {debugInfo.userEmail}</div>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="Masukkan email Anda"
                disabled={loading}
              />
              {errors.email && <p className="input-error">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className={`form-input ${errors.password ? "error" : ""}`}
                  placeholder="Masukkan password Anda"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="input-error">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <div className="remember-me">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="remember-checkbox"
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="remember-label">
                  Ingat saya
                </label>
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="forgot-password"
                disabled={loading}
              >
                Lupa password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || backendStatus === "offline"}
              className="login-button"
            >
              {loading ? (
                <>
                  <svg
                    className="loading-icon"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Backend Help */}
          {backendStatus === "offline" && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                color: "#92400e",
              }}
            >
              <strong>Backend Offline</strong>
              <p>Untuk menjalankan backend:</p>
              <ol style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                <li>Buka terminal di folder backend</li>
                <li>
                  Jalankan:{" "}
                  <code
                    style={{
                      backgroundColor: "#fff",
                      padding: "2px 4px",
                      borderRadius: "2px",
                    }}
                  >
                    python auth_simple.py
                  </code>
                </li>
                <li>Tunggu hingga server berjalan di port 5001</li>
                <li>Klik tombol "Test Backend" untuk memverifikasi</li>
              </ol>
            </div>
          )}

          {/* Divider */}
          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">Atau</span>
          </div>

          {/* OAuth Buttons */}
          <button
            onClick={handleGoogleLogin}
            className="oauth-button"
            disabled={loading}
          >
            <svg
              className="oauth-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Masuk dengan Google
          </button>

          {/* Register Link */}
          <div className="register-prompt">
            <p>
              Belum punya akun?{" "}
              <button
                onClick={handleGoToRegister}
                className="register-link"
                disabled={loading}
              >
                Daftar sekarang
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
