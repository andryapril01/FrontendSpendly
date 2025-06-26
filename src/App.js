// src/App.js (Updated with Emergency Auth Fix)

import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import Scanner from "./components/Scanner/Scanner";
import Sidebar from "./components/Sidebar/Sidebar";
import Header from "./components/Header/Header";
import HomePage from "./Home/HomePage";
import LoginPage from "./components/Auth/LoginPage";
import RegisterPage from "./components/Auth/RegisterPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Transaction from "./components/Transaction/Transaction";
import AddIncome from "./components/Transaction/AddIncome";
import Budget from "./components/Budget/Budget";
import Reminders from "./components/Reminders";
import OnboardingModal from "./components/Dashboard/OnboardingModal";
import "./App.css";

// Emergency Auth Fix Component
const EmergencyAuthFix = () => {
  const { clearTokens } = useAuth();
  const [isFixing, setIsFixing] = useState(false);
  const [fixResults, setFixResults] = useState([]);

  const AUTH_API_URL =
    process.env.REACT_APP_AUTH_URL || "http://localhost:5001";

  const performEmergencyFix = async () => {
    setIsFixing(true);
    setFixResults([]);

    try {
      setFixResults(["🧹 Clearing all stored data..."]);
      clearTokens();

      setFixResults((prev) => [...prev, "🌐 Testing backend connection..."]);
      const backendResponse = await fetch(`${AUTH_API_URL}/api/health`, {
        method: 'GET', // Make sure it's GET, if that's what the server expects
        credentials: 'include', // Include credentials (cookies, etc.) for CORS support
        headers: {
          'Content-Type': 'application/json', // Add Content-Type if needed
          'Authorization': `Bearer ${yourAuthToken}` // If you're using JWT or other auth methods, include the token
        }
      });


      if (!backendResponse.ok) {
        setFixResults((prev) => [
          ...prev,
          `❌ Backend not responding at ${AUTH_API_URL}`,
        ]);
        setFixResults((prev) => [
          ...prev,
          "💡 Make sure your backend server is running on port 5001",
        ]);
        return;
      }

      setFixResults((prev) => [...prev, "✅ Backend is responding"]);

      setFixResults((prev) => [...prev, "🔐 Performing fresh login..."]);
      const loginResponse = await fetch(`${AUTH_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@spendly.com",
          password: "Admin123!",
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.access_token) {
        // Store tokens directly
        localStorage.setItem("access_token", loginData.access_token);
        localStorage.setItem("auth_token", loginData.access_token);
        if (loginData.refresh_token) {
          localStorage.setItem("refresh_token", loginData.refresh_token);
        }
        if (loginData.user) {
          localStorage.setItem("user", JSON.stringify(loginData.user));
        }

        setFixResults((prev) => [...prev, "✅ Fresh login successful!"]);
        setFixResults((prev) => [...prev, "📊 Testing dashboard access..."]);

        // Test dashboard
        const dashboardResponse = await fetch(
          `${AUTH_API_URL}/api/dashboard/summary`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${loginData.access_token}`,
            },
          }
        );

        if (dashboardResponse.ok) {
          setFixResults((prev) => [...prev, "✅ Dashboard access successful!"]);
          setFixResults((prev) => [...prev, "🎉 Emergency fix completed!"]);
          setFixResults((prev) => [...prev, "🔄 Reloading page..."]);

          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setFixResults((prev) => [
            ...prev,
            "❌ Dashboard access still failing",
          ]);
        }
      } else {
        setFixResults((prev) => [
          ...prev,
          `❌ Login failed: ${loginData.error || "Unknown error"}`,
        ]);
      }
    } catch (error) {
      setFixResults((prev) => [...prev, `❌ Fix failed: ${error.message}`]);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#fff",
        border: "2px solid #ef4444",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        zIndex: 10000,
        width: "90%",
        maxWidth: "500px",
        maxHeight: "80vh",
        overflow: "auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#ef4444", margin: "0 0 8px 0" }}>
          🚨 Authentication Problem
        </h2>
        <p style={{ margin: "0", color: "#6b7280" }}>
          Your tokens are missing. Let's fix this automatically!
        </p>
      </div>

      {fixResults.length > 0 && (
        <div
          style={{
            background: "#000",
            color: "#0f0",
            padding: "12px",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "12px",
            marginBottom: "16px",
            maxHeight: "200px",
            overflow: "auto",
          }}
        >
          {fixResults.map((result, index) => (
            <div key={index}>{result}</div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <button
          onClick={performEmergencyFix}
          disabled={isFixing}
          style={{
            background: isFixing ? "#6b7280" : "#ef4444",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "8px",
            cursor: isFixing ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {isFixing ? "🔧 Fixing..." : "🚑 Auto Fix Now"}
        </button>

        <button
          onClick={() => (window.location.href = "/login")}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          🔐 Manual Login
        </button>
      </div>
    </div>
  );
};

// Layout untuk halaman yang membutuhkan sidebar dan header
const DashboardLayout = ({
  children,
  sidebarOpen,
  toggleSidebar,
  onLogout,
}) => {
  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onLogout={onLogout} onLinkClick={toggleSidebar} />
      <div className={`main-content ${sidebarOpen ? "" : "expanded"}`}>
        <Header toggleSidebar={toggleSidebar} onLogout={onLogout} />
        <div className="page-container">{children}</div>
      </div>
    </div>
  );
};

// Main App container that uses the AuthProvider
const AppContainer = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// The actual App content that uses the auth context
function AppContent() {
  const { isLoggedIn, logout, loading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEmergencyFix, setShowEmergencyFix] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check for authentication issues
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      const isProtectedRoute =
        location.pathname.startsWith("/dashboard") ||
        location.pathname.startsWith("/scanner") ||
        location.pathname.startsWith("/transactions") ||
        location.pathname.startsWith("/budgets") ||
        location.pathname.startsWith("/reports") ||
        location.pathname.startsWith("/reminders");

      if (isProtectedRoute) {
        // Check if there are any stored tokens
        const hasAnyToken =
          localStorage.getItem("access_token") ||
          localStorage.getItem("auth_token") ||
          sessionStorage.getItem("access_token") ||
          sessionStorage.getItem("auth_token");

        if (hasAnyToken) {
          // Tokens exist but user is not logged in = authentication problem
          setShowEmergencyFix(true);
        } else {
          // No tokens = normal redirect to login
          navigate("/login", { replace: true });
        }
      }
    }
  }, [isLoggedIn, loading, location, navigate]);

  // Redirect to dashboard if authenticated and on auth routes
  useEffect(() => {
    if (isLoggedIn && !loading) {
      if (location.pathname === "/login" || location.pathname === "/register") {
        navigate("/dashboard", { replace: true });
      }
      setShowEmergencyFix(false); // Hide emergency fix if logged in
    }
  }, [isLoggedIn, loading, location, navigate]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // Show emergency fix if needed
  if (showEmergencyFix) {
    return <EmergencyAuthFix />;
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <>
      <OnboardingModal />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <DashboardLayout
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
              >
                <Dashboard user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/scanner"
          element={
            isLoggedIn ? (
              <DashboardLayout
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
              >
                <Scanner />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Tambahkan rute untuk halaman lain seperti transactions, budgets, dll. */}
        <Route
          path="/transactions"
          element={
            isLoggedIn ? (
              <DashboardLayout
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
              >
                <Transaction />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/budgets"
          element={
            isLoggedIn ? (
              <DashboardLayout
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
              >
                <Budget />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/reminders"
          element={
            isLoggedIn ? (
              <DashboardLayout
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
              >
                <Reminders />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/add-income"
          element={
            isLoggedIn ? (
              <DashboardLayout
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
              >
                <AddIncome />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback route */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </>
  );
}

export default AppContainer;
