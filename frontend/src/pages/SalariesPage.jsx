import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import pdfMake from "pdfmake-rtl/build/pdfmake";
import { vfs } from "../fonts/vfs_fonts_custom";
import SalaryProcessModal from "../components/SalaryProcessModal";

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};

const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null || isNaN(num)) return "0.00";
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export default function SalariesPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError } = useNotification();
  const [userInfo, setUserInfo] = useState(null);
  const [monthlyGroups, setMonthlyGroups] = useState([]);
  const [appliedYear, setAppliedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  
  // Modal state
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedBranchEmployees, setSelectedBranchEmployees] = useState([]);
  const [selectedBranchInfo, setSelectedBranchInfo] = useState(null);
  const [activeMonthDetails, setActiveMonthDetails] = useState({ month: null, year: null, name: "" });

  useEffect(() => {
    if (!token) return;

    apiGet("/auth/me", token)
      .then(setUserInfo)
      .catch(console.error);

    loadSalaries();
  }, [token, appliedYear]);

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/salaries/all-months?year=${appliedYear}`, token);
      setMonthlyGroups(data);
      
      // Auto-expand current month
      const currentMonth = new Date().getMonth() + 1;
      if (appliedYear === new Date().getFullYear()) {
        const currentKey = `${appliedYear}-${currentMonth}`;
        setExpandedMonths(new Set([currentKey]));
      }
    } catch (err) {
      console.error(err);
      showError("حدث خطأ أثناء تحميل بيانات الرواتب");
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

  const handleProcessBranch = async (branch, month, year, monthName) => {
    try {
      const data = await apiGet(`/salaries/branch-data?branch_id=${branch.branch_id}&month=${month}&year=${year}`, token);
      if (data && data.length > 0) {
        setSelectedBranchEmployees(data);
        setSelectedBranchInfo(branch);
        setActiveMonthDetails({ month, year, name: monthName });
        setShowProcessModal(true);
      } else {
        showError("لا يوجد موظفون في هذا الفرع ليتم احتساب رواتبهم");
      }
    } catch (err) {
      showError("حدث خطأ أثناء جلب بيانات الموظفين");
    }
  };

  const onSalarySubmit = async (payload) => {
    try {
      await apiPost("/salaries", payload, token);
      success("تم حفظ بيانات الراتب بنجاح");
      loadSalaries();
      setShowProcessModal(false);
    } catch (err) {
      showError("حدث خطأ أثناء حفظ الراتب");
    }
  };

  const generateMonthlyPDF = async (group) => {
    try {
      // 1. Fetch detailed data for all branches
      const response = await apiGet(`/salaries/monthly-report?month=${group.month}&year=${group.year}`, token);
      const detailedData = response.data; // Array of { branch_name, salaries: [...] }

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
          bold: 'Cairo-Bold.ttf'
        }
      };

      const formatArabicText = (text) => (text || '').toString().trim().replace(/\s+/g, ' ').replace(/[()]/g, '');
      const formatNumber = (num) => {
        if (!num && num !== 0) return '0.00';
        return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      const tableLayout = {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0.8 : 0.3,
        vLineWidth: () => 0.3,
        hLineColor: (i, node) => (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB',
        vLineColor: () => '#E5E7EB',
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 5,
        paddingBottom: () => 5
      };

      const totalNet = detailedData.reduce((sum, b) => sum + b.salaries.reduce((sSum, s) => sSum + parseFloat(s.net_salary || 0), 0), 0);
      const totalEmployees = detailedData.reduce((sum, b) => sum + b.salaries.length, 0);

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 8, alignment: 'right' },
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [30, 40, 30, 40],
        content: [
          // Page 1 Header
          { text: formatArabicText('تقرير الرواتب'), style: 'title' },
          { text: formatArabicText('مركز العمران للتدريب والتطوير'), style: 'subtitle' },
          { text: formatArabicText(`${group.month_name} ${group.year}`), style: 'subtitle2' },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 5, 0, 15] },

          // Overall Stats
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي الرواتب الصافية'), style: 'statLabel' },
                  { text: `${formatNumber(totalNet)} درهم`, style: 'statValue', color: '#DC2626' }
                ]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي الموظفين'), style: 'statLabel' },
                  { text: formatNumber(totalEmployees, 0), style: 'statValue', color: '#5A7ACD' }
                ]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي الفروع'), style: 'statLabel' },
                  { text: formatNumber(detailedData.length, 0), style: 'statValue', color: '#5A7ACD' }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Summary Table
          { text: formatArabicText('ملخص الفروع'), style: 'sectionTitle' },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: formatArabicText('اسم الفرع'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('عدد الموظفين'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي الرواتب الصافية'), style: 'tableHeader', alignment: 'center' }
                ],
                ...detailedData.map(b => {
                  const bNet = b.salaries.reduce((sum, s) => sum + parseFloat(s.net_salary || 0), 0);
                  return [
                    { text: formatArabicText(b.branch_name), style: 'tableCell', bold: true, alignment: 'center' },
                    { text: b.salaries.length, style: 'tableCell', alignment: 'center' },
                    { text: formatNumber(bNet) + ' درهم', style: 'tableCell', bold: true, color: '#10B981', alignment: 'center' }
                  ];
                }),
                [
                  { text: formatArabicText('المجموع الإجمالي'), style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' },
                  { text: totalEmployees, style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' },
                  { text: formatNumber(totalNet) + ' درهم', style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' }
                ]
              ]
            },
            layout: tableLayout,
            margin: [0, 0, 0, 20]
          }
        ],
        styles: {
          title: { fontSize: 16, bold: true, color: '#5A7ACD', alignment: 'center', margin: [0, 0, 0, 5] },
          subtitle: { fontSize: 13, bold: true, color: '#2B2A2A', alignment: 'center', margin: [0, 0, 0, 3] },
          subtitle2: { fontSize: 10, bold: true, color: '#6B7280', alignment: 'center', margin: [0, 0, 0, 10] },
          sectionTitle: { fontSize: 11, bold: true, color: '#2B2A2A', margin: [0, 0, 0, 8], alignment: 'right' },
          statLabel: { fontSize: 8, color: '#6B7280', margin: [0, 0, 0, 3], alignment: 'center' },
          statValue: { fontSize: 12, bold: true, alignment: 'center' },
          tableHeader: { fontSize: 7, bold: true, fillColor: '#F3F4F6', color: '#1F2937', alignment: 'center' },
          tableCell: { fontSize: 6.5, alignment: 'center', color: '#374151' },
          branchTitle: { fontSize: 14, bold: true, color: '#5A7ACD', margin: [0, 5, 0, 10], alignment: 'center' }
        },
        footer: (curr, total) => ({
          text: formatArabicText(`صفحة ${curr} من ${total}`),
          alignment: 'center',
          fontSize: 8,
          color: '#6B7280',
          margin: [0, 10, 0, 0]
        })
      };

      // Add detailed tables for each branch
      detailedData.forEach(branch => {
        docDefinition.content.push({ text: '', pageBreak: 'before' });
        docDefinition.content.push({ text: formatArabicText(`تفاصيل كشف رواتب فرع: ${branch.branch_name}`), style: 'branchTitle' });

        const tableBody = [
          [
            { text: formatArabicText('الرقم'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الاسم'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الأساسي'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('المستحق'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الإضافات'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('السبب'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الخصم'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('السبب'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' }
          ]
        ];

        let branchTotalNet = 0;
        branch.salaries.forEach(salary => {
          const items = salary.items || [];
          const additions = items.filter(i => i.type === 'addition');
          const deductions = items.filter(i => i.type === 'deduction');

          const addSum = additions.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
          const dedSum = deductions.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
          const sNet = parseFloat(salary.net_salary || 0);
          branchTotalNet += sNet;

          const addReasons = additions.map(i => i.reason).filter(r => r).join(' | ');
          const dedReasons = deductions.map(i => i.reason).filter(r => r).join(' | ');

          tableBody.push([
            { text: salary.employee_number || salary.employee?.employment_number || '-', style: 'tableCell', alignment: 'center' },
            { text: formatArabicText(salary.employee_name || salary.employee?.name || '-'), style: 'tableCell', bold: true, alignment: 'center' },
            { text: formatNumber(salary.base_salary), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(salary.entitled_salary), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(addSum), style: 'tableCell', color: '#10B981', bold: true, alignment: 'center' },
            { text: formatArabicText(addReasons || '-'), style: 'tableCell', fontSize: 6, alignment: 'center' },
            { text: formatNumber(dedSum), style: 'tableCell', color: '#DC2626', bold: true, alignment: 'center' },
            { text: formatArabicText(dedReasons || '-'), style: 'tableCell', fontSize: 6, alignment: 'center' },
            { text: formatNumber(sNet), style: 'tableCell', bold: true, color: '#10B981', alignment: 'center' }
          ]);
        });

        // Add Branch Total Row
        tableBody.push([
          { text: '', style: 'tableCell' },
          { text: formatArabicText('إجمالي الفرع'), style: 'tableHeader', alignment: 'center', colSpan: 2 },
          {},
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: '', style: 'tableCell' },
          { text: formatNumber(branchTotalNet) + ' درهم', style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' }
        ]);

        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: [28, '*', 32, 32, 32, 72, 32, 72, 40],
            body: tableBody
          },
          layout: tableLayout
        });
      });

      pdfMake.createPdf(docDefinition).download(`رواتب_${group.month_name}_${group.year}.pdf`);
      success(`تم تحميل كشف رواتب ${group.month_name}`);
    } catch (err) {
      console.error(err);
      showError("حدث خطأ أثناء إنشاء ملف PDF: " + err.message);
    }
  };

  const generateYearlyPDF = () => {
    if (!monthlyGroups || monthlyGroups.length === 0) {
      showError("لا توجد بيانات متاحة للسنة المختارة");
      return;
    }

    try {
      pdfMake.vfs = vfs;
      pdfMake.fonts = { Cairo: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf' } };

      const formatArabicText = (text) => (text || '').toString().trim();
      const totalYearly = monthlyGroups.reduce((sum, g) => sum + parseFloat(g.total_salary || 0), 0);

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 10, alignment: 'right' },
        content: [
          { text: formatArabicText('تقرير مسيرة الرواتب السنوي'), style: 'header' },
          { text: formatArabicText(`إجمالي سنة ${appliedYear}`), style: 'subheader' },
          { text: `إجمالي الرواتب السنوية: ${formatNumber(totalYearly)} درهم`, style: 'total', margin: [0, 10, 0, 20] },
          
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: formatArabicText('إجمالي الرواتب'), style: 'tableHeader' },
                  { text: formatArabicText('عدد الفروع'), style: 'tableHeader' },
                  { text: formatArabicText('الشهر'), style: 'tableHeader' }
                ],
                ...monthlyGroups.map(g => [
                  { text: formatNumber(g.total_salary) + ' درهم', alignment: 'center' },
                  { text: g.branches.length, alignment: 'center' },
                  { text: g.month_name, alignment: 'center' }
                ])
              ]
            },
            layout: 'lightHorizontalLines'
          }
        ],
        styles: {
          header: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subheader: { fontSize: 15, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          total: { fontSize: 13, bold: true, color: '#1e3a8a' },
          tableHeader: { bold: true, fontSize: 11, color: 'black', fillColor: '#eeeeee', alignment: 'center' }
        }
      };

      pdfMake.createPdf(docDefinition).download(`رواتب_سنوية_${appliedYear}.pdf`);
      success("تم البدء في تحميل التقرير السنوي...");
    } catch (err) {
      console.error(err);
      showError("خطأ في إنشاء التقرير السنوي");
    }
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض هذه الصفحة</p>
        </div>
      </div>
    );
  }

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
    <div className="container">
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "#2B2A2A" }}>نظام إدارة الرواتب</h3>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {monthlyGroups.length > 0 && (
              <button
                className="btn success btn-small"
                onClick={generateYearlyPDF}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0 0.75rem",
                  fontSize: "12px",
                  fontWeight: "600",
                  height: "30px",
                  borderRadius: "3px"
                }}
              >
                📊 تحميل تقرير السنة {appliedYear}
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#202020" }}>السنة:</span>
              <select 
                value={appliedYear} 
                onChange={(e) => setAppliedYear(parseInt(e.target.value))}
                style={{ 
                  padding: "0.25rem 0.5rem", 
                  borderRadius: "3px", 
                  border: "1px solid #D1D1D1", 
                  fontFamily: "Cairo", 
                  fontSize: "12px",
                  height: "30px",
                  backgroundColor: "white"
                }}
              >
                {[appliedYear - 1, appliedYear, appliedYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p>جاري تحميل البيانات...</p>
        </div>
      ) : monthlyGroups.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p>لا توجد بيانات متاحة لهذا العام</p>
        </div>
      ) : (
        <div>
          {monthlyGroups.map(group => {
            const key = `${group.year}-${group.month}`;
            const isExpanded = expandedMonths.has(key);
            
            return (
              <div 
                key={key} 
                className="panel" 
                style={{ 
                  marginBottom: "1.5rem", 
                  padding: "0.75rem"
                }}
              >
                <h2 
                  onClick={() => toggleMonth(group.year, group.month)}
                  style={{ 
                    fontSize: "18px", 
                    marginBottom: isExpanded ? "1.5rem" : "0", 
                    fontWeight: "600", 
                    color: "#2B2A2A", 
                    borderBottom: isExpanded ? "2px solid #E5E7EB" : "none", 
                    paddingBottom: "0.75rem", 
                    cursor: "pointer", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginTop: 0,
                    marginRight: 0,
                    marginLeft: 0
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span>{group.month_name} {group.year}</span>
                    <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>
                      (إجمالي: {formatNumber(group.total_salary)} درهم)
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <button 
                      className="btn-small"
                      title="تحميل PDF"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateMonthlyPDF(group);
                      }}
                      style={{ 
                        padding: "0.3rem 0.6rem", 
                        fontSize: "0.75rem", 
                        backgroundColor: "#3B82F6", // var(--color-primary) equivalent
                        color: "white", 
                        border: "none", 
                        borderRadius: "4px", 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontWeight: "600"
                      }}
                    >
                      <span style={{fontSize: "12px"}}>📄</span> PDF
                    </button>
                    <span style={{ 
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", 
                      transition: "transform 0.2s",
                      fontSize: "14px"
                    }}>▼</span>
                  </div>
                </h2>

                {isExpanded && (
                  <div className="panel-content" style={{ padding: "0", borderTop: "none" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                      {group.branches.map(branch => (
                        <div 
                          key={branch.branch_id} 
                          className="stat-card" 
                          style={{ 
                            padding: "1rem", 
                            cursor: "pointer",
                            textAlign: "center"
                          }}
                          onClick={() => handleProcessBranch(branch, group.month, group.year, group.month_name)}
                        >
                          <div className="stat-label" style={{ marginBottom: "0.5rem" }}>{branch.branch_name}</div>
                          <div className="stat-value" style={{ fontSize: "20px", color: "#5A7ACD", margin: "0.5rem 0" }}>
                            {formatNumber(branch.total_net)}
                          </div>
                          <div style={{ 
                            fontSize: "11px", 
                            fontWeight: "600",
                            color: branch.processed_count === branch.total_employees ? "#28a745" : "#FEB05D",
                            marginTop: "0.4rem"
                          }}>
                            المعالجين: {branch.processed_count} / {branch.total_employees}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showProcessModal && (
        <SalaryProcessModal 
          show={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          onSubmit={onSalarySubmit}
          employees={selectedBranchEmployees}
          month={activeMonthDetails.month}
          year={activeMonthDetails.year}
          monthName={activeMonthDetails.name}
        />
      )}
    </div>
  );
}
