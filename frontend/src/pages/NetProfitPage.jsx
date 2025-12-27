import React, { useState, useEffect } from "react";
import { apiGet } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};

export default function NetProfitPage() {
  const token = localStorage.getItem("token") || "";
  const { error: showError } = useNotification();
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [data, setData] = useState(null);
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
      // تحميل الجلسات الموافق عليها
      let sessionsUrl = "/sessions/all";
      if (selectedBranchId) sessionsUrl += `?branch_id=${selectedBranchId}`;
      const sessions = await apiGet(sessionsUrl, token);
      
      // تحميل المصاريف
      let expensesUrl = "/expenses";
      if (selectedBranchId) expensesUrl += `?branch_id=${selectedBranchId}`;
      const expenses = await apiGet(expensesUrl, token);
      
      // فلترة حسب السنة والشهر
      let filteredSessions = Array.isArray(sessions) ? sessions : [];
      let filteredExpenses = Array.isArray(expenses) ? expenses : [];
      
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
      
      // حساب الإيرادات
      const totalRevenue = filteredSessions.reduce((sum, s) => sum + parseFloat(s.calculated_amount || 0), 0);
      
      // حساب المصاريف
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      
      // صافي الربح
      const netProfit = totalRevenue - totalExpenses;
      
      setData({
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit: netProfit,
        sessionsCount: filteredSessions.length,
        expensesCount: filteredExpenses.length,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0
      });
    } catch (err) {
      console.error("Error loading data:", err);
      showError("حدث خطأ أثناء تحميل البيانات");
      setData(null);
    } finally {
      setLoading(false);
    }
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
      <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #007bff;">تقرير صافي الأرباح</h1>
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
          <div style="font-size: 24px; font-weight: bold; color: #28a745;">${data.revenue.toFixed(2)} درهم</div>
        </div>
        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
          <div style="color: #666; font-size: 14px; margin-bottom: 10px;">إجمالي المصاريف</div>
          <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${data.expenses.toFixed(2)} درهم</div>
        </div>
        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; grid-column: 1 / -1;">
          <div style="color: #666; font-size: 14px; margin-bottom: 10px;">صافي الربح</div>
          <div style="font-size: 32px; font-weight: bold; color: ${data.netProfit >= 0 ? '#28a745' : '#dc3545'};">
            ${data.netProfit.toFixed(2)} درهم
          </div>
          <div style="color: #666; font-size: 12px; margin-top: 5px;">
            نسبة الربح: ${data.profitMargin.toFixed(2)}%
          </div>
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
    
    pdf.save(`صافي_الأرباح_${selectedYear}${selectedMonth ? `_${monthNames[selectedMonth]}` : ''}.pdf`);
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
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض صافي الأرباح</p>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحيات
  if (!userInfo || (!userInfo.is_super_admin && !userInfo.is_operation_manager && !userInfo.is_backdoor)) {
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
      <h1 className="main-title">صافي الأرباح - مركز العمران للتدريب والتطوير</h1>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
              <div className="stat-card" style={{ background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)", color: "white" }}>
                <div className="stat-icon">💰</div>
                <div className="stat-value">{data.revenue.toFixed(2)}</div>
                <div className="stat-label">إجمالي الإيرادات (درهم)</div>
              </div>
              
              <div className="stat-card" style={{ background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)", color: "white" }}>
                <div className="stat-icon">💸</div>
                <div className="stat-value">{data.expenses.toFixed(2)}</div>
                <div className="stat-label">إجمالي المصاريف (درهم)</div>
              </div>
              
              <div className="stat-card" style={{ 
                background: data.netProfit >= 0 
                  ? "linear-gradient(135deg, #30cfd0 0%, #330867 100%)" 
                  : "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", 
                color: "white" 
              }}>
                <div className="stat-icon">📈</div>
                <div className="stat-value">{data.netProfit.toFixed(2)}</div>
                <div className="stat-label">صافي الربح (درهم)</div>
              </div>
              
              <div className="stat-card" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                <div className="stat-icon">📊</div>
                <div className="stat-value">{data.profitMargin.toFixed(2)}%</div>
                <div className="stat-label">نسبة الربح</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="panel">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>التفاصيل</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                <div style={{ padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <h4 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#007bff" }}>الإيرادات</h4>
                  <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#28a745", marginBottom: "0.5rem" }}>
                    {data.revenue.toFixed(2)} درهم
                  </div>
                  <div style={{ color: "#666", fontSize: "0.9rem" }}>
                    من {data.sessionsCount} جلسة
                  </div>
                </div>
                
                <div style={{ padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <h4 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#007bff" }}>المصاريف</h4>
                  <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#dc3545", marginBottom: "0.5rem" }}>
                    {data.expenses.toFixed(2)} درهم
                  </div>
                  <div style={{ color: "#666", fontSize: "0.9rem" }}>
                    من {data.expensesCount} مصروف
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: data.netProfit >= 0 ? "#d4edda" : "#f8d7da", borderRadius: "8px", textAlign: "center" }}>
                <h4 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: data.netProfit >= 0 ? "#155724" : "#721c24" }}>
                  صافي الربح النهائي
                </h4>
                <div style={{ fontSize: "3rem", fontWeight: "bold", color: data.netProfit >= 0 ? "#28a745" : "#dc3545" }}>
                  {data.netProfit.toFixed(2)} درهم
                </div>
                <div style={{ marginTop: "0.5rem", color: data.netProfit >= 0 ? "#155724" : "#721c24", fontSize: "1rem" }}>
                  نسبة الربح: {data.profitMargin.toFixed(2)}%
                </div>
              </div>
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



