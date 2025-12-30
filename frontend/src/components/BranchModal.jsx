import React, { useState, useEffect } from "react";

export default function BranchModal({ isOpen, onClose, onSubmit, branch = null }) {
  const [formData, setFormData] = useState({ name: "", default_hourly_rate: "" });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || "",
        default_hourly_rate: branch.default_hourly_rate || ""
      });
    } else {
      setFormData({ name: "", default_hourly_rate: "" });
    }
  }, [branch, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{branch ? "تعديل الفرع" : "إضافة فرع جديد"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <input
              placeholder="اسم الفرع"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="سعر الساعة الافتراضي"
              value={formData.default_hourly_rate}
              onChange={(e) => setFormData({ ...formData, default_hourly_rate: e.target.value })}
              required
            />
          </div>
          <div className="modal-footer">
            <button className="btn secondary" type="submit">
              {branch ? "تحديث" : "إضافة"}
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

