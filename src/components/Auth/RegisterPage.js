// src/components/Auth/RegisterPage.js (Fixed Navigation)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import { useAuth } from "../../contexts/AuthContext";

const RegisterPage = () => {
  const { register, error: authError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const passwordValidation = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

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
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Nama depan wajib diisi";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Nama belakang wajib diisi";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = "Nomor telepon wajib diisi";
    } else if (!/^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(formData.phone)) {
      newErrors.phone = "Format nomor telepon tidak valid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (!Object.values(passwordValidation).every(Boolean)) {
      newErrors.password = "Password tidak memenuhi kriteria keamanan";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "Anda harus menyetujui syarat dan ketentuan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      // Connect to backend registration API
      const response = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword, // jika backend butuh ini
        phone: formData.phone,
      });

      // Show success message
      setSuccessMessage("Registrasi berhasil! Silakan login dengan akun Anda.");

      // Clear form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        agreeToTerms: false,
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      // Display error message
      setErrors({
        submit:
          error.message ||
          "Terjadi kesalahan saat registrasi. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleGoogleSignup = () => {
    alert("Google OAuth signup - will be implemented");
  };

  const PasswordCriteriaItem = ({ isValid, label }) => (
    <div
      className={`criteria-item ${
        isValid ? "criteria-valid" : "criteria-invalid"
      }`}
    >
      {isValid ? (
        <svg
          className="criteria-icon"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg
          className="criteria-icon"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Header */}
        <div className="register-header">
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
          <h2 className="register-title">Daftar ke Spendly</h2>
          <p className="register-subtitle">
            Mulai perjalanan keuangan yang lebih baik
          </p>
        </div>

        {/* Registration Form */}
        <div className="register-form-container">
          <div className="register-form">
            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            {authError && <div className="error-message">{authError}</div>}

            {successMessage && (
              <div
                className="success-message"
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#16a34a",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.375rem",
                  marginBottom: "1rem",
                }}
              >
                {successMessage}
              </div>
            )}

            {/* Name Fields */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  Nama Depan *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`form-input ${errors.firstName ? "error" : ""}`}
                  placeholder="Masukkan nama depan"
                />
                {errors.firstName && (
                  <p className="input-error">{errors.firstName}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Nama Belakang *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`form-input ${errors.lastName ? "error" : ""}`}
                  placeholder="Masukkan nama belakang"
                />
                {errors.lastName && (
                  <p className="input-error">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="Masukkan email Anda"
              />
              {errors.email && <p className="input-error">{errors.email}</p>}
            </div>

            {/* Phone Field */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Nomor Telepon *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${errors.phone ? "error" : ""}`}
                placeholder="Contoh: 081234567890"
              />
              {errors.phone && <p className="input-error">{errors.phone}</p>}
              <p className="input-hint">
                Format: 08xxxxxxxxxx atau +62xxxxxxxxxx
              </p>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password *
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? "error" : ""}`}
                  placeholder="Masukkan password Anda"
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowPassword(!showPassword)}
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
              {formData.password && (
                <div className="password-strength">
                  <div className="password-criteria">
                    Password harus memiliki:
                  </div>
                  <div className="criteria-list">
                    <PasswordCriteriaItem
                      isValid={passwordValidation.minLength}
                      label="Minimal 8 karakter"
                    />
                    <PasswordCriteriaItem
                      isValid={passwordValidation.hasUppercase}
                      label="Huruf besar"
                    />
                    <PasswordCriteriaItem
                      isValid={passwordValidation.hasLowercase}
                      label="Huruf kecil"
                    />
                    <PasswordCriteriaItem
                      isValid={passwordValidation.hasNumber}
                      label="Angka"
                    />
                    <PasswordCriteriaItem
                      isValid={passwordValidation.hasSpecialChar}
                      label="Karakter khusus"
                    />
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="input-error">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Konfirmasi Password *
              </label>
              <div className="password-input-container">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.confirmPassword ? "error" : ""
                  }`}
                  placeholder="Ulangi password Anda"
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && (
                <p className="input-error">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="form-group">
              <div className="terms-checkbox">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="terms-input"
                />
                <label htmlFor="agreeToTerms" className="terms-label">
                  Saya setuju dengan{" "}
                  <button className="terms-link">Syarat dan Ketentuan</button>{" "}
                  serta{" "}
                  <button className="terms-link">Kebijakan Privasi</button>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="input-error">{errors.agreeToTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="register-button"
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
                  Mendaftar...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">Atau</span>
            </div>

            {/* OAuth Buttons */}
            <button onClick={handleGoogleSignup} className="oauth-button">
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
              Daftar dengan Google
            </button>

            {/* Login Link */}
            <div className="login-prompt">
              <p>
                Sudah punya akun?{" "}
                <button onClick={handleGoToLogin} className="login-link">
                  Masuk sekarang
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
