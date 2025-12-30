import React, { useState, useEffect } from "react";
import { apiGet } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import pdfMake from "pdfmake-rtl/build/pdfmake";
import { vfs } from "../fonts/vfs_fonts_custom";
import { buildStatisticsPDF } from "./StatisticsPage_pdfmake";

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};

export default function StatisticsPage() {
  const token = localStorage.getItem("token") || "";
  const { error: showError } = useNotification();
  const [branches, setBranches] = useState([]);
  const [salesStaff, setSalesStaff] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedSalesStaffId, setSelectedSalesStaffId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfStatus, setPdfStatus] = useState('');

  useEffect(() => {
    if (!token) return;
    
    apiGet("/auth/me", token)
      .then((userData) => {
        setUserInfo(userData);
        if (userData.is_sales_manager && !userData.is_super_admin && userData.branch_id) {
          setSelectedBranchId(userData.branch_id);
        }
      })
      .catch(console.error);
    
    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);
    
    apiGet("/sales-staff", token)
      .then(setSalesStaff)
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    loadStatistics();
  }, [selectedBranchId, selectedSalesStaffId, selectedMonth, selectedYear, token]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      let branchId = selectedBranchId;
      if (userInfo && userInfo.is_sales_manager && !userInfo.is_super_admin && userInfo.branch_id) {
        branchId = userInfo.branch_id;
      }
      
      let url = `/statistics/comprehensive?year=${selectedYear}`;
      if (branchId) {
        url += `&branch_id=${branchId}`;
      }
      if (selectedSalesStaffId) {
        url += `&sales_staff_id=${selectedSalesStaffId}`;
      }
      if (selectedMonth) {
        url += `&month=${selectedMonth}`;
      }
      
      const data = await apiGet(url, token);
      setStatistics(data);
    } catch (err) {
      console.error("Error loading statistics:", err);
      showError("حدث خطأ أثناء تحميل الإحصائيات");
      setStatistics(null);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "#666", fontSize: "1.1rem" }}>جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "#666", fontSize: "1.1rem" }}>لا توجد بيانات للعرض</p>
        </div>
      </div>
    );
  }

  // حساب الإحصائيات الإجمالية من branches_comprehensive
  // استخدام total_unique_days من Backend الذي يحسب عدد الأيام الفريدة على مستوى جميع الفروع
  // إذا كان يوجد تقارير في فرعين مختلفين في نفس اليوم، يحسب على أنه يوم واحد
  const totalDailyReports = statistics.total_unique_days || 0;
  const totalMonthlyContracts = statistics.branches_comprehensive?.reduce((sum, b) => sum + b.total_monthly_contracts, 0) || 0;
  const totalContractsValue = statistics.branches_comprehensive?.reduce((sum, b) => sum + parseFloat(b.total_contracts_value), 0) || 0;
  const totalPaidAmount = statistics.branches_comprehensive?.reduce((sum, b) => sum + parseFloat(b.total_paid_amount), 0) || 0;
  const totalRemainingAmount = statistics.branches_comprehensive?.reduce((sum, b) => sum + parseFloat(b.total_remaining_amount), 0) || 0;
  const totalNetAmount = statistics.branches_comprehensive?.reduce((sum, b) => sum + parseFloat(b.total_net_amount), 0) || 0;

  const generateStatisticsPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfProgress(0);
    setPdfStatus('جاري إعداد التقرير...');

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
        // Map all default pdfmake-rtl fonts to Cairo
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

      // Get filter information for title
      const branchName = selectedBranchId 
        ? branches.find(b => b.id === selectedBranchId)?.name || `فرع ${selectedBranchId}`
        : "جميع الفروع";
      const salesStaffName = selectedSalesStaffId
        ? salesStaff.find(s => s.id === selectedSalesStaffId)?.name || `موظف ${selectedSalesStaffId}`
        : "جميع موظفي المبيعات";
      const monthName = selectedMonth ? monthNames[selectedMonth] : "جميع الأشهر";

      setPdfProgress(30);
      setPdfStatus('جاري بناء التقرير...');

      // Build PDF document definition using pdfmake
      const isSuperAdmin = userInfo && userInfo.is_super_admin;
      const docDefinition = buildStatisticsPDF(
        statistics,
        totalDailyReports,
        totalMonthlyContracts,
        totalContractsValue,
        totalPaidAmount,
        totalRemainingAmount,
        totalNetAmount,
        branchName,
        salesStaffName,
        monthName,
        selectedYear,
        isSuperAdmin
      );

      setPdfProgress(50);
      setPdfStatus('جاري إنشاء ملف PDF...');

      // Generate and download PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      setPdfProgress(80);
      setPdfStatus('جاري حفظ الملف...');
    
      const fileName = `تقرير_الإحصائيات_${selectedYear}${selectedMonth ? '_' + monthNames[selectedMonth] : ''}${selectedBranchId ? '_' + branchName.replace(/\s/g, '_') : ''}.pdf`;
      pdfDoc.download(fileName);

      setPdfProgress(100);
      setPdfStatus('تم التحميل بنجاح!');

      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfProgress(0);
        setPdfStatus('');
      }, 1000);

    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
      setIsGeneratingPDF(false);
      setPdfProgress(0);
      setPdfStatus('');
    }
  };

  return (
    <div className="container">
      {/* PDF Generation Modal */}
      {isGeneratingPDF && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            minWidth: '300px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#2B2A2A' }}>جاري إنشاء ملف PDF</h3>
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: `${pdfProgress}%`,
                height: '100%',
                backgroundColor: '#007bff',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>{pdfStatus || `${pdfProgress}%`}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="panel" style={{ marginBottom: "2rem" }}>
        <div className="filters-bar" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          {userInfo && userInfo.is_super_admin ? (
            <select 
              value={selectedBranchId || ""} 
              onChange={(e) => {
                setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null);
                setSelectedSalesStaffId(null); // إعادة تعيين موظف المبيعات عند تغيير الفرع
              }}
              style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "13px" }}
            >
              <option value="">جميع الفروع</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          ) : userInfo && userInfo.is_sales_manager ? (
            <div style={{ padding: "0.5rem", backgroundColor: "#f5f5f5", borderRadius: "6px", fontSize: "13px", fontWeight: 600 }}>
              {branches.find(b => b.id === userInfo.branch_id)?.name || `فرع ${userInfo.branch_id}`}
            </div>
          ) : null}
          
          {/* 2. موظف مبيعات */}
          <select
            value={selectedSalesStaffId || ""}
            onChange={(e) => setSelectedSalesStaffId(e.target.value ? parseInt(e.target.value) : null)}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "13px" }}
          >
            <option value="">جميع موظفي المبيعات</option>
            {salesStaff
              .filter(staff => !selectedBranchId || staff.branch_id === selectedBranchId)
              .map(staff => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
          </select>
          
          {/* 3. شهر */}
          <select
            value={selectedMonth || ""}
            onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "13px" }}
          >
            <option value="">جميع الأشهر</option>
            {Object.entries(monthNames).map(([num, name]) => (
              <option key={num} value={num}>{name}</option>
            ))}
          </select>
          
          {/* 4. سنة */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "13px" }}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          </div>
          
          {/* Export PDF Button */}
          <button
            onClick={generateStatisticsPDF}
            className="btn primary"
            style={{ 
              padding: "0.6rem 1.2rem", 
              borderRadius: "6px", 
              fontFamily: "Cairo", 
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            disabled={isGeneratingPDF}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {isGeneratingPDF ? 'جاري التصدير...' : 'تصدير PDF'}
          </button>
        </div>
      </div>

      {/* 1. الإحصائيات الإجمالية */}
      <div className="panel" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
          الإحصائيات الإجمالية
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
          <div className="stat-card">
            <div className="stat-label">إجمالي التقارير اليومية</div>
            <div className="stat-value">{totalDailyReports}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي العقود الشهرية</div>
            <div className="stat-value">{totalMonthlyContracts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي قيمة العقود</div>
            <div className="stat-value">{totalContractsValue.toFixed(2)}</div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي المبالغ المدفوعة</div>
            <div className="stat-value">{totalPaidAmount.toFixed(2)}</div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي المتبقي</div>
            <div className="stat-value" style={{ color: "#DC3545" }}>
              {totalRemainingAmount.toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي الصافي</div>
            <div className="stat-value" style={{ color: "#5A7ACD" }}>
              {totalNetAmount.toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
          {statistics.daily_reports_details?.total_discounted !== undefined && (
            <div className="stat-card">
              <div className="stat-label">إجمالي النسبة</div>
              <div className="stat-value" style={{ color: "#DC3545" }}>
                {parseFloat(statistics.daily_reports_details.total_discounted).toFixed(2)}
              </div>
              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
            </div>
          )}
        </div>
      </div>

      {/* 2. إحصائيات التقارير اليومية */}
      {statistics.daily_reports_details && (
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
            إحصائيات التقارير اليومية
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="stat-card">
              <div className="stat-label">إجمالي المكالمات</div>
              <div className="stat-value">{statistics.daily_reports_details.total_calls}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">إجمالي الهوت كول</div>
              <div className="stat-value">{statistics.daily_reports_details.total_hot_calls}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">إجمالي ليدز الفرع</div>
              <div className="stat-value">{statistics.daily_reports_details.total_branch_leads}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">إجمالي ليدز الأونلاين</div>
              <div className="stat-value">{statistics.daily_reports_details.total_online_leads}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">إجمالي الزيارات</div>
              <div className="stat-value">{statistics.daily_reports_details.total_visits}</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. إحصائيات حسب طريقة الدفع */}
      {statistics.payment_methods_details && statistics.payment_methods_details.length > 0 && (
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
            إحصائيات حسب طريقة الدفع
          </h2>
          <div className="table-container">
            <table style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>طريقة الدفع</th>
                  <th style={{ textAlign: "center" }}>المبلغ الإجمالي</th>
                  <th style={{ textAlign: "center" }}>عدد المعاملات</th>
                  <th style={{ textAlign: "center" }}>المبلغ الصافي</th>
                </tr>
              </thead>
              <tbody>
                {statistics.payment_methods_details.map(method => (
                  <tr key={method.payment_method_id}>
                    <td style={{ fontWeight: 600, textAlign: "center" }}>{method.payment_method_name}</td>
                    <td style={{ textAlign: "center" }}>{parseFloat(method.total_paid).toFixed(2)} درهم</td>
                    <td style={{ textAlign: "center" }}>{method.transactions_count}</td>
                    <td style={{ fontWeight: 600, color: "#5A7ACD", textAlign: "center" }}>{parseFloat(method.total_net).toFixed(2)} درهم</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. إحصائيات الموظف */}
      {statistics.sales_staff_details && statistics.sales_staff_details.length > 0 && (
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
            إحصائيات الموظف
          </h2>
          
          {/* إحصائيات النشاط اليومي */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "1rem", fontWeight: 600, color: "#6B7280" }}>إحصائيات النشاط اليومي</h3>
            <div className="table-container">
              <table style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>اسم الموظف</th>
                    <th style={{ textAlign: "center" }}>الفرع</th>
                    <th style={{ textAlign: "center" }}>عدد المكالمات</th>
                    <th style={{ textAlign: "center" }}>عدد الزيارات</th>
                    <th style={{ textAlign: "center" }}>عدد الـ Leads</th>
                    <th style={{ textAlign: "center" }}>عدد التقارير اليومية</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.sales_staff_details.map(staff => (
                    <tr key={staff.staff_id}>
                      <td style={{ fontWeight: 600, textAlign: "center" }}>{staff.staff_name}</td>
                      <td style={{ textAlign: "center" }}>{staff.branch_name}</td>
                      <td style={{ textAlign: "center" }}>{staff.total_calls}</td>
                      <td style={{ textAlign: "center" }}>{staff.total_visits}</td>
                      <td style={{ textAlign: "center" }}>{staff.total_leads}</td>
                      <td style={{ textAlign: "center" }}>{staff.reports_count || 0}</td>
                    </tr>
                  ))}
                  {/* صف الإجمالي */}
                  <tr style={{ backgroundColor: "#F9FAFB", fontWeight: 600 }}>
                    <td style={{ textAlign: "center" }}>الإجمالي</td>
                    <td style={{ textAlign: "center" }}>-</td>
                    <td style={{ textAlign: "center" }}>{statistics.sales_staff_details.reduce((sum, s) => sum + s.total_calls, 0)}</td>
                    <td style={{ textAlign: "center" }}>{statistics.sales_staff_details.reduce((sum, s) => sum + s.total_visits, 0)}</td>
                    <td style={{ textAlign: "center" }}>{statistics.sales_staff_details.reduce((sum, s) => sum + s.total_leads, 0)}</td>
                    <td style={{ textAlign: "center" }}>{statistics.sales_staff_details.reduce((sum, s) => sum + (s.reports_count || 0), 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* إحصائيات المبيعات */}
          <div>
            <h3 style={{ fontSize: "16px", marginBottom: "1rem", fontWeight: 600, color: "#6B7280" }}>إحصائيات المبيعات</h3>
            <div className="table-container">
              <table style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>اسم الموظف</th>
                    <th style={{ textAlign: "center" }}>الفرع</th>
                    <th style={{ textAlign: "center" }}>إجمالي المبيعات</th>
                    <th style={{ textAlign: "center" }}>عدد العقود</th>
                    <th style={{ textAlign: "center" }}>قيمة العقود</th>
                    <th style={{ textAlign: "center" }}>الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.sales_staff_details.map(staff => (
                    <tr key={staff.staff_id}>
                      <td style={{ fontWeight: 600, textAlign: "center" }}>{staff.staff_name}</td>
                      <td style={{ textAlign: "center" }}>{staff.branch_name}</td>
                      <td style={{ fontWeight: 600, color: "#5A7ACD", textAlign: "center" }}>{parseFloat(staff.total_sales).toFixed(2)} درهم</td>
                      <td style={{ textAlign: "center" }}>{staff.contracts_count}</td>
                      <td style={{ fontWeight: 600, textAlign: "center" }}>{parseFloat(staff.contracts_value).toFixed(2)} درهم</td>
                      <td style={{ fontWeight: 600, color: "#28A745", textAlign: "center" }}>{parseFloat(staff.total_net_amount || 0).toFixed(2)} درهم</td>
                    </tr>
                  ))}
                  {/* صف الإجمالي */}
                  <tr style={{ backgroundColor: "#F9FAFB", fontWeight: 600 }}>
                    <td style={{ textAlign: "center" }}>الإجمالي</td>
                    <td style={{ textAlign: "center" }}>-</td>
                    <td style={{ color: "#5A7ACD", textAlign: "center" }}>
                      {statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.total_sales), 0).toFixed(2)} درهم
                    </td>
                    <td style={{ textAlign: "center" }}>{statistics.sales_staff_details.reduce((sum, s) => sum + s.contracts_count, 0)}</td>
                    <td style={{ textAlign: "center" }}>
                      {statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.contracts_value), 0).toFixed(2)} درهم
                    </td>
                    <td style={{ color: "#28A745", textAlign: "center" }}>
                      {statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.total_net_amount || 0), 0).toFixed(2)} درهم
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* العقود التي مازالت تملك دفعة غير مكتملة */}
      {statistics.incomplete_payment_contracts && statistics.incomplete_payment_contracts.length > 0 && (
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
            العقود التي مازالت تملك دفعة غير مكتملة
          </h2>
          <div className="table-container">
            <table style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr>
                  <th>رقم العقد</th>
                  <th>اسم صاحب العقد</th>
                  <th>الفرع</th>
                  <th>موظف المبيعات</th>
                  <th>الكورس</th>
                  <th>مصدر التسجيل</th>
                  <th>القيمة الإجمالية</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>الصافي</th>
                </tr>
              </thead>
              <tbody>
                {statistics.incomplete_payment_contracts.map(contract => (
                  <tr key={contract.contract_id}>
                    <td>{contract.contract_number}</td>
                    <td style={{ fontWeight: 600 }}>{contract.student_name}</td>
                    <td>{contract.branch_name}</td>
                    <td>{contract.sales_staff_name}</td>
                    <td>{contract.course_name}</td>
                    <td>{contract.registration_source}</td>
                    <td>{parseFloat(contract.total_amount).toFixed(2)} درهم</td>
                    <td>{parseFloat(contract.paid_amount).toFixed(2)} درهم</td>
                    <td style={{ fontWeight: 600, color: "#DC3545" }}>{parseFloat(contract.remaining_amount).toFixed(2)} درهم</td>
                    <td style={{ fontWeight: 600, color: "#5A7ACD" }}>{parseFloat(contract.net_amount).toFixed(2)} درهم</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* تفاصيل التسجيل في كل نوع كورس */}
      {statistics.course_registration_details && statistics.course_registration_details.length > 0 && (
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
            تفاصيل التسجيل في كل نوع كورس
          </h2>
          <div className="table-container">
            <table style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>اسم الكورس</th>
                  <th style={{ textAlign: "center" }}>عدد الفروع</th>
                  <th style={{ textAlign: "center" }}>إجمالي التسجيلات</th>
                  <th style={{ textAlign: "center" }}>القيمة الإجمالية</th>
                  <th style={{ textAlign: "center" }}>المدفوع</th>
                  <th style={{ textAlign: "center" }}>المتبقي</th>
                  <th style={{ textAlign: "center" }}>الصافي</th>
                </tr>
              </thead>
              <tbody>
                {statistics.course_registration_details.map(course => (
                  <tr key={course.course_id}>
                    <td style={{ fontWeight: 600, textAlign: "center" }}>{course.course_name}</td>
                    <td style={{ textAlign: "center" }}>{course.branches_count}</td>
                    <td style={{ textAlign: "center" }}>{course.total_registrations}</td>
                    <td style={{ fontWeight: 600, color: "#5A7ACD", textAlign: "center" }}>{parseFloat(course.total_value).toFixed(2)} درهم</td>
                    <td style={{ textAlign: "center" }}>{parseFloat(course.paid_amount).toFixed(2)} درهم</td>
                    <td style={{ fontWeight: 600, color: "#DC3545", textAlign: "center" }}>{parseFloat(course.remaining_amount).toFixed(2)} درهم</td>
                    <td style={{ fontWeight: 600, color: "#28A745", textAlign: "center" }}>{parseFloat(course.net_amount).toFixed(2)} درهم</td>
                  </tr>
                ))}
                {/* صف الإجمالي */}
                <tr style={{ backgroundColor: "#F9FAFB", fontWeight: 600 }}>
                  <td style={{ textAlign: "center" }}>الإجمالي</td>
                  <td style={{ textAlign: "center" }}>-</td>
                  <td style={{ textAlign: "center" }}>{statistics.course_registration_details.reduce((sum, c) => sum + c.total_registrations, 0)}</td>
                  <td style={{ color: "#5A7ACD", textAlign: "center" }}>
                    {statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.total_value), 0).toFixed(2)} درهم
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.paid_amount), 0).toFixed(2)} درهم
                  </td>
                  <td style={{ color: "#DC3545", textAlign: "center" }}>
                    {statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.remaining_amount), 0).toFixed(2)} درهم
                  </td>
                  <td style={{ color: "#28A745", textAlign: "center" }}>
                    {statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.net_amount), 0).toFixed(2)} درهم
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
