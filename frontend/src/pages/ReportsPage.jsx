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

  const generateTeacherPDF = async (teacherStat, teacherSessions, group, branchName) => {
    // Create a temporary container for the teacher's report
    const printContent = document.createElement('div');
    printContent.style.position = 'absolute';
    printContent.style.left = '-9999px';
    printContent.style.top = '0';
    printContent.style.width = '210mm';
    printContent.style.backgroundColor = 'white';
    printContent.style.padding = '15px';
    printContent.style.fontFamily = 'Cairo, Arial, sans-serif';
    printContent.style.direction = 'rtl';
    printContent.style.textAlign = 'right';
    
    // Add title header
    const titleDiv = document.createElement('div');
    titleDiv.style.textAlign = 'center';
    titleDiv.style.marginBottom = '15px';
    titleDiv.style.paddingBottom = '10px';
    titleDiv.style.borderBottom = '2px solid #007bff';
    titleDiv.innerHTML = `
      <h1 style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0; color: #007bff;">تقرير مدرس - مركز العمران للتدريب والتطوير</h1>
      <h2 style="font-size: 14px; font-weight: bold; margin: 0; color: #333;">${branchName} - ${teacherStat.teacher_name} - ${group.monthName} ${group.year}</h2>
    `;
    printContent.appendChild(titleDiv);
    
    // Teacher Statistics Summary
    const statsDiv = document.createElement('div');
    statsDiv.style.marginBottom = '15px';
    statsDiv.style.padding = '10px';
    statsDiv.style.backgroundColor = '#f8f9fa';
    statsDiv.style.borderRadius = '6px';
    statsDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
        <div style="padding: 10px; background: white; border-radius: 6px;">
          <div style="color: #666; font-size: 12px; margin-bottom: 5px;">عدد الساعات</div>
          <div style="font-size: 16px; font-weight: bold; color: #007bff;">${teacherStat.total_hours.toFixed(2)}</div>
        </div>
        <div style="padding: 10px; background: white; border-radius: 6px;">
          <div style="color: #666; font-size: 12px; margin-bottom: 5px;">الإجمالي</div>
          <div style="font-size: 16px; font-weight: bold; color: #28a745;">${teacherStat.total_amount.toFixed(2)} درهم</div>
        </div>
        <div style="padding: 10px; background: white; border-radius: 6px;">
          <div style="color: #666; font-size: 12px; margin-bottom: 5px;">النوع</div>
          <div style="font-size: 16px; font-weight: bold; color: ${teacherStat.location === "external" ? "#ffc107" : "#007bff"};">${teacherStat.location === "external" ? "خارجي" : "داخلي"}</div>
        </div>
      </div>
    `;
    printContent.appendChild(statsDiv);
    
    // Sessions Table
    const sessionsTable = document.createElement('div');
    sessionsTable.style.marginBottom = '15px';
    sessionsTable.innerHTML = `
      <h3 style="font-size: 14px; color: #007bff; margin-bottom: 10px;">الجلسات (${teacherSessions.length})</h3>
      <div style="display: grid; gap: 5px;">
        <div style="display: grid; grid-template-columns: 1fr 1.2fr 1fr 1fr 0.9fr 0.9fr 0.8fr 1fr 1fr 1.1fr; padding: 8px; background: #f8f9fa; font-weight: bold; font-size: 11px; text-align: center;">
          <span>الطالب</span>
          <span>تاريخ الجلسة</span>
          <span>من الساعة</span>
          <span>إلى الساعة</span>
          <span>المدة</span>
          <span>رقم العقد</span>
          <span>سعر الساعة</span>
          <span>الإجمالي</span>
          <span>داخلي/خارجي</span>
          <span>الفرع</span>
        </div>
        ${teacherSessions.map(session => `
          <div style="display: grid; grid-template-columns: 1fr 1.2fr 1fr 1fr 0.9fr 0.9fr 0.8fr 1fr 1fr 1.1fr; padding: 6px; border-bottom: 1px solid #ddd; font-size: 10px; text-align: center;">
            <span>${session.student_name}</span>
            <span>${session.session_date}</span>
            <span>${convertTo12Hour(session.start_time)}</span>
            <span>${convertTo12Hour(session.end_time)}</span>
            <span>${session.duration_text}</span>
            <span style="font-weight: bold; color: #007bff;">${session.contract_number}</span>
            <span>${parseFloat(session.hourly_rate || 0).toFixed(2)} درهم</span>
            <span style="font-weight: bold; color: #28a745;">${parseFloat(session.calculated_amount || 0).toFixed(2)} درهم</span>
            <span style="color: ${session.location === "external" ? "#ffc107" : "#007bff"}; font-weight: bold;">${session.location === "external" ? "خارجي" : "داخلي"}</span>
            <span>${getBranchName(session.branch_id)}</span>
          </div>
        `).join('')}
      </div>
    `;
    printContent.appendChild(sessionsTable);
    
    document.body.appendChild(printContent);
    
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Convert to canvas
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        letterRendering: true
      });
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const topMargin = 10; // Top margin for new pages in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed with top margin
      while (heightLeft > 0) {
        position = heightLeft - imgHeight - topMargin; // Add top margin for new pages
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - topMargin); // Account for margin in remaining height
      }
      
      // Save PDF with teacher name and month
      const fileName = `تقرير_${teacherStat.teacher_name.replace(/\s/g, "_")}_${group.monthName}_${group.year}.pdf`;
      pdf.save(fileName);
      
      console.log('Teacher PDF generated successfully');
    } catch (err) {
      console.error('Error generating teacher PDF:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
    } finally {
      // Clean up
      if (document.body.contains(printContent)) {
        document.body.removeChild(printContent);
      }
    }
  };

  const generateAllTeachersPDF = async (group, teacherStats, branchName) => {
    // Generate PDF for each teacher sequentially
    for (const stat of teacherStats) {
      const teacherSessions = group.sessions.filter(s => s.teacher_name === stat.teacher_name);
      if (teacherSessions.length > 0) {
        await generateTeacherPDF(stat, teacherSessions, group, branchName);
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    success(`تم تحميل ${teacherStats.length} ملف PDF للمدرسين`);
  };

  const generatePDF = async (group, monthExpenses, teacherStats, totals, branchName) => {
    // Find the expanded content element
    const monthKey = `${group.year}-${group.month}`;
    const expandedContent = document.querySelector(`[data-month-key="${monthKey}"]`);
    
    if (!expandedContent) {
      showError('يرجى فتح البطاقة الشهرية أولاً لعرض المحتوى');
      return;
    }
    
    // Create a temporary container with the same content
    const printContent = document.createElement('div');
    printContent.style.position = 'absolute';
    printContent.style.left = '-9999px';
    printContent.style.top = '0';
    printContent.style.width = '210mm';
    printContent.style.backgroundColor = 'white';
    printContent.style.padding = '15px';
    printContent.style.fontFamily = 'Cairo, Arial, sans-serif';
    printContent.style.direction = 'rtl';
    printContent.style.textAlign = 'right';
    
    // Add title header
    const titleDiv = document.createElement('div');
    titleDiv.style.textAlign = 'center';
    titleDiv.style.marginBottom = '15px';
    titleDiv.style.paddingBottom = '10px';
    titleDiv.style.borderBottom = '2px solid #007bff';
    titleDiv.innerHTML = `
      <h1 style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0; color: #007bff;">تقرير شهري - مركز العمران للتدريب والتطوير</h1>
      <h2 style="font-size: 14px; font-weight: bold; margin: 0; color: #333;">${branchName} - ${group.monthName} ${group.year}</h2>
    `;
    printContent.appendChild(titleDiv);
    
    // Clone the expanded content
    const clonedContent = expandedContent.cloneNode(true);
    
    // Scale down all font sizes in cloned content
    const allElements = clonedContent.querySelectorAll('*');
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      if (fontSize && !isNaN(fontSize)) {
        el.style.fontSize = `${fontSize * 0.75}px`; // Reduce by 25%
      }
      
      // Reduce padding and margins
      if (style.padding) {
        const padding = parseFloat(style.padding);
        if (padding && !isNaN(padding)) {
          el.style.padding = `${padding * 0.7}px`;
        }
      }
      if (style.margin) {
        const margin = parseFloat(style.margin);
        if (margin && !isNaN(margin)) {
          el.style.margin = `${margin * 0.7}px`;
        }
      }
    });
    
    // Specifically reduce table sizes more aggressively and improve column widths
    const tables = clonedContent.querySelectorAll('.table');
    tables.forEach(table => {
      // Check if this is the sessions table (last table in the content)
      const isSessionsTable = table.querySelector('.row.head span')?.textContent.includes('الفرع') || 
                              table.querySelector('.row.head span')?.textContent.includes('المدرس');
      
      // Reduce table gap - minimal for sessions table
      if (isSessionsTable) {
        table.style.gap = '0'; // No gap for sessions table
        table.style.margin = '0';
        table.style.padding = '0';
      } else {
        table.style.gap = '0.1rem';
      }
      
      // Reduce row padding and font sizes
      const rows = table.querySelectorAll('.row');
      rows.forEach(row => {
        // Minimal padding for sessions table rows
        if (isSessionsTable) {
          row.style.padding = '0.02rem 0.05rem'; // Very minimal padding
          row.style.fontSize = '0.5rem'; // Smaller font
          row.style.minHeight = 'auto'; // Remove min-height
          row.style.lineHeight = '1'; // Very tight line height
          row.style.margin = '0'; // No margin
          row.style.border = 'none'; // Remove any borders
        } else {
          row.style.padding = '0.2rem 0.15rem';
          row.style.fontSize = '0.55rem';
        }
        
        // Adjust grid columns for sessions table (10 columns after removing actions and داخلي/خارجي)
        const currentCols = row.style.gridTemplateColumns || window.getComputedStyle(row).gridTemplateColumns;
        if (currentCols && (currentCols.includes('repeat(12') || currentCols.includes('0.8fr 1.2fr'))) {
          // Better balanced columns with more width (10 columns: الفرع, المدرس, الطالب, التاريخ, من الساعة, إلى الساعة, المدة, رقم العقد, سعر الساعة, الإجمالي)
          row.style.gridTemplateColumns = '1.1fr 1.7fr 1.7fr 1.3fr 1.2fr 1.2fr 1.1fr 1.3fr 1.3fr 1.4fr';
        }
        
        // Reduce span font sizes in rows and center content
        const spans = row.querySelectorAll('span');
        spans.forEach(span => {
          if (isSessionsTable) {
            span.style.fontSize = '0.5rem'; // Smaller font
            span.style.padding = '0.02rem'; // Minimal padding
            span.style.lineHeight = '1.1'; // Tight line height
          } else {
            span.style.fontSize = '0.55rem';
            span.style.padding = '0.05rem';
          }
          span.style.wordBreak = 'break-word';
          span.style.overflow = 'hidden';
          span.style.textOverflow = 'ellipsis';
          span.style.display = 'flex';
          span.style.alignItems = 'center';
          span.style.justifyContent = 'center';
          span.style.textAlign = 'center';
        });
      });
      
      // Reduce header row sizes
      const headerRows = table.querySelectorAll('.row.head');
      headerRows.forEach(headerRow => {
        if (isSessionsTable) {
          headerRow.style.padding = '0.02rem 0.05rem'; // Very minimal padding
          headerRow.style.fontSize = '0.5rem'; // Smaller font
          headerRow.style.minHeight = 'auto'; // Remove min-height
          headerRow.style.lineHeight = '1'; // Very tight line height
          headerRow.style.margin = '0'; // No margin
          headerRow.style.border = 'none'; // Remove any borders
        } else {
          headerRow.style.padding = '0.25rem 0.15rem';
          headerRow.style.fontSize = '0.6rem';
        }
        
        // Adjust grid columns for sessions table header (10 columns after removing actions and داخلي/خارجي)
        const currentCols = headerRow.style.gridTemplateColumns || window.getComputedStyle(headerRow).gridTemplateColumns;
        if (currentCols && (currentCols.includes('repeat(12') || currentCols.includes('0.8fr 1.2fr'))) {
          headerRow.style.gridTemplateColumns = '1.1fr 1.7fr 1.7fr 1.3fr 1.2fr 1.2fr 1.1fr 1.3fr 1.3fr 1.4fr';
        }
        
        const headerSpans = headerRow.querySelectorAll('span');
        headerSpans.forEach(span => {
          if (isSessionsTable) {
            span.style.fontSize = '0.55rem'; // Smaller font
            span.style.padding = '0.02rem'; // Minimal padding
            span.style.lineHeight = '1.1'; // Tight line height
          } else {
            span.style.fontSize = '0.6rem';
            span.style.padding = '0.05rem';
          }
          span.style.display = 'flex';
          span.style.alignItems = 'center';
          span.style.justifyContent = 'center';
          span.style.textAlign = 'center';
        });
      });
    });
    
    // Reduce h4, h5 sizes and remove number from "الجلسات" heading
    const headings = clonedContent.querySelectorAll('h4, h5');
    headings.forEach(heading => {
      const style = window.getComputedStyle(heading);
      const fontSize = parseFloat(style.fontSize);
      if (fontSize && !isNaN(fontSize)) {
        heading.style.fontSize = `${fontSize * 0.7}px`;
      }
      heading.style.marginBottom = '0.4rem';
      
      // Remove number from "الجلسات" heading
      const text = heading.textContent.trim();
      if (text.includes('الجلسات') && text.includes('(')) {
        // Remove the number part like "(6)" from "الجلسات (6)"
        heading.textContent = 'الجلسات';
      }
    });
    
    // Reduce statistics boxes sizes
    const statBoxes = clonedContent.querySelectorAll('[style*="grid-template-columns"]');
    statBoxes.forEach(box => {
      const children = box.children;
      Array.from(children).forEach(child => {
        child.style.padding = '0.5rem';
        const innerDivs = child.querySelectorAll('div');
        innerDivs.forEach(div => {
          const style = window.getComputedStyle(div);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize && !isNaN(fontSize)) {
            div.style.fontSize = `${fontSize * 0.65}px`;
          }
        });
      });
    });
    
    // Remove buttons and forms from cloned content
    const buttons = clonedContent.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());
    
    const forms = clonedContent.querySelectorAll('form');
    forms.forEach(form => form.remove());
    
    // Remove action buttons from sessions table
    const actionCells = clonedContent.querySelectorAll('[style*="الإجراءات"]');
    actionCells.forEach(cell => {
      const row = cell.closest('.row');
      if (row) {
        const actionSpan = row.querySelector('span:last-child');
        if (actionSpan && actionSpan.querySelector('button')) {
          actionSpan.remove();
        }
      }
    });
    
    // Remove the last column (الإجراءات) from sessions table header
    const sessionHeaders = clonedContent.querySelectorAll('.row.head');
    sessionHeaders.forEach(header => {
      const spans = header.querySelectorAll('span');
      if (spans.length > 0) {
        const lastSpan = spans[spans.length - 1];
        if (lastSpan.textContent.includes('الإجراءات')) {
          lastSpan.remove();
        }
      }
    });
    
    // Remove the last column (الإجراءات) from session rows
    const sessionRows = clonedContent.querySelectorAll('.row:not(.head)');
    sessionRows.forEach(row => {
      const spans = row.querySelectorAll('span');
      if (spans.length > 0) {
        // Remove last span if it contains buttons (الإجراءات)
        const lastSpan = spans[spans.length - 1];
        if (lastSpan.querySelector('button')) {
          lastSpan.remove();
        }
        // Remove second to last span if it contains "داخلي" or "خارجي" (داخلي/خارجي column)
        if (spans.length > 1) {
          const secondLastSpan = spans[spans.length - 2];
          const text = secondLastSpan.textContent.trim();
          if (text === 'داخلي' || text === 'خارجي') {
            secondLastSpan.remove();
          }
        }
      }
    });
    
    // Remove "داخلي/خارجي" column from session table headers
    sessionHeaders.forEach(header => {
      const spans = header.querySelectorAll('span');
      spans.forEach((span, index) => {
        const text = span.textContent.trim();
        if (text === 'داخلي/خارجي') {
          span.remove();
        }
      });
    });
    
    // Remove "PDF" column from teacher statistics table
    const teacherStatsTables = clonedContent.querySelectorAll('.table');
    teacherStatsTables.forEach(table => {
      // Check if this is the teacher statistics table (contains "اسم المدرس" in header)
      const headerRow = table.querySelector('.row.head');
      if (headerRow) {
        const headerSpans = headerRow.querySelectorAll('span');
        const isTeacherStatsTable = Array.from(headerSpans).some(span => 
          span.textContent.trim().includes('اسم المدرس')
        );
        
        if (isTeacherStatsTable) {
          // Remove "PDF" column from header
          headerSpans.forEach(span => {
            if (span.textContent.trim() === 'PDF') {
              span.remove();
            }
          });
          
          // Remove "PDF" column from data rows and adjust grid columns
          const dataRows = table.querySelectorAll('.row:not(.head)');
          dataRows.forEach(row => {
            const spans = row.querySelectorAll('span');
            // Remove last span (PDF column)
            if (spans.length > 0) {
              const lastSpan = spans[spans.length - 1];
              if (lastSpan.querySelector('button') || lastSpan.textContent.trim() === 'PDF') {
                lastSpan.remove();
              }
            }
            // Adjust grid columns to 4 columns (اسم المدرس, عدد الساعات, الإجمالي, داخلي/خارجي)
            row.style.gridTemplateColumns = '1.5fr 1fr 1fr 1fr';
          });
          
          // Adjust header grid columns to 4 columns
          headerRow.style.gridTemplateColumns = '1.5fr 1fr 1fr 1fr';
        }
      }
    });
    
    // Remove margins and padding from sessions table container div
    const sessionsTableContainers = clonedContent.querySelectorAll('div');
    sessionsTableContainers.forEach(container => {
      const h5 = container.querySelector('h5');
      if (h5 && h5.textContent.trim() === 'الجلسات') {
        // This is the sessions table container
        container.style.marginBottom = '0';
        container.style.padding = '0';
        container.style.marginTop = '0';
      }
    });
    
    printContent.appendChild(clonedContent);
    document.body.appendChild(printContent);
    
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Convert to canvas
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        letterRendering: true
      });
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const topMargin = 10; // Top margin for new pages in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed with top margin
      while (heightLeft > 0) {
        position = heightLeft - imgHeight - topMargin; // Add top margin for new pages
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - topMargin); // Account for margin in remaining height
      }
      
      // Save PDF
      const fileName = `تقرير_${group.monthName}_${group.year}_${branchName.replace(/\s/g, "_")}.pdf`;
      pdf.save(fileName);
      
      console.log('PDF generated successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
    } finally {
      // Clean up
      if (document.body.contains(printContent)) {
        document.body.removeChild(printContent);
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h2 style={{ margin: 0, color: "#007bff", fontSize: "1rem" }}>
                  الجلسات الموافق عليها ({sessions.length})
                </h2>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  {userInfo && userInfo.is_super_admin && (
                    <select
                      value={selectedBranchId || ""}
                      onChange={(e) => {
                        const branchId = e.target.value ? parseInt(e.target.value) : null;
                        setSelectedBranchId(branchId);
                      }}
                      style={{
                        padding: "0.4rem 0.8rem",
                        borderRadius: "6px",
                        border: "1px solid #007bff",
                        backgroundColor: "white",
                        color: "#007bff",
                        cursor: "pointer",
                        fontFamily: "Cairo",
                        fontSize: "0.8rem",
                        fontWeight: "bold"
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
                    دمج أسماء المدرسين (في التقرير المفتوح فقط)
                  </button>
                </div>
              </div>
              
              {branchGroups.map((branchGroup) => (
                <div key={branchGroup.branchId} style={{ marginBottom: "1rem" }}>
                  <h3 style={{ 
                    color: "#007bff", 
                    marginBottom: "0.75rem", 
                    padding: "0.75rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #dcdcdc",
                    fontSize: "0.95rem"
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
                      marginBottom: "1rem", 
                      border: "1px solid #dcdcdc", 
                      borderRadius: "6px",
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
                        padding: "0.75rem",
                        backgroundColor: "#f8f9fa",
                        borderBottom: isExpanded ? "1px solid #dcdcdc" : "none"
                      }}
                      onClick={() => toggleMonth(group.year, group.month)}
                    >
                      <h3 style={{ margin: 0, color: "#007bff", fontSize: "0.9rem" }}>
                        {group.monthName} {group.year}
                      </h3>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generatePDF(group, monthExpenses, teacherStats, totals, branchGroup.branchName);
                          }}
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "6px",
                            border: "1px solid #007bff",
                            backgroundColor: "#007bff",
                            color: "white",
                            cursor: "pointer",
                            fontFamily: "Cairo",
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                          title="تحميل PDF"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          PDF
                        </button>
                        <span style={{ color: "#666", fontSize: "0.8rem" }}>
                          عدد الجلسات: <strong>{group.sessions.length}</strong>
                        </span>
                        <span style={{ color: "#28a745", fontWeight: "bold", fontSize: "0.85rem" }}>
                          الإجمالي: {totals.grandTotal.toFixed(2)} درهم
                        </span>
                        <span style={{ fontSize: "0.9rem" }}>
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{ padding: "1rem" }} data-month-key={monthKey}>
                        {/* Statistics Summary */}
                        <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                          <h4 style={{ color: "#007bff", marginBottom: "0.75rem", fontSize: "0.9rem" }}>الإحصائيات الإجمالية</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                            <div style={{ textAlign: "center", padding: "0.75rem", backgroundColor: "white", borderRadius: "6px" }}>
                              <div style={{ color: "#666", fontSize: "0.75rem", marginBottom: "0.4rem" }}>الإجمالي الداخلي</div>
                              <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#007bff" }}>
                                {totals.internalTotal.toFixed(2)} درهم
                              </div>
                            </div>
                            <div style={{ textAlign: "center", padding: "0.75rem", backgroundColor: "white", borderRadius: "6px" }}>
                              <div style={{ color: "#666", fontSize: "0.75rem", marginBottom: "0.4rem" }}>الإجمالي الخارجي</div>
                              <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#ffc107" }}>
                                {totals.externalTotal.toFixed(2)} درهم
                              </div>
                            </div>
                            <div style={{ textAlign: "center", padding: "0.75rem", backgroundColor: "white", borderRadius: "6px" }}>
                              <div style={{ color: "#666", fontSize: "0.75rem", marginBottom: "0.4rem" }}>إجمالي المصاريف</div>
                              <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#dc3545" }}>
                                {totals.expensesTotal.toFixed(2)} درهم
                              </div>
                            </div>
                            <div style={{ textAlign: "center", padding: "0.75rem", backgroundColor: "white", borderRadius: "6px" }}>
                              <div style={{ color: "#666", fontSize: "0.75rem", marginBottom: "0.4rem" }}>الإجمالي الكامل</div>
                              <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#28a745" }}>
                                {totals.grandTotal.toFixed(2)} درهم
                              </div>
                            </div>
                          </div>

                          {/* Teacher Statistics */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                            <h5 style={{ color: "#007bff", margin: 0, fontSize: "0.85rem" }}>إحصائيات المدرسين</h5>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateAllTeachersPDF(group, teacherStats, branchGroup.branchName);
                              }}
                              style={{
                                padding: "0.35rem 0.7rem",
                                borderRadius: "6px",
                                border: "1px solid #28a745",
                                backgroundColor: "#28a745",
                                color: "white",
                                cursor: "pointer",
                                fontFamily: "Cairo",
                                fontWeight: "bold",
                                fontSize: "0.7rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem"
                              }}
                              title="تحميل PDF لكل المدرسين"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              تحميل PDF لكل المدرسين
                            </button>
                          </div>
                          <div className="table" style={{ gap: "0.25rem" }}>
                            <div className="row head" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr", fontSize: "0.8rem", padding: "0.5rem" }}>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>اسم المدرس</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>عدد الساعات</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>الإجمالي</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>داخلي/خارجي</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>PDF</span>
                            </div>
                            {teacherStats.map((stat, idx) => (
                              <div key={idx} className="row" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr", fontSize: "0.8rem", padding: "0.5rem" }}>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.teacher_name}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.total_hours.toFixed(2)}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.total_amount.toFixed(2)} درهم</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", color: stat.location === "external" ? "#ffc107" : "#007bff", fontWeight: "bold" }}>
                                  {stat.location === "external" ? "خارجي" : "داخلي"}
                                </span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const teacherSessions = group.sessions.filter(s => s.teacher_name === stat.teacher_name);
                                      generateTeacherPDF(stat, teacherSessions, group, branchGroup.branchName);
                                    }}
                                    style={{
                                      padding: "0.25rem 0.5rem",
                                      borderRadius: "4px",
                                      border: "1px solid #007bff",
                                      backgroundColor: "#007bff",
                                      color: "white",
                                      cursor: "pointer",
                                      fontFamily: "Cairo",
                                      fontSize: "0.7rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.2rem"
                                    }}
                                    title={`تحميل PDF لـ ${stat.teacher_name}`}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="7 10 12 15 17 10"></polyline>
                                      <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    PDF
                                  </button>
                                </span>
                              </div>
                            ))}
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
                            <div className="panel" style={{ backgroundColor: "#f8f9fa", padding: "1rem" }}>
                              <h5 style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>إضافة مصروف إضافي</h5>
                              <form onSubmit={(e) => handleAddExpense(group.year, group.month, e)}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                  <input
                                    type="text"
                                    placeholder="اسم المدرس"
                                    value={expenseForm.teacher_name}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, teacher_name: e.target.value }))}
                                    style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.8rem" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="السبب"
                                    value={expenseForm.title}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.8rem" }}
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="المبلغ"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                                    required
                                    style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.8rem" }}
                                  />
                                  <select
                                    value={expenseForm.branch_id}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, branch_id: parseInt(e.target.value) }))}
                                    required
                                    style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.8rem" }}
                                  >
                                    <option value="">اختر الفرع</option>
                                    {branches.map(b => (
                                      <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                  <button
                                    type="submit"
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
                                    إضافة
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowExpenseForm(prev => ({ ...prev, [monthKey]: false }));
                                      setExpenseForm({ title: "", amount: "", branch_id: branches[0]?.id || "", teacher_name: "" });
                                    }}
                                    style={{
                                      padding: "0.4rem 0.8rem",
                                      borderRadius: "6px",
                                      border: "1px solid #dc3545",
                                      backgroundColor: "white",
                                      color: "#dc3545",
                                      cursor: "pointer",
                                      fontFamily: "Cairo",
                                      fontSize: "0.8rem"
                                    }}
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
                            <h5 style={{ color: "#dc3545", marginBottom: "0.4rem", fontSize: "0.85rem" }}>المصاريف الإضافية ({monthExpenses.length})</h5>
                            <div className="table" style={{ gap: "0.25rem" }}>
                              <div className="row head" style={{ gridTemplateColumns: "repeat(4, 1fr)", fontSize: "0.8rem", padding: "0.5rem" }}>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>اسم الفرع</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>اسم المدرس</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>السبب</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>المبلغ</span>
                              </div>
                              {monthExpenses.map((expense) => (
                                <div key={expense.id} className="row" style={{ gridTemplateColumns: "repeat(4, 1fr)", fontSize: "0.8rem", padding: "0.5rem" }}>
                                  <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{getBranchName(expense.branch_id)}</span>
                                  <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{expense.teacher_name || "-"}</span>
                                  <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{expense.title}</span>
                                  <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#dc3545" }}>
                                    {parseFloat(expense.amount || 0).toFixed(2)} درهم
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sessions Table */}
                        <div>
                          <h5 style={{ color: "#007bff", marginBottom: "0.4rem", fontSize: "0.85rem" }}>الجلسات ({group.sessions.length})</h5>
                          <div className="table" style={{ gap: "0.25rem" }}>
                            <div className="row head" style={{ gridTemplateColumns: "0.8fr 1.2fr 1.2fr 1fr 0.9fr 0.9fr 0.8fr 1fr 1fr 1.1fr 0.9fr 0.7fr", fontSize: "0.8rem", padding: "0.5rem" }}>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>الفرع</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>المدرس</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>الطالب</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>تاريخ الجلسة</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>من الساعة</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>إلى الساعة</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>المدة</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>رقم العقد</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>سعر الساعة</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>الإجمالي</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>داخلي/خارجي</span>
                              <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>الإجراءات</span>
                            </div>
                            {group.sessions.map((session) => (
                              <div key={session.id} className="row" style={{ gridTemplateColumns: "0.8fr 1.2fr 1.2fr 1fr 0.9fr 0.9fr 0.8fr 1fr 1fr 1.1fr 0.9fr 0.7fr", fontSize: "0.8rem", padding: "0.5rem" }}>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{getBranchName(session.branch_id)}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{session.teacher_name}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{session.student_name}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{session.session_date}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{convertTo12Hour(session.start_time)}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{convertTo12Hour(session.end_time)}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{session.duration_text}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#007bff" }}>{session.contract_number}</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{parseFloat(session.hourly_rate || 0).toFixed(2)} درهم</span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#28a745" }}>
                                  {parseFloat(session.calculated_amount || 0).toFixed(2)} درهم
                                </span>
                                <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", color: session.location === "external" ? "#ffc107" : "#007bff", fontWeight: "bold" }}>
                                  {session.location === "external" ? "خارجي" : "داخلي"}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.2rem", gap: "0.15rem" }}>
                                  <button 
                                    onClick={() => handleEdit(session)}
                                    style={{ 
                                      padding: "0.3rem",
                                      backgroundColor: "#ffc107",
                                      color: "white",
                                      border: "none",
                                      whiteSpace: "nowrap",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      minWidth: "28px",
                                      height: "28px",
                                      borderRadius: "4px",
                                      cursor: "pointer"
                                    }}
                                    title="تعديل"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(session.id)}
                                    style={{ 
                                      padding: "0.3rem", 
                                      whiteSpace: "nowrap", 
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      minWidth: "28px",
                                      height: "28px",
                                      borderRadius: "4px",
                                      border: "none",
                                      cursor: "pointer",
                                      backgroundColor: "#dc3545",
                                      color: "white"
                                    }}
                                    title="حذف"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </span>
                              </div>
                            ))}
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
