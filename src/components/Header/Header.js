import React from "react";
import "./Header.css";

const Header = ({ toggleSidebar, onLogout }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const toggleNotifications = () => setShowNotifications(!showNotifications);
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
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
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="search-bar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Search..." />
        </div>
      </div>
      <div className="header-right">
        <button className="notification-btn" onClick={toggleNotifications}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notification-badge">3</span>
        </button>
        {showNotifications && (
          <div className="notifications-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button className="mark-all-read">Mark all as read</button>
            </div>
            <div className="notification-list">
              <div className="notification-item unread">
                <div className="notification-icon success">
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
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="notification-content">
                  <p>Transaksi berhasil ditambahkan</p>
                  <span className="notification-time">2 menit yang lalu</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon warning">
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="notification-content">
                  <p>Pengingat pembayaran tagihan</p>
                  <span className="notification-time">1 jam yang lalu</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <button onClick={onLogout} className="logout-btn" style={{marginLeft: '16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer'}}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
