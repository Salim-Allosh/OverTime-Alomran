import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete, apiPatch } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import pdfMake from "pdfmake-rtl/build/pdfmake";
import { vfs } from "../fonts/vfs_fonts_custom";
import FilterDropdown from "../components/FilterDropdown";

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
  const [appliedYear, setAppliedYear] = useState(new Date().getFullYear());
  const [appliedMonthIds, setAppliedMonthIds] = useState([]);
  const [monthlyGroups, setMonthlyGroups] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [expandedExpenseBranches, setExpandedExpenseBranches] = useState(new Set()); // Set of "monthKey-branchId"
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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExpenses, setBulkExpenses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [token, appliedYear]);


  const loadAllMonthsData = async () => {
    if (!appliedYear) return;

    setLoading(true);
    try {
      const data = await apiGet(`/net-profit/all-months?year=${appliedYear}`, token);
      setMonthlyGroups(Array.isArray(data) ? data : []);

      // Auto-expand current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      if (appliedYear === currentYear) {
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

  const toggleExpenseBranch = (monthKey, branchId) => {
    const key = `${monthKey}-${branchId}`;
    const newExpanded = new Set(expandedExpenseBranches);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedExpenseBranches(newExpanded);
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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const openBulkModal = () => {
    // Initialize bulk expenses with all categories
    const initial = expenseCategories.map(cat => ({ title: cat.name, amount: "" }));
    setBulkExpenses(initial);
    setShowBulkModal(true);
    setShowExpenseModal(false);
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    setSelectedBranchForExpense(null);
    setSelectedYearForExpense(null);
    setSelectedMonthForExpense(null);
    setBulkExpenses([]);
  };

  const handleBulkSubmit = async () => {
    const validExpenses = bulkExpenses.filter(e => parseFloat(e.amount) > 0);
    if (validExpenses.length === 0) {
      showError("يرجى إدخال مبالغ لبعض المصاريف");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      let expenseDateStr;
      if (selectedYearForExpense === now.getFullYear() && selectedMonthForExpense === (now.getMonth() + 1)) {
        expenseDateStr = now.toISOString().slice(0, 19).replace('T', ' ');
      } else {
        const d = new Date(selectedYearForExpense, selectedMonthForExpense - 1, 1, 12, 0, 0);
        expenseDateStr = d.toISOString().slice(0, 19).replace('T', ' ');
      }

      await apiPost("/net-profit-expenses/bulk-branch", {
        branch_id: selectedBranchForExpense.branch_id,
        expenses: validExpenses.map(e => ({ title: e.title, amount: parseFloat(e.amount) })),
        expense_date: expenseDateStr
      }, token);

      success("تم إضافة جميع المصاريف بنجاح!");
      closeBulkModal();
      loadAllMonthsData();
    } catch (err) {
      showError("حدث خطأ أثناء إضافة المصاريف: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
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



  const getBranchKPIs = () => [];


  const generateMonthlyPDF = (group) => {
    try {
      pdfMake.vfs = vfs;
      pdfMake.fonts = {
        Cairo: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' },
        Nillima: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' },
        Roboto: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' }
      };

      const { year, month, month_name, branches } = group;
      const totalRevenue = branches.reduce((sum, b) => sum + parseFloat(b.revenue || 0), 0);
      const totalExpenses = branches.reduce((sum, b) => sum + parseFloat(b.expenses || 0), 0);
      const totalNetProfit = totalRevenue - totalExpenses;

      const formatArabicText = (text) => (text || '').toString().trim().replace(/\s+/g, ' ').replace(/[()]/g, '');

      const tableLayout = {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0.8 : 0.3,
        vLineWidth: () => 0.3,
        hLineColor: (i, node) => (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB',
        vLineColor: () => '#E5E7EB',
        paddingLeft: () => 5,
        paddingRight: () => 5,
        paddingTop: () => 5,
        paddingBottom: () => 5
      };

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 9, alignment: 'right' },
        pageSize: 'A4',
        pageMargins: [30, 40, 30, 40],
        content: [
          { text: formatArabicText('تقرير الصافي والمصاريف'), style: 'title' },
          { text: formatArabicText('مركز العمران للتدريب والتطوير'), style: 'subtitle' },
          { text: formatArabicText(`ملخص شهر: ${month_name} ${year}`), style: 'subtitle2' },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 5, 0, 15] },

          { text: formatArabicText('ملخص أداء الفروع'), style: 'sectionTitle' },
          {
            table: {
              rtl: true,
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: formatArabicText('صافي الربح'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي المصاريف'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي الصافي'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('اسم الفرع'), style: 'tableHeader', alignment: 'center' }
                ],
                ...branches.sort((a,b) => (b.revenue - b.expenses) - (a.revenue - a.expenses)).map(b => {
                  const bProfit = parseFloat(b.revenue || 0) - parseFloat(b.expenses || 0);
                  return [
                    { text: formatNumber(bProfit), style: 'tableCell', bold: true, color: bProfit >= 0 ? '#10B981' : '#DC2626', alignment: 'center' },
                    { text: formatNumber(b.expenses), style: 'tableCell', color: '#DC2626', alignment: 'center' },
                    { text: formatNumber(b.revenue), style: 'tableCell', alignment: 'center' },
                    { text: formatArabicText(b.branch_name), style: 'tableCell', bold: true, alignment: 'center' }
                  ];
                }),
                [
                  { text: formatNumber(totalNetProfit), style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' },
                  { text: formatNumber(totalExpenses), style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'center' },
                  { text: formatNumber(totalRevenue), style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'center' },
                  { text: formatArabicText('المجموع الإجمالي'), style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'center' }
                ]
              ]
            },
            layout: tableLayout,
            margin: [0, 0, 0, 20]
          },

          { text: formatArabicText('قائمة المصاريف حسب الفئة'), style: 'sectionTitle' },
          {
            table: {
              rtl: true,
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: formatArabicText('نوع المصروف'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي المبلغ'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('النسبة مئوية'), style: 'tableHeader', alignment: 'center' }
                ],
                ...(() => {
                  const totals = {};
                  branches.forEach(b => {
                    (b.expenses_list || []).forEach(e => {
                      const cat = e.title || 'غير مصنف';
                      totals[cat] = (totals[cat] || 0) + parseFloat(e.amount || 0);
                    });
                  });
                  return Object.entries(totals).sort((a,b) => b[1] - a[1]).map(([cat, amount]) => [
                    { text: formatArabicText(cat), style: 'tableCell', bold: true, alignment: 'center' },
                    { text: formatNumber(amount) + ' درهم', style: 'tableCell', alignment: 'center' },
                    { text: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) + '%' : '0%', style: 'tableCell', alignment: 'center' }
                  ]);
                })(),
                [
                  { text: formatArabicText('إجمالي المصاريف'), style: 'tableHeader', fillColor: '#FEF2F2', alignment: 'center' },
                  { text: formatNumber(totalExpenses) + ' درهم', style: 'tableHeader', fillColor: '#FEF2F2', alignment: 'center' },
                  { text: '100%', style: 'tableHeader', fillColor: '#FEF2F2', alignment: 'center' }
                ]
              ]
            },
            layout: tableLayout
          }
        ],
        styles: {
          title: { fontSize: 15, bold: true, color: '#5A7ACD', alignment: 'center', margin: [0, 0, 0, 5] },
          subtitle: { fontSize: 12, bold: true, color: '#374151', alignment: 'center', margin: [0, 0, 0, 2] },
          subtitle2: { fontSize: 10, color: '#6B7280', alignment: 'center', margin: [0, 0, 0, 10] },
          sectionTitle: { fontSize: 11, bold: true, color: '#5A7ACD', margin: [0, 15, 0, 10], alignment: 'right' },
          tableHeader: { fontSize: 8.5, bold: true, fillColor: '#F3F4F6', color: '#1F2937', alignment: 'center' },
          tableCell: { fontSize: 8, alignment: 'center', color: '#374151' },
          branchTitle: { fontSize: 13, bold: true, color: '#5A7ACD', margin: [0, 20, 0, 10], alignment: 'center' }
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
      branches.forEach(b => {
        if (b.expenses_list && b.expenses_list.length > 0) {
          docDefinition.content.push({ text: '', pageBreak: 'before' });
          docDefinition.content.push({ text: formatArabicText(`تفاصيل مصاريف فرع: ${b.branch_name}`), style: 'branchTitle' });

          docDefinition.content.push({
            table: {
              rtl: true,
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: formatArabicText('نوع المصروف'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي المبلغ'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('النسبة مئوية'), style: 'tableHeader', alignment: 'center' }
                ],
                ...b.expenses_list.map(e => [
                  { text: formatArabicText(e.title), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(e.amount) + ' درهم', style: 'tableCell', bold: true, color: '#DC2626', alignment: 'center' },
                  { text: (parseFloat(b.expenses || 0) > 0 ? ((parseFloat(e.amount || 0) / parseFloat(b.expenses || 0)) * 100).toFixed(1) + '%' : '0%'), style: 'tableCell', alignment: 'center' }
                ])
              ]
            },
            layout: tableLayout
          });
        }
      });

      pdfMake.createPdf(docDefinition).download(`تقرير_الصافي_${month_name}_${year}.pdf`);
      success("تم تحميل التقرير بنجاح!");
    } catch (err) {
      console.error("PDF Error:", err);
      showError("خطأ في إنشاء التقرير: " + err.message);
    }
  };

  const generateYearlyPDF = () => {
    if (!monthlyGroups || monthlyGroups.length === 0) {
      showError("لا توجد بيانات متاحة للسنة المختارة");
      return;
    }

    try {
      pdfMake.vfs = vfs;
      pdfMake.fonts = {
        Cairo: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' },
        Nillima: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' },
        Roboto: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' }
      };

      const branchSummary = {}; 
      const categoryTotals = {}; 
      let yearlyTotalNetRevenue = 0;
      let yearlyTotalExpenses = 0;

      monthlyGroups.forEach(monthGroup => {
        monthGroup.branches.forEach(branchData => {
          const bId = branchData.branch_id;
          if (!branchSummary[bId]) {
            branchSummary[bId] = {
              branch_id: bId,
              branch_name: branchData.branch_name,
              revenue: 0,
              expenses: 0,
              expenses_list: []
            };
          }
          branchSummary[bId].revenue += parseFloat(branchData.revenue || 0);
          branchSummary[bId].expenses += parseFloat(branchData.expenses || 0);
          yearlyTotalNetRevenue += parseFloat(branchData.revenue || 0);
          yearlyTotalExpenses += parseFloat(branchData.expenses || 0);

          if (branchData.expenses_list) {
            branchData.expenses_list.forEach(e => {
              const cat = e.title || "غير مصنف";
              categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(e.amount || 0);
              branchSummary[bId].expenses_list.push(e);
            });
          }
        });
      });

      const yearlyTotalNetProfit = yearlyTotalNetRevenue - yearlyTotalExpenses;
      const branchesArr = Object.values(branchSummary).sort((a, b) => (b.revenue - b.expenses) - (a.revenue - a.expenses));
      const formatArabicText = (text) => (text || '').toString().trim().replace(/\s+/g, ' ').replace(/[()]/g, '');

      const tableLayout = {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0.8 : 0.3,
        vLineWidth: () => 0.3,
        hLineColor: (i, node) => (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB',
        vLineColor: () => '#E5E7EB',
        paddingLeft: () => 5,
        paddingRight: () => 5,
        paddingTop: () => 5,
        paddingBottom: () => 5
      };

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 9, alignment: 'right' },
        pageSize: 'A4',
        pageMargins: [30, 40, 30, 40],
        content: [
          { text: formatArabicText('تقرير الأداء المالي السنوي'), style: 'title' },
          { text: formatArabicText('مركز العمران للتدريب والتطوير'), style: 'subtitle' },
          { text: formatArabicText(`إجمالي سنة ${appliedYear}`), style: 'subtitle2' },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 5, 0, 15] },

          { text: formatArabicText('ملخص أداء الفروع السنوي'), style: 'sectionTitle' },
          {
            table: {
              rtl: true,
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: formatArabicText('صافي الربح'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي المصاريف'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي الصافي'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('اسم الفرع'), style: 'tableHeader', alignment: 'center' }
                ],
                ...branchesArr.map(b => [
                  { text: formatNumber(b.revenue - b.expenses), style: 'tableCell', bold: true, color: (b.revenue - b.expenses) >= 0 ? '#10B981' : '#DC2626', alignment: 'center' },
                  { text: formatNumber(b.expenses), style: 'tableCell', color: '#DC2626', alignment: 'center' },
                  { text: formatNumber(b.revenue), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(b.branch_name), style: 'tableCell', bold: true, alignment: 'center' }
                ]),
                [
                  { text: formatNumber(yearlyTotalNetProfit), style: 'tableHeader', fillColor: '#EFF6FF', alignment: 'center' },
                  { text: formatNumber(yearlyTotalExpenses), style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'center' },
                  { text: formatNumber(yearlyTotalNetRevenue), style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'center' },
                  { text: formatArabicText('المجموع السنوي الإجمالي'), style: 'tableHeader', fillColor: '#F3F4F6', alignment: 'center' }
                ]
              ]
            },
            layout: tableLayout,
            margin: [0, 0, 0, 20]
          },

          { text: formatArabicText('تحليل المصاريف السنوية حسب النوع'), style: 'sectionTitle' },
          {
            table: {
              rtl: true,
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: formatArabicText('نوع المصروف'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي المبلغ السنوي'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('النسبة مئوية'), style: 'tableHeader', alignment: 'center' }
                ],
                ...(() => {
                  const totals = {};
                  Object.values(branchSummary).forEach(b => {
                    (b.expenses_list || []).forEach(e => {
                      const cat = e.title || 'غير مصنف';
                      totals[cat] = (totals[cat] || 0) + parseFloat(e.amount || 0);
                    });
                  });
                  return Object.entries(totals).sort((a,b) => b[1] - a[1]).map(([cat, amount]) => [
                    { text: formatArabicText(cat), style: 'tableCell', bold: true, alignment: 'center' },
                    { text: formatNumber(amount) + ' درهم', style: 'tableCell', alignment: 'center' },
                    { text: yearlyTotalExpenses > 0 ? ((amount / yearlyTotalExpenses) * 100).toFixed(1) + '%' : '0%', style: 'tableCell', alignment: 'center' }
                  ]);
                })(),
                [
                  { text: formatArabicText('إجمالي المصاريف السنوية'), style: 'tableHeader', fillColor: '#FEF2F2', alignment: 'center' },
                  { text: formatNumber(yearlyTotalExpenses) + ' درهم', style: 'tableHeader', fillColor: '#FEF2F2', alignment: 'center' },
                  { text: '100%', style: 'tableHeader', fillColor: '#FEF2F2', alignment: 'center' }
                ]
              ]
            },
            layout: tableLayout
          }
        ],
        styles: {
          title: { fontSize: 16, bold: true, color: '#5A7ACD', alignment: 'center', margin: [0, 0, 0, 5] },
          subtitle: { fontSize: 12, bold: true, color: '#374151', alignment: 'center', margin: [0, 0, 0, 2] },
          subtitle2: { fontSize: 10, color: '#6B7280', alignment: 'center', margin: [0, 0, 0, 10] },
          sectionTitle: { fontSize: 11, bold: true, color: '#5A7ACD', margin: [0, 15, 0, 10], alignment: 'right' },
          tableHeader: { fontSize: 9, bold: true, fillColor: '#F3F4F6', color: '#1F2937', alignment: 'center' },
          tableCell: { fontSize: 8.5, alignment: 'center', color: '#374151' },
          branchTitle: { fontSize: 14, bold: true, color: '#5A7ACD', margin: [0, 20, 0, 10], alignment: 'center' }
        },
        footer: (curr, total) => ({
          text: formatArabicText(`صفحة ${curr} من ${total}`),
          alignment: 'center',
          fontSize: 8,
          color: '#6B7280',
          margin: [0, 10, 0, 0]
        })
      };

      branchesArr.forEach(b => {
        if (b.expenses_list && b.expenses_list.length > 0) {
          docDefinition.content.push({ text: '', pageBreak: 'before' });
          docDefinition.content.push({ text: formatArabicText(`تفاصيل مصاريف فرع السنوية: ${b.branch_name}`), style: 'branchTitle' });

          docDefinition.content.push({
            table: {
              rtl: true,
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: formatArabicText('نوع المصروف'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي المبلغ'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('النسبة مئوية'), style: 'tableHeader', alignment: 'center' }
                ],
                ...b.expenses_list.map(e => [
                  { text: formatArabicText(e.title), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(e.amount) + ' درهم', style: 'tableCell', bold: true, color: '#DC2626', alignment: 'center' },
                  { text: (parseFloat(b.expenses || 0) > 0 ? ((parseFloat(e.amount || 0) / parseFloat(b.expenses || 0)) * 100).toFixed(1) + '%' : '0%'), style: 'tableCell', alignment: 'center' }
                ])
              ]
            },
            layout: tableLayout
          });
        }
      });

      pdfMake.createPdf(docDefinition).download(`تقرير_الأرباح_السنوية_${appliedYear}.pdf`);
      success("تم تحميل تقرير السنة بنجاح!");
    } catch (err) {
      console.error("Yearly PDF Error:", err);
      showError("خطأ في إنشاء تقرير السنة: " + err.message);
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
              {(userInfo && userInfo.is_super_admin && !userInfo.is_backdoor && monthlyGroups.length > 0) && (
                <button
                  className="btn success"
                  onClick={generateYearlyPDF}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    fontSize: "14px",
                    fontFamily: "Cairo",
                    fontWeight: "600",
                    height: "36px"
                  }}
                >
                  <span style={{ fontSize: "16px" }}>📊</span>
                  تحميل تقرير السنة {appliedYear}
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563" }}>السنة:</span>
                <FilterDropdown
                  placeholder="اختر السنة"
                  options={Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return { value: year, label: year.toString() };
                  })}
                  selectedValues={[appliedYear]}
                  isSingle={true}
                  onChange={(vals) => {
                    if (vals.length > 0) setAppliedYear(vals[0]);
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563" }}>الأشهر:</span>
                <FilterDropdown
                  placeholder="جميع الأشهر"
                  options={Object.entries(monthNames).map(([num, name]) => ({ label: name, value: parseInt(num) }))}
                  selectedValues={appliedMonthIds}
                  onChange={setAppliedMonthIds}
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
            {/* ملخص الأفرع للسنة */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {branches.map(branch => {
                let totalBranchNetProfit = 0;
                monthlyGroups
                  .filter(group => appliedMonthIds.length === 0 || appliedMonthIds.includes(group.month))
                  .forEach(group => {
                    const bData = group.branches.find(b => b.branch_id === branch.id);
                    if (bData) {
                      totalBranchNetProfit += parseFloat(bData.net_profit || 0);
                    }
                  });
                return (
                  <div key={branch.id} className="stat-card" style={{ padding: "1rem" }}>
                    <div className="stat-label" style={{ marginBottom: "0.5rem" }}>{branch.name}</div>
                    <div className="stat-value" style={{ 
                      fontSize: "20px", 
                      color: totalBranchNetProfit >= 0 ? "#28a745" : "#dc3545",
                      margin: "0.5rem 0"
                    }}>
                      {formatNumber(totalBranchNetProfit)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>صافي الربح {appliedMonthIds.length > 0 ? "للأشهر المختارة" : "للسنة"}</div>
                  </div>
                );
              })}
            </div>
            {monthlyGroups
              .filter(group => appliedMonthIds.length === 0 || appliedMonthIds.includes(group.month))
              .map((group) => {
              const monthKey = `${group.year}-${group.month}`;
              const isExpanded = expandedMonths.has(monthKey);

              // Calculate totals for the month
              const totalRevenue = group.branches.reduce((sum, b) => sum + parseFloat(b.revenue || 0), 0);
              const totalExpenses = group.branches.reduce((sum, b) => sum + parseFloat(b.expenses || 0), 0);
              const totalNetProfit = totalRevenue - totalExpenses;

              return (
                <div 
                  key={monthKey} 
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
                      <div style={{ display: "flex", gap: "1.25rem", fontSize: "13px", color: "#4B5563", fontWeight: "600" }}>
                        <span>المدفوعات: {formatNumber(group.branches.reduce((sum, b) => sum + parseFloat(b.gross_revenue || 0), 0))}</span>
                        <span style={{ color: "#059669" }}>الصافي: {formatNumber(totalRevenue)}</span>
                        <span style={{ color: totalNetProfit >= 0 ? "#10B981" : "#EF4444" }}>الربح: {formatNumber(totalNetProfit)}</span>
                      </div>
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
                          backgroundColor: "var(--color-primary)", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "4px", 
                          cursor: "pointer" 
                        }}
                      >📄 PDF</button>
                      <span style={{ 
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", 
                        transition: "transform 0.2s",
                        fontSize: "14px"
                      }}>▼</span>
                    </div>
                  </h2>

                  {isExpanded && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                      {group.branches.map((branchData) => {
                        const branchKey = `${monthKey}-${branchData.branch_id}`;
                        const isExpensesExpanded = expandedExpenseBranches.has(branchKey);
                        
                        return (
                          <div key={branchData.branch_id} className="panel" style={{ padding: "1rem", marginBottom: 0, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                              <h3 style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "#5A7ACD" }}>
                                {branchData.branch_name}
                              </h3>
                              <button
                                className="btn primary btn-small"
                                onClick={() => openExpenseModal(branchData, group.year, group.month)}
                                style={{ height: "24px", fontSize: "10px", padding: "0 0.5rem" }}
                              >
                                + مصروف
                              </button>
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: "#6B7280" }}>المبالغ المدفوعة:</span>
                                <span style={{ fontWeight: "600" }}>{formatNumber(parseFloat(branchData.gross_revenue || 0))} درهم</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: "#6B7280" }}>إجمالي الصافي:</span>
                                <span style={{ fontWeight: "600", color: "#28a745" }}>{formatNumber(parseFloat(branchData.revenue || 0))} درهم</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: "#6B7280" }}>إجمالي المصاريف:</span>
                                <span style={{ fontWeight: "600", color: "#dc3545" }}>{formatNumber(parseFloat(branchData.expenses || 0))} درهم</span>
                              </div>
                              <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                fontSize: "14px", 
                                marginTop: "0.5rem", 
                                paddingTop: "0.5rem", 
                                borderTop: "1px dashed #D1D1D1",
                                fontWeight: "bold",
                                color: branchData.net_profit >= 0 ? "#28a745" : "#dc3545"
                              }}>
                                <span>الربح النهائي:</span>
                                <span>{formatNumber(parseFloat(branchData.net_profit || 0))} درهم</span>
                              </div>
                            </div>

                            {/* Expenses Details Toggle */}
                            <div style={{ marginTop: "1rem", borderTop: "1px solid #F3F4F6", paddingTop: "0.75rem" }}>
                              <div
                                onClick={() => toggleExpenseBranch(monthKey, branchData.branch_id)}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  padding: "0.5rem",
                                  backgroundColor: "#F9FAFB",
                                  borderRadius: "4px",
                                  fontSize: "12px"
                                }}
                              >
                                <span style={{ fontWeight: "600", color: "#4B5563" }}>تفاصيل المصاريف ({branchData.expenses_list ? branchData.expenses_list.length : 0})</span>
                                <span>{isExpensesExpanded ? "▼" : "◀"}</span>
                              </div>

                              {isExpensesExpanded && (
                                <div style={{ marginTop: "0.75rem" }}>
                                  {branchData.expenses_list && branchData.expenses_list.length > 0 ? (
                                    <div className="table-container" style={{ margin: 0, boxShadow: "none", border: "1px solid #F3F4F6" }}>
                                      <table style={{ fontSize: "11px" }}>
                                        <thead>
                                          <tr style={{ background: "#F9FAFB" }}>
                                            <th style={{ padding: "0.5rem" }}>السبب</th>
                                            <th style={{ padding: "0.5rem" }}>المبلغ</th>
                                            <th style={{ padding: "0.5rem" }}></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {branchData.expenses_list.map((expense) => (
                                            <tr key={expense.id}>
                                              <td style={{ padding: "0.4rem" }}>{expense.title}</td>
                                              <td style={{ padding: "0.4rem" }}>{formatNumber(parseFloat(expense.amount || 0))}</td>
                                              <td style={{ padding: "0.4rem" }}>
                                                <div style={{ display: "flex", gap: "0.25rem" }}>
                                                  <button
                                                    onClick={() => openEditExpenseModal(expense, branchData, group.year, group.month)}
                                                    style={{ padding: "2px 4px", fontSize: "9px", background: "#FFC107", border: "none", color: "white", borderRadius: "2px" }}
                                                  >تعديل</button>
                                                  <button
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    style={{ padding: "2px 4px", fontSize: "9px", background: "#DC3545", border: "none", color: "white", borderRadius: "2px" }}
                                                  >حذف</button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p style={{ fontSize: "11px", color: "#9CA3AF", textAlign: "center", margin: "0.5rem 0" }}>لا توجد مصاريف</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
              <div>
                {!isEditingExpense && (
                  <button 
                    className="btn" 
                    onClick={openBulkModal}
                    style={{ backgroundColor: "#8B5CF6", color: "white" }}
                  >
                    📦 جميع المصاريف
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn" onClick={closeExpenseModal} disabled={isSubmitting}>إلغاء</button>
                <button 
                  className="btn primary" 
                  onClick={handleAddExpense} 
                  disabled={isSubmitting}
                  style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer", minWidth: "80px" }}
                >
                  {isSubmitting ? (isEditingExpense ? "جاري التحديث..." : "جاري الإضافة...") : (isEditingExpense ? "تحديث" : "إضافة")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Expenses Modal */}
      {showBulkModal && selectedBranchForExpense && (
        <div className="modal-overlay" onClick={closeBulkModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="modal-header" style={{ padding: "0.75rem 1rem" }}>
              <h3 style={{ fontSize: "0.9rem", margin: 0 }}>
                إضافة كافة المصاريف - {selectedBranchForExpense.branch_name}
              </h3>
              <button className="modal-close" onClick={closeBulkModal}>×</button>
            </div>
            <div className="modal-body" style={{ padding: "1rem", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {bulkExpenses.map((expense, idx) => (
                  <div key={idx} className="form-group" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "11px", fontWeight: "600", color: "#4B5563" }}>{expense.title}</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expense.amount}
                      onChange={(e) => {
                        const newBulk = [...bulkExpenses];
                        newBulk[idx].amount = e.target.value;
                        setBulkExpenses(newBulk);
                      }}
                      style={{ 
                        padding: "0.4rem 0.6rem", 
                        fontSize: "0.8rem",
                        borderColor: expense.amount > 0 ? "var(--color-primary)" : "#E5E7EB"
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn" onClick={closeBulkModal} disabled={isSubmitting}>إلغاء</button>
              <button 
                className="btn primary" 
                onClick={handleBulkSubmit} 
                disabled={isSubmitting}
                style={{ backgroundColor: "#8B5CF6", opacity: isSubmitting ? 0.7 : 1, minWidth: "100px" }}
              >
                {isSubmitting ? "جاري الإضافة..." : "إضافة كافة المصاريف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
