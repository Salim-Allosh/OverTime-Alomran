import React, { useState, useEffect } from "react";

export default function ExpenseCategoryModal({ isOpen, onClose, onSubmit, category = null }) {
  const [formData, setFormData] = useState({ name: "", is_active: true });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        is_active: category.is_active !== undefined ? category.is_active : true
      });
    } else {
      setFormData({ name: "", is_active: true });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{category ? "تعديل مصروف" : "إضافة مصروف جديد"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <input
              placeholder="اسم المصروف"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="form-control"
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "13px", cursor: "pointer", marginTop: "1rem" }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>نشط</span>
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn secondary" type="submit" style={{ backgroundColor: "var(--color-primary)", color: "white" }}>
              {category ? "تحديث" : "إضافة"}
            </button>
            <button className="btn" type="button" onClick={onClose} style={{ marginLeft: "0.5rem" }}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
