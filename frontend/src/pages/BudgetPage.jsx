import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};

export default function BudgetPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    branch_id: "",
    title: "",
    amount: "",
    month: "",
    year: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    apiGet("/auth/me", token)
      .then(setUserInfo)
      .catch(console.error);
    
    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);
    
    loadData();
  }, [token, selectedBranchId, selectedYear, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // تحميل الجلسات
      let sessionsUrl = "/sessions/all";
      if (selectedBranchId) sessionsUrl += `?branch_id=${selectedBranchId}`;
      const sessions = await apiGet(sessionsUrl, token);
      
      // تحميل المصاريف
      let expensesUrl = "/expenses";
      if (selectedBranchId) expensesUrl += `?branch_id=${selectedBranchId}`;
      const expensesData = await apiGet(expensesUrl, token);
      
      // فلترة حسب السنة والشهر
      let filteredSessions = Array.isArray(sessions) ? sessions : [];
      let filteredExpenses = Array.isArray(expensesData) ? expensesData : [];
      
      if (selectedYear) {
        filteredSessions = filteredSessions.filter(s => {
          const date = new Date(s.session_date || s.created_at);
          return date.getFullYear() === selectedYear && (!selectedMonth || date.getMonth() + 1 === selectedMonth);
        });
        
        filteredExpenses = filteredExpenses.filter(e => {
          const date = new Date(e.created_at);
          return date.getFullYear() === selectedYear && (!selectedMonth || date.getMonth() + 1 === selectedMonth);
        });
      }
      
      setExpenses(filteredExpenses);
      
      // حساب الإيرادات الشهرية
      const monthlyRevenue = {};
      filteredSessions.forEach(s => {
        const date = new Date(s.session_date || s.created_at);
        const month = date.getMonth() + 1;
        if (!monthlyRevenue[month]) monthlyRevenue[month] = 0;
        monthlyRevenue[month] += parseFloat(s.calculated_amount || 0);
      });
      
      // حساب الإيرادات الإجمالية
      const totalRevenue = filteredSessions.reduce((sum, s) => sum + parseFloat(s.calculated_amount || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      
      setData({
        totalRevenue,
        totalExpenses,
        monthlyRevenue,
        sessionsCount: filteredSessions.length,
        expensesCount: filteredExpenses.length
      });
    } catch (err) {
      console.error("Error loading data:", err);
      showError("حدث خطأ أثناء تحميل البيانات");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/expenses", {
        branch_id: parseInt(expenseForm.branch_id),
        title: expenseForm.title,
        amount: parseFloat(expenseForm.amount),
        month: expenseForm.month ? parseInt(expenseForm.month) : null,
        year: expenseForm.year ? parseInt(expenseForm.year) : null
      }, token);
      success("تم إضافة المصروف بنجاح!");
      setExpenseForm({ branch_id: "", title: "", amount: "", month: "", year: "" });
      setShowExpenseForm(false);
      loadData();
    } catch (err) {
      showError("حدث خطأ أثناء إضافة المصروف: " + err.message);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    confirm(
      "هل أنت متأكد من حذف هذا المصروف؟",
      async () => {
        try {
          await apiDelete(`/expenses/${expenseId}`, token);
          success("تم حذف المصروف بنجاح!");
          loadData();
        } catch (err) {
          showError("حدث خطأ أثناء حذف المصروف");
        }
      }
    );
  };

  const generatePDF = async () => {
    if (!data) return;
    
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
      <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #007bff;">تقرير الميزانية</h1>
      <p style="font-size: 14px; margin: 5px 0 0 0; color: #666;">
        ${selectedMonth ? monthNames[selectedMonth] : 'السنة'} ${selectedYear}
        ${selectedBranchId ? ` - ${getBranchName(selectedBranchId)}` : ''}
      </p>
    `;
    printContent.appendChild(title);
    
    const summaryDiv = document.createElement('div');
    summaryDiv.style.marginBottom = '20px';
    summaryDiv.style.padding = '20px';
    summaryDiv.style.backgroundColor = '#f8f9fa';
    summaryDiv.style.borderRadius = '8px';
    summaryDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
          <div style="color: #666; font-size: 14px; margin-bottom: 10px;">إجمالي الإيرادات</div>
          <div style="font-size: 24px; font-weight: bold; color: #28a745;">${data.totalRevenue.toFixed(2)} درهم</div>
        </div>
        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
          <div style="color: #666; font-size: 14px; margin-bottom: 10px;">إجمالي المصاريف</div>
          <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${data.totalExpenses.toFixed(2)} درهم</div>
        </div>
      </div>
    `;
    printContent.appendChild(summaryDiv);
    
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
    
    pdf.save(`الميزانية_${selectedYear}${selectedMonth ? `_${monthNames[selectedMonth]}` : ''}.pdf`);
    document.body.removeChild(printContent);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض الميزانية</p>
        </div>
      </div>
    );
  }

  // Super Admin فقط
  if (!userInfo || !userInfo.is_super_admin) {
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
      <h1 className="main-title">الميزانية - مركز العمران للتدريب والتطوير</h1>
      <div className="container">
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>الفلاتر</h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>الفرع</label>
              <select 
                value={selectedBranchId || ""} 
                onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.9rem", minWidth: "200px" }}
              >
                <option value="">جميع الفروع</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>السنة</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.9rem", width: "120px" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>الشهر (اختياري)</label>
              <select
                value={selectedMonth || ""}
                onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.9rem", minWidth: "150px" }}
              >
                <option value="">جميع الأشهر</option>
                {Object.entries(monthNames).map(([num, name]) => (
                  <option key={num} value={num}>{name}</option>
                ))}
              </select>
            </div>
            {data && (
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button className="btn primary" onClick={generatePDF}>
                  📄 تصدير PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>جاري تحميل البيانات...</p>
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="stat-card">
                <div className="stat-label">إجمالي الإيرادات</div>
                <div className="stat-value">{data.totalRevenue.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي المصاريف</div>
                <div className="stat-value">{data.totalExpenses.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">عدد الجلسات</div>
                <div className="stat-value">{data.sessionsCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">عدد المصاريف</div>
                <div className="stat-value">{data.expensesCount}</div>
              </div>
            </div>

            {/* Monthly Revenue Breakdown */}
            {!selectedMonth && Object.keys(data.monthlyRevenue).length > 0 && (
              <div className="panel" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>الإيرادات الشهرية</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>الشهر</th>
                        <th style={{ textAlign: "left" }}>الإيرادات (درهم)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.monthlyRevenue)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([month, revenue]) => (
                          <tr key={month}>
                            <td style={{ fontWeight: "600" }}>{monthNames[parseInt(month)]}</td>
                            <td className="number" data-type="number" style={{ color: "#2E7D32", fontWeight: "600" }}>{revenue.toFixed(2)} درهم</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expenses Section */}
            <div className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>المصاريف</h3>
                <button className="btn primary" onClick={() => {
                  setExpenseForm({
                    branch_id: branches.length > 0 ? branches[0].id.toString() : "",
                    title: "",
                    amount: "",
                    month: selectedMonth?.toString() || "",
                    year: selectedYear.toString()
                  });
                  setShowExpenseForm(true);
                }}>
                  إضافة مصروف
                </button>
              </div>

              {showExpenseForm && (
                <form className="panel" style={{ marginBottom: "1rem", backgroundColor: "#f8f9fa" }} onSubmit={handleAddExpense}>
                  <h4>إضافة مصروف جديد</h4>
                  <div className="grid">
                    <select
                      value={expenseForm.branch_id}
                      onChange={(e) => setExpenseForm({ ...expenseForm, branch_id: e.target.value })}
                      required
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                    >
                      <option value="">اختر الفرع</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <input
                      placeholder="عنوان المصروف"
                      value={expenseForm.title}
                      onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="المبلغ"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="الشهر (اختياري)"
                      value={expenseForm.month}
                      onChange={(e) => setExpenseForm({ ...expenseForm, month: e.target.value })}
                      min="1"
                      max="12"
                    />
                    <input
                      type="number"
                      placeholder="السنة (اختياري)"
                      value={expenseForm.year}
                      onChange={(e) => setExpenseForm({ ...expenseForm, year: e.target.value })}
                    />
                  </div>
                  <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                    <button className="btn primary" type="submit">إضافة</button>
                    <button className="btn" type="button" onClick={() => setShowExpenseForm(false)}>إلغاء</button>
                  </div>
                </form>
              )}

              {expenses.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666", padding: "2rem" }}>لا توجد مصاريف للعرض</p>
              ) : (
                <div className="table">
                  <div className="row head" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                    <span>التاريخ</span>
                    <span>الفرع</span>
                    <span>العنوان</span>
                    <span>المبلغ</span>
                    <span>الإجراءات</span>
                  </div>
                  {expenses.map(expense => (
                    <div key={expense.id} className="row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                      <span>{new Date(expense.created_at).toLocaleDateString('ar-SA')}</span>
                      <span>{getBranchName(expense.branch_id)}</span>
                      <span>{expense.title}</span>
                      <span style={{ color: "#dc3545", fontWeight: "600" }}>{expense.amount} درهم</span>
                      <span>
                        <button 
                          className="btn-small btn-danger"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          حذف
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>لا توجد بيانات للعرض</p>
          </div>
        )}
      </div>
    </>
  );
}
