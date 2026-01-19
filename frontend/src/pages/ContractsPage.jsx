import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";

export default function ContractsPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [contracts, setContracts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [form, setForm] = useState({
    branch_id: "",
    teacher_name: "",
    student_name: "",
    client_phone: "",
    course_id: "",
    contract_number: "",
    start_date: "",
    end_date: "",
    hourly_rate: ""
  });
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    if (!token) return;

    apiGet("/auth/me", token)
      .then(setUserInfo)
      .catch(console.error);

    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);

    apiGet("/courses", token)
      .then(setCourses)
      .catch(console.error);

    loadContracts();
  }, [token, selectedBranchId, selectedStatus]);

  const loadContracts = async () => {
    try {
      let url = "/contracts";
      const params = [];
      if (selectedBranchId) params.push(`branch_id=${selectedBranchId}`);
      if (selectedStatus) params.push(`status=${selectedStatus}`);
      if (params.length > 0) url += "?" + params.join("&");

      const data = await apiGet(url, token);
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading contracts:", err);
      setContracts([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/contracts", {
        ...form,
        branch_id: parseInt(form.branch_id),
        course_id: form.course_id ? parseInt(form.course_id) : null,
        hourly_rate: parseFloat(form.hourly_rate),
        end_date: form.end_date || null,
        client_phone: form.client_phone || null
      }, token);
      success("تم إنشاء العقد بنجاح!");
      setForm({
        branch_id: "",
        teacher_name: "",
        student_name: "",
        client_phone: "",
        course_id: "",
        contract_number: "",
        start_date: "",
        end_date: "",
        hourly_rate: ""
      });
      setShowForm(false);
      loadContracts();
    } catch (err) {
      showError("حدث خطأ أثناء إنشاء العقد: " + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingContract) return;

    try {
      const updateData = {
        ...form,
        branch_id: parseInt(form.branch_id),
        course_id: form.course_id ? parseInt(form.course_id) : undefined,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
        end_date: form.end_date || null,
        client_phone: form.client_phone || undefined
      };
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      await apiPatch(`/contracts/${editingContract.id}`, updateData, token);
      success("تم تحديث العقد بنجاح!");
      setShowForm(false);
      setEditingContract(null);
      loadContracts();
    } catch (err) {
      showError("حدث خطأ أثناء تحديث العقد: " + err.message);
    }
  };

  const handleDelete = async (contractId) => {
    // حساب عدد العقود التابعة (الدفعات القديمة المرتبطة)
    const childrenCount = contracts.filter(c => c.parent_contract_id === contractId).length;

    let confirmMsg = "هل أنت متأكد من حذف هذا العقد؟";
    if (childrenCount > 0) {
      confirmMsg = `هذا العقد مرتبط به عدد (${childrenCount}) من العقود/الدفعات التابعة. حذف هذا العقد سيؤدي إلى حذف جميع هذه التوابع. هل أنت متأكد؟`;
    }

    confirm(
      confirmMsg,
      async () => {
        try {
          await apiDelete(`/contracts/${contractId}`, token);
          success("تم حذف العقد بنجاح!");
          loadContracts();
        } catch (err) {
          showError("حدث خطأ أثناء حذف العقد");
        }
      }
    );
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setForm({
      branch_id: contract.branch_id.toString(),
      teacher_name: contract.teacher_name || "",
      student_name: contract.student_name || "",
      client_phone: contract.client_phone || "",
      course_id: contract.course_id ? contract.course_id.toString() : "",
      contract_number: contract.contract_number || "",
      start_date: contract.start_date || "",
      end_date: contract.end_date || "",
      hourly_rate: contract.hourly_rate ? contract.hourly_rate.toString() : ""
    });
    setShowForm(true);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض العقود</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="main-title">إدارة العقود - مركز العمران للتدريب والتطوير</h1>
      <div className="container">
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>قائمة العقود</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <select
                value={selectedBranchId || ""}
                onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.85rem" }}
              >
                <option value="">جميع الفروع</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.85rem" }}
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
              <button className="btn primary" onClick={() => {
                setEditingContract(null);
                setForm({
                  branch_id: branches.length > 0 ? branches[0].id.toString() : "",
                  teacher_name: "",
                  student_name: "",
                  client_phone: "",
                  course_id: "",
                  contract_number: "",
                  start_date: "",
                  end_date: "",
                  hourly_rate: ""
                });
                setShowForm(true);
              }}>
                إضافة عقد جديد
              </button>
            </div>
          </div>

          {showForm && (
            <form className="panel" style={{ marginBottom: "1rem", backgroundColor: "#f8f9fa" }} onSubmit={editingContract ? handleUpdate : handleCreate}>
              <h4>{editingContract ? "تعديل العقد" : "إضافة عقد جديد"}</h4>
              <div className="grid">
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  required
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                >
                  <option value="">اختر الفرع</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <input
                  placeholder="اسم المدرس"
                  value={form.teacher_name}
                  onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                  required
                />
                <input
                  placeholder="اسم الطالب"
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  required
                />
                <input
                  placeholder="رقم هاتف العميل"
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                />
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                >
                  <option value="">اختر نوع الدورة</option>
                  {courses.filter(c => c.is_active !== false).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  placeholder="رقم العقد"
                  value={form.contract_number}
                  onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                  required
                />
                <input
                  type="date"
                  placeholder="تاريخ البدء"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
                <input
                  type="date"
                  placeholder="تاريخ الانتهاء (اختياري)"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="سعر الساعة"
                  value={form.hourly_rate}
                  onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <button className="btn primary" type="submit">
                  {editingContract ? "تحديث" : "إضافة"}
                </button>
                <button className="btn" type="button" onClick={() => {
                  setShowForm(false);
                  setEditingContract(null);
                }}>إلغاء</button>
              </div>
            </form>
          )}

          {contracts.length === 0 ? (
            <div className="table-container">
              <table>
                <tbody>
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>لا توجد عقود حالياً</td>
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
                    <th>المدرس</th>
                    <th>الطالب</th>
                    <th>رقم العقد</th>
                    <th>تاريخ البدء</th>
                    <th>تاريخ الانتهاء</th>
                    <th style={{ textAlign: "left" }}>سعر الساعة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(contract => (
                    <tr key={contract.id}>
                      <td>{getBranchName(contract.branch_id)}</td>
                      <td>{contract.teacher_name}</td>
                      <td>{contract.student_name}</td>
                      <td>{contract.contract_number}</td>
                      <td>{contract.start_date}</td>
                      <td>{contract.end_date || "-"}</td>
                      <td className="number" data-type="number">{contract.hourly_rate} درهم</td>
                      <td>
                        {!userInfo?.is_branch_account && (
                          <>
                            <button
                              className="btn btn-small"
                              style={{ marginLeft: "0.5rem" }}
                              onClick={() => handleEdit(contract)}
                            >
                              تعديل
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDelete(contract.id)}
                            >
                              حذف
                            </button>
                          </>
                        )}
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

