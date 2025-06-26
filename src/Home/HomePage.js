// src/Home/HomePage.js (Updated with React Router)

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 8h.01"></path>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <path d="M21 15l-5-5L5 21"></path>
        </svg>
      ),
      title: "Pemindaian Struk Otomatis",
      description:
        "Cukup foto struk belanja, sistem akan otomatis mengekstrak data transaksi dengan teknologi OCR canggih.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18"></path>
          <path d="m19 9-5 5-4-4-3 3"></path>
        </svg>
      ),
      title: "Analisis Pengeluaran",
      description:
        "Visualisasi data yang mudah dipahami untuk melihat pola pengeluaran dan mengoptimalkan keuangan Anda.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
      ),
      title: "Pengingat Pembayaran",
      description:
        "Jangan lewatkan tagihan penting dengan sistem pengingat yang dapat disesuaikan dengan kebutuhan Anda.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1v22"></path>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      title: "Manajemen Anggaran",
      description:
        "Tetapkan batas anggaran untuk setiap kategori dan dapatkan notifikasi saat mendekati batas tersebut.",
    },
  ];

  const stats = [
    { number: "65.43%", label: "Tingkat Literasi Keuangan Indonesia" },
    { number: "9+ Juta", label: "Mahasiswa Aktif di Indonesia" },
    { number: "100+", label: "Format Struk yang Didukung" },
    { number: "95%", label: "Akurasi Pemindaian OCR" },
  ];

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    // After logout, user will automatically be redirected to home due to App.js logic
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">Spendly</div>
          <div className="nav-buttons">
            {isLoggedIn ? (
              <>
                <button onClick={handleDashboardClick} className="login-button">
                  Dashboard
                </button>
                <button onClick={handleLogout} className="register-button">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <button onClick={handleLoginClick} className="login-button">
                  Masuk
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="register-button"
                >
                  Daftar
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">
            Kelola Keuanganmu dengan
            <span className="hero-title-highlight"> Teknologi AI</span>
          </h1>
          <p className="hero-description">
            Spendly membantu Anda mencatat pengeluaran secara otomatis dengan
            teknologi OCR, menganalisis pola keuangan, dan membuat keputusan
            finansial yang lebih bijak.
          </p>
          <div className="hero-buttons">
            <button
              onClick={handleRegisterClick}
              className="hero-primary-button"
            >
              Mulai Gratis
            </button>
            <button className="hero-secondary-button">
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Fitur Unggulan Spendly</h2>
            <p className="section-subtitle">
              Teknologi terdepan untuk mengelola keuangan dengan mudah
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-header">
            <h2 className="stats-title">Mengapa Spendly?</h2>
            <p className="stats-subtitle">
              Data dan fakta yang mendukung pengembangan Spendly
            </p>
          </div>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">Cara Kerja Spendly</h2>
            <p className="section-subtitle">
              Hanya 4 langkah mudah untuk mengelola keuangan Anda
            </p>
          </div>
          <div className="steps-grid">
            {[
              {
                step: "1",
                title: "Upload Struk",
                description: "Foto atau upload struk belanja Anda",
              },
              {
                step: "2",
                title: "Ekstraksi Otomatis",
                description: "AI akan menganalisis dan mengekstrak data",
              },
              {
                step: "3",
                title: "Review & Simpan",
                description: "Periksa data dan simpan transaksi",
              },
              {
                step: "4",
                title: "Analisis & Insight",
                description: "Dapatkan insight pengeluaran Anda",
              },
            ].map((item, index) => (
              <div key={index} className="step-item">
                <div className="step-number">{item.step}</div>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">
            Siap Mengelola Keuangan dengan Lebih Baik?
          </h2>
          <p className="cta-description">
            Bergabunglah dengan ribuan pengguna yang sudah merasakan kemudahan
            Spendly
          </p>
          <button onClick={handleRegisterClick} className="cta-button">
            Daftar Sekarang - Gratis!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <h3 className="footer-logo">Spendly</h3>
              <p className="footer-about">
                Platform manajemen keuangan dengan teknologi AI untuk kehidupan
                yang lebih sejahtera.
              </p>
            </div>
            <div>
              <h4 className="footer-section-title">Produk</h4>
              <ul className="footer-links">
                <li className="footer-link">Pemindaian Struk</li>
                <li className="footer-link">Analisis Keuangan</li>
                <li className="footer-link">Manajemen Anggaran</li>
                <li className="footer-link">Pengingat Pembayaran</li>
              </ul>
            </div>
            <div>
              <h4 className="footer-section-title">Perusahaan</h4>
              <ul className="footer-links">
                <li className="footer-link">Tentang Kami</li>
                <li className="footer-link">Blog</li>
                <li className="footer-link">Karir</li>
                <li className="footer-link">Kontak</li>
              </ul>
            </div>
            <div>
              <h4 className="footer-section-title">Dukungan</h4>
              <ul className="footer-links">
                <li className="footer-link">Pusat Bantuan</li>
                <li className="footer-link">Tutorial</li>
                <li className="footer-link">Kebijakan Privasi</li>
                <li className="footer-link">Syarat & Ketentuan</li>
              </ul>
            </div>
          </div>
          <div className="footer-copyright">
            <p>&copy; 2025 Spendly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
