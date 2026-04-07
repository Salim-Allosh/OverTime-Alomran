import pdfMake from "pdfmake-rtl/build/pdfmake";
import { vfs } from "../fonts/vfs_fonts_custom";

// Initialize fonts
pdfMake.vfs = vfs;
pdfMake.fonts = {
  Cairo: {
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
  },
  Nillima: {
    normal: 'Cairo-Regular.ttf',
    bold: 'Cairo-Bold.ttf',
    italics: 'Cairo-Regular.ttf',
    bolditalics: 'Cairo-Bold.ttf'
  }
};

// ----------------------------------------------------------------------------
// Utility Formatter Helpers
// ----------------------------------------------------------------------------
const formatArabic = (text) => {
  if (text === undefined || text === null) return '';
  let str = String(text).trim();
  if (str === '') return '';
  
  // Clean text
  str = str.replace(/\s+/g, ' ').replace(/[()]/g, '');
  
  // Prefix with RLM (\u200F) to force RTL context in pdfmake-rtl/Bidi
  return `\u200F${str}`;
};

const formatNum = (num, decimals = 2) => {
  if (typeof num !== 'number' && isNaN(parseFloat(num))) return num || "0.00";
  return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// ----------------------------------------------------------------------------
// Premium PDF Styling Constants (Mirrored from Overtime Reports)
// ----------------------------------------------------------------------------
const styles = {
  title: { fontSize: 18, bold: true, color: '#5A7ACD', alignment: 'center', direction: 'rtl' },
  subtitle: { fontSize: 14, bold: true, color: '#2B2A2A', alignment: 'center', direction: 'rtl' },
  subtitle2: { fontSize: 12, bold: true, color: '#6B7280', alignment: 'center', direction: 'rtl' },
  sectionTitle: { fontSize: 12, bold: true, color: '#2B2A2A', margin: [0, 0, 0, 8], alignment: 'right', direction: 'rtl' },
  
  tableHeader: { fontSize: 8, bold: true, fillColor: '#F3F4F6', color: '#1F2937', alignment: 'center', direction: 'rtl', margin: [0, 0, 0, 0] },
  tableCell: { fontSize: 7, alignment: 'center', color: '#374151', direction: 'rtl' },
  tableCellBold: { fontSize: 7, bold: true, alignment: 'center', color: '#1F2937', direction: 'rtl' },

  totalHeader: { fontSize: 8, bold: true, color: '#0F172A', fillColor: '#E2E8F0', alignment: 'center', direction: 'rtl', margin: [0, 0, 0, 0] },
  signatureTitle: { fontSize: 9, color: '#6B7280', alignment: 'center', direction: 'rtl' }
};

const reportsLayout = {
  hLineWidth: function (i, node) {
    if (i === 0 || i === node.table.body.length) return 0.8;
    return 0.3;
  },
  vLineWidth: function (i, node) {
    return 0.3;
  },
  hLineColor: function (i, node) {
    if (i === 0 || i === node.table.body.length) return '#5A7ACD';
    return '#E5E7EB';
  },
  vLineColor: function (i, node) {
    return '#E5E7EB';
  },
  paddingLeft: function (i, node) { return 5; },
  paddingRight: function (i, node) { return 5; },
  paddingTop: function (i, node) { return 4; },
  paddingBottom: function (i, node) { return 4; }
};

// ----------------------------------------------------------------------------
// Core Base Document
// ----------------------------------------------------------------------------
const startDocument = (pageTitle) => ({
  pageSize: 'A4',
  pageOrientation: 'portrait',
  pageMargins: [30, 50, 30, 50],
  defaultStyle: { font: 'Cairo', fontSize: 8, alignment: 'right' },
  styles: styles,
  content: [],
  info: { title: pageTitle },
  footer: function (currentPage, pageCount) {
    return {
      text: formatArabic(`صفحة ${currentPage} من ${pageCount}`),
      alignment: 'center', fontSize: 8, color: '#6B7280', margin: [0, 10, 0, 0], direction: 'rtl'
    };
  }
});

// ----------------------------------------------------------------------------
// Section Builders
// ----------------------------------------------------------------------------
const buildHeaderSection = (title, subtitle) => {
  return [
    { text: formatArabic(title), style: 'title', alignment: 'center', margin: [0, 0, 0, 5] },
    { text: formatArabic('مركز العمران للتدريب والتطوير'), style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 3] },
    { text: formatArabic(subtitle), style: 'subtitle2', alignment: 'center', margin: [0, 0, 0, 15] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 0, 0, 15] }
  ];
};

