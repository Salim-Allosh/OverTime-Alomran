import React, { useState, useEffect } from "react";

export default function PaymentMethodModal({ isOpen, onClose, onSubmit, paymentMethod = null }) {
  const [formData, setFormData] = useState({ name: "", discount_percentage: "0", is_active: true });

  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        name: paymentMethod.name || "",
        discount_percentage: paymentMethod.discount_percentage?.toString() || "0",
        is_active: paymentMethod.is_active !== undefined ? paymentMethod.is_active : true
      });
    } else {
      setFormData({ name: "", discount_percentage: "0", is_active: true });
    }
  }, [paymentMethod, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{paymentMethod ? "تعديل طريقة الدفع" : "إضافة طريقة دفع جديدة"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <input
              placeholder="مثال: Visa, Cash, Tabby"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="number"
              step="0.0001"
              min="0"
              max="1"
              placeholder="نسبة الخصم (0.0685 = 6.85%)"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
              required
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
              {paymentMethod ? "تحديث" : "إضافة"}
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

