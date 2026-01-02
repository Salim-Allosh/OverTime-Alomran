import React, { useState } from "react";
import { authService } from "../features/auth/services/authService";
import { useNotification } from "../contexts/NotificationContext";

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const { error } = useNotification();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.login(username, password);
      onLogin(res.access_token);
      setUsername("");
      setPassword("");
    } catch (err) {
      error("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>تسجيل الدخول للموظفين</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <input
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="modal-footer">
            <button className="btn secondary" type="submit">تسجيل الدخول</button>
            <button className="btn" type="button" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}


