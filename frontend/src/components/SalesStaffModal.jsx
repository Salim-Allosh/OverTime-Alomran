import React, { useState, useEffect } from "react";
import { apiGet } from "../api";

export default function SalesStaffModal({ 
  show, 
  onClose, 
  onSubmit, 
  editingStaff,
  branches,
  isSuperAdmin = false,
  userBranchId = null
}) {
  const [formData, setFormData] = useState({
    branch_id: "",
    name: "",
    phone: "",
    email: "",
    is_active: true
  });

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        branch_id: editingStaff.branch_id?.toString() || "",
        name: editingStaff.name || "",
        phone: editingStaff.phone || "",
        email: editingStaff.email || "",
        is_active: editingStaff.is_active !== undefined ? editingStaff.is_active : true
      });
    } else {
      setFormData({
        branch_id: userBranchId ? userBranchId.toString() : "",
        name: "",
        phone: "",
        email: "",
        is_active: true
      });
    }
  }, [editingStaff, show, userBranchId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <h3 style={{ fontSize: "1rem" }}>{editingStaff ? "تعديل موظف مبيعات" : "إضافة موظف مبيعات"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>الفرع *</label>
                {isSuperAdmin ? (
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    required
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                  >
                    <option value="">اختر الفرع</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={branches.find(b => b.id === userBranchId)?.name || ""}
                    disabled
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%", backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                  />
                )}
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>اسم الموظف *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="اسم الموظف"
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف (اختياري)"
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="البريد الإلكتروني (اختياري)"
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                />
              </div>
              
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: 600 }}>نشط</span>
                </label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn primary" type="submit">
              {editingStaff ? "تحديث" : "إضافة"}
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

