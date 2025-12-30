import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";

export default function SalesStaffPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({
    branch_id: "",
    name: "",
    phone: "",
    email: "",
    is_active: true
  });
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  useEffect(() => {
    if (!token) return;
    
    apiGet("/auth/me", token)
      .then(setUserInfo)
      .catch(console.error);
    
    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);
    
    loadStaff();
  }, [token, selectedBranchId]);

  const loadStaff = async () => {
    try {
      let url = "/sales-staff";
      if (selectedBranchId) url += `?branch_id=${selectedBranchId}`;
      
      const data = await apiGet(url, token);
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading staff:", err);
      setStaff([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/sales-staff", {
        ...form,
        branch_id: parseInt(form.branch_id),
        phone: form.phone || null,
        email: form.email || null
      }, token);
      success("تم إنشاء موظف المبيعات بنجاح!");
      resetForm();
      setShowForm(false);
      loadStaff();
    } catch (err) {
      showError("حدث خطأ أثناء إنشاء موظف المبيعات: " + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    try {
      await apiPatch(`/sales-staff/${editingStaff.id}`, {
        name: form.name || undefined,
        phone: form.phone || null,
        email: form.email || null,
        is_active: form.is_active
      }, token);
      success("تم تحديث موظف المبيعات بنجاح!");
      setShowForm(false);
      setEditingStaff(null);
      loadStaff();
    } catch (err) {
      showError("حدث خطأ أثناء تحديث موظف المبيعات: " + err.message);
    }
  };

  const handleDelete = async (staffId) => {
    confirm(
      "هل أنت متأكد من حذف هذا الموظف؟",
      async () => {
        try {
          await apiDelete(`/sales-staff/${staffId}`, token);
          success("تم حذف موظف المبيعات بنجاح!");
          loadStaff();
        } catch (err) {
          showError("حدث خطأ أثناء حذف الموظف");
        }
      }
    );
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setForm({
      branch_id: staffMember.branch_id.toString(),
      name: staffMember.name,
      phone: staffMember.phone || "",
      email: staffMember.email || "",
      is_active: staffMember.is_active !== undefined ? staffMember.is_active : true
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      branch_id: branches.length > 0 ? branches[0].id.toString() : "",
      name: "",
      phone: "",
      email: "",
      is_active: true
    });
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض موظفي المبيعات</p>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحيات
  if (!userInfo || (!userInfo.is_super_admin && !userInfo.is_sales_manager && !userInfo.is_backdoor)) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="main-title">إدارة موظفي المبيعات - مركز العمران للتدريب والتطوير</h1>
      <div className="container">
        <div className="panel">
          <div className="filters-bar">
            <h3 style={{ fontSize: "13px", margin: 0, fontWeight: 600 }}>قائمة موظفي المبيعات</h3>
            <select 
              value={selectedBranchId || ""} 
              onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">جميع الفروع</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button className="btn primary" onClick={() => {
              setEditingStaff(null);
              resetForm();
              setShowForm(true);
            }}>
              إضافة موظف
            </button>
          </div>

          {showForm && (
            <form className="panel" style={{ marginBottom: "1rem", backgroundColor: "#f8f9fa" }} onSubmit={editingStaff ? handleUpdate : handleCreate}>
              <h4>{editingStaff ? "تعديل الموظف" : "إضافة موظف جديد"}</h4>
              <div className="grid">
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  required
                  disabled={editingStaff !== null}
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                >
                  <option value="">اختر الفرع</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <input
                  placeholder="اسم الموظف"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="رقم الهاتف (اختياري)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="البريد الإلكتروني (اختياري)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  مفعّل
                </label>
              </div>
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <button className="btn primary" type="submit">
                  {editingStaff ? "تحديث" : "إضافة"}
                </button>
                <button className="btn" type="button" onClick={() => {
                  setShowForm(false);
                  setEditingStaff(null);
                }}>إلغاء</button>
              </div>
            </form>
          )}

          {staff.length === 0 ? (
            <div className="table-container">
              <table>
                <tbody>
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>لا يوجد موظفو مبيعات حالياً</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>الفرع</th>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>البريد الإلكتروني</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(staffMember => (
                    <tr key={staffMember.id}>
                      <td>{getBranchName(staffMember.branch_id)}</td>
                      <td>{staffMember.name}</td>
                      <td>{staffMember.phone || "-"}</td>
                      <td>{staffMember.email || "-"}</td>
                      <td>
                        <span className={`status status-${staffMember.is_active ? "active" : "inactive"}`}>
                          {staffMember.is_active ? "مفعّل" : "معطّل"}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-small" 
                          style={{ marginLeft: "0.5rem" }}
                          onClick={() => handleEdit(staffMember)}
                        >
                          تعديل
                        </button>
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(staffMember.id)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
