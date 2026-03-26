import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete, apiPatch } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import pdfMake from "pdfmake-rtl/build/pdfmake";
import { vfs } from "../fonts/vfs_fonts_custom";

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};
const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null || isNaN(num)) return num;
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export default function NetProfitPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyGroups, setMonthlyGroups] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [selectedBranchForExpense, setSelectedBranchForExpense] = useState(null);
  const [selectedMonthForExpense, setSelectedMonthForExpense] = useState(null);
  const [selectedYearForExpense, setSelectedYearForExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: ""
  });

  useEffect(() => {
    if (!token) return;

    apiGet("/auth/me", token)
      .then(setUserInfo)
      .catch(console.error);

    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);

    apiGet("/expense-categories", token)
      .then(data => setExpenseCategories(Array.isArray(data) ? data.filter(c => c.is_active) : []))
      .catch(console.error);

    loadAllMonthsData();
  }, [token, selectedYear]);

  const loadAllMonthsData = async () => {
    if (!selectedYear) return;

    setLoading(true);
    try {
      const data = await apiGet(`/net-profit/all-months?year=${selectedYear}`, token);
      setMonthlyGroups(Array.isArray(data) ? data : []);

      // Auto-expand current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      if (selectedYear === currentYear) {
        const currentKey = `${currentYear}-${currentMonth}`;
        setExpandedMonths(new Set([currentKey]));
      }
    } catch (err) {
      console.error("Error loading monthly data:", err);
      showError("حدث خطأ أثناء تحميل البيانات");
      setMonthlyGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = (year, month) => {
    const key = `${year}-${month}`;
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedMonths(newExpanded);
  };

  const openExpenseModal = (branchData, year, month) => {
    setSelectedBranchForExpense(branchData);
    setSelectedYearForExpense(year);
    setSelectedMonthForExpense(month);
    setExpenseForm({ title: "", amount: "" });
    setIsEditingExpense(false);
    setEditingExpenseId(null);
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (expense, branchData, year, month) => {
    setSelectedBranchForExpense(branchData);
    setSelectedYearForExpense(year);
    setSelectedMonthForExpense(month);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount.toString()
    });
    setIsEditingExpense(true);
    setEditingExpenseId(expense.id);
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setSelectedBranchForExpense(null);
    setSelectedYearForExpense(null);
    setSelectedMonthForExpense(null);
    setExpenseForm({ title: "", amount: "" });
    setIsEditingExpense(false);
    setEditingExpenseId(null);
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount || !selectedBranchForExpense) {
      showError("يرجى إدخال عنوان المصروف والمبلغ");
      return;
    }

    try {
      const now = new Date();
      let expenseDateStr;

      if (selectedYearForExpense === now.getFullYear() && selectedMonthForExpense === (now.getMonth() + 1)) {
        // Current month: use current time
        expenseDateStr = now.toISOString().slice(0, 19).replace('T', ' ');
      } else {
        // Past/Future month: use 1st of that month
        const d = new Date(selectedYearForExpense, selectedMonthForExpense - 1, 1, 12, 0, 0);
        expenseDateStr = d.toISOString().slice(0, 19).replace('T', ' ');
      }

      if (isEditingExpense && editingExpenseId) {
        await apiPatch(`/net-profit-expenses/${editingExpenseId}`, {
          title: expenseForm.title,
          amount: parseFloat(expenseForm.amount),
          expense_date: expenseDateStr
        }, token);
        success("تم تحديث المصروف بنجاح!");
      } else {
        await apiPost("/net-profit-expenses", {
          branch_id: selectedBranchForExpense.branch_id,
          title: expenseForm.title,
          amount: parseFloat(expenseForm.amount),
          expense_date: expenseDateStr
        }, token);
        success("تم إضافة المصروف بنجاح!");
      }
      closeExpenseModal();
      loadAllMonthsData();
    } catch (err) {
      showError("حدث خطأ أثناء " + (isEditingExpense ? "تحديث" : "إضافة") + " المصروف: " + (err.message || err));
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    confirm("هل أنت متأكد من حذف هذا المصروف؟", async () => {
      try {
        await apiDelete(`/net-profit-expenses/${expenseId}`, token);
        success("تم حذف المصروف بنجاح!");
        loadAllMonthsData();
      } catch (err) {
        showError("حدث خطأ أثناء حذف المصروف");
      }
    });
  };

  const generateMonthlyPDF = (group) => {
    try {
      // Set up pdfMake fonts
      pdfMake.vfs = vfs;
      pdfMake.fonts = {
        Cairo: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Bold.ttf'
        },
        Nillima: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Bold.ttf'
        },
        Roboto: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Bold.ttf'
        }
      };

      // Calculate totals
      const totalRevenue = group.branches.reduce((sum, b) => sum + parseFloat(b.revenue || 0), 0);
      const totalExpenses = group.branches.reduce((sum, b) => sum + parseFloat(b.expenses || 0), 0);
      const totalNetProfit = totalRevenue - totalExpenses;

      // Build PDF content
      const content = [];

      // Title
      content.push({
        text: `تقرير صافي الأرباح - ${group.month_name} ${group.year}`,
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      });

      // Summary section
      content.push({
        text: 'الإحصائيات الإجمالية',
        style: 'subheader',
        margin: [0, 0, 0, 10]
      });

      content.push({
        table: {
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'صافي المبلغ من العقود', style: 'tableHeader', alignment: 'center' },
              { text: 'إجمالي المصاريف', style: 'tableHeader', alignment: 'center' },
              { text: 'صافي الربح النهائي', style: 'tableHeader', alignment: 'center' }
            ],
            [
              { text: formatNumber(totalRevenue) + ' درهم', alignment: 'center' },
              { text: formatNumber(totalExpenses) + ' درهم', alignment: 'center' },
              {
                text: formatNumber(totalNetProfit) + ' درهم',
                alignment: 'center',
                bold: true
              }
            ]
          ]
        },
        margin: [0, 0, 0, 20]
      });

      // Branches details
      group.branches.forEach((branchData, index) => {
        if (index > 0) {
          content.push({ text: '', pageBreak: 'before' });
        }

        content.push({
          text: branchData.branch_name,
          style: 'subheader',
          margin: [0, 0, 0, 10]
        });

        // Branch summary
        content.push({
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'صافي المبلغ من العقود', style: 'tableHeader', alignment: 'center' },
                { text: 'إجمالي المصاريف', style: 'tableHeader', alignment: 'center' },
                { text: 'صافي الربح النهائي', style: 'tableHeader', alignment: 'center' }
              ],
              [
                { text: formatNumber(parseFloat(branchData.revenue || 0)) + ' درهم', alignment: 'center' },
                { text: formatNumber(parseFloat(branchData.expenses || 0)) + ' درهم', alignment: 'center' },
                {
                  text: formatNumber(parseFloat(branchData.net_profit || 0)) + ' درهم',
                  alignment: 'center',
                  bold: true
                }
              ]
            ]
          },
          margin: [0, 0, 0, 10]
        });

        // Expenses table
        if (branchData.expenses_list && branchData.expenses_list.length > 0) {
          content.push({
            text: 'تفاصيل المصاريف',
            style: 'sectionTitle',
            margin: [0, 10, 0, 5]
          });

          const expensesTableBody = [
            [
              { text: 'السبب', style: 'tableHeader', alignment: 'center' },
              { text: 'المبلغ', style: 'tableHeader', alignment: 'center' }
            ]
          ];

          branchData.expenses_list.forEach(expense => {
            expensesTableBody.push([
              { text: expense.title || '-', alignment: 'center' },
              { text: formatNumber(parseFloat(expense.amount || 0)) + ' درهم', alignment: 'center' }
            ]);
          });

          content.push({
            table: {
              widths: ['*', '*'],
              body: expensesTableBody
            },
            margin: [0, 0, 0, 20]
          });
        } else {
          content.push({
            text: 'لا توجد مصاريف مسجلة',
            style: 'note',
            margin: [0, 0, 0, 20],
            italics: true
          });
        }
      });

      // Document definition
      const docDefinition = {
        defaultStyle: {
          font: 'Cairo',
          fontSize: 10,
          alignment: 'right'
        },
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: content,
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            color: '#007bff',
            margin: [0, 0, 0, 10]
          },
          subheader: {
            fontSize: 14,
            bold: true,
            color: '#333'
          },
          sectionTitle: {
            fontSize: 12,
            bold: true,
            color: '#555'
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            fillColor: '#f8f9fa'
          },
          note: {
            fontSize: 9,
            color: '#999'
          }
        }
      };

      // Generate and download PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      const fileName = `تقرير_صافي_الأرباح_${group.month_name}_${group.year}.pdf`;
      pdfDoc.download(fileName);

      success("تم تحميل ملف PDF بنجاح!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      showError("حدث خطأ أثناء إنشاء ملف PDF: " + (err.message || err));
    }
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض صافي الأرباح</p>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحيات - فقط السوبر أدمن
  if (!userInfo || !userInfo.is_super_admin || userInfo.is_backdoor) {
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
      <div className="container">
        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>صافي الأرباح</h3>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>السنة</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontFamily: "Cairo", fontSize: "0.9rem", width: "120px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>جاري تحميل البيانات...</p>
          </div>
        ) : monthlyGroups.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>لا توجد بيانات للعرض</p>
          </div>
        ) : (
          <div>
            {monthlyGroups.map((group) => {
              const monthKey = `${group.year}-${group.month}`;
              const isExpanded = expandedMonths.has(monthKey);

              // Calculate totals for the month
              const totalRevenue = group.branches.reduce((sum, b) => sum + parseFloat(b.revenue || 0), 0);
              const totalExpenses = group.branches.reduce((sum, b) => sum + parseFloat(b.expenses || 0), 0);
              const totalNetProfit = totalRevenue - totalExpenses;

              return (
                <div key={monthKey} style={{ marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "6px",
                      marginBottom: "0.4rem",
                      cursor: "pointer",
                      border: "1px solid #dcdcdc"
                    }}
                    onClick={() => toggleMonth(group.year, group.month)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                        <h4 style={{ margin: 0, fontSize: "0.9rem" }}>
                          {group.month_name} {group.year}
                        </h4>
                        <span style={{ fontSize: "0.85rem", color: "#28a745", fontWeight: "600" }}>
                          صافي المبلغ: {formatNumber(totalRevenue)} درهم
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {group.branches.length} فرع • إجمالي صافي الربح: {formatNumber(totalNetProfit)} درهم
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        className="btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateMonthlyPDF(group);
                        }}
                        style={{
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.75rem",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        📄 تحميل PDF
                      </button>
                      <span>{isExpanded ? "▼" : "▶"}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {group.branches.map((branchData) => (
                        <div key={branchData.branch_id} className="panel">
                          <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "2px solid var(--border-color)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                              <div>
                                <h3 style={{ fontSize: "1rem", margin: 0, marginBottom: "0.75rem", color: "var(--color-primary)" }}>
                                  {branchData.branch_name}
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>المبلغ الصافي من العقود:</span>
                                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#28a745" }}>
                                      {formatNumber(parseFloat(branchData.revenue || 0))} درهم
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>صافي الربح النهائي:</span>
                                    <span style={{
                                      fontSize: "1rem",
                                      fontWeight: "bold",
                                      color: branchData.net_profit >= 0 ? "#28a745" : "#dc3545"
                                    }}>
                                      {formatNumber(parseFloat(branchData.net_profit || 0))} درهم
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                className="btn primary btn-small"
                                onClick={() => openExpenseModal(branchData, group.year, group.month)}
                              >
                                + إضافة مصروف
                              </button>
                            </div>
                          </div>

                          {/* Expenses Details */}
                          <div>
                            <h4 style={{ fontSize: "0.9rem", marginBottom: "0.75rem", fontWeight: "600" }}>
                              تفاصيل المصاريف
                            </h4>
                            {branchData.expenses_list && branchData.expenses_list.length > 0 ? (
                              <div className="table-container">
                                <table>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: "center" }}>السبب</th>
                                      <th style={{ textAlign: "center" }}>المبلغ</th>
                                      <th style={{ textAlign: "center" }}>الإجراءات</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {branchData.expenses_list.map((expense) => (
                                      <tr key={expense.id}>
                                        <td style={{ textAlign: "center" }}>{expense.title}</td>
                                        <td data-type="number" style={{ textAlign: "center" }}>{formatNumber(parseFloat(expense.amount || 0))} درهم</td>
                                        <td style={{ textAlign: "center" }}>
                                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                            <button
                                              onClick={() => openEditExpenseModal(expense, branchData, group.year, group.month)}
                                              title="تعديل المصروف"
                                              style={{
                                                padding: "0.25rem 0.5rem",
                                                backgroundColor: "#ffc107",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "0.75rem"
                                              }}
                                            >
                                              تعديل
                                            </button>
                                            <button
                                              onClick={() => handleDeleteExpense(expense.id)}
                                              title="حذف المصروف"
                                              style={{
                                                padding: "0.25rem 0.5rem",
                                                backgroundColor: "#dc3545",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "0.75rem"
                                              }}
                                            >
                                              حذف
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", padding: "1rem", textAlign: "center", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                لا توجد مصاريف مسجلة
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {showExpenseModal && selectedBranchForExpense && (
        <div className="modal-overlay" onClick={closeExpenseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header" style={{ padding: "0.75rem 1rem" }}>
              <h3 style={{ fontSize: "0.9rem", margin: 0 }}>
                {isEditingExpense ? "تعديل مصروف" : "إضافة مصروف جديد"} - {selectedBranchForExpense.branch_name}
              </h3>
              <button className="modal-close" onClick={closeExpenseModal}>×</button>
            </div>
            <div className="modal-body" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      fontFamily: "Cairo",
                      fontSize: "0.85rem"
                    }}
                  >
                    <option value="">اختر نوع المصروف</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    {/* Fallback if no categories or editing an old manual one */}
                    {expenseForm.title && !expenseCategories.find(c => c.name === expenseForm.title) && (
                      <option value={expenseForm.title}>{expenseForm.title}</option>
                    )}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="المبلغ"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      fontFamily: "Cairo",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn" onClick={closeExpenseModal}>إلغاء</button>
              <button className="btn primary" onClick={handleAddExpense}>{isEditingExpense ? "تحديث" : "إضافة"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
