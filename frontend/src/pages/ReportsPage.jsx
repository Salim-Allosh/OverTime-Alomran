import React, { useState, useEffect, useRef } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};

// Convert 24-hour time to 12-hour format with AM/PM
function convertTo12Hour(time24) {
  if (!time24 || time24 === "-") return "-";
  
  try {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const min = minutes || "00";
    
    if (hour === 0) {
      return `12:${min} صباحاً`;
    } else if (hour === 12) {
      return `12:${min} ظهراً`;
    } else if (hour < 12) {
      return `${hour}:${min} صباحاً`;
    } else {
      return `${hour - 12}:${min} مساءً`;
    }
  } catch (e) {
    return time24; // Return original if conversion fails
  }
}

export default function ReportsPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [expenses, setExpenses] = useState({}); // { "2025-1": [expenses...] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [showExpenseForm, setShowExpenseForm] = useState({}); // { "2025-1": true/false }
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", branch_id: "", teacher_name: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editForm, setEditForm] = useState({
    teacher_name: "",
    student_name: "",
    session_date: "",
    start_time: "",
    end_time: "",
    duration_hours: "",
    duration_text: "",
    contract_number: "",
    hourly_rate: "",
    location: "internal"
  });
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [teacherNames, setTeacherNames] = useState([]);
  const [mergeForm, setMergeForm] = useState({
    old_name: "",
    new_name: ""
  });
  const [selectedBranchId, setSelectedBranchId] = useState(null); // null = all branches

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await apiGet("/branches", "");
        setBranches(Array.isArray(data) ? data : []);
        if (data.length > 0 && !expenseForm.branch_id) {
          setExpenseForm(prev => ({ ...prev, branch_id: data[0].id }));
        }
      } catch (err) {
        console.error("Error loading branches:", err);
        setBranches([]);
      }
    };
    loadBranches();
  }, []);

  // Load user info
  useEffect(() => {
    if (!token) return;
    const loadUserInfo = async () => {
      try {
        const data = await apiGet("/auth/me", token);
        setUserInfo(data);
      } catch (err) {
        console.error("Error loading user info:", err);
      }
    };
    loadUserInfo();
  }, [token]);

  // Load approved sessions
  useEffect(() => {
    if (!token) return;
    loadSessions(selectedBranchId);
  }, [token, selectedBranchId]);

  // Load teacher names from currently displayed sessions only
  const loadTeacherNames = async () => {
    if (!token || sessions.length === 0) {
      // Extract unique teacher names from currently loaded sessions
      const uniqueNames = [...new Set(sessions.map(s => s.teacher_name))].sort();
      setTeacherNames(uniqueNames);
      return;
    }
    try {
      // Get unique teacher names from currently displayed sessions
      const uniqueNames = [...new Set(sessions.map(s => s.teacher_name))].sort();
      setTeacherNames(uniqueNames);
    } catch (err) {
      console.error("Error loading teacher names:", err);
      // Fallback: extract from current sessions
      const uniqueNames = [...new Set(sessions.map(s => s.teacher_name))].sort();
      setTeacherNames(uniqueNames);
    }
  };

  // Load expenses for all months
  useEffect(() => {
    if (!token || sessions.length === 0) return;
    
    const loadExpenses = async () => {
      const branchGroups = groupSessionsByBranchAndMonth(sessions);
      const expensesData = {};
      
      for (const branchGroup of branchGroups) {
        for (const group of branchGroup.months) {
          const monthKey = `${group.year}-${group.month}`;
          if (!expensesData[monthKey]) {
            try {
              const data = await apiGet(`/expenses/monthly?year=${group.year}&month=${group.month}`, token);
              expensesData[monthKey] = Array.isArray(data) ? data : [];
            } catch (err) {
              console.error(`Error loading expenses for ${group.year}-${group.month}:`, err);
              expensesData[monthKey] = [];
            }
          }
        }
      }
      
      setExpenses(expensesData);
    };
    
    loadExpenses();
  }, [sessions, token]);

  const loadSessions = async (branchId = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = branchId ? `/sessions/all?branch_id=${branchId}` : "/sessions/all";
      const data = await apiGet(url, token);
      console.log("[Reports] Loaded sessions:", data);
      const sessionsData = Array.isArray(data) ? data : [];
      setSessions(sessionsData);
      
      // Load teacher names from the loaded sessions
      const uniqueNames = [...new Set(sessionsData.map(s => s.teacher_name))].sort();
      setTeacherNames(uniqueNames);
      
      // Auto-expand current month
      if (sessionsData.length > 0) {
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
        setExpandedMonths(new Set([currentKey]));
      }
    } catch (err) {
      console.error("[Reports] Error loading sessions:", err);
      setError(err.message || "حدث خطأ أثناء تحميل الجلسات");
      setSessions([]);
      setTeacherNames([]);
    } finally {
      setLoading(false);
    }
  };

  // Group sessions by branch and month
  const groupSessionsByBranchAndMonth = (sessions) => {
    const grouped = {}; // { branchId: { "2025-1": { year, month, sessions } } }
    
    sessions.forEach(session => {
      const branchId = session.branch_id;
      if (!grouped[branchId]) {
        grouped[branchId] = {};
      }
      
      const createdDate = new Date(session.created_at);
      const year = createdDate.getFullYear();
      const month = createdDate.getMonth() + 1;
      const key = `${year}-${month}`;
      
      if (!grouped[branchId][key]) {
        grouped[branchId][key] = {
          year,
          month,
          monthName: monthNames[month],
          sessions: []
        };
      }
      
      grouped[branchId][key].sessions.push(session);
    });
    
    // Convert to array format: [{ branchId, branchName, months: [...] }]
    return Object.entries(grouped).map(([branchId, months]) => {
      const branch = branches.find(b => b.id === parseInt(branchId));
      const monthsArray = Object.values(months).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      return {
        branchId: parseInt(branchId),
        branchName: branch ? branch.name : `فرع ${branchId}`,
        months: monthsArray
      };
    }).sort((a, b) => a.branchId - b.branchId);
  };

  // Calculate teacher statistics
  const calculateTeacherStats = (sessions) => {
    const stats = {};
    
    sessions.forEach(session => {
      const teacher = session.teacher_name;
      if (!stats[teacher]) {
        stats[teacher] = {
          total_hours: 0,
          total_amount: 0,
          location: session.location || "internal"
        };
      }
      
      stats[teacher].total_hours += parseFloat(session.duration_hours || 0);
      stats[teacher].total_amount += parseFloat(session.calculated_amount || 0);
    });
    
    return Object.entries(stats).map(([teacher, data]) => ({
      teacher_name: teacher,
      ...data
    }));
  };

  // Calculate totals
  const calculateTotals = (sessions, monthExpenses) => {
    let internalTotal = 0;
    let externalTotal = 0;
    
    sessions.forEach(session => {
      const amount = parseFloat(session.calculated_amount || 0);
      if (session.location === "external") {
        externalTotal += amount;
      } else {
        internalTotal += amount;
      }
    });
    
    const expensesTotal = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const grandTotal = internalTotal + externalTotal + expensesTotal;
    
    return {
      internalTotal,
      externalTotal,
      expensesTotal,
      grandTotal
    };
  };

  const toggleMonth = (year, month) => {
    const key = `${year}-${month}`;
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleAddExpense = async (year, month, e) => {
    e.preventDefault();
    const key = `${year}-${month}`;
    
    try {
      const expense = await apiPost("/expenses", {
        ...expenseForm,
        month,
        year
      }, token);
      
      setExpenses(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), expense]
      }));
      
      setExpenseForm({ title: "", amount: "", branch_id: branches[0]?.id || "", teacher_name: "" });
      setShowExpenseForm(prev => ({ ...prev, [key]: false }));
    } catch (err) {
      showError("حدث خطأ أثناء إضافة المصروف: " + err.message);
    }
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setEditForm({
      teacher_name: session.teacher_name,
      student_name: session.student_name,
      session_date: session.session_date,
      start_time: session.start_time || "",
      end_time: session.end_time || "",
      duration_hours: session.duration_hours.toString(),
      duration_text: session.duration_text,
      contract_number: session.contract_number,
      hourly_rate: session.hourly_rate.toString(),
      location: session.location || "internal"
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingSession) return;
    
    try {
      await apiPatch(`/sessions/${editingSession.id}`, editForm, token);
      success("تم تحديث الجلسة بنجاح!");
      setShowEditModal(false);
      setEditingSession(null);
      loadSessions();
    } catch (err) {
      showError("حدث خطأ أثناء تحديث الجلسة: " + err.message);
    }
  };

  const handleDelete = async (sessionId) => {
    confirm(
      "هل أنت متأكد من حذف هذه الجلسة؟",
      async () => {
        try {
          await apiDelete(`/sessions/${sessionId}`, token);
          success("تم حذف الجلسة بنجاح!");
          loadSessions();
        } catch (err) {
          showError("حدث خطأ أثناء حذف الجلسة: " + err.message);
        }
      }
    );
  };

  const handleMergeTeachers = async (e) => {
    e.preventDefault();
    if (!mergeForm.old_name || !mergeForm.new_name) {
      showError("يرجى اختيار الاسم القديم والاسم الجديد");
      return;
    }
    
    if (mergeForm.old_name === mergeForm.new_name) {
      showError("الاسم القديم والاسم الجديد لا يمكن أن يكونا متطابقين");
      return;
    }
    
    // Get session IDs from currently displayed sessions in the report
    const sessionIds = sessions
      .filter(session => session.teacher_name === mergeForm.old_name)
      .map(session => session.id);
    
    if (sessionIds.length === 0) {
      showError(`لا توجد جلسات في التقرير الحالي تحتوي على الاسم "${mergeForm.old_name}"`);
      return;
    }
    
    confirm(
      `هل أنت متأكد من دمج "${mergeForm.old_name}" مع "${mergeForm.new_name}"؟ سيتم تحديث ${sessionIds.length} جلسة في التقرير المفتوح فقط.`,
      async () => {
        try {
          const result = await apiPost("/teachers/merge", {
            ...mergeForm,
            session_ids: sessionIds
          }, token);
          success(`تم دمج الأسماء بنجاح! تم تحديث ${result.updated_count} جلسة في التقرير المفتوح.`);
          setShowMergeModal(false);
          setMergeForm({ old_name: "", new_name: "" });
          loadTeacherNames();
          loadSessions(); // Reload sessions to reflect the changes
        } catch (err) {
          showError("حدث خطأ أثناء دمج الأسماء: " + err.message);
        }
      }
    );
  };

  const generatePDF = async (group, monthExpenses, teacherStats, totals, branchName) => {
    let printContent = null;
    
    try {
      // Create completely isolated container - will not affect main page
      printContent = document.createElement('div');
      
      // Maximum isolation - prevent any impact on main page
      // Note: html2canvas needs element to be visible (but can be off-screen)
      printContent.style.cssText = `
        position: absolute !important;
        left: -20000px !important;
        top: 0 !important;
        width: 210mm !important;
        min-height: 297mm !important;
        max-width: 210mm !important;
        background-color: white !important;
        padding: 20mm !important;
        margin: 0 !important;
        border: none !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
        z-index: -1 !important;
        overflow: visible !important;
        isolation: isolate !important;
        contain: layout style paint !important;
        font-family: Arial, sans-serif !important;
        direction: rtl !important;
        text-align: right !important;
      `;
      
      printContent.setAttribute('dir', 'rtl');
      printContent.setAttribute('lang', 'ar');
      printContent.setAttribute('aria-hidden', 'true');
      
      // Add global styles for Arabic support
      const styleTag = document.createElement('style');
      styleTag.textContent = `
        @page {
          margin: 0;
        }
        * {
          font-family: Arial, sans-serif !important;
          direction: rtl !important;
          text-align: right !important;
          box-sizing: border-box !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
      `;
      printContent.appendChild(styleTag);
      
      // Title Section with modern design
      const titleSection = document.createElement('div');
      titleSection.style.cssText = `
        background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 25px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;
      
      const h1 = document.createElement('h1');
      h1.textContent = 'تقرير شهري - مركز العمران للتدريب والتطوير';
      h1.style.cssText = 'margin: 0 0 10px 0; font-size: 20px; font-weight: bold; font-family: Arial, sans-serif;';
      titleSection.appendChild(h1);
      
      const h2 = document.createElement('h2');
      h2.textContent = `${branchName} - ${group.monthName} ${group.year}`;
      h2.style.cssText = 'margin: 0; font-size: 16px; font-weight: normal; font-family: Arial, sans-serif;';
      titleSection.appendChild(h2);
      
      printContent.appendChild(titleSection);
      
      // Statistics Summary Box
      const statsBox = document.createElement('div');
      statsBox.style.cssText = `
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 25px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;
      
      const statsTitle = document.createElement('h3');
      statsTitle.textContent = 'الإحصائيات الإجمالية';
      statsTitle.style.cssText = 'margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #2c3e50; font-family: Arial, sans-serif;';
      statsBox.appendChild(statsTitle);
      
      const statsList = document.createElement('div');
      statsList.style.cssText = 'font-size: 12px; line-height: 2; font-family: Arial, sans-serif;';
      
      const statsItems = [
        { label: 'الإجمالي الداخلي', value: totals.internalTotal.toFixed(2), bold: false },
        { label: 'الإجمالي الخارجي', value: totals.externalTotal.toFixed(2), bold: false },
        { label: 'إجمالي المصاريف', value: totals.expensesTotal.toFixed(2), bold: false },
        { label: 'الإجمالي الكامل', value: totals.grandTotal.toFixed(2), bold: true, color: '#2980b9' }
      ];
      
      statsItems.forEach(item => {
        const p = document.createElement('p');
        p.textContent = `${item.label}: ${item.value} درهم`;
        p.style.cssText = `margin: 5px 0; font-family: Arial, sans-serif; ${item.bold ? 'font-weight: bold;' : ''} ${item.color ? `color: ${item.color};` : ''}`;
        statsList.appendChild(p);
      });
      
      statsBox.appendChild(statsList);
      printContent.appendChild(statsBox);
      
      // Helper function to create modern table
      const createTable = (title, headers, rows) => {
        const tableSection = document.createElement('div');
        tableSection.style.cssText = 'margin-bottom: 25px;';
        
        const tableTitle = document.createElement('h3');
        tableTitle.textContent = title;
        tableTitle.style.cssText = 'margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #2c3e50; font-family: Arial, sans-serif;';
        tableSection.appendChild(tableTitle);
        
        const table = document.createElement('table');
        table.style.cssText = `
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          font-family: Arial, sans-serif;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 6px;
          overflow: hidden;
        `;
        
        // Header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.cssText = 'background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%); color: white;';
        
        headers.forEach(header => {
          const th = document.createElement('th');
          th.textContent = header;
          th.style.cssText = `
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            font-family: Arial, sans-serif;
            direction: rtl;
            border: 1px solid rgba(255,255,255,0.2);
          `;
          headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body rows
        const tbody = document.createElement('tbody');
        rows.forEach((row, idx) => {
          const tr = document.createElement('tr');
          if (idx % 2 === 0) {
            tr.style.cssText = 'background-color: #f8f9fa;';
          }
          
          row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell || '';
            td.style.cssText = `
              padding: 10px 8px;
              text-align: center;
              border: 1px solid #dee2e6;
              font-family: Arial, sans-serif;
              direction: rtl;
            `;
            tr.appendChild(td);
          });
          
          tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        tableSection.appendChild(table);
        return tableSection;
      };
      
      // Teacher Statistics Table
      if (teacherStats.length > 0) {
        const teacherHeaders = ['اسم المدرس', 'الساعات', 'الإجمالي', 'النوع'];
        const teacherRows = teacherStats.map(stat => [
          stat.teacher_name,
          stat.total_hours.toFixed(2),
          `${stat.total_amount.toFixed(2)} درهم`,
          stat.location === 'external' ? 'خارجي' : 'داخلي'
        ]);
        printContent.appendChild(createTable('إحصائيات المدرسين', teacherHeaders, teacherRows));
      }
      
      // Expenses Table
      if (monthExpenses.length > 0) {
        const expenseHeaders = ['اسم الفرع', 'اسم المدرس', 'السبب', 'المبلغ'];
        const expenseRows = monthExpenses.map(expense => [
          getBranchName(expense.branch_id),
          expense.teacher_name || '-',
          expense.title,
          `${parseFloat(expense.amount || 0).toFixed(2)} درهم`
        ]);
        printContent.appendChild(createTable('المصاريف الإضافية', expenseHeaders, expenseRows));
      }
      
      // Sessions Table
      if (group.sessions.length > 0) {
        const sessionHeaders = ['الفرع', 'المدرس', 'الطالب', 'التاريخ', 'من', 'إلى', 'الساعات', 'العقد', 'السعر', 'الإجمالي', 'النوع'];
        const sessionRows = group.sessions.map(session => [
          getBranchName(session.branch_id),
          session.teacher_name,
          session.student_name,
          session.session_date,
          convertTo12Hour(session.start_time),
          convertTo12Hour(session.end_time),
          parseFloat(session.duration_hours || 0).toFixed(2),
          session.contract_number || '-',
          parseFloat(session.hourly_rate || 0).toFixed(2),
          parseFloat(session.calculated_amount || 0).toFixed(2),
          session.location === 'external' ? 'خارجي' : 'داخلي'
        ]);
        printContent.appendChild(createTable('تفاصيل الجلسات', sessionHeaders, sessionRows));
      }
      
      // Append to body with maximum isolation
      document.body.appendChild(printContent);
      
      // Force layout calculation
      printContent.offsetHeight;
      
      // Wait for rendering - multiple frames to ensure everything is ready
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify element is in DOM
      if (!printContent.parentNode || !document.body.contains(printContent)) {
        throw new Error('Element was removed from DOM before capture');
      }
      
      // Convert to canvas with better options
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        letterRendering: true,
        removeContainer: false,
        foreignObjectRendering: false,
        onclone: (clonedDoc, element) => {
          // Ensure cloned element has proper styles
          const clonedElement = clonedDoc.querySelector('[dir="rtl"]');
          if (clonedElement) {
            clonedElement.style.position = 'absolute';
            clonedElement.style.left = '0';
            clonedElement.style.top = '0';
          }
        }
      });
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      const marginTop = 10;
      
      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - marginTop);
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - marginTop);
      }
      
      // Save PDF
      const fileName = `تقرير_${group.monthName}_${group.year}_${branchName.replace(/\s/g, "_")}.pdf`;
      pdf.save(fileName);
      
      success('تم إنشاء ملف PDF بنجاح');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
    } finally {
      // Clean up - remove element if it exists
      if (printContent && printContent.parentNode) {
        try {
          printContent.parentNode.removeChild(printContent);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  };

  const branchGroups = groupSessionsByBranchAndMonth(sessions);

  if (!token) {
    return (
      <>
        <div className="container">
          <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض التقارير</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container">
        <div className="panel">
          {loading && (
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>جاري التحميل...</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ 
              textAlign: "center", 
              padding: "1.5rem",
              backgroundColor: "#f8d7da",
              borderRadius: "8px",
              border: "1px solid #dc3545",
              marginBottom: "1rem"
            }}>
              <p style={{ color: "#721c24", fontSize: "0.9rem", margin: "0 0 0.75rem 0" }}>
                <strong>خطأ:</strong> {error}
              </p>
              <button
                onClick={loadSessions}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #dc3545",
                  backgroundColor: "white",
                  color: "#dc3545",
                  cursor: "pointer",
                  fontFamily: "Cairo",
                  fontSize: "0.85rem"
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                لا توجد جلسات موافق عليها للعرض
              </p>
            </div>
          )}

          {!loading && !error && branchGroups.length > 0 && (
            <div>
              <div className="filters-bar" style={{ marginBottom: "0.75rem" }}>
                <h2 style={{ fontSize: "16px", margin: 0, fontWeight: 600, color: "#2B2A2A" }}>
                  الجلسات الموافق عليها ({sessions.length})
                </h2>
                  {userInfo && userInfo.is_super_admin && (
                    <select
                      value={selectedBranchId || ""}
                      onChange={(e) => {
                        const branchId = e.target.value ? parseInt(e.target.value) : null;
                        setSelectedBranchId(branchId);
                      }}
                    >
                      <option value="">جميع الفروع</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => {
                      loadTeacherNames();
                      setShowMergeModal(true);
                    }}
                  className="btn"
                >
                  دمج أسماء المدرسين
                  </button>
              </div>
              
              {branchGroups.map((branchGroup) => (
                <div key={branchGroup.branchId} style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ 
                    color: "#2B2A2A", 
                    marginBottom: "0.75rem", 
                    padding: "0.75rem 1rem",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    fontWeight: 600,
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                  }}>
                    {branchGroup.branchName}
                  </h3>
                  
                  {branchGroup.months.map((group) => {
                const monthKey = `${group.year}-${group.month}`;
                const isExpanded = expandedMonths.has(monthKey);
                const monthExpenses = expenses[monthKey] || [];
                const teacherStats = calculateTeacherStats(group.sessions);
                const totals = calculateTotals(group.sessions, monthExpenses);
                
                return (
                  <div 
                    key={monthKey}
                    className="panel" 
                    style={{ 
                      marginBottom: "0.75rem",
                      padding: 0,
                      overflow: "hidden"
                    }}
                  >
                    {/* Month Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#F9FAFB",
                        borderBottom: isExpanded ? "2px solid #E5E7EB" : "none",
                        transition: "all 0.2s ease"
                      }}
                      onClick={() => toggleMonth(group.year, group.month)}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = "#F3F4F6";
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = "#F9FAFB";
                      }}
                    >
                      <h3 style={{ margin: 0, color: "#2B2A2A", fontSize: "14px", fontWeight: 600 }}>
                        {group.monthName} {group.year}
                      </h3>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generatePDF(group, monthExpenses, teacherStats, totals, branchGroup.branchName);
                          }}
                          className="btn primary btn-small"
                          title="تحميل PDF"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          PDF
                        </button>
                        <span style={{ color: "#6B7280", fontSize: "12px" }}>
                          عدد الجلسات: <strong style={{ color: "#2B2A2A" }}>{group.sessions.length}</strong>
                        </span>
                        <span style={{ color: "#5A7ACD", fontWeight: "600", fontSize: "13px" }}>
                          الإجمالي: {totals.grandTotal.toFixed(2)} درهم
                        </span>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{ padding: "1rem" }} data-month-key={monthKey}>
                        {/* Statistics Summary */}
                        <div style={{ marginBottom: "1rem" }}>
                          <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "0.75rem", color: "#2B2A2A", paddingBottom: "0.5rem", borderBottom: "1px solid #E5E7EB" }}>الإحصائيات الإجمالية</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                            <div className="stat-card">
                              <div className="stat-label">الإجمالي الداخلي</div>
                              <div className="stat-value">{totals.internalTotal.toFixed(2)}</div>
                              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
                              </div>
                            <div className="stat-card">
                              <div className="stat-label">الإجمالي الخارجي</div>
                              <div className="stat-value">{totals.externalTotal.toFixed(2)}</div>
                              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-label">إجمالي المصاريف</div>
                              <div className="stat-value">{totals.expensesTotal.toFixed(2)}</div>
                              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
                              </div>
                            <div className="stat-card">
                              <div className="stat-label">الإجمالي الكامل</div>
                              <div className="stat-value" style={{ color: "#5A7ACD" }}>{totals.grandTotal.toFixed(2)}</div>
                              <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "0.25rem" }}>درهم</div>
                              </div>
                            </div>
                          </div>

                          {/* Teacher Statistics */}
                        <div style={{ marginBottom: "1rem" }}>
                          <h5 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 0.75rem 0", color: "#2B2A2A" }}>إحصائيات المدرسين</h5>
                          <div className="table-container">
                            <table>
                              <thead>
                                <tr>
                                  <th>اسم المدرس</th>
                                  <th style={{ textAlign: "left" }}>عدد الساعات</th>
                                  <th style={{ textAlign: "left" }}>الإجمالي</th>
                                  <th>داخلي/خارجي</th>
                                </tr>
                              </thead>
                              <tbody>
                            {teacherStats.map((stat, idx) => (
                                  <tr key={idx}>
                                    <td>{stat.teacher_name}</td>
                                    <td className="number" data-type="number">{stat.total_hours.toFixed(2)}</td>
                                    <td className="number" data-type="number">{stat.total_amount.toFixed(2)} درهم</td>
                                    <td>
                                      <span className={`status status-${stat.location === "external" ? "pending" : "active"}`}>
                                  {stat.location === "external" ? "خارجي" : "داخلي"}
                                </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Add Expense Button */}
                        <div style={{ marginBottom: "0.75rem" }}>
                          {!showExpenseForm[monthKey] ? (
                            <button
                              onClick={() => setShowExpenseForm(prev => ({ ...prev, [monthKey]: true }))}
                              style={{
                                padding: "0.4rem 0.8rem",
                                borderRadius: "6px",
                                border: "1px solid #28a745",
                                backgroundColor: "#28a745",
                                color: "white",
                                cursor: "pointer",
                                fontFamily: "Cairo",
                                fontWeight: "bold",
                                fontSize: "0.8rem"
                              }}
                            >
                              + إضافة مصروف إضافي
                            </button>
                          ) : (
                            <div className="panel" style={{ marginBottom: "0.75rem" }}>
                              <h5 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "0.75rem" }}>إضافة مصروف إضافي</h5>
                              <form onSubmit={(e) => handleAddExpense(group.year, group.month, e)}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                  <input
                                    type="text"
                                    placeholder="اسم المدرس"
                                    value={expenseForm.teacher_name}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, teacher_name: e.target.value }))}
                                    style={{ padding: "0.4rem 0.6rem", fontSize: "11px", border: "1px solid #D1D1D1", borderRadius: "3px" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="السبب"
                                    value={expenseForm.title}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    style={{ padding: "0.4rem 0.6rem", fontSize: "11px", border: "1px solid #D1D1D1", borderRadius: "3px" }}
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="المبلغ"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                                    required
                                    style={{ padding: "0.4rem 0.6rem", fontSize: "11px", border: "1px solid #D1D1D1", borderRadius: "3px" }}
                                  />
                                  <select
                                    value={expenseForm.branch_id}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, branch_id: parseInt(e.target.value) }))}
                                    required
                                    style={{ padding: "0.4rem 0.6rem", fontSize: "11px", border: "1px solid #D1D1D1", borderRadius: "3px" }}
                                  >
                                    <option value="">اختر الفرع</option>
                                    {branches.map(b => (
                                      <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button type="submit" className="btn primary">
                                    إضافة
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowExpenseForm(prev => ({ ...prev, [monthKey]: false }));
                                      setExpenseForm({ title: "", amount: "", branch_id: branches[0]?.id || "", teacher_name: "" });
                                    }}
                                    className="btn"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>

                        {/* Expenses List */}
                        {monthExpenses.length > 0 && (
                          <div style={{ marginBottom: "1rem" }}>
                            <h5 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "0.5rem", color: "#2B2A2A" }}>المصاريف الإضافية ({monthExpenses.length})</h5>
                            <div className="table-container">
                              <table>
                                <thead>
                                  <tr>
                                    <th>اسم الفرع</th>
                                    <th>اسم المدرس</th>
                                    <th>السبب</th>
                                    <th style={{ textAlign: "left" }}>المبلغ</th>
                                  </tr>
                                </thead>
                                <tbody>
                              {monthExpenses.map((expense) => (
                                    <tr key={expense.id}>
                                      <td>{getBranchName(expense.branch_id)}</td>
                                      <td>{expense.teacher_name || "-"}</td>
                                      <td>{expense.title}</td>
                                      <td className="number" data-type="number" style={{ fontWeight: "600", color: "#2B2A2A" }}>
                                    {parseFloat(expense.amount || 0).toFixed(2)} درهم
                                      </td>
                                    </tr>
                              ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Sessions Table */}
                        <div>
                          <h5 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "0.5rem", color: "#2B2A2A" }}>تفاصيل الجلسات ({group.sessions.length})</h5>
                          <div className="table-container" style={{ overflowX: "auto" }}>
                            <table style={{ minWidth: "1200px" }}>
                              <thead>
                                <tr>
                                  <th>الفرع</th>
                                  <th>المدرس</th>
                                  <th>الطالب</th>
                                  <th>تاريخ الجلسة</th>
                                  <th>من الساعة</th>
                                  <th>إلى الساعة</th>
                                  <th style={{ textAlign: "left" }}>عدد الساعات</th>
                                  <th>رقم العقد</th>
                                  <th style={{ textAlign: "left" }}>سعر الساعة</th>
                                  <th style={{ textAlign: "left" }}>الإجمالي</th>
                                  <th>داخلي/خارجي</th>
                                  <th>الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody>
                            {group.sessions.map((session) => (
                                  <tr key={session.id}>
                                    <td>{getBranchName(session.branch_id)}</td>
                                    <td>{session.teacher_name}</td>
                                    <td>{session.student_name}</td>
                                    <td>{session.session_date}</td>
                                    <td>{convertTo12Hour(session.start_time)}</td>
                                    <td>{convertTo12Hour(session.end_time)}</td>
                                    <td className="number" data-type="number" style={{ textAlign: "left" }}>
                                      {parseFloat(session.duration_hours || 0).toFixed(2)}
                                    </td>
                                    <td style={{ fontWeight: "600", color: "#5A7ACD" }}>{session.contract_number}</td>
                                    <td className="number" data-type="number" style={{ textAlign: "left" }}>
                                      {parseFloat(session.hourly_rate || 0).toFixed(2)} درهم
                                    </td>
                                    <td className="number" data-type="number" style={{ fontWeight: "600", color: "#5A7ACD", textAlign: "left" }}>
                                  {parseFloat(session.calculated_amount || 0).toFixed(2)} درهم
                                    </td>
                                    <td>
                                      <span className={`status status-${session.location === "external" ? "pending" : "active"}`}>
                                  {session.location === "external" ? "خارجي" : "داخلي"}
                                </span>
                                    </td>
                                    <td>
                                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                  <button 
                                    onClick={() => handleEdit(session)}
                                          className="btn btn-small"
                                          style={{ padding: "0.3rem", minWidth: "32px" }}
                                    title="تعديل"
                                  >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(session.id)}
                                          className="btn btn-small btn-danger"
                                          style={{ padding: "0.3rem", minWidth: "32px" }}
                                    title="حذف"
                                  >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </button>
                              </div>
                                    </td>
                                  </tr>
                            ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingSession && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1rem" }}>تعديل الجلسة</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="grid">
                  <input 
                    placeholder="اسم المدرس" 
                    value={editForm.teacher_name} 
                    onChange={(e) => setEditForm({ ...editForm, teacher_name: e.target.value })} 
                    required 
                  />
                  <input 
                    placeholder="اسم الطالب" 
                    value={editForm.student_name} 
                    onChange={(e) => setEditForm({ ...editForm, student_name: e.target.value })} 
                    required 
                  />
                  <input 
                    type="date" 
                    value={editForm.session_date} 
                    onChange={(e) => setEditForm({ ...editForm, session_date: e.target.value })} 
                    required 
                  />
                  <input 
                    type="time" 
                    placeholder="من الساعة" 
                    value={editForm.start_time} 
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} 
                  />
                  <input 
                    type="time" 
                    placeholder="إلى الساعة" 
                    value={editForm.end_time} 
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} 
                  />
                  <input 
                    type="number" 
                    step="0.25" 
                    placeholder="عدد الساعات" 
                    value={editForm.duration_hours} 
                    onChange={(e) => setEditForm({ ...editForm, duration_hours: e.target.value })} 
                    required 
                  />
                  <input 
                    placeholder="نص المدة (مثال: ساعتان)" 
                    value={editForm.duration_text} 
                    onChange={(e) => setEditForm({ ...editForm, duration_text: e.target.value })} 
                    required 
                  />
                  <input 
                    placeholder="رقم العقد" 
                    value={editForm.contract_number} 
                    onChange={(e) => setEditForm({ ...editForm, contract_number: e.target.value })} 
                    required 
                  />
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="سعر الساعة" 
                    value={editForm.hourly_rate} 
                    onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })} 
                    required 
                  />
                  <select
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "1rem" }}
                  >
                    <option value="internal">داخلي</option>
                    <option value="external">خارجي</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn primary" type="submit">حفظ التعديلات</button>
                <button className="btn" type="button" onClick={() => setShowEditModal(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Teachers Modal */}
      {showMergeModal && (
        <div className="modal-overlay" onClick={() => setShowMergeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1rem" }}>دمج أسماء المدرسين</h3>
              <button className="modal-close" onClick={() => setShowMergeModal(false)}>×</button>
            </div>
            <form onSubmit={handleMergeTeachers}>
              <div className="modal-body">
                <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1rem" }}>
                  اختر الاسم القديم الذي تريد دمجه مع اسم جديد موحد. سيتم تحديث <strong>الجلسات في التقرير المفتوح فقط</strong>.
                </p>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "bold" }}>
                    الاسم القديم (المراد دمجه):
                  </label>
                  <select
                    value={mergeForm.old_name}
                    onChange={(e) => setMergeForm({ ...mergeForm, old_name: e.target.value })}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "0.75rem", 
                      borderRadius: "8px", 
                      border: "1px solid #dcdcdc", 
                      fontFamily: "Cairo", 
                      fontSize: "0.9rem" 
                    }}
                  >
                    <option value="">اختر الاسم القديم</option>
                    {teacherNames.map((name, idx) => (
                      <option key={idx} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "bold" }}>
                    الاسم الجديد الموحد:
                  </label>
                  <select
                    value={mergeForm.new_name}
                    onChange={(e) => setMergeForm({ ...mergeForm, new_name: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: "0.75rem", 
                      borderRadius: "8px", 
                      border: "1px solid #dcdcdc", 
                      fontFamily: "Cairo", 
                      fontSize: "0.9rem",
                      marginBottom: "0.5rem"
                    }}
                  >
                    <option value="">اختر من القائمة أو أدخل اسم جديد</option>
                    {teacherNames.filter(name => name !== mergeForm.old_name).map((name, idx) => (
                      <option key={idx} value={name}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="أو أدخل اسم جديد موحد"
                    value={mergeForm.new_name && !teacherNames.includes(mergeForm.new_name) ? mergeForm.new_name : ""}
                    onChange={(e) => setMergeForm({ ...mergeForm, new_name: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: "0.75rem", 
                      borderRadius: "8px", 
                      border: "1px solid #dcdcdc", 
                      fontFamily: "Cairo", 
                      fontSize: "0.9rem" 
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn primary" type="submit">دمج الأسماء</button>
                <button className="btn" type="button" onClick={() => {
                  setShowMergeModal(false);
                  setMergeForm({ old_name: "", new_name: "" });
                }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
