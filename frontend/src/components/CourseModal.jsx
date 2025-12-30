import React, { useState, useEffect } from "react";

export default function CourseModal({ isOpen, onClose, onSubmit, course = null }) {
  const [formData, setFormData] = useState({ name: "", type: "", is_active: true });

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || "",
        type: course.type || "",
        is_active: course.is_active !== undefined ? course.is_active : true
      });
    } else {
      setFormData({ name: "", type: "", is_active: true });
    }
  }, [course, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{course ? "تعديل الكورس" : "إضافة كورس جديد"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <input
              placeholder="اسم الكورس"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              placeholder="نوع الكورس (اختياري)"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "13px", cursor: "pointer", marginTop: "0.5rem" }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>نشط</span>
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn secondary" type="submit">
              {course ? "تحديث" : "إضافة"}
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

