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

  const handleLogin = async (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setShowLoginModal(false);
    
    // جلب معلومات المستخدم للتحقق من نوع الحساب
    try {
      const userInfo = await apiGet("/auth/me", newToken);
      // إذا كان سوبر أدمن أو مدير مبيعات، يتم توجيهه إلى صفحة الإحصائيات
      if ((userInfo.is_super_admin || userInfo.is_sales_manager) && !userInfo.is_backdoor) {
        navigate("/statistics");
      } else if (userInfo.is_operation_manager && !userInfo.is_backdoor) {
        // مدير العمليات يتم توجيهه إلى صفحة المسودات
        navigate("/drafts");
      } else {
        navigate("/drafts");
      }
    } catch (error) {
      // في حالة الخطأ، التوجيه الافتراضي إلى المسودات
      navigate("/drafts");
    }
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
        <div className="header-right">
          <span style={{ 
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.5px"
          }}>
            مركز العمران للتدريب والتطوير
          </span>
        </div>
        <nav className="header-nav">
            {!token || !userInfo ? (
              <Link 
                to="/"
                className={location.pathname === "/" ? "active" : ""}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                الرئيسية
              </Link>
            ) : null}
            {token && userInfo ? (
              <>
                {(userInfo.is_super_admin || userInfo.is_sales_manager) && !userInfo.is_backdoor ? (
                  <>
                    {userInfo.is_super_admin && (
                      <>
                        <Link 
                          to="/reports"
                          className={location.pathname === "/reports" ? "active" : ""}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                          </svg>
                          تقارير الإضافي
                        </Link>
                      </>
                    )}
                    <Link 
                      to="/daily-sales-reports"
                      className={location.pathname === "/daily-sales-reports" ? "active" : ""}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                      تقارير المبيعات
                    </Link>
                    <Link 
                      to="/statistics"
                      className={location.pathname === "/statistics" ? "active" : ""}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                      </svg>
                      الإحصائيات
                    </Link>
                    {userInfo.is_super_admin && (
                      <Link 
                        to="/net-profit"
                        className={location.pathname === "/net-profit" ? "active" : ""}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                        </svg>
                        صافي الأرباح
                      </Link>
                    )}
                    <Link 
                      to="/admin"
                      className={location.pathname === "/admin" ? "active" : ""}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                      </svg>
                      الإعدادات
                    </Link>
                  </>
                ) : (
                  <>
                    {/* المسودات وتقارير الإضافي تظهر فقط لمدير العمليات */}
                    {userInfo?.is_operation_manager && !userInfo?.is_backdoor && (
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
                      </>
                    )}
                    {!userInfo?.is_operation_manager && (
                      <>
                        {(userInfo && userInfo.is_backdoor) && (
                          <Link 
                            to="/daily-sales-reports"
                            className={location.pathname === "/daily-sales-reports" ? "active" : ""}
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                            </svg>
                            تقارير المبيعات
                          </Link>
                        )}
                        <Link 
                          to="/statistics"
                          className={location.pathname === "/statistics" ? "active" : ""}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                          </svg>
                          الإحصائيات
                        </Link>
                      </>
                    )}
                    {(userInfo?.is_sales_manager || userInfo?.is_backdoor) && (
                      <Link 
                        to="/sales-staff"
                        className={location.pathname === "/sales-staff" ? "active" : ""}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        موظفو المبيعات
                      </Link>
                    )}
                    {(userInfo && userInfo.is_backdoor) && (
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
                  </>
                )}
                {userInfo && (
                  <div style={{ 
                    borderLeft: "2px solid rgba(255, 255, 255, 0.2)",
                    paddingRight: "1.5rem",
                    paddingLeft: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.9)"
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "16px", height: "16px" }}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span>
                      {userInfo.is_backdoor ? "باكدور" :
                       userInfo.is_super_admin ? "Super Admin" :
                       userInfo.is_sales_manager ? "مدير مبيعات" :
                       userInfo.is_operation_manager ? "مدير أوبريشن" :
                       userInfo.is_branch_account ? "حساب الفرع" :
                       "موظف"}
                    </span>
                  </div>
                )}
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  style={{ 
                    borderLeft: "2px solid rgba(255, 255, 255, 0.2)",
                    paddingRight: "1.5rem",
                    paddingLeft: "1.5rem"
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
                style={{ 
                  borderLeft: "2px solid rgba(255, 255, 255, 0.2)",
                  paddingRight: "1.5rem",
                  paddingLeft: "1.5rem",
                  background: "rgba(90, 122, 205, 0.2)"
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                تسجيل الدخول
              </a>
            )}
          </nav>
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

