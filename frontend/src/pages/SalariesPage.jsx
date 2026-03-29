import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import pdfMake from "pdfmake-rtl/build/pdfmake";
import { vfs } from "../fonts/vfs_fonts_custom";
import SalaryProcessModal from "../components/SalaryProcessModal";
import SalaryDetailsModal from "../components/SalaryDetailsModal";

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBranchEmployees, setSelectedBranchEmployees] = useState([]);
  const [selectedBranchInfo, setSelectedBranchInfo] = useState(null);
  const [activeMonthDetails, setActiveMonthDetails] = useState({ month: null, year: null, name: "" });
  const [activeCardId, setActiveCardId] = useState(null); // Track which branch card's icons are shown

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

  const handleViewDetails = async (branch, month, year, monthName) => {
    try {
      const data = await apiGet(`/salaries/branch-data?branch_id=${branch.branch_id}&month=${month}&year=${year}`, token);
      if (data && data.length > 0) {
        setSelectedBranchEmployees(data);
        setSelectedBranchInfo(branch);
        setActiveMonthDetails({ month, year, name: monthName });
        setShowDetailsModal(true);
      } else {
        showError("لا توجد بيانات رواتب لعرضها لهذا الفرع");
      }
    } catch (err) {
      showError("حدث خطأ أثناء جلب بيانات الرواتب");
    }
  };

  const onSalarySubmit = async (payload, shouldClose = true) => {
    try {
      await apiPost("/salaries", payload, token);
      success("تم حفظ بيانات الراتب بنجاح");
      await loadSalaries();
      if (shouldClose) {
        setShowProcessModal(false);
      }
      return true;
    } catch (err) {
      showError("حدث خطأ أثناء حفظ الراتب");
      return false;
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
              widths: ['auto', 'auto', '*'], // Reversed: [Net, Count, BranchName]
              body: [
                [
                  { text: formatArabicText('إجمالي الرواتب الصافية'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('عدد الموظفين'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('اسم الفرع'), style: 'tableHeader', alignment: 'center' }
                ],
                ...detailedData.map(b => {
                  const bNet = b.salaries.reduce((sum, s) => sum + parseFloat(s.net_salary || 0), 0);
                  return [
                    { text: formatNumber(bNet) + ' درهم', style: 'tableCell', bold: true, color: '#10B981', alignment: 'center' },
                    { text: b.salaries.length, style: 'tableCell', alignment: 'center' },
                    { text: formatArabicText(b.branch_name), style: 'tableCell', bold: true, alignment: 'center' }
                  ];
                }),
                [
                  { text: formatNumber(totalNet) + ' درهم', style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' },
                  { text: totalEmployees, style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' },
                  { text: formatArabicText('المجموع الإجمالي'), style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' }
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
        const tableHeader = [
          { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('السبب'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الخصم'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('السبب'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الإضافات'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('المستحق'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الأساسي'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الاسم'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الرقم'), style: 'tableHeader', alignment: 'center' }
        ];

        const tableBody = [tableHeader];

        let branchTotalNet = 0;
        let branchTotalBase = 0;
        let branchTotalEntitled = 0;
        let branchTotalAdditions = 0;
        let branchTotalDeductions = 0;

        branch.salaries.forEach(salary => {
          const items = salary.items || [];
          const additions = items.filter(i => i.type === 'addition');
          const deductions = items.filter(i => i.type === 'deduction');

          const addSum = additions.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
          const dedSum = deductions.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
          const sNet = parseFloat(salary.net_salary || 0);
          const sBase = parseFloat(salary.base_salary || 0);
          const sEntitled = parseFloat(salary.entitled_salary || 0);

          branchTotalNet += sNet;
          branchTotalBase += sBase;
          branchTotalEntitled += sEntitled;
          branchTotalAdditions += addSum;
          branchTotalDeductions += dedSum;

          const addReasons = additions.map(i => i.reason).filter(r => r).join(' | ');
          const dedReasons = deductions.map(i => i.reason).filter(r => r).join(' | ');

          // Re-populate body in RTL order manually
          tableBody.push([
            { text: formatNumber(sNet), style: 'tableCell', bold: true, color: '#10B981', alignment: 'center' },
            { text: formatArabicText(dedReasons || '-'), style: 'tableCell', fontSize: 6, alignment: 'center' },
            { text: formatNumber(dedSum), style: 'tableCell', color: '#DC2626', bold: true, alignment: 'center' },
            { text: formatArabicText(addReasons || '-'), style: 'tableCell', fontSize: 6, alignment: 'center' },
            { text: formatNumber(addSum), style: 'tableCell', color: '#10B981', bold: true, alignment: 'center' },
            { text: formatNumber(sEntitled), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(sBase), style: 'tableCell', alignment: 'center' },
            { text: formatArabicText(salary.employee_name || salary.employee?.name || '-'), style: 'tableCell', bold: true, alignment: 'center' },
            { text: salary.employee_number || salary.employee?.employment_number || '-', style: 'tableCell', alignment: 'center' }
          ]);
        });

        // Add Branch Total Row in RTL order manually
        tableBody.push([
          { text: formatNumber(branchTotalNet), style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' },
          { text: '', style: 'tableCell' },
          { text: formatNumber(branchTotalDeductions), style: 'tableHeader', alignment: 'center' },
          { text: '', style: 'tableCell' },
          { text: formatNumber(branchTotalAdditions), style: 'tableHeader', alignment: 'center' },
          { text: formatNumber(branchTotalEntitled), style: 'tableHeader', alignment: 'center' },
          { text: formatNumber(branchTotalBase), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('إجمالي الفرع'), style: 'tableHeader', alignment: 'center', colSpan: 2 },
          {}
        ]);

        docDefinition.content.push({
          stack: [
            { text: '', pageBreak: 'before' },
            { text: formatArabicText(`تفاصيل كشف رواتب فرع: ${branch.branch_name}`), style: 'branchTitle' },
            {
              table: {
                headerRows: 1,
                widths: [40, 72, 32, 72, 32, 32, 32, '*', 28], // Reversed widths: [Net, DedReason, Ded, AddReason, Add, Entitled, Base, Name, Number]
                body: tableBody
              },
              layout: tableLayout
            }
          ]
        });
      });

      // Add Approvals Section at the end
      docDefinition.content.push({ text: '', margin: [0, 40, 0, 15] });
      docDefinition.content.push({ 
        text: formatArabicText('اعتمادات التقرير'), 
        style: 'sectionTitle', 
        alignment: 'center', 
        margin: [0, 0, 0, 20] 
      });

      docDefinition.content.push({
        table: {
          widths: ['*', '*', '*'],
          rtl: true,
          body: [
            [
              { 
                stack: [
                  { text: formatArabicText('مدير الفرع'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] },
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' },
                  { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }
                ]
              },
              { 
                stack: [
                  { text: formatArabicText('مدير منطقة العين'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] },
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' },
                  { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }
                ]
              },
              { 
                stack: [
                  { text: formatArabicText('الموارد البشرية'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] },
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' },
                  { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }
                ]
              }
            ],
            [
              { text: '', margin: [0, 25, 0, 25], colSpan: 3, border: [false, false, false, false] }, {}, {}
            ],
            [
              { 
                stack: [
                  { text: formatArabicText('الحسابات'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] },
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' },
                  { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }
                ]
              },
              { 
                stack: [
                  { text: formatArabicText('الادارة العامة'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] },
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' },
                  { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }
                ]
              },
              { text: '', border: [false, false, false, false] }
            ]
          ]
        },
        layout: 'noBorders'
      });

      pdfMake.createPdf(docDefinition).download(`رواتب_${group.month_name}_${group.year}.pdf`);
      success(`تم تحميل كشف رواتب ${group.month_name}`);
    } catch (err) {
      console.error(err);
      showError("حدث خطأ أثناء إنشاء ملف PDF: " + err.message);
    }
  };

  const generateSingleBranchPDF = async (branch, group) => {
    try {
      // Fetch detailed data for this specific branch
      const response = await apiGet(`/salaries/branch-data?branch_id=${branch.branch_id}&month=${group.month}&year=${group.year}`, token);
      const employees = response; // Array of { employee: {}, salary_record: {} }

      if (!employees || employees.length === 0) {
        showError("لا توجد بيانات رواتب لهذا الفرع");
        return;
      }

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

      let branchTotalNet = 0;
      let branchTotalBase = 0;
      let branchTotalEntitled = 0;
      let branchTotalAdditions = 0;
      let branchTotalDeductions = 0;

      const tableHeader = [
        { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('السبب'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الخصم'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('السبب'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الإضافات'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('المستحق'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الأساسي'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الاسم'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الرقم'), style: 'tableHeader', alignment: 'center' }
      ];

      const tableBody = [tableHeader];

      employees.forEach(item => {
        const salary = item.salary_record || {};
        const items = salary.items || [];
        const additions = items.filter(i => i.type === 'addition');
        const deductions = items.filter(i => i.type === 'deduction');

        const addSum = additions.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
        const dedSum = deductions.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
        const sNet = parseFloat(salary.net_salary || 0);
        const sBase = parseFloat(salary.base_salary || 0);
        const sEntitled = parseFloat(salary.entitled_salary || 0);

        branchTotalNet += sNet;
        branchTotalBase += sBase;
        branchTotalEntitled += sEntitled;
        branchTotalAdditions += addSum;
        branchTotalDeductions += dedSum;

        const addReasons = additions.map(i => i.reason).filter(r => r).join(' | ');
        const dedReasons = deductions.map(i => i.reason).filter(r => r).join(' | ');

        tableBody.push([
          { text: formatNumber(sNet), style: 'tableCell', bold: true, color: '#10B981', alignment: 'center' },
          { text: formatArabicText(dedReasons || '-'), style: 'tableCell', fontSize: 6, alignment: 'center' },
          { text: formatNumber(dedSum), style: 'tableCell', color: '#DC2626', bold: true, alignment: 'center' },
          { text: formatArabicText(addReasons || '-'), style: 'tableCell', fontSize: 6, alignment: 'center' },
          { text: formatNumber(addSum), style: 'tableCell', color: '#10B981', bold: true, alignment: 'center' },
          { text: formatNumber(sEntitled), style: 'tableCell', alignment: 'center' },
          { text: formatNumber(sBase), style: 'tableCell', alignment: 'center' },
          { text: formatArabicText(item.employee.name), style: 'tableCell', bold: true, alignment: 'center' },
          { text: item.employee.employment_number || '-', style: 'tableCell', alignment: 'center' }
        ]);
      });

      // Add Total Row
      tableBody.push([
        { text: formatNumber(branchTotalNet), style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' },
        { text: '', style: 'tableCell' },
        { text: formatNumber(branchTotalDeductions), style: 'tableHeader', alignment: 'center' },
        { text: '', style: 'tableCell' },
        { text: formatNumber(branchTotalAdditions), style: 'tableHeader', alignment: 'center' },
        { text: formatNumber(branchTotalEntitled), style: 'tableHeader', alignment: 'center' },
        { text: formatNumber(branchTotalBase), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('إجمالي الفرع'), style: 'tableHeader', alignment: 'center', colSpan: 2 },
        {}
      ]);

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 8, alignment: 'right' },
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [30, 40, 30, 40],
        content: [
          // Header
          { text: formatArabicText('تقرير رواتب فرع'), style: 'title' },
          { text: formatArabicText('مركز العمران للتدريب والتطوير'), style: 'subtitle' },
          { text: formatArabicText(`${branch.branch_name} - ${group.month_name} ${group.year}`), style: 'subtitle2' },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 5, 0, 15] },

          // Stats
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: formatArabicText('صافي رواتب الفرع'), style: 'statLabel' },
                  { text: `${formatNumber(branchTotalNet)} درهم`, style: 'statValue', color: '#DC2626' }
                ]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('عدد الموظفين'), style: 'statLabel' },
                  { text: formatNumber(employees.length, 0), style: 'statValue', color: '#5A7ACD' }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Detailed Table
          { text: formatArabicText(`تفاصيل كشف رواتب فرع: ${branch.branch_name}`), style: 'branchTitle' },
          {
            table: {
              headerRows: 1,
              widths: [40, 72, 32, 72, 32, 32, 32, '*', 28],
              body: tableBody
            },
            layout: tableLayout
          },

          // Approvals
          { text: '', margin: [0, 40, 0, 15] },
          { text: formatArabicText('اعتمادات التقرير'), style: 'sectionTitle', alignment: 'center', margin: [0, 0, 0, 20] },
          {
            table: {
              widths: ['*', '*', '*'],
              rtl: true,
              body: [
                [
                  { stack: [{ text: formatArabicText('مدير الفرع'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] }, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' }, { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }] },
                  { stack: [{ text: formatArabicText('مدير منطقة العين'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] }, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' }, { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }] },
                  { stack: [{ text: formatArabicText('الموارد البشرية'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] }, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' }, { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }] }
                ],
                [
                  { stack: [{ text: formatArabicText('الحسابات'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] }, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }], alignment: 'center' }, { text: formatArabicText('التوقيع والختم'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }] },
                  { colSpan: 2, stack: [{ text: formatArabicText('الإدارة العامة'), bold: true, alignment: 'center', margin: [0, 5, 0, 30] }, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 240, y2: 0, lineWidth: 1, lineColor: '#5A7ACD' }], alignment: 'center' }, { text: formatArabicText('الاعتماد النهائي والموافقة بقرار الصرف'), fontSize: 6, alignment: 'center', margin: [0, 5, 0, 5] }] }
                ]
              ]
            },
            layout: 'noBorders'
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
          text: formatArabicText(`صفحة ${curr} من ${total} - تقرير فرع ${branch.branch_name}`),
          alignment: 'center',
          fontSize: 8,
          color: '#6B7280',
          margin: [0, 10, 0, 0]
        })
      };

      pdfMake.createPdf(docDefinition).download(`رواتب_${branch.branch_name}_${group.month_name}.pdf`);
      success(`تم تحميل تقرير فرع ${branch.branch_name}`);
    } catch (err) {
      console.error(err);
      showError("خطأ في إنشاء ملف الـ PDF: " + err.message);
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
                          className={`stat-card ${activeCardId === `${key}-${branch.branch_id}` ? 'active' : ''}`}
                          style={{ 
                            padding: "1rem", 
                            cursor: "pointer",
                            textAlign: "center",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            transform: activeCardId === `${key}-${branch.branch_id}` ? "translateY(-4px)" : "none",
                            boxShadow: activeCardId === `${key}-${branch.branch_id}` ? "0 12px 20px -5px rgba(90, 122, 205, 0.2)" : "var(--shadow-sm)",
                            zIndex: activeCardId === `${key}-${branch.branch_id}` ? 10 : 1
                          }}
                          onClick={() => {
                            const cid = `${key}-${branch.branch_id}`;
                            setActiveCardId(activeCardId === cid ? null : cid);
                          }}
                        >
                          <div className="stat-label" style={{ marginBottom: "0.2rem", transition: "all 0.3s" }}>{branch.branch_name}</div>
                          <div className="stat-value" style={{ 
                            fontSize: "22px", 
                            color: "#5A7ACD", 
                            margin: "0.1rem 0",
                            transition: "all 0.3s"
                          }}>
                            {formatNumber(branch.total_net)}
                          </div>
                          <div style={{ 
                            fontSize: "10px", 
                            fontWeight: "700",
                            color: branch.processed_count === branch.total_employees ? "#10B981" : "#F59E0B",
                            marginBottom: "0.5rem",
                            backgroundColor: branch.processed_count === branch.total_employees ? "#ECFDF5" : "#FFFBEB",
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "10px"
                          }}>
                            {branch.processed_count} / {branch.total_employees} معالج
                          </div>

                          {/* Modern Action Overlay (Dynamic) */}
                          <div style={{ 
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: activeCardId === `${key}-${branch.branch_id}` ? "100%" : "0",
                            background: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(8px)",
                            display: "flex", 
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "0.8rem", 
                            padding: "0.75rem",
                            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            opacity: activeCardId === `${key}-${branch.branch_id}` ? 1 : 0,
                            visibility: activeCardId === `${key}-${branch.branch_id}` ? "visible" : "hidden",
                            zIndex: 2,
                            borderTop: activeCardId === `${key}-${branch.branch_id}` ? "1px solid rgba(90, 122, 205, 0.1)" : "none"
                          }}>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <button 
                                title="تحميل تقرير PDF" 
                                onClick={(e) => { e.stopPropagation(); generateSingleBranchPDF(branch, group); }}
                                style={{ 
                                    border: "none", 
                                    background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", 
                                    color: "white", 
                                    padding: "8px", 
                                    borderRadius: "12px", 
                                    cursor: "pointer", 
                                    width: "42px", 
                                    height: "42px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)",
                                    transition: "transform 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                >
                                <span style={{fontSize: "18px"}}>📄</span>
                                </button>
                                <button 
                                title="عرض كشف التفاصيل" 
                                onClick={(e) => { e.stopPropagation(); handleViewDetails(branch, group.month, group.year, group.month_name); }}
                                style={{ 
                                    border: "none", 
                                    background: "linear-gradient(135deg, #10B981, #059669)", 
                                    color: "white", 
                                    padding: "8px", 
                                    borderRadius: "12px", 
                                    cursor: "pointer", 
                                    width: "42px", 
                                    height: "42px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)",
                                    transition: "transform 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                >
                                <span style={{fontSize: "18px"}}>🔍</span>
                                </button>
                                <button 
                                title="بدء معالجة الرواتب" 
                                onClick={(e) => { e.stopPropagation(); handleProcessBranch(branch, group.month, group.year, group.month_name); }}
                                style={{ 
                                    border: "none", 
                                    background: "linear-gradient(135deg, #F59E0B, #D97706)", 
                                    color: "white", 
                                    padding: "8px", 
                                    borderRadius: "12px", 
                                    cursor: "pointer", 
                                    width: "42px", 
                                    height: "42px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.3)",
                                    transition: "transform 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                >
                                <span style={{fontSize: "18px"}}>⚙️</span>
                                </button>
                            </div>
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "#6B7280", marginTop: "4px" }}>إجراءات الفرع</span>
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
          branchName={selectedBranchInfo?.branch_name}
          employees={selectedBranchEmployees}
          month={activeMonthDetails.month}
          year={activeMonthDetails.year}
          monthName={activeMonthDetails.name}
        />
      )}

      {showDetailsModal && (
        <SalaryDetailsModal
          show={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          branchName={selectedBranchInfo?.branch_name}
          data={selectedBranchEmployees}
          monthName={activeMonthDetails.name}
          year={activeMonthDetails.year}
        />
      )}
    </div>
  );
}