const buildSignaturesSection = () => {
  return [
    { text: formatArabic('التوقيعات والتوثيق'), style: 'sectionTitle', alignment: 'center', margin: [0, 50, 0, 80] },
    {
      stack: [
        {
          columns: [
            { width: '*', stack: [ { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1.5, lineColor: '#6B7280' }], alignment: 'center', margin: [0, 0, 0, 15] }, { text: formatArabic('الموارد البشرية'), style: 'signatureTitle', alignment: 'center' } ] },
            { width: '*', stack: [ { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1.5, lineColor: '#6B7280' }], alignment: 'center', margin: [0, 0, 0, 15] }, { text: formatArabic('مدير منطقة العين'), style: 'signatureTitle', alignment: 'center' } ] }
          ],
          columnGap: 40, margin: [40, 0, 40, 80]
        },
        {
          columns: [
            { width: '*', stack: [ { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1.5, lineColor: '#6B7280' }], alignment: 'center', margin: [0, 0, 0, 15] }, { text: formatArabic('الادارة العامة'), style: 'signatureTitle', alignment: 'center' } ] },
            { width: '*', stack: [ { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1.5, lineColor: '#6B7280' }], alignment: 'center', margin: [0, 0, 0, 15] }, { text: formatArabic('الحسابات'), style: 'signatureTitle', alignment: 'center' } ] }
          ],
          columnGap: 40, margin: [40, 0, 40, 0]
        }
      ]
    }
  ];
};

// ----------------------------------------------------------------------------
// Logical Bidi Mappers (Index 0 draws on the RIGHT visually under RTL)
// ----------------------------------------------------------------------------

const BRANCH_TABLE_WIDTHS = ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'];

