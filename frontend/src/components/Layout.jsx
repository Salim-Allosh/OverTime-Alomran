import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import LoginModal from "./LoginModal";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [userInfo, setUserInfo] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (token) {
      apiGet("/auth/me", token)
        .then(setUserInfo)
        .catch(() => {
          setUserInfo(null);
          setToken("");
          localStorage.removeItem("token");
        });
    } else {
      setUserInfo(null);
    }
  }, [token]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setShowLoginModal(false);
    navigate("/drafts");
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
    setUserInfo(null);
    navigate("/");
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-right">مركز العمران للتدريب والتطوير</div>
        <nav className="header-nav">
            <Link 
              to="/"
              className={location.pathname === "/" ? "active" : ""}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              الرئيسية
            </Link>
            {token ? (
              <>
                <Link 
                  to="/drafts"
                  className={location.pathname === "/drafts" ? "active" : ""}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                  </svg>
                  المسودات
                </Link>
                <Link 
                  to="/reports"
                  className={location.pathname === "/reports" ? "active" : ""}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  التقارير الشهرية
                </Link>
                <Link 
                  to="/contracts"
                  className={location.pathname === "/contracts" ? "active" : ""}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                  العقود
                </Link>
                <Link 
                  to="/daily-reports"
                  className={location.pathname === "/daily-reports" ? "active" : ""}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  التقارير اليومية
                </Link>
                {userInfo && userInfo.is_super_admin && (
                  <Link 
                    to="/admin"
                    className={location.pathname === "/admin" ? "active" : ""}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                    </svg>
                    لوحة التحكم
                  </Link>
                )}
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  تسجيل الخروج
                </a>
              </>
            ) : (
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowLoginModal(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                تسجيل الدخول
              </a>
            )}
          </nav>
        )}
      </header>

      {children}

      <footer className="footer">This app Created By Salim Alu</footer>
      
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

