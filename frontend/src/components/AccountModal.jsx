import React, { useState, useEffect } from "react";

export default function AccountModal({ isOpen, onClose, onSubmit, account = null, branches = [], isSuperAdmin = false, userBranchId = null }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    branch_id: "",
    account_type: "",
    is_active: true
  });

  useEffect(() => {
    if (account) {
      let accountType = "";
      if (account.is_super_admin) accountType = "super_admin";
      else if (account.is_sales_manager) accountType = "sales_manager";
      else if (account.is_operation_manager) accountType = "operation_manager";
      else if (account.is_branch_account) accountType = "branch_account";
      
      setFormData({
        username: account.username || "",
        password: "",
        branch_id: account.branch_id?.toString() || "",
        account_type: accountType,
        is_active: account.is_active !== undefined ? account.is_active : true
      });
    } else {
      setFormData({
        username: "",
        password: "",
        branch_id: userBranchId?.toString() || "",
        account_type: "",
        is_active: true
      });
    }
  }, [account, isOpen, userBranchId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h3>{account ? "تعديل الحساب" : "إنشاء حساب جديد"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <input
              placeholder="اسم المستخدم"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder={account ? "كلمة المرور (اختياري)" : "كلمة المرور"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!account}
              minLength={account ? 0 : 6}
            />
            <select
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              required
              disabled={!isSuperAdmin && userBranchId}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "14px" }}
            >
              <option value="">اختر الفرع</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
              required
              style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "14px" }}
            >
              <option value="">اختر نوع الحساب</option>
              {isSuperAdmin && (
                <option value="super_admin">Super Admin</option>
              )}
              <option value="operation_manager">مدير أوبريشن</option>
              <option value="sales_manager">مدير مبيعات</option>
              <option value="branch_account">حساب الفرع (عرض فقط)</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "13px", cursor: "pointer", marginTop: "0.5rem" }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>مفعّل</span>
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn secondary" type="submit">
              {account ? "تحديث" : "إنشاء"}
            </button>
            <button className="btn" type="button" onClick={onClose}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

