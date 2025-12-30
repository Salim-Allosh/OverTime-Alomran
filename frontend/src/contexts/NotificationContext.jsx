import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type, // 'success' or 'error'
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const success = (message, duration) => {
    return showNotification(message, 'success', duration);
  };

  const error = (message, duration) => {
    return showNotification(message, 'error', duration);
  };

  // Confirm dialog replacement
  const confirm = (message, onConfirm, onCancel) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type: 'confirm',
      onConfirm: () => {
        if (onConfirm) onConfirm();
        removeNotification(id);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        removeNotification(id);
      }
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  };

  return (
    <NotificationContext.Provider value={{ success, error, confirm, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
        pointerEvents: 'none'
      }}
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onRemove }) => {
  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';
  const isConfirm = notification.type === 'confirm';

  const backgroundColor = isSuccess ? '#28a745' : isError ? '#dc3545' : '#007bff';
  const borderColor = isSuccess ? '#1e7e34' : isError ? '#c82333' : '#0056b3';

  return (
    <div
      style={{
        backgroundColor,
        color: 'white',
        padding: '1rem 1.25rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${borderColor}`,
        minWidth: '300px',
        maxWidth: '400px',
        pointerEvents: 'auto',
        animation: 'slideInRight 0.3s ease-out',
        fontFamily: 'Cairo, Arial, sans-serif',
        direction: 'rtl'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
          {/* Icon */}
          <div style={{ marginTop: '2px', flexShrink: 0 }}>
            {isSuccess && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {isError && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            {isConfirm && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
          </div>
          
          {/* Message */}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', fontWeight: '500' }}>
              {notification.message}
            </p>
            
            {/* Confirm buttons */}
            {isConfirm && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={notification.onCancel}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'Cairo',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={notification.onConfirm}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'Cairo',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  تأكيد
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Close button (only for success/error, not confirm) */}
        {!isConfirm && (
          <button
            onClick={() => onRemove(notification.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginTop: '2px',
              opacity: 0.8,
              transition: 'opacity 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '0.8';
            }}
            title="إغلاق"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

