import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";

export default function DailyReportsPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [reports, setReports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [form, setForm] = useState({
    branch_id: "",
    report_date: "",
    total_sessions: "0",
    total_hours: "0",
    total_amount: "0",
    internal_sessions: "0",
    external_sessions: "0",
    internal_amount: "0",
    external_amount: "0",
    total_expenses: "0",
    net_profit: "0",
    notes: ""
  });
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!token) return;
    
    apiGet("/auth/me", token)
      .then(setUserInfo)
      .catch(console.error);
    
    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);
    
    loadReports();
  }, [token, selectedBranchId, dateFrom, dateTo]);

  const loadReports = async () => {
    try {
      let url = "/daily-reports";
      const params = [];
      if (selectedBranchId) params.push(`branch_id=${selectedBranchId}`);
      if (dateFrom) params.push(`date_from=${dateFrom}`);
      if (dateTo) params.push(`date_to=${dateTo}`);
      if (params.length > 0) url += "?" + params.join("&");
      
      const data = await apiGet(url, token);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading reports:", err);
      setReports([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/daily-reports", {
        ...form,
        branch_id: parseInt(form.branch_id),
        total_sessions: parseInt(form.total_sessions),
        total_hours: parseFloat(form.total_hours),
        total_amount: parseFloat(form.total_amount),
        internal_sessions: parseInt(form.internal_sessions),
        external_sessions: parseInt(form.external_sessions),
        internal_amount: parseFloat(form.internal_amount),
        external_amount: parseFloat(form.external_amount),
        total_expenses: parseFloat(form.total_expenses),
        net_profit: parseFloat(form.net_profit),
        notes: form.notes || null
      }, token);
      success("تم إنشاء التقرير اليومي بنجاح!");
      resetForm();
      setShowForm(false);
      loadReports();
    } catch (err) {
      showError("حدث خطأ أثناء إنشاء التقرير: " + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingReport) return;
    
    try {
      const updateData = {
        report_date: form.report_date || undefined,
        total_sessions: form.total_sessions ? parseInt(form.total_sessions) : undefined,
        total_hours: form.total_hours ? parseFloat(form.total_hours) : undefined,
        total_amount: form.total_amount ? parseFloat(form.total_amount) : undefined,
        internal_sessions: form.internal_sessions ? parseInt(form.internal_sessions) : undefined,
        external_sessions: form.external_sessions ? parseInt(form.external_sessions) : undefined,
        internal_amount: form.internal_amount ? parseFloat(form.internal_amount) : undefined,
        external_amount: form.external_amount ? parseFloat(form.external_amount) : undefined,
        total_expenses: form.total_expenses ? parseFloat(form.total_expenses) : undefined,
        net_profit: form.net_profit ? parseFloat(form.net_profit) : undefined,
        notes: form.notes || null
      };
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      
      await apiPatch(`/daily-reports/${editingReport.id}`, updateData, token);
      success("تم تحديث التقرير اليومي بنجاح!");
      setShowForm(false);
      setEditingReport(null);
      loadReports();
    } catch (err) {
      showError("حدث خطأ أثناء تحديث التقرير: " + err.message);
    }
  };

  const handleDelete = async (reportId) => {
    confirm(
      "هل أنت متأكد من حذف هذا التقرير اليومي؟",
      async () => {
        try {
          await apiDelete(`/daily-reports/${reportId}`, token);
          success("تم حذف التقرير اليومي بنجاح!");
          loadReports();
        } catch (err) {
          showError("حدث خطأ أثناء حذف التقرير");
        }
      }
    );
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setForm({
      branch_id: report.branch_id.toString(),
      report_date: report.report_date,
      total_sessions: report.total_sessions.toString(),
      total_hours: report.total_hours.toString(),
      total_amount: report.total_amount.toString(),
      internal_sessions: report.internal_sessions.toString(),
      external_sessions: report.external_sessions.toString(),
      internal_amount: report.internal_amount.toString(),
      external_amount: report.external_amount.toString(),
      total_expenses: report.total_expenses.toString(),
      net_profit: report.net_profit.toString(),
      notes: report.notes || ""
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      branch_id: branches.length > 0 ? branches[0].id.toString() : "",
      report_date: "",
      total_sessions: "0",
      total_hours: "0",
      total_amount: "0",
      internal_sessions: "0",
      external_sessions: "0",
      internal_amount: "0",
      external_amount: "0",
      total_expenses: "0",
      net_profit: "0",
      notes: ""
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
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض التقارير اليومية</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="main-title">التقارير اليومية - مركز العمران للتدريب والتطوير</h1>
      <div className="container">
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>قائمة التقارير اليومية</h3>
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
              <input
                type="date"
                placeholder="من تاريخ"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.85rem" }}
              />
              <input
                type="date"
                placeholder="إلى تاريخ"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.85rem" }}
              />
              <button className="btn primary" onClick={() => {
                setEditingReport(null);
                resetForm();
                setShowForm(true);
              }}>
                إضافة تقرير يومي جديد
              </button>
            </div>
          </div>

          {showForm && (
            <form className="panel" style={{ marginBottom: "1rem", backgroundColor: "#f8f9fa" }} onSubmit={editingReport ? handleUpdate : handleCreate}>
              <h4>{editingReport ? "تعديل التقرير اليومي" : "إضافة تقرير يومي جديد"}</h4>
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
                  type="date"
                  placeholder="تاريخ التقرير"
                  value={form.report_date}
                  onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="إجمالي الجلسات"
                  value={form.total_sessions}
                  onChange={(e) => setForm({ ...form, total_sessions: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="إجمالي الساعات"
                  value={form.total_hours}
                  onChange={(e) => setForm({ ...form, total_hours: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="إجمالي المبلغ"
                  value={form.total_amount}
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="الجلسات الداخلية"
                  value={form.internal_sessions}
                  onChange={(e) => setForm({ ...form, internal_sessions: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="الجلسات الخارجية"
                  value={form.external_sessions}
                  onChange={(e) => setForm({ ...form, external_sessions: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="مبلغ الجلسات الداخلية"
                  value={form.internal_amount}
                  onChange={(e) => setForm({ ...form, internal_amount: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="مبلغ الجلسات الخارجية"
                  value={form.external_amount}
                  onChange={(e) => setForm({ ...form, external_amount: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="إجمالي المصاريف"
                  value={form.total_expenses}
                  onChange={(e) => setForm({ ...form, total_expenses: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="صافي الربح"
                  value={form.net_profit}
                  onChange={(e) => setForm({ ...form, net_profit: e.target.value })}
                  required
                />
                <textarea
                  placeholder="ملاحظات (اختياري)"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  style={{ gridColumn: "1 / -1", padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", minHeight: "80px" }}
                />
              </div>
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <button className="btn primary" type="submit">
                  {editingReport ? "تحديث" : "إضافة"}
                </button>
                <button className="btn" type="button" onClick={() => {
                  setShowForm(false);
                  setEditingReport(null);
                }}>إلغاء</button>
              </div>
            </form>
          )}

          {reports.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "1.5rem", fontSize: "0.9rem" }}>لا توجد تقارير يومية حالياً</p>
          ) : (
            <div className="table" style={{ overflowX: "auto" }}>
              <div className="row head" style={{ gridTemplateColumns: "repeat(12, 1fr)", minWidth: "1200px" }}>
                <span>الفرع</span>
                <span>التاريخ</span>
                <span>إجمالي الجلسات</span>
                <span>إجمالي الساعات</span>
                <span>إجمالي المبلغ</span>
                <span>جلسات داخلية</span>
                <span>جلسات خارجية</span>
                <span>مبلغ داخلي</span>
                <span>مبلغ خارجي</span>
                <span>المصاريف</span>
                <span>صافي الربح</span>
                <span>الإجراءات</span>
              </div>
              {reports.map(report => (
                <div key={report.id} className="row" style={{ gridTemplateColumns: "repeat(12, 1fr)", minWidth: "1200px" }}>
                  <span>{getBranchName(report.branch_id)}</span>
                  <span>{report.report_date}</span>
                  <span>{report.total_sessions}</span>
                  <span>{report.total_hours}</span>
                  <span>{report.total_amount} درهم</span>
                  <span>{report.internal_sessions}</span>
                  <span>{report.external_sessions}</span>
                  <span>{report.internal_amount} درهم</span>
                  <span>{report.external_amount} درهم</span>
                  <span>{report.total_expenses} درهم</span>
                  <span>{report.net_profit} درهم</span>
                  <span>
                    <button 
                      className="btn-small" 
                      style={{ backgroundColor: "#007bff", color: "white", marginRight: "0.5rem" }}
                      onClick={() => handleEdit(report)}
                    >
                      تعديل
                    </button>
                    <button 
                      className="btn-small btn-danger"
                      onClick={() => handleDelete(report.id)}
                    >
                      حذف
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

