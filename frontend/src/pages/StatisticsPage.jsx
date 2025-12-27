import React, { useState, useEffect } from "react";
import { apiGet } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};

export default function StatisticsPage() {
  const token = localStorage.getItem("token") || "";
  const { error: showError } = useNotification();
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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
  }, [token]);

  useEffect(() => {
    if (selectedYear) {
      loadStatistics();
    }
  }, [selectedBranchId, selectedYear, token]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      let url = `/reports/monthly?year=${selectedYear}`;
      if (selectedBranchId) {
        url += `&branch_id=${selectedBranchId}`;
      }
      
      const data = await apiGet(url, token);
      
      // حساب الإحصائيات الإجمالية
      const totalStats = {
        totalSessions: 0,
        totalHours: 0,
        totalAmount: 0,
        totalExpenses: 0,
        netProfit: 0,
        branches: data.length,
        months: new Set()
      };

      data.forEach(report => {
        totalStats.totalSessions += report.total_sessions || 0;
        totalStats.totalHours += parseFloat(report.total_hours || 0);
        totalStats.totalAmount += parseFloat(report.total_amount || 0);
        totalStats.totalExpenses += parseFloat(report.total_expenses || 0);
        totalStats.months.add(report.month);
      });

      totalStats.netProfit = totalStats.totalAmount - totalStats.totalExpenses;
      
      // Load comprehensive statistics for PDF report
      let comprehensiveStats = null;
      try {
        const yearStart = `${selectedYear}-01-01`;
        const yearEnd = `${selectedYear}-12-31`;
        
        // Load daily reports
        let dailyReportsUrl = `/daily-reports?date_from=${yearStart}&date_to=${yearEnd}`;
        if (selectedBranchId) {
          dailyReportsUrl += `&branch_id=${selectedBranchId}`;
        }
        const dailyReports = await apiGet(dailyReportsUrl, token);
        
        // Load contracts
        let contractsUrl = `/contracts`;
        if (selectedBranchId) {
          contractsUrl += `?branch_id=${selectedBranchId}`;
        }
        const contracts = await apiGet(contractsUrl, token);
        const yearContracts = contracts.filter(c => {
          const contractYear = new Date(c.start_date).getFullYear();
          return contractYear === selectedYear;
        });
        
        // Load daily sales reports
        let salesReportsUrl = `/daily-sales-reports?date_from=${yearStart}&date_to=${yearEnd}`;
        if (selectedBranchId) {
          salesReportsUrl += `&branch_id=${selectedBranchId}`;
        }
        const salesReports = await apiGet(salesReportsUrl, token);
        
        // Calculate comprehensive statistics
        const daysWithReports = new Set(dailyReports.map(r => r.report_date)).size;
        const totalContracts = yearContracts.length;
        const totalCalls = salesReports.reduce((sum, r) => sum + (parseFloat(r.total_calls || 0)), 0);
        const totalContractValue = yearContracts.reduce((sum, c) => {
          // Calculate contract value based on sessions
          const contractSessions = data.filter(r => 
            r.branch_id === c.branch_id && 
            r.month >= new Date(c.start_date).getMonth() + 1
          );
          const contractAmount = contractSessions.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
          return sum + contractAmount;
        }, 0);
        const totalPaid = salesReports.reduce((sum, r) => sum + parseFloat(r.total_paid || 0), 0);
        const totalRemaining = salesReports.reduce((sum, r) => sum + parseFloat(r.total_remaining || 0), 0);
        const netTotal = totalStats.netProfit;
        
        comprehensiveStats = {
          daysWithReports,
          totalContracts,
          totalCalls,
          totalContractValue,
          totalPaid,
          totalRemaining,
          netTotal
        };
      } catch (err) {
        console.error("Error loading comprehensive stats:", err);
        // Continue without comprehensive stats
      }
      
      setStatistics({
        monthly: data,
        totals: totalStats,
        comprehensive: comprehensiveStats
      });
    } catch (err) {
      console.error("Error loading statistics:", err);
      showError("حدث خطأ أثناء تحميل الإحصائيات");
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  const generatePDF = async () => {
    if (!statistics || !statistics.comprehensive) {
      showError("لا توجد بيانات شاملة لعرضها في التقرير");
      return;
    }
    
    try {
      // Get page font family
      const bodyStyle = window.getComputedStyle(document.body);
      const pageFontFamily = bodyStyle.fontFamily || 'Cairo, sans-serif';
      
      // Create PDF container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '20mm';
      container.style.fontFamily = pageFontFamily;
      container.style.direction = 'rtl';
      container.style.textAlign = 'right';
      container.setAttribute('lang', 'ar');
      container.setAttribute('dir', 'rtl');
      
      // Header
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '25px';
      header.style.paddingBottom = '15px';
      header.style.borderBottom = '2px solid #333';
      
      const title = document.createElement('h1');
      title.textContent = 'تقرير الإحصائيات الشامل';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.margin = '0 0 10px 0';
      title.style.color = '#000';
      title.style.fontFamily = pageFontFamily;
      header.appendChild(title);
      
      const branch = document.createElement('p');
      branch.textContent = selectedBranchId ? getBranchName(selectedBranchId) : 'جميع الفروع';
      branch.style.fontSize = '16px';
      branch.style.margin = '0 0 8px 0';
      branch.style.color = '#000';
      branch.style.fontFamily = pageFontFamily;
      header.appendChild(branch);
      
      const period = document.createElement('p');
      period.textContent = `الفترة: ${selectedYear}`;
      period.style.fontSize = '14px';
      period.style.margin = '0 0 8px 0';
      period.style.color = '#000';
      period.style.fontFamily = pageFontFamily;
      header.appendChild(period);
      
      const today = new Date();
      const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
      const issueDate = document.createElement('p');
      issueDate.textContent = `تاريخ الإصدار : ${dateStr} -- العملة درهم`;
      issueDate.style.fontSize = '12px';
      issueDate.style.margin = '0';
      issueDate.style.color = '#000';
      issueDate.style.fontFamily = pageFontFamily;
      header.appendChild(issueDate);
      
      container.appendChild(header);
      
      // Table Section
      const tableTitle = document.createElement('h2');
      tableTitle.textContent = 'الإحصائيات الإجمالية';
      tableTitle.style.fontSize = '16px';
      tableTitle.style.fontWeight = '600';
      tableTitle.style.margin = '20px 0 10px 0';
      tableTitle.style.textAlign = 'right';
      tableTitle.style.color = '#000';
      tableTitle.style.fontFamily = pageFontFamily;
      container.appendChild(tableTitle);
      
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginTop = '20px';
      
      const comp = statistics.comprehensive;
      const dataRows = [
        ['عدد الأيام التي لديها تقارير يومية', comp.daysWithReports.toString()],
        ['إجمالي العقود الشهرية', comp.totalContracts.toString()],
        ['إجمالي المكالمات', comp.totalCalls.toString()],
        ['إجمالي قيمة العقود', `${comp.totalContractValue.toFixed(2)} درهم`],
        ['إجمالي المدفوع', `${comp.totalPaid.toFixed(2)} درهم`],
        ['إجمالي المتبقي', `${comp.totalRemaining.toFixed(2)} درهم`],
        ['إجمالي الصافي', `${comp.netTotal.toFixed(2)} درهم`]
      ];
      
      dataRows.forEach(([label, value]) => {
        const row = document.createElement('tr');
        
        const labelCell = document.createElement('td');
        labelCell.textContent = label;
        labelCell.style.padding = '10px 15px';
        labelCell.style.border = '1px solid #ddd';
        labelCell.style.fontSize = '12px';
        labelCell.style.fontWeight = '600';
        labelCell.style.backgroundColor = '#f9f9f9';
        labelCell.style.width = '60%';
        labelCell.style.fontFamily = pageFontFamily;
        row.appendChild(labelCell);
        
        const valueCell = document.createElement('td');
        valueCell.textContent = value;
        valueCell.style.padding = '10px 15px';
        valueCell.style.border = '1px solid #ddd';
        valueCell.style.fontSize = '12px';
        valueCell.style.textAlign = 'left';
        valueCell.style.width = '40%';
        valueCell.style.fontFamily = pageFontFamily;
        row.appendChild(valueCell);
        
        table.appendChild(row);
      });
      
      container.appendChild(table);
      document.body.appendChild(container);
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate PDF
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        letterRendering: true
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const branchNameForFile = selectedBranchId ? getBranchName(selectedBranchId).replace(/\s/g, "_") : "جميع_الفروع";
      pdf.save(`تقرير_الإحصائيات_الشامل_${branchNameForFile}_${selectedYear}.pdf`);
      
      // Cleanup
      document.body.removeChild(container);
    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
    }
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض الإحصائيات</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="main-title">لوحة الإحصائيات - مركز العمران للتدريب والتطوير</h1>
      <div className="container">
        {/* Filters */}
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
        </div>

        {loading ? (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>جاري تحميل الإحصائيات...</p>
          </div>
        ) : statistics ? (
          <>
            {/* PDF Download Button */}
            {statistics.comprehensive && (
              <div style={{ marginBottom: "1rem", textAlign: "right" }}>
                <button
                  onClick={generatePDF}
                  className="btn primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "14px" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "8px", display: "inline-block", verticalAlign: "middle" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  تحميل تقرير PDF شامل
                </button>
              </div>
            )}
            
            {/* Statistics Cards - بطاقات إحصائيات */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="stat-card">
                <div className="stat-label">إجمالي الجلسات</div>
                <div className="stat-value">{statistics.totals.totalSessions}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي الساعات</div>
                <div className="stat-value">{statistics.totals.totalHours.toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي الإيرادات</div>
                <div className="stat-value">{statistics.totals.totalAmount.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي المصاريف</div>
                <div className="stat-value">{statistics.totals.totalExpenses.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">صافي الربح</div>
                <div className="stat-value" style={{ color: statistics.totals.netProfit >= 0 ? "#5A7ACD" : "#2B2A2A" }}>
                  {statistics.totals.netProfit.toFixed(2)}
                </div>
                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">عدد الفروع</div>
                <div className="stat-value">{statistics.totals.branches}</div>
              </div>
            </div>

            {/* Monthly Reports Table */}
            <div className="panel">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>التقارير الشهرية</h3>
              {statistics.monthly.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666", padding: "2rem" }}>لا توجد بيانات للعرض</p>
              ) : (
                <div className="table">
                  <div className="row head" style={{ gridTemplateColumns: "repeat(8, 1fr)" }}>
                    <span>الشهر</span>
                    <span>الفرع</span>
                    <span>عدد الجلسات</span>
                    <span>الساعات</span>
                    <span>الإيرادات</span>
                    <span>المصاريف</span>
                    <span>صافي الربح</span>
                    <span>نسبة الربح</span>
                  </div>
                  {statistics.monthly.map((report, index) => {
                    const profitMargin = report.total_amount > 0 
                      ? ((report.total_amount - (report.total_expenses || 0)) / report.total_amount * 100).toFixed(1)
                      : "0.0";
                    return (
                      <div key={index} className="row" style={{ gridTemplateColumns: "repeat(8, 1fr)" }}>
                        <span style={{ fontWeight: "600" }}>{monthNames[report.month]} {report.year}</span>
                        <span>{getBranchName(report.branch_id)}</span>
                        <span>{report.total_sessions || 0}</span>
                        <span>{parseFloat(report.total_hours || 0).toFixed(2)}</span>
                        <span style={{ color: "#28a745", fontWeight: "600" }}>{parseFloat(report.total_amount || 0).toFixed(2)} درهم</span>
                        <span style={{ color: "#dc3545" }}>{parseFloat(report.total_expenses || 0).toFixed(2)} درهم</span>
                        <span style={{ 
                          color: parseFloat(report.total_amount || 0) - parseFloat(report.total_expenses || 0) >= 0 ? "#28a745" : "#dc3545",
                          fontWeight: "600"
                        }}>
                          {(parseFloat(report.total_amount || 0) - parseFloat(report.total_expenses || 0)).toFixed(2)} درهم
                        </span>
                        <span style={{ 
                          color: parseFloat(profitMargin) >= 0 ? "#28a745" : "#dc3545",
                          fontWeight: "600"
                        }}>
                          {profitMargin}%
                        </span>
                      </div>
                    );
                  })}
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
