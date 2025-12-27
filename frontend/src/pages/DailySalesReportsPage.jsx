import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function DailySalesReportsPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [reports, setReports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [salesStaff, setSalesStaff] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [form, setForm] = useState({
    branch_id: "",
    sales_staff_id: "",
    report_date: "",
    sales_amount: "0",
    number_of_deals: "0",
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
    
    loadSalesStaff();
    loadReports();
  }, [token, selectedBranchId, dateFrom, dateTo]);

  const loadSalesStaff = async () => {
    try {
      const data = await apiGet("/sales-staff", token);
      setSalesStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading sales staff:", err);
      setSalesStaff([]);
    }
  };

  const loadReports = async () => {
    try {
      let url = "/daily-sales-reports";
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
      await apiPost("/daily-sales-reports", {
        ...form,
        branch_id: parseInt(form.branch_id),
        sales_staff_id: parseInt(form.sales_staff_id),
        sales_amount: parseFloat(form.sales_amount),
        number_of_deals: parseInt(form.number_of_deals),
        notes: form.notes || null
      }, token);
      success("تم إنشاء التقرير بنجاح!");
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
      await apiPatch(`/daily-sales-reports/${editingReport.id}`, {
        sales_amount: form.sales_amount ? parseFloat(form.sales_amount) : undefined,
        number_of_deals: form.number_of_deals ? parseInt(form.number_of_deals) : undefined,
        notes: form.notes || null
      }, token);
      success("تم تحديث التقرير بنجاح!");
      setShowForm(false);
      setEditingReport(null);
      loadReports();
    } catch (err) {
      showError("حدث خطأ أثناء تحديث التقرير: " + err.message);
    }
  };

  const handleDelete = async (reportId) => {
    confirm(
      "هل أنت متأكد من حذف هذا التقرير؟",
      async () => {
        try {
          await apiDelete(`/daily-sales-reports/${reportId}`, token);
          success("تم حذف التقرير بنجاح!");
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
      sales_staff_id: report.sales_staff_id?.toString() || "",
      report_date: report.report_date,
      sales_amount: report.sales_amount.toString(),
      number_of_deals: report.number_of_deals.toString(),
      notes: report.notes || ""
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      branch_id: branches.length > 0 ? branches[0].id.toString() : "",
      sales_staff_id: "",
      report_date: "",
      sales_amount: "0",
      number_of_deals: "0",
      notes: ""
    });
  };

  const generatePDF = async () => {
    const printContent = document.createElement('div');
    printContent.style.position = 'absolute';
    printContent.style.left = '-9999px';
    printContent.style.width = '210mm';
    printContent.style.backgroundColor = 'white';
    printContent.style.padding = '20px';
    printContent.style.fontFamily = 'Cairo, Arial, sans-serif';
    printContent.style.direction = 'rtl';
    
    const title = document.createElement('div');
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.borderBottom = '2px solid #007bff';
    title.style.paddingBottom = '10px';
    title.innerHTML = `
      <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #007bff;">تقرير المبيعات اليومية</h1>
      <p style="font-size: 14px; margin: 5px 0 0 0; color: #666;">${new Date().toLocaleDateString('ar-SA')}</p>
    `;
    printContent.appendChild(title);
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background: #007bff; color: white;">
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">التاريخ</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">الفرع</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">موظف المبيعات</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">عدد الصفقات</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">مبلغ المبيعات</th>
      </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    reports.forEach(report => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${report.report_date}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${getBranchName(report.branch_id)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${getSalesStaffName(report.sales_staff_id)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${report.number_of_deals}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${report.sales_amount} درهم</td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    printContent.appendChild(table);
    
    document.body.appendChild(printContent);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(printContent, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`تقرير_المبيعات_اليومية_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.removeChild(printContent);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  const getSalesStaffName = (staffId) => {
    const staff = salesStaff.find(s => s.id === staffId);
    return staff ? staff.name : `موظف ${staffId}`;
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض التقارير</p>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحيات
  if (!userInfo || (!userInfo.is_super_admin && !userInfo.is_sales_manager && !userInfo.is_operation_manager && !userInfo.is_backdoor)) {
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
      <h1 className="main-title">تقارير المبيعات اليومية - مركز العمران للتدريب والتطوير</h1>
      <div className="container">
        <div className="panel">
          <div className="filters-bar">
            <h3 style={{ fontSize: "13px", margin: 0, fontWeight: 600 }}>قائمة تقارير المبيعات اليومية</h3>
            <select 
              value={selectedBranchId || ""} 
              onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
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
            />
            <input
              type="date"
              placeholder="إلى تاريخ"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            {reports.length > 0 && (
              <button className="btn primary" onClick={generatePDF}>
                📄 PDF
              </button>
            )}
            {!userInfo?.is_branch_account && (
              <button className="btn primary" onClick={() => {
                setEditingReport(null);
                resetForm();
                setShowForm(true);
              }}>
                إضافة تقرير
              </button>
            )}
          </div>

          {showForm && (
            <form className="panel" style={{ marginBottom: "1rem", backgroundColor: "#f8f9fa" }} onSubmit={editingReport ? handleUpdate : handleCreate}>
              <h4>{editingReport ? "تعديل التقرير" : "إضافة تقرير جديد"}</h4>
              <div className="grid">
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  required
                  disabled={editingReport !== null}
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                >
                  <option value="">اختر الفرع</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={form.sales_staff_id}
                  onChange={(e) => setForm({ ...form, sales_staff_id: e.target.value })}
                  required
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                >
                  <option value="">اختر موظف المبيعات</option>
                  {salesStaff.filter(s => !form.branch_id || s.branch_id === parseInt(form.branch_id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  placeholder="تاريخ التقرير"
                  value={form.report_date}
                  onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                  required
                  disabled={editingReport !== null}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="مبلغ المبيعات"
                  value={form.sales_amount}
                  onChange={(e) => setForm({ ...form, sales_amount: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="عدد الصفقات"
                  value={form.number_of_deals}
                  onChange={(e) => setForm({ ...form, number_of_deals: e.target.value })}
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
            <div className="table-container">
              <table>
                <tbody>
                  <tr>
                    <td colSpan={userInfo?.is_branch_account ? 5 : 6} style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>لا توجد تقارير حالياً</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الفرع</th>
                    <th>موظف المبيعات</th>
                    <th style={{ textAlign: "left" }}>عدد الصفقات</th>
                    <th style={{ textAlign: "left" }}>مبلغ المبيعات</th>
                    {!userInfo?.is_branch_account && <th>الإجراءات</th>}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>{report.report_date}</td>
                      <td>{getBranchName(report.branch_id)}</td>
                      <td>{getSalesStaffName(report.sales_staff_id)}</td>
                      <td className="number" data-type="number">{report.number_of_deals}</td>
                      <td className="number" data-type="number" style={{ color: "#2E7D32", fontWeight: "600" }}>{report.sales_amount} درهم</td>
                      {!userInfo?.is_branch_account && (
                        <td>
                          <button 
                            className="btn btn-small" 
                            style={{ marginLeft: "0.5rem" }}
                            onClick={() => handleEdit(report)}
                          >
                            تعديل
                          </button>
                          <button 
                            className="btn btn-small btn-danger"
                            onClick={() => handleDelete(report.id)}
                          >
                            حذف
                          </button>
                        </td>
                      )}
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
