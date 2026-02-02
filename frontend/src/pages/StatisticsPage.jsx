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

const safeParse = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null || isNaN(num)) return num;
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const MultiSelect = ({ options, selectedValues, onChange, placeholder, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const isAllSelected = options.length > 0 && selectedValues.length === options.length;

  const toggleAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  return (
    <div ref={containerRef} className="multiselect-container" style={{ position: "relative", ...style }}>
      <div
        className="multiselect-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "0.4rem 0.5rem",
          borderRadius: "6px",
          border: "1px solid #dcdcdc",
          backgroundColor: "white",
          cursor: "pointer",
          minWidth: "150px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "13px",
          height: "36px"
        }}
      >
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "140px",
          fontFamily: "Cairo"
        }}>
          {selectedValues.length === 0
            ? placeholder
            : selectedValues.length === options.length
              ? `الكل (${options.length})`
              : selectedValues.length <= 2
                ? options.filter(o => selectedValues.includes(o.value)).map(o => o.label).join('، ')
                : `${selectedValues.length} مختار`}
        </span>
        <span style={{ fontSize: "10px", color: "#666" }}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div
          className="multiselect-dropdown"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: "white",
            border: "1px solid #dcdcdc",
            borderRadius: "6px",
            marginTop: "4px",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: "4px 0"
          }}
        >
          <div
            style={{
              padding: "0.5rem",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "bold",
              fontSize: "12px",
              fontFamily: "Cairo"
            }}
            onClick={toggleAll}
          >
            <input type="checkbox" checked={isAllSelected} readOnly style={{ cursor: "pointer" }} />
            الكل
          </div>
          {options.map(opt => (
            <div
              key={opt.value}
              style={{
                padding: "0.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "12px",
                fontFamily: "Cairo",
                backgroundColor: selectedValues.includes(opt.value) ? "#f0f7ff" : "transparent"
              }}
              onClick={() => toggleOption(opt.value)}
            >
              <input type="checkbox" checked={selectedValues.includes(opt.value)} readOnly style={{ cursor: "pointer" }} />
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function StatisticsPage() {
  const token = localStorage.getItem("token") || "";
  const { error: showError } = useNotification();
  const [branches, setBranches] = useState([]);
  const [salesStaff, setSalesStaff] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);
  const [selectedSalesStaffIds, setSelectedSalesStaffIds] = useState([]);
  const [selectedMonthIds, setSelectedMonthIds] = useState([new Date().getMonth() + 1]);
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
          setSelectedBranchIds([userData.branch_id]);
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
  }, [selectedBranchIds, selectedSalesStaffIds, selectedMonthIds, selectedYear, token]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      let branchIds = selectedBranchIds;
      if (userInfo && userInfo.is_sales_manager && !userInfo.is_super_admin && userInfo.branch_id) {
        branchIds = [userInfo.branch_id];
      }

      let url = `/statistics/comprehensive?year=${selectedYear}`;
      if (branchIds.length > 0) {
        url += `&branch_id=${branchIds.join(',')}`;
      }
      if (selectedSalesStaffIds.length > 0) {
        url += `&sales_staff_id=${selectedSalesStaffIds.join(',')}`;
      }
      if (selectedMonthIds.length > 0) {
        url += `&month=${selectedMonthIds.join(',')}`;
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
  // Helper helper to ensure number
  const safeParse = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const totalDailyReports = statistics.total_unique_days || 0;
  const totalMonthlyContracts = statistics.branches_comprehensive?.reduce((sum, b) => sum + (parseInt(b.total_monthly_contracts) || 0), 0) || 0;
  const totalContractsValue = statistics.branches_comprehensive?.reduce((sum, b) => sum + safeParse(b.total_contracts_value), 0) || 0;
  const totalPaidAmount = statistics.branches_comprehensive?.reduce((sum, b) => sum + safeParse(b.total_paid_amount), 0) || 0;
  const totalRemainingAmount = statistics.branches_comprehensive?.reduce((sum, b) => sum + safeParse(b.total_remaining_amount), 0) || 0;
  const totalNetAmount = statistics.branches_comprehensive?.reduce((sum, b) => sum + safeParse(b.total_net_amount), 0) || 0;

  const formatDateArabic = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const dayNames = ["الأحد", "الأثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const monthName = monthNames[date.getMonth() + 1];
    const year = date.getFullYear();
    return `${dayName} ${day} ${monthName} ${year}`;
  };

  const handleDownloadPDF = async () => {
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
      const branchName = selectedBranchIds.length > 0
        ? selectedBranchIds.map(id => branches.find(b => b.id === id)?.name || id).join('، ')
        : "جميع الفروع";
      const salesStaffName = selectedSalesStaffIds.length > 0
        ? selectedSalesStaffIds.map(id => salesStaff.find(s => s.id === id)?.name || id).join('، ')
        : "جميع موظفي المبيعات";
      const monthName = selectedMonthIds.length > 0
        ? selectedMonthIds.sort((a, b) => a - b).map(m => monthNames[m]).join('، ')
        : "جميع الأشهر";

      setPdfProgress(30);
      setPdfStatus('جاري بناء التقرير...');

      // Build PDF document definition using pdfmake
      const isSuperAdmin = userInfo && userInfo.is_super_admin;
      // Filter branches to only those with activity for the PDF report (to mimic original behavior and avoid bloat)
      const activeBranches = statistics.branches_comprehensive?.filter(b =>
        (parseInt(b.total_monthly_contracts) || 0) > 0 ||
        (safeParse(b.total_contracts_value) > 0) ||
        (safeParse(b.total_paid_amount) > 0) ||
        (safeParse(b.total_daily_reports) || 0) > 0
      ) || [];

      // Create a modified statistics object for the PDF
      const pdfStatistics = {
        ...statistics,
        branches_comprehensive: activeBranches
      };

      const docDefinition = buildStatisticsPDF(
        pdfStatistics,
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
        isSuperAdmin,
        selectedBranchIds
      );

      setPdfProgress(50);
      setPdfStatus('جاري إنشاء ملف PDF...');

      // Generate and download PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);

      setPdfProgress(80);
      setPdfStatus('جاري حفظ الملف...');

      let monthPart = "";
      if (selectedMonthIds.length === 1) {
        monthPart = `_${monthNames[selectedMonthIds[0]]}`;
      } else if (selectedMonthIds.length > 1) {
        monthPart = "_أشهر_متعددة";
      }

      let branchPart = "";
      if (selectedBranchIds.length === 1) {
        branchPart = `_${branches.find(b => b.id === selectedBranchIds[0])?.name || selectedBranchIds[0]}`;
      } else if (selectedBranchIds.length > 1) {
        branchPart = "_فروع_متعددة";
      }

      const fileName = `تقرير_الإحصائيات_${selectedYear}${monthPart}${branchPart}.pdf`.replace(/\s/g, '_');
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
              <MultiSelect
                placeholder="جميع الفروع"
                options={branches.map(b => ({ label: b.name, value: b.id }))}
                selectedValues={selectedBranchIds}
                onChange={(vals) => {
                  setSelectedBranchIds(vals);
                  setSelectedSalesStaffIds([]);
                }}
              />
            ) : userInfo && userInfo.is_sales_manager ? (
              <div style={{ padding: "0.5rem", backgroundColor: "#f5f5f5", borderRadius: "6px", fontSize: "13px", fontWeight: 600, fontFamily: "Cairo" }}>
                {branches.find(b => b.id === userInfo.branch_id)?.name || `فرع ${userInfo.branch_id}`}
              </div>
            ) : null}

            {/* 2. موظف مبيعات */}
            <MultiSelect
              placeholder="جميع موظفي المبيعات"
              options={salesStaff
                .filter(staff => selectedBranchIds.length === 0 || selectedBranchIds.includes(staff.branch_id))
                .map(staff => ({ label: staff.name, value: staff.id }))}
              selectedValues={selectedSalesStaffIds}
              onChange={setSelectedSalesStaffIds}
            />

            {/* 3. شهر */}
            <MultiSelect
              placeholder="جميع الأشهر"
              options={Object.entries(monthNames).map(([num, name]) => ({ label: name, value: parseInt(num) }))}
              selectedValues={selectedMonthIds}
              onChange={setSelectedMonthIds}
            />

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

          <button
            onClick={handleDownloadPDF}
            className="btn success"
            disabled={isGeneratingPDF}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {isGeneratingPDF ? (
              <span>جاري التحميل...</span>
            ) : (
              <>
                <span>📄 تحميل تقرير شامل</span>
              </>
            )}
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
            <div className="stat-value">{formatNumber(totalDailyReports, 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي العقود الشهرية</div>
            <div className="stat-value">{formatNumber(totalMonthlyContracts, 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي المبيعات</div>
            <div className="stat-value">{formatNumber(totalContractsValue)}</div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي المبالغ المدفوعة</div>
            <div className="stat-value">{formatNumber(totalPaidAmount)}</div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي المتبقي</div>
            <div className="stat-value" style={{ color: "#DC3545" }}>
              {formatNumber(totalRemainingAmount)}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي الصافي</div>
            <div className="stat-value" style={{ color: "#5A7ACD" }}>
              {formatNumber(totalNetAmount)}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">إجمالي النسبة</div>
            <div className="stat-value" style={{ color: "#DC3545" }}>
              {formatNumber(totalPaidAmount - totalNetAmount)}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
          </div>
        </div>
      </div>

      {/* 2. إحصائيات التقارير اليومية */}
      {
        statistics.daily_reports_details && (
          <div className="panel" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
              إحصائيات التقارير اليومية
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div className="stat-card">
                <div className="stat-label">إجمالي المكالمات</div>
                <div className="stat-value">{formatNumber(statistics.daily_reports_details.total_calls, 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي الهوت كول</div>
                <div className="stat-value">{formatNumber(statistics.daily_reports_details.total_hot_calls, 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي الووك إن</div>
                <div className="stat-value">{formatNumber(statistics.daily_reports_details.total_walk_ins, 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي ليدز الفرع</div>
                <div className="stat-value">{formatNumber(statistics.daily_reports_details.total_branch_leads, 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي ليدز الأونلاين</div>
                <div className="stat-value">{formatNumber(statistics.daily_reports_details.total_online_leads, 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي ليدز إضافي</div>
                <div className="stat-value">{formatNumber(statistics.daily_reports_details.total_extra_leads, 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي الزيارات</div>
                <div className="stat-value">{formatNumber(statistics.daily_reports_details.total_visits, 0)}</div>
              </div>
            </div>
          </div>
        )
      }

      {/* 1.5 إحصائيات الفروع التفصيلية (للسوبر أدمن فقط) */}
      {userInfo && userInfo.is_super_admin && statistics.branches_comprehensive && statistics.branches_comprehensive.length > 0 && (
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
            إحصائيات الفروع التفصيلية
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {statistics.branches_comprehensive.map(branchStat => {
              const branchName = branches.find(b => b.id === branchStat.branch_id)?.name || `فرع ${branchStat.branch_id}`;
              const netAmount = safeParse(branchStat.total_net_amount);
              const totalPaid = safeParse(branchStat.total_paid_amount);
              const feeAmount = totalPaid - netAmount;

              return (
                <div key={branchStat.branch_id} style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: "8px",
                  padding: "1rem",
                  border: "1px solid #E5E7EB"
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "1rem", color: "#1F2937", borderBottom: "1px solid #E5E7EB", paddingBottom: "0.5rem" }}>
                    {branchName}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", fontSize: "13px" }}>
                    <div>
                      <div style={{ color: "#6B7280", marginBottom: "2px" }}>العقود الشهرية</div>
                      <div style={{ fontWeight: "600" }}>{formatNumber(parseInt(branchStat.total_monthly_contracts) || 0, 0)}</div>
                    </div>
                    <div>
                      <div style={{ color: "#6B7280", marginBottom: "2px" }}>إجمالي المبيعات</div>
                      <div style={{ fontWeight: "600" }}>{formatNumber(safeParse(branchStat.total_contracts_value))}</div>
                    </div>
                    <div>
                      <div style={{ color: "#6B7280", marginBottom: "2px" }}>المدفوع</div>
                      <div style={{ fontWeight: "600" }}>{formatNumber(totalPaid)}</div>
                    </div>
                    <div>
                      <div style={{ color: "#6B7280", marginBottom: "2px" }}>المتبقي</div>
                      <div style={{ fontWeight: "600", color: "#DC3545" }}>{formatNumber(safeParse(branchStat.total_remaining_amount))}</div>
                    </div>
                    <div>
                      <div style={{ color: "#6B7280", marginBottom: "2px" }}>الصافي</div>
                      <div style={{ fontWeight: "600", color: "#5A7ACD" }}>{formatNumber(netAmount)}</div>
                    </div>
                    <div>
                      <div style={{ color: "#6B7280", marginBottom: "2px" }}>النسبة</div>
                      <div style={{ fontWeight: "600", color: "#DC3545" }}>{formatNumber(feeAmount)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. إحصائيات حسب طريقة الدفع */}
      {
        statistics.payment_methods_details && statistics.payment_methods_details.length > 0 && (
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
                      <td style={{ textAlign: "center" }}>{formatNumber(parseFloat(method.total_paid))} درهم</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(method.transactions_count, 0)}</td>
                      <td style={{ fontWeight: 600, color: "#5A7ACD", textAlign: "center" }}>{formatNumber(parseFloat(method.total_net))} درهم</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* 4. إحصائيات حسب مصدر التسجيل */}
      {
        statistics.registration_sources_details && statistics.registration_sources_details.length > 0 && (
          <div className="panel" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
              إحصائيات حسب مصدر التسجيل
            </h2>
            <div className="table-container">
              <table style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>مصدر التسجيل</th>
                    <th style={{ textAlign: "center" }}>الفرع</th>
                    <th style={{ textAlign: "center" }}>عدد العقود</th>
                    <th style={{ textAlign: "center" }}>المبلغ المدفوع</th>
                    <th style={{ textAlign: "center" }}>المبلغ الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.registration_sources_details.map((source, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, textAlign: "center" }}>{source.registration_source}</td>
                      <td style={{ textAlign: "center" }}>{source.branch_name}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(source.total_contracts, 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(source.total_paid)} درهم</td>
                      <td style={{ fontWeight: 600, color: "#5A7ACD", textAlign: "center" }}>{formatNumber(source.total_net)} درهم</td>
                    </tr>
                  ))}
                  {/* صف الإجمالي */}
                  <tr style={{ backgroundColor: "#F9FAFB", fontWeight: 600 }}>
                    <td style={{ textAlign: "center" }}>الإجمالي</td>
                    <td style={{ textAlign: "center" }}>-</td>
                    <td style={{ textAlign: "center" }}>{formatNumber(statistics.registration_sources_details.reduce((sum, s) => sum + s.total_contracts, 0), 0)}</td>
                    <td style={{ textAlign: "center" }}>{formatNumber(statistics.registration_sources_details.reduce((sum, s) => sum + s.total_paid, 0))} درهم</td>
                    <td style={{ color: "#5A7ACD", textAlign: "center" }}>{formatNumber(statistics.registration_sources_details.reduce((sum, s) => sum + s.total_net, 0))} درهم</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* 4. إحصائيات الموظف */}
      {
        statistics.sales_staff_details && statistics.sales_staff_details.length > 0 && (
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
                      <th style={{ textAlign: "center" }}>الاتصالات اليومية</th>
                      <th style={{ textAlign: "center" }}>الهوت كول</th>
                      <th style={{ textAlign: "center" }}>الووك ان</th>
                      <th style={{ textAlign: "center" }}>ليدز الفرع</th>
                      <th style={{ textAlign: "center" }}>ليدز الاونلاين</th>
                      <th style={{ textAlign: "center" }}>الليدز الاضافي</th>
                      <th style={{ textAlign: "center" }}>عدد الزيارات</th>
                      <th style={{ textAlign: "center" }}>عدد التقارير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.sales_staff_details.map(staff => (
                      <tr key={staff.staff_id}>
                        <td style={{ fontWeight: 600, textAlign: "center" }}>{staff.staff_name}</td>
                        <td style={{ textAlign: "center" }}>{staff.branch_name}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.total_calls, 0)}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.total_hot_calls, 0)}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.total_walk_ins, 0)}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.total_branch_leads, 0)}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.total_online_leads, 0)}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.total_extra_leads, 0)}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.total_visits, 0)}</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.reports_count || 0, 0)}</td>
                      </tr>
                    ))}
                    {/* صف الإجمالي */}
                    <tr style={{ backgroundColor: "#F9FAFB", fontWeight: 600 }}>
                      <td style={{ textAlign: "center" }}>الإجمالي</td>
                      <td style={{ textAlign: "center" }}>-</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_calls, 0), 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_hot_calls, 0), 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_walk_ins, 0), 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_branch_leads, 0), 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_online_leads, 0), 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_extra_leads, 0), 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_visits, 0), 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + (s.reports_count || 0), 0), 0)}</td>
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
                      <th style={{ textAlign: "center" }}>المبالغ المدفوعة</th>
                      <th style={{ textAlign: "center" }}>الصافي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.sales_staff_details.map(staff => (
                      <tr key={staff.staff_id}>
                        <td style={{ fontWeight: 600, textAlign: "center" }}>{staff.staff_name}</td>
                        <td style={{ textAlign: "center" }}>{staff.branch_name}</td>
                        <td style={{ fontWeight: 600, color: "#5A7ACD", textAlign: "center" }}>{formatNumber(parseFloat(staff.total_sales))} درهم</td>
                        <td style={{ textAlign: "center" }}>{formatNumber(staff.contracts_count, 0)}</td>
                        <td style={{ fontWeight: 600, textAlign: "center" }}>{formatNumber(parseFloat(staff.total_paid_amount || 0))} درهم</td>
                        <td style={{ fontWeight: 600, color: "#28A745", textAlign: "center" }}>{formatNumber(parseFloat(staff.total_net_amount || 0))} درهم</td>
                      </tr>
                    ))}
                    {/* صف الإجمالي */}
                    <tr style={{ backgroundColor: "#F9FAFB", fontWeight: 600 }}>
                      <td style={{ textAlign: "center" }}>الإجمالي</td>
                      <td style={{ textAlign: "center" }}>-</td>
                      <td style={{ color: "#5A7ACD", textAlign: "center" }}>
                        {formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.total_sales), 0))} درهم
                      </td>
                      <td style={{ textAlign: "center" }}>{formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.contracts_count, 0), 0)}</td>
                      <td style={{ textAlign: "center" }}>
                        {formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.total_paid_amount || 0), 0))} درهم
                      </td>
                      <td style={{ color: "#28A745", textAlign: "center" }}>
                        {formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.total_net_amount || 0), 0))} درهم
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }

      {/* العقود التي مازالت تملك دفعة غير مكتملة */}
      {
        statistics.incomplete_payment_contracts && statistics.incomplete_payment_contracts.length > 0 && (
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
                      <td>{formatNumber(parseFloat(contract.total_amount))} درهم</td>
                      <td>{formatNumber(parseFloat(contract.paid_amount))} درهم</td>
                      <td style={{ fontWeight: 600, color: "#DC3545" }}>{formatNumber(parseFloat(contract.remaining_amount))} درهم</td>
                      <td style={{ fontWeight: 600, color: "#5A7ACD" }}>{formatNumber(parseFloat(contract.net_amount))} درهم</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* تفاصيل الزيارات */}
      {
        statistics.visits_details && statistics.visits_details.length > 0 && (
          <div className="panel" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "1.5rem", fontWeight: 600, color: "#2B2A2A", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.75rem" }}>
              تفاصيل الزيارات
            </h2>
            <div className="table-container">
              <table style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>التاريخ</th>
                    <th style={{ textAlign: "center" }}>اسم الموظف</th>
                    <th style={{ textAlign: "center" }}>الفرع</th>
                    <th style={{ textAlign: "center" }}>تفاصيل الزيارة</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.visits_details.map((visit, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: "center" }}>{formatDateArabic(visit.date)}</td>
                      <td style={{ textAlign: "center" }}>{visit.sales_staff_name}</td>
                      <td style={{ textAlign: "center" }}>{visit.branch_name}</td>
                      <td style={{ textAlign: "right" }}>{visit.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* تفاصيل التسجيل في كل نوع كورس */}
      {
        statistics.course_registration_details && statistics.course_registration_details.length > 0 && (
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
                      <td style={{ textAlign: "center" }}>{formatNumber(course.branches_count, 0)}</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(course.total_registrations, 0)}</td>
                      <td style={{ fontWeight: 600, color: "#5A7ACD", textAlign: "center" }}>{formatNumber(parseFloat(course.total_value))} درهم</td>
                      <td style={{ textAlign: "center" }}>{formatNumber(parseFloat(course.paid_amount))} درهم</td>
                      <td style={{ fontWeight: 600, color: "#DC3545", textAlign: "center" }}>{formatNumber(parseFloat(course.remaining_amount))} درهم</td>
                      <td style={{ fontWeight: 600, color: "#28A745", textAlign: "center" }}>{formatNumber(parseFloat(course.net_amount))} درهم</td>
                    </tr>
                  ))}
                  {/* صف الإجمالي */}
                  <tr style={{ backgroundColor: "#F9FAFB", fontWeight: 600 }}>
                    <td style={{ textAlign: "center" }}>الإجمالي</td>
                    <td style={{ textAlign: "center" }}>-</td>
                    <td style={{ textAlign: "center" }}>{formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + c.total_registrations, 0), 0)}</td>
                    <td style={{ color: "#5A7ACD", textAlign: "center" }}>
                      {formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.total_value), 0))} درهم
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.paid_amount), 0))} درهم
                    </td>
                    <td style={{ color: "#DC3545", textAlign: "center" }}>
                      {formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.remaining_amount), 0))} درهم
                    </td>
                    <td style={{ color: "#28A745", textAlign: "center" }}>
                      {formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.net_amount), 0))} درهم
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      }
    </div >
  );
}
