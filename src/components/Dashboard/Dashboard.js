// src/components/Dashboard/Dashboard.js (Fixed Version with Better Session Management)

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  LabelList
} from "recharts";

const Dashboard = () => {
  const { user, makeAuthenticatedRequest, isLoggedIn, logout, forceLogout } =
    useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    recentTransactions: [],
    expenseDistribution: [],
    budgetStatus: [],
    upcomingPayments: [],
  });
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const hasFetchedRef = useRef(false);

  // API endpoint
  const AUTH_API_URL =
    process.env.REACT_APP_AUTH_URL || "http://localhost:5001";

  // Session expired handler
  const handleSessionExpired = () => {
    console.log("🚨 Session expired detected");
    setSessionExpired(true);
    setError("Your session has expired. Please login again.");

    // Clear any ongoing operations
    setLoading(false);
    setRefreshing(false);

    // Force logout after a short delay to show the message
    setTimeout(() => {
      forceLogout();
    }, 3000);
  };

  // Enhanced fetch function with better error handling
  const makeSecureRequest = async (url, retryCount = 0, maxRetries = 2) => {
    try {
      console.log(`🔗 Making request to: ${url} (attempt ${retryCount + 1})`);

      const response = await makeAuthenticatedRequest(url);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        if (response.status === 401) {
          console.log("🔑 Received 401 - Authentication failed");
          throw new Error("AUTHENTICATION_FAILED");
        } else {
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      }

      return response;
    } catch (error) {
      console.error(`❌ Request failed for ${url}:`, error);

      if (error.message === "AUTHENTICATION_FAILED") {
        handleSessionExpired();
        throw error;
      }

      // Retry for network errors
      if (
        retryCount < maxRetries &&
        (error.message.includes("fetch") ||
          error.message.includes("Network") ||
          error.message.includes("timeout"))
      ) {
        console.log(`🔄 Retrying request (${retryCount + 1}/${maxRetries})`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return makeSecureRequest(url, retryCount + 1, maxRetries);
      }

      throw error;
    }
  };

  // Fetch dashboard data with improved error handling and loading states
  const fetchDashboardData = async (showLoading = true) => {
    if (!isLoggedIn) {
      console.log("❌ User not logged in, cannot fetch dashboard data");
      setError("Please login to access dashboard data");
      return;
    }

    if (sessionExpired) {
      console.log("❌ Session expired, not fetching data");
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log("📊 === FETCHING DASHBOARD DATA ===");
      console.log("👤 User:", user?.email);
      console.log("🌐 API URL:", AUTH_API_URL);

      // Define endpoints
      const endpoints = [
        { url: `${AUTH_API_URL}/api/dashboard/summary`, key: "summary" },
        {
          url: `${AUTH_API_URL}/api/dashboard/recent-transactions`,
          key: "recentTransactions",
        },
        {
          url: `${AUTH_API_URL}/api/dashboard/expense-distribution`,
          key: "expenseDistribution",
        },
        {
          url: `${AUTH_API_URL}/api/dashboard/budget-status`,
          key: "budgetStatus",
        },
        {
          url: `${AUTH_API_URL}/api/dashboard/upcoming-payments`,
          key: "upcomingPayments",
        },
      ];

      console.log("🚀 Making dashboard API requests...");

      // Make requests with better error handling
      const results = {};
      let hasAnyError = false;
      const errors = [];

      for (const endpoint of endpoints) {
        try {
          const response = await makeSecureRequest(endpoint.url);
          const data = await response.json();
          results[endpoint.key] = data;
          console.log(`✅ ${endpoint.key}: Success`);
        } catch (error) {
          console.error(`❌ ${endpoint.key}: ${error.message}`);

          if (error.message === "AUTHENTICATION_FAILED") {
            // Stop processing if authentication failed
            return;
          }

          // Set default empty data for failed endpoints
          results[endpoint.key] = getDefaultData(endpoint.key);
          hasAnyError = true;
          errors.push(`${endpoint.key}: ${error.message}`);
        }
      }

      // Update dashboard data
      setDashboardData({
        summary: results.summary || getDefaultData("summary"),
        recentTransactions: results.recentTransactions || [],
        expenseDistribution: results.expenseDistribution || [],
        budgetStatus: results.budgetStatus || [],
        upcomingPayments: results.upcomingPayments || [],
      });

      console.log("✅ Dashboard data loaded successfully");

      // Show warning if some data failed to load
      if (hasAnyError && errors.length > 0) {
        console.warn("⚠️ Some dashboard data failed to load:", errors);
        // You could show a toast notification here instead of setting error
      }
    } catch (error) {
      console.error("❌ Critical error fetching dashboard data:", error);

      if (error.message === "AUTHENTICATION_FAILED") {
        // Already handled by makeSecureRequest
        return;
      }

      setError(error.message || "Failed to fetch dashboard data");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Get default data for failed endpoints
  const getDefaultData = (key) => {
    const defaults = {
      summary: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        balance: 0,
        savingsGoal: 0,
        expenseChange: 0,
      },
      recentTransactions: [],
      expenseDistribution: [],
      budgetStatus: [],
      upcomingPayments: [],
    };
    return defaults[key] || {};
  };

  // Initial data fetch
  useEffect(() => {
    if (!isLoggedIn) {
      console.log("⚠️ User not logged in");
      setLoading(false);
      return;
    }

    if (sessionExpired) {
      return;
    }

    // Prevent multiple fetches
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchDashboardData();
  }, [isLoggedIn, sessionExpired]);

  // Manual refresh with better UX
  const handleRefresh = async () => {
    if (sessionExpired) {
      forceLogout();
      return;
    }

    setRefreshing(true);
    console.log("🔄 Manual dashboard refresh triggered");

    try {
      await fetchDashboardData(false); // Don't show main loading spinner
    } catch (error) {
      console.error("❌ Refresh failed:", error);
      if (error.message !== "AUTHENTICATION_FAILED") {
        setError("Failed to refresh dashboard. Please try again.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Retry with reset
  const handleRetry = () => {
    if (sessionExpired) {
      forceLogout();
      return;
    }

    console.log("🔄 Retrying dashboard data fetch");
    setError(null);
    hasFetchedRef.current = false;
    fetchDashboardData();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (typeof amount !== "number" || isNaN(amount)) {
      return "Rp 0";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (typeof value !== "number" || isNaN(value)) {
      return "0%";
    }
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="dashboard">
        <div className="login-prompt">
          <h2>Authentication Required</h2>
          <p>Please login to access your dashboard.</p>
          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = "/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show session expired message
  if (sessionExpired) {
    return (
      <div className="dashboard">
        <div className="session-expired">
          <h2>Session Expired</h2>
          <p>
            Your session has expired. You will be redirected to login shortly.
          </p>
          <div className="session-expired-actions">
            <button className="btn btn-primary" onClick={forceLogout}>
              Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state with better UX
  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
          <p className="loading-subtext">This may take a few moments</p>
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => {
                setLoading(false);
                setError("Loading cancelled. Click retry to try again.");
              }}
              className="btn btn-outline"
              disabled={refreshing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state with better options
  if (error && !sessionExpired) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <h2>Dashboard Error</h2>
          <p className="error-message">{error}</p>
          <div className="error-details">
            <details>
              <summary>Technical Details</summary>
              <p>User: {user?.email || "Unknown"}</p>
              <p>API URL: {AUTH_API_URL}</p>
              <p>Time: {new Date().toLocaleString()}</p>
            </details>
          </div>
          <div className="error-actions">
            <button onClick={handleRetry} className="btn btn-primary">
              🔄 Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
              style={{ marginLeft: "10px" }}
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={logout}
              className="btn btn-secondary"
              style={{ marginLeft: "10px" }}
            >
              🚪 Logout & Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    summary,
    recentTransactions,
    expenseDistribution,
    budgetStatus,
    upcomingPayments,
  } = dashboardData;

  // Safe calculations
  const savingsPercentage =
    summary.savingsGoal > 0
      ? Math.min((summary.balance / summary.savingsGoal) * 100, 100)
      : 0;

  const expenseChangeColor =
    (summary.expenseChange || 0) >= 0 ? "negative" : "positive";

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="page-title">
          Selamat datang, {user?.firstName || user?.name || "User"}! 👋
        </h1>

        <div className="dashboard-actions">
          <button
            onClick={handleRefresh}
            className="btn btn-primary"
            disabled={refreshing || sessionExpired}
            style={{ marginRight: "10px" }}
          >
            {refreshing ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>

          <button
            onClick={() => (window.location.href = "/scanner")}
            className="btn btn-success"
            disabled={sessionExpired}
            style={{ marginRight: "10px" }}
          >
            📱 Add Transaction
          </button>

          <button onClick={logout} className="btn btn-outline">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon income">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
          <div className="summary-info">
            <span>Monthly Income</span>
            <h3>{formatCurrency(summary.monthlyIncome || 0)}</h3>
            <span className="summary-change positive">Target bulanan</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon expense">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
              <polyline points="17 18 23 18 23 12"></polyline>
            </svg>
          </div>
          <div className="summary-info">
            <span>Monthly Expenses</span>
            <h3>{formatCurrency(summary.monthlyExpenses || 0)}</h3>
            <span className={`summary-change ${expenseChangeColor}`}>
              {formatPercentage(summary.expenseChange || 0)} from last month
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon balance">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="summary-info">
            <span>Balance</span>
            <h3>{formatCurrency(summary.balance || 0)}</h3>
            <span
              className={`summary-change ${
                (summary.balance || 0) >= 0 ? "positive" : "negative"
              }`}
            >
              Sisa bulan ini
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon savings">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="summary-info">
            <span>Savings Goal</span>
            <h3>{formatCurrency(summary.savingsGoal || 0)}</h3>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${Math.max(0, Math.min(savingsPercentage, 100))}%`,
                }}
              ></div>
            </div>
            <span className="summary-change">
              {Math.round(savingsPercentage)}% achieved
            </span>
          </div>
        </div>
      </div>

      <div className="cashflow-progress-bars-only">
        <div className="progress-row">
          <div className="progress-label-left">Expenses</div>
          <div className="progress-label-right">
            {summary.monthlyIncome > 0 ? Math.round((summary.monthlyExpenses / summary.monthlyIncome) * 100) : 0}%
            <span className="progress-amount">{formatCurrency(summary.monthlyExpenses || 0)}</span>
          </div>
        </div>
        <div className="progress-bar-wrapper">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill expense" style={{width: `${summary.monthlyIncome > 0 ? Math.min((summary.monthlyExpenses / summary.monthlyIncome) * 100, 100) : 0}%`}}></div>
          </div>
        </div>
        <div className="progress-row">
          <div className="progress-label-left">Savings</div>
          <div className="progress-label-right">
            {summary.monthlyIncome > 0 ? Math.round((Math.max(0, summary.balance) / summary.monthlyIncome) * 100) : 0}%
            <span className="progress-amount">{formatCurrency(Math.max(0, summary.balance || 0))}</span>
          </div>
        </div>
        <div className="progress-bar-wrapper">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill savings" style={{width: `${summary.monthlyIncome > 0 ? Math.min((Math.max(0, summary.balance) / summary.monthlyIncome) * 100, 100) : 0}%`}}></div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <div className="left-column">
          {/* Expense Chart */}
          <div className="card expense-chart">
            <div className="card-header">
              <h2 className="section-title">Expense Distribution</h2>
              <select className="time-filter">
                <option>This Month</option>
                <option>Last Month</option>
                <option>Last 3 Months</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="chart-container">
              {expenseDistribution && expenseDistribution.length > 0 ? (
                <div className="chart-content">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={expenseDistribution}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {expenseDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || `hsl(${index * 60}, 70%, 50%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-legend">
                    {expenseDistribution.map((item, index) => (
                      <div key={index} className="legend-item">
                        <span
                          className="legend-color"
                          style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
                        ></span>
                        <span className="legend-label">
                          {item.category || "Unknown"} ({item.percentage || 0}%)
                        </span>
                        <span className="legend-amount">
                          {formatCurrency(item.amount || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No expense data available</p>
                  <p>Start adding transactions to see your spending patterns</p>
                  <button
                    onClick={() => (window.location.href = "/scanner")}
                    className="btn btn-primary"
                    style={{ marginTop: "10px" }}
                    disabled={sessionExpired}
                  >
                    Add Transaction
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Budget Status */}
          <div className="card budget-status">
            <div className="card-header">
              <h2 className="section-title">Budget Status</h2>
              <button className="btn btn-outline">View All</button>
            </div>
            <div className="budget-list">
              {budgetStatus && budgetStatus.length > 0 ? (
                budgetStatus.map((budget, index) => (
                  <div key={index} className="budget-item">
                    <div className="budget-info">
                      <div className="budget-category">
                        <span
                          className="category-icon"
                          style={{ color: budget.color || "#666" }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                        </span>
                        <span>{budget.category || "Unknown Category"}</span>
                      </div>
                      <div className="budget-amount">
                        <span className="spent">
                          {formatCurrency(budget.spent || 0)}
                        </span>
                        <span className="total">
                          / {formatCurrency(budget.budget || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="budget-progress">
                      <div className="progress-bar">
                        <div
                          className={`progress ${budget.status || "normal"}`}
                          style={{
                            width: `${Math.min(budget.percentage || 0, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span
                        className={`progress-text ${budget.status || "normal"}`}
                      >
                        {budget.percentage || 0}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No budget data available</p>
                  <p>Set up budgets for your categories</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-column">
          {/* Recent Transactions */}
          <div className="card recent-transactions">
            <div className="card-header">
              <h2 className="section-title">Recent Transactions</h2>
              <button className="btn btn-outline">View All</button>
            </div>
            <div className="transaction-list">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div
                    className="transaction-item"
                    key={transaction.id || index}
                  >
                    <div className="transaction-date">
                      {transaction.date
                        ? new Date(transaction.date).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                            }
                          )
                        : "Unknown"}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-merchant">
                        {transaction.merchant ||
                          transaction.merchantName ||
                          transaction.description ||
                          "Unknown Merchant"}
                      </div>
                      <div className="transaction-category">
                        {transaction.category || "Uncategorized"}
                      </div>
                    </div>
                    <div className="transaction-amount expense">
                      {formatCurrency(transaction.amount || 0)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No transactions yet</p>
                  <p>
                    Start by scanning a receipt or adding a transaction manually
                  </p>
                  <button
                    onClick={() => (window.location.href = "/scanner")}
                    className="btn btn-primary"
                    style={{ marginTop: "10px" }}
                    disabled={sessionExpired}
                  >
                    Add Transaction
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="card upcoming-payments">
            <div className="card-header">
              <h2 className="section-title">Upcoming Payments</h2>
              <button className="btn btn-outline">View All</button>
            </div>
            <div className="payment-list">
              {upcomingPayments && upcomingPayments.length > 0 ? (
                upcomingPayments.map((payment, index) => (
                  <div key={payment.id || index} className="payment-item">
                    <div
                      className={`payment-icon ${payment.icon || "default"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="payment-details">
                      <div className="payment-title">
                        {payment.title || "Payment"}
                      </div>
                      <div className="payment-due">
                        Due{" "}
                        {payment.dueDate
                          ? new Date(payment.dueDate).toLocaleDateString(
                              "id-ID"
                            )
                          : "Unknown"}
                      </div>
                    </div>
                    <div className="payment-amount">
                      {formatCurrency(payment.amount || 0)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No upcoming payments</p>
                  <p>Set up reminders for recurring bills</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
