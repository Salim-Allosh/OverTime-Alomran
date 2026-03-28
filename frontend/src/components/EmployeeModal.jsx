import React, { useState, useEffect } from "react";

export default function EmployeeModal({ 
  show, 
  onClose, 
  onSubmit, 
  editingEmployee,
  branches
}) {
  const [formData, setFormData] = useState({
    employment_number: "",
    name: "",
    branch_id: "",
    salary: "",
    notes: "",
    is_active: true
  });

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        employment_number: editingEmployee.employment_number || "",
        name: editingEmployee.name || "",
        branch_id: editingEmployee.branch_id?.toString() || "",
        salary: editingEmployee.salary?.toString() || "",
        notes: editingEmployee.notes || "",
        is_active: editingEmployee.is_active !== undefined ? editingEmployee.is_active : true
      });
    } else {
      setFormData({
        employment_number: "",
        name: "",
        branch_id: "",
        salary: "",
        notes: "",
        is_active: true
      });
    }
  }, [editingEmployee, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
        ...formData,
        salary: parseFloat(formData.salary) || 0,
        branch_id: parseInt(formData.branch_id)
    });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <h3 style={{ fontSize: "1rem" }}>{editingEmployee ? "تعديل بيانات موظف" : "إضافة موظف جديد"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>رقم التوظيف *</label>
                <input
                  type="text"
                  value={formData.employment_number}
                  onChange={(e) => setFormData({ ...formData, employment_number: e.target.value })}
                  required
                  placeholder="رقم التوظيف"
                  className="form-control"
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>اسم الموظف *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="اسم الموظف"
                  className="form-control"
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>الفرع *</label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  required
                  className="form-control"
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                >
                  <option value="">اختر الفرع</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>الراتب الحالي *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                  placeholder="0.00"
                  className="form-control"
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية"
                  className="form-control"
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%", minHeight: "80px", resize: "vertical" }}
                />
              </div>
              
              <div style={{ marginTop: "0.5rem" }}>
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
            <button className="btn primary" type="submit" style={{ minWidth: "100px" }}>
              {editingEmployee ? "تحديث" : "إضافة"}
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
