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

export default function MonthlyContractReportsPage() {
  const token = localStorage.getItem("token") || "";
  const { error: showError } = useNotification();
  const [contracts, setContracts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    apiGet("/auth/me", token)
      .then(setUserInfo)
      .catch(console.error);
    
    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);
    
    loadContracts();
  }, [token, selectedBranchId, selectedYear, selectedMonth]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      let url = "/contracts";
      const params = [];
      if (selectedBranchId) params.push(`branch_id=${selectedBranchId}`);
      if (params.length > 0) url += "?" + params.join("&");
      
      const data = await apiGet(url, token);
      const contractsList = Array.isArray(data) ? data : [];
      
      // فلترة حسب الشهر والسنة
      const filtered = contractsList.filter(contract => {
        const contractDate = new Date(contract.start_date);
        const contractYear = contractDate.getFullYear();
        const contractMonth = contractDate.getMonth() + 1;
        return contractYear === selectedYear && contractMonth === selectedMonth;
      });
      
      setContracts(filtered);
      
      // حساب الإحصائيات
      const stats = {
        totalContracts: filtered.length,
        activeContracts: filtered.filter(c => c.status === "active").length,
        completedContracts: filtered.filter(c => c.status === "completed").length,
        totalValue: filtered.reduce((sum, c) => sum + parseFloat(c.hourly_rate || 0) * parseFloat(c.total_hours || 0), 0),
        totalHours: filtered.reduce((sum, c) => sum + parseFloat(c.total_hours || 0), 0)
      };
      
      setStatistics(stats);
    } catch (err) {
      console.error("Error loading contracts:", err);
      showError("حدث خطأ أثناء تحميل العقود");
      setContracts([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
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
      <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #007bff;">تقرير العقود الشهرية</h1>
      <p style="font-size: 14px; margin: 5px 0 0 0; color: #666;">${monthNames[selectedMonth]} ${selectedYear}</p>
      ${selectedBranchId ? `<p style="font-size: 12px; margin: 5px 0 0 0; color: #666;">${getBranchName(selectedBranchId)}</p>` : ''}
    `;
    printContent.appendChild(title);
    
    if (statistics) {
      const statsDiv = document.createElement('div');
      statsDiv.style.marginBottom = '20px';
      statsDiv.style.padding = '15px';
      statsDiv.style.backgroundColor = '#f8f9fa';
      statsDiv.style.borderRadius = '8px';
      statsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
          <div>
            <div style="color: #666; font-size: 12px; margin-bottom: 5px;">إجمالي العقود</div>
            <div style="font-size: 18px; font-weight: bold; color: #007bff;">${statistics.totalContracts}</div>
          </div>
          <div>
            <div style="color: #666; font-size: 12px; margin-bottom: 5px;">عقود نشطة</div>
            <div style="font-size: 18px; font-weight: bold; color: #28a745;">${statistics.activeContracts}</div>
          </div>
          <div>
            <div style="color: #666; font-size: 12px; margin-bottom: 5px;">إجمالي الساعات</div>
            <div style="font-size: 18px; font-weight: bold; color: #ffc107;">${statistics.totalHours.toFixed(2)}</div>
          </div>
          <div>
            <div style="color: #666; font-size: 12px; margin-bottom: 5px;">إجمالي القيمة</div>
            <div style="font-size: 18px; font-weight: bold; color: #28a745;">${statistics.totalValue.toFixed(2)} درهم</div>
          </div>
        </div>
      `;
      printContent.appendChild(statsDiv);
    }
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background: #007bff; color: white;">
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">رقم العقد</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">المدرس</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">الطالب</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">تاريخ البدء</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">سعر الساعة</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">الساعات</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">الحالة</th>
      </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    contracts.forEach(contract => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${contract.contract_number}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${contract.teacher_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${contract.student_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${contract.start_date}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${contract.hourly_rate} درهم</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${contract.total_hours || 0}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${contract.status === "active" ? "نشط" : contract.status === "completed" ? "مكتمل" : "ملغي"}</td>
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
    
    pdf.save(`تقرير_العقود_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
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
      <h1 className="main-title">التقارير الشهرية للعقود - مركز العمران للتدريب والتطوير</h1>
      <div className="container">
        <div className="filters-bar" style={{ marginBottom: "0.5rem" }}>
          <h3 style={{ fontSize: "13px", margin: 0, fontWeight: 600 }}>الفلاتر</h3>
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
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            placeholder="السنة"
            style={{ width: "100px" }}
          />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {Object.entries(monthNames).map(([num, name]) => (
              <option key={num} value={num}>{name}</option>
            ))}
          </select>
          {contracts.length > 0 && (
            <button className="btn primary" onClick={generatePDF}>
              📄 PDF
            </button>
          )}
        </div>

        {loading ? (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>جاري تحميل البيانات...</p>
          </div>
        ) : statistics ? (
          <>
            {/* Statistics Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="stat-card">
                <div className="stat-label">إجمالي العقود</div>
                <div className="stat-value">{statistics.totalContracts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">عقود نشطة</div>
                <div className="stat-value">{statistics.activeContracts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي الساعات</div>
                <div className="stat-value">{statistics.totalHours.toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي القيمة</div>
                <div className="stat-value">{statistics.totalValue.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
              </div>
            </div>

            {/* Contracts Table */}
            <div className="panel">
              <h3 style={{ fontSize: "13px", marginBottom: "0.75rem", fontWeight: 600 }}>قائمة العقود</h3>
              {contracts.length === 0 ? (
                <div className="table-container">
                  <table>
                    <tbody>
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>لا توجد عقود للعرض</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>رقم العقد</th>
                        <th>الفرع</th>
                        <th>المدرس</th>
                        <th>الطالب</th>
                        <th>تاريخ البدء</th>
                        <th style={{ textAlign: "left" }}>سعر الساعة</th>
                        <th style={{ textAlign: "left" }}>الساعات</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(contract => (
                        <tr key={contract.id}>
                          <td style={{ fontWeight: "600" }}>{contract.contract_number}</td>
                          <td>{getBranchName(contract.branch_id)}</td>
                          <td>{contract.teacher_name}</td>
                          <td>{contract.student_name}</td>
                          <td>{contract.start_date}</td>
                          <td className="number" data-type="number">{contract.hourly_rate} درهم</td>
                          <td className="number" data-type="number">{contract.total_hours || 0}</td>
                          <td>
                            <span className={`status status-${contract.status}`}>
                              {contract.status === "active" ? "نشط" : contract.status === "completed" ? "مكتمل" : "ملغي"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