const buildBranchHeaderRow = () => [
  { text: formatArabic('الرقم'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('الاسم'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('أيام الشهر'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('الراتب الاساسي'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('أيام الدوام'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('المستحق'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('أيام الإضافي'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('راتب الاضافي'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('مبلغ الإضافي'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('سبب الإضافة'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('مبلغ الخصم'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('سبب الخصم'), style: 'tableHeader', alignment: 'center' },
  { text: formatArabic('الصافي'), style: 'tableHeader', alignment: 'center' }
];

const correctBranchRow = (salary, isTotalRow = false) => {
  if (isTotalRow) {
    return [
      { text: formatArabic('الإجماليات'), style: 'totalHeader', alignment: 'center' },
      { text: '', style: 'totalHeader', alignment: 'center' },
      { text: '', style: 'totalHeader', alignment: 'center' },
      { text: formatNum(salary.originalTotal), style: 'totalHeader', alignment: 'center' },
      { text: '', style: 'totalHeader', alignment: 'center' },
      { text: formatNum(salary.entitled), style: 'totalHeader', alignment: 'center' },
      { text: '', style: 'totalHeader', alignment: 'center' },
      { text: formatNum(salary.base), style: 'totalHeader', alignment: 'center' }, 
      { text: formatNum(salary.overtimeAmount), style: 'totalHeader', color: '#10B981', alignment: 'center' },
      { text: '', style: 'totalHeader', alignment: 'center' },
      { text: formatNum(salary.dedAmount), style: 'totalHeader', color: '#DC2626', alignment: 'center' },
      { text: '', style: 'totalHeader', alignment: 'center' },
      { text: formatNum(salary.net), style: 'totalHeader', bold: true, alignment: 'center' }
    ];
  }

  return [
    { text: formatArabic(salary.empId), style: 'tableCell', alignment: 'center' },
    { text: formatArabic(salary.name), style: 'tableCellBold', alignment: 'center' },
    { text: formatArabic(salary.daysInMonth), style: 'tableCell', alignment: 'center' },
    { text: formatNum(salary.contractSalary), style: 'tableCell', alignment: 'center' },
    { text: formatArabic(salary.workDays), style: 'tableCell', alignment: 'center' },
    { text: formatNum(salary.entitled), style: 'tableCell', alignment: 'center' },
    { text: formatArabic(salary.overtimeDays), style: 'tableCell', alignment: 'center' },
    { text: formatNum(salary.additionRate), style: 'tableCell', alignment: 'center' },
    { text: formatNum(salary.overtimeAmount), style: 'tableCell', color: '#10B981', bold: true, alignment: 'center' },
    { text: formatArabic(salary.addReasons || '-'), style: 'tableCell', alignment: 'center', fontSize: 6 },
    { text: formatNum(salary.dedAmount), style: 'tableCell', color: '#DC2626', bold: true, alignment: 'center' },
    { text: formatArabic(salary.dedReasons || '-'), style: 'tableCell', alignment: 'center', fontSize: 6 },
    { text: formatNum(salary.net), style: 'tableCell', color: '#5A7ACD', bold: true, alignment: 'center' }
  ];
};

const mapSalaryData = (sourceData, daysInMonth) => {
  const isWrapped = !!sourceData.salary_record;
  const salaryObj = isWrapped ? sourceData.salary_record : sourceData;
  const employeeObj = sourceData.employee || {};

  const items = salaryObj.items || [];
  const additions = items.filter(i => i.type === 'addition');
  const deductions = items.filter(i => i.type === 'deduction');

  const overtimeItem = additions.find(i => i.is_automatic);

  return {
    empId: salaryObj.employee_number || employeeObj.employment_number || '-',
    name: salaryObj.employee_name || employeeObj.name || '-',
    daysInMonth: daysInMonth,
    contractSalary: employeeObj.salary || 0,
    additionRate: salaryObj.base_salary || employeeObj.salary || 0,
    workDays: salaryObj.working_days || 0,
    entitled: parseFloat(salaryObj.entitled_salary || 0),

    overtimeDays: overtimeItem ? overtimeItem.days : 0,
    overtimeAmount: additions.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    addReasons: additions.map(i => i.reason).filter(Boolean).join(' | '),

    dedAmount: deductions.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    dedReasons: deductions.map(i => i.reason).filter(Boolean).join(' | '),
    
    net: parseFloat(salaryObj.net_salary || 0)
  };
};

const buildBranchTable = (salariesData, daysInMonth, branchName = '', forceReverse = false) => {
  // Always reverse for all branches to ensure RTL consistency on various environments
  const isTargetBranch = true;

  let totals = { originalTotal: 0, base: 0, entitled: 0, overtimeAmount: 0, dedAmount: 0, net: 0 };
  
  let headerRow = buildBranchHeaderRow();
  if (isTargetBranch) headerRow = [...headerRow].reverse();

  let rows = [headerRow];

  salariesData.forEach((sObj) => {
    const data = mapSalaryData(sObj, daysInMonth);
    totals.originalTotal += parseFloat(data.contractSalary);
    totals.base += parseFloat(data.additionRate);
    totals.entitled += data.entitled;
    totals.overtimeAmount += data.overtimeAmount;
    totals.dedAmount += data.dedAmount;
    totals.net += data.net;
    
    let dataRow = correctBranchRow(data, false);
    if (isTargetBranch) dataRow = [...dataRow].reverse();
    rows.push(dataRow);
  });

  let totalRow = correctBranchRow(totals, true);
  if (isTargetBranch) totalRow = [...totalRow].reverse();
  rows.push(totalRow);

  let widths = [...BRANCH_TABLE_WIDTHS];
  if (isTargetBranch) widths = widths.reverse();

  return {
    table: {
      rtl: true, // Let the Bidi engine firmly read the Arabic headers
      headerRows: 1,
      widths: widths,
      body: rows
    },
    layout: reportsLayout,
    margin: [0, 0, 0, 20]
  };
};

// ----------------------------------------------------------------------------
// Export API
// ----------------------------------------------------------------------------
export const SalaryPDF = {
  
  generateSingleBranch: (branchInfo, groupInfo, employeesData) => {
    const title = `كشف رواتب صادر`;
    const doc = startDocument(title);
    
    doc.content.push(...buildHeaderSection(title, `كشف رواتب: ${branchInfo.branch_name} | شهر: ${groupInfo.month_name} ${groupInfo.year}`));
    
    const daysInMonth = new Date(groupInfo.year, groupInfo.month, 0).getDate();
    // In Single Branch, Barari is NOT forced (as per user request "بدون التاثير على التقرير الفردي")
    doc.content.push(buildBranchTable(employeesData, daysInMonth, branchInfo.branch_name, false));
    doc.content.push(...buildSignaturesSection());
    
    pdfMake.createPdf(doc).download(`رواتب_${branchInfo.branch_name}_${groupInfo.month_name}.pdf`);
  },

  generateMonthly: (groupInfo, branchesData) => {
    const title = `التقرير الشامل للرواتب`;
    const doc = startDocument(title);
    
    let totalNetAll = 0, totalEmpAll = 0, totalContractAll = 0, totalBasicAll = 0, totalAddsAll = 0, totalDedsAll = 0;

    let headers = [
        { text: formatArabic('اسم الفرع'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('الموظفين'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('إجمالي الراتب الاساسي'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('إجمالي الإضافي'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('إجمالي الإضافات'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('إجمالي الخصومات'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('إجمالي الصافي'), style: 'tableHeader', alignment: 'center' }
    ];
    // User requested flipping the Comprehensive Summary table too
    headers = headers.reverse();

    const summaryRows = [headers];

    branchesData.forEach((branch) => {
      const bNet = branch.salaries.reduce((sum, s) => sum + parseFloat(s.net_salary || 0), 0);
      const bContract = branch.salaries.reduce((sum, s) => sum + parseFloat((s.employee?.salary || s.base_salary || 0)), 0);
      const bBasic = branch.salaries.reduce((sum, s) => sum + parseFloat(s.base_salary || 0), 0);
      const bAdds = branch.salaries.reduce((sum, s) => {
          const adds = (s.items || []).filter(i => i.type === 'addition');
          return sum + adds.reduce((as, ai) => as + parseFloat(ai.amount || 0), 0);
      }, 0);
      const bDeds = branch.salaries.reduce((sum, s) => {
          const deds = (s.items || []).filter(i => i.type === 'deduction');
          return sum + deds.reduce((ds, di) => ds + parseFloat(di.amount || 0), 0);
      }, 0);

      const bEmps = branch.salaries.length;
      totalNetAll += bNet;
      totalEmpAll += bEmps;
      totalContractAll += bContract;
      totalBasicAll += bBasic;
      totalAddsAll += bAdds;
      totalDedsAll += bDeds;
      
      let row = [
        { text: formatArabic(branch.branch_name), style: 'tableCellBold', alignment: 'center' },
        { text: formatArabic(bEmps), style: 'tableCell', alignment: 'center' },
        { text: formatNum(bContract), style: 'tableCell', alignment: 'center' },
        { text: formatNum(bBasic), style: 'tableCell', alignment: 'center' },
        { text: formatNum(bAdds), style: 'tableCell', color: '#10B981', alignment: 'center' },
        { text: formatNum(bDeds), style: 'tableCell', color: '#DC2626', alignment: 'center' },
        { text: `${formatNum(bNet)} درهم`, style: 'tableCell', color: '#5A7ACD', bold: true, alignment: 'center' }
      ];
      summaryRows.push(row.reverse());
    });

    let totalsRow = [
      { text: formatArabic('الإجمالي العام'), style: 'totalHeader', alignment: 'center' },
      { text: formatArabic(totalEmpAll), style: 'totalHeader', alignment: 'center' },
      { text: formatNum(totalContractAll), style: 'totalHeader', alignment: 'center' },
      { text: formatNum(totalBasicAll), style: 'totalHeader', alignment: 'center' },
      { text: formatNum(totalAddsAll), style: 'totalHeader', color: '#10B981', alignment: 'center' },
      { text: formatNum(totalDedsAll), style: 'totalHeader', color: '#DC2626', alignment: 'center' },
      { text: `${formatNum(totalNetAll)} درهم`, style: 'totalHeader', alignment: 'center' }
    ];
    summaryRows.push(totalsRow.reverse());

    doc.content.push(...buildHeaderSection(title, `الخاص بشهر: ${groupInfo.month_name} ${groupInfo.year}`));

    doc.content.push({ text: formatArabic('ملخص فروع المؤسسة'), style: 'sectionTitle' });
    doc.content.push({
      table: {
        rtl: true,
        headerRows: 1,
        widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
        body: summaryRows
      },
      layout: reportsLayout,
      margin: [0, 0, 0, 20]
    });

    const daysInMonth = new Date(groupInfo.year, groupInfo.month, 0).getDate();
    branchesData.forEach(branch => {
      doc.content.push({ text: '', pageBreak: 'before' });
      doc.content.push({ text: formatArabic(branch.branch_name), style: 'title', margin: [0, 0, 0, 15] });
      doc.content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 0, 0, 15] });
      doc.content.push({ text: formatArabic('تفاصيل رواتب الفرع'), style: 'sectionTitle' });
      
      // Inside COMPREHENSIVE report, force reverse Barari Branch.
      const forceReverseThisBranch = branch.branch_name.includes('Barari');
      doc.content.push(buildBranchTable(branch.salaries, daysInMonth, branch.branch_name, forceReverseThisBranch));
    });

    doc.content.push(...buildSignaturesSection());
    pdfMake.createPdf(doc).download(`كشف_شامل_${groupInfo.month_name}_${groupInfo.year}.pdf`);
  },

  generateYearlyDetailed: (year, allYearData) => {
    const title = `مسيرة الرواتب السنوية - ${year}`;
    const doc = startDocument(title);

    // 1. Aggregation Maps
    const branchStats = {};
    const empStats = {};

    allYearData.forEach(monthObj => {
      // monthObj = { month: number, branches: [{ branch_name, salaries: [] }] }
      (monthObj.branches || []).forEach(branch => {
        const bName = branch.branch_name;
        if (!branchStats[bName]) {
          branchStats[bName] = { contract: 0, basic: 0, entitled: 0, adds: 0, deds: 0, net: 0, empCount: new Set() };
        }

        (branch.salaries || []).forEach(s => {
          const empId = s.employee_number || s.employee?.employment_number || s.employee_id || 'Unknown';
          const empName = s.employee_name || s.employee?.name || 'Unknown';

          // Branch Aggregates
          branchStats[bName].contract += parseFloat(s.employee?.salary || s.base_salary || 0);
          branchStats[bName].basic += parseFloat(s.base_salary || 0);
          branchStats[bName].entitled += parseFloat(s.entitled_salary || 0);
          branchStats[bName].net += parseFloat(s.net_salary || 0);
          branchStats[bName].empCount.add(empId);

          const items = s.items || [];
          const adds = items.filter(i => i.type === 'addition').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
          const deds = items.filter(i => i.type === 'deduction').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
          branchStats[bName].adds += adds;
          branchStats[bName].deds += deds;

          // Employee Aggregates
          if (!empStats[empId]) {
            empStats[empId] = { id: empId, name: empName, branch: bName, basic: 0, entitled: 0, adds: 0, deds: 0, net: 0, monthsActive: 0 };
          }
          empStats[empId].basic += parseFloat(s.base_salary || 0);
          empStats[empId].entitled += parseFloat(s.entitled_salary || 0);
          empStats[empId].adds += adds;
          empStats[empId].deds += deds;
          empStats[empId].net += parseFloat(s.net_salary || 0);
          empStats[empId].monthsActive += 1;
        });
      });
    });

    // 2. Render Header
    doc.content.push(...buildHeaderSection(title, `كشف مالي إجمالي لعام ${year}`));

    // 3. Branch Annual Summary Table
    doc.content.push({ text: formatArabic('إحصائيات الفروع السنوية'), style: 'sectionTitle' });
    let bHeaders = [
      { text: formatArabic('الفرع'), style: 'tableHeader', alignment: 'center' },
      { text: formatArabic('الموظفين (فريد)'), style: 'tableHeader', alignment: 'center' },
      { text: formatArabic('إجمالي الراتب الاساسي'), style: 'tableHeader', alignment: 'center' },
      { text: formatArabic('إجمالي الإضافي'), style: 'tableHeader', alignment: 'center' },
      { text: formatArabic('إجمالي الإضافات'), style: 'tableHeader', alignment: 'center' },
      { text: formatArabic('إجمالي الخصومات'), style: 'tableHeader', alignment: 'center' },
      { text: formatArabic('صافي العام'), style: 'tableHeader', alignment: 'center' }
    ];
    const branchRows = [bHeaders.reverse()];

    Object.keys(branchStats).sort().forEach(bn => {
      const bs = branchStats[bn];
      let row = [
        { text: formatArabic(bn), style: 'tableCellBold', alignment: 'center' },
        { text: formatArabic(bs.empCount.size), style: 'tableCell', alignment: 'center' },
        { text: formatNum(bs.contract), style: 'tableCell', alignment: 'center' },
        { text: formatNum(bs.basic), style: 'tableCell', alignment: 'center' },
        { text: formatNum(bs.adds), style: 'tableCell', color: '#10B981', alignment: 'center' },
        { text: formatNum(bs.deds), style: 'tableCell', color: '#DC2626', alignment: 'center' },
        { text: `${formatNum(bs.net)} درهم`, style: 'tableCell', color: '#5A7ACD', bold: true, alignment: 'center' }
      ];
      branchRows.push(row.reverse());
    });

    doc.content.push({
      table: {
        rtl: true, headerRows: 1,
        widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'], // Star on Branch Name (Last)
        body: branchRows
      },
      layout: reportsLayout, margin: [0, 0, 0, 30]
    });

    // 4. Employee Annual Summaries by Branch
    Object.keys(branchStats).sort().forEach(bn => {
      doc.content.push({ text: '', pageBreak: 'before' });
      doc.content.push({ text: formatArabic(`مسيرة موظفي فرع: ${bn}`), style: 'title', margin: [0, 0, 0, 15] });
      doc.content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 0, 0, 15] });
      doc.content.push({ text: formatArabic('إحصائيات الموظفين السنوية للفرع'), style: 'sectionTitle' });

      let eHeaders = [
        { text: formatArabic('الرقم'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('الاسم'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('الأشهر'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('إجمالي الإضافي'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('إجمالي الإضافات'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('إجمالي الخصومات'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabic('صافي السنة'), style: 'tableHeader', alignment: 'center' }
      ];
      const empRows = [eHeaders.reverse()];

      // Filter employees belonging to this branch
      Object.values(empStats).filter(es => es.branch === bn).sort((a,b) => a.id.localeCompare(b.id)).forEach(es => {
        let row = [
          { text: formatArabic(es.id), style: 'tableCell', alignment: 'center' },
          { text: formatArabic(es.name), style: 'tableCellBold', alignment: 'center' },
          { text: formatArabic(es.monthsActive), style: 'tableCell', alignment: 'center' },
          { text: formatNum(es.basic), style: 'tableCell', alignment: 'center' },
          { text: formatNum(es.adds), style: 'tableCell', color: '#10B981', alignment: 'center' },
          { text: formatNum(es.deds), style: 'tableCell', color: '#DC2626', alignment: 'center' },
          { text: `${formatNum(es.net)} درهم`, style: 'tableCell', color: '#5A7ACD', bold: true, alignment: 'center' }
        ];
        empRows.push(row.reverse());
      });

      doc.content.push({
        table: {
          rtl: true, headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', '*', 'auto'], // Star on Name (Now Index 5)
          body: empRows
        },
        layout: reportsLayout, margin: [0, 0, 0, 20]
      });
    });

    doc.content.push(...buildSignaturesSection());

    pdfMake.createPdf(doc).download(`تقرير_سنوي_${year}.pdf`);
  }
};
