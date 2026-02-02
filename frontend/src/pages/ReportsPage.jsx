import React, { useState, useEffect, useRef } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfMake from "pdfmake-rtl/build/pdfmake";
import { vfs } from "../fonts/vfs_fonts_custom";
import { buildComprehensiveMonthlyReportPDF, buildBranchMonthlyReportPDF } from "./ReportsPage_pdfmake";

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

export default function ReportsPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [expenses, setExpenses] = useState({}); // { "2025-1": [expenses...] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedMonth, setExpandedMonth] = useState(null);
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
  const [showExpenseEditModal, setShowExpenseEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseEditForm, setExpenseEditForm] = useState({ title: "", amount: "", teacher_name: "" });
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [teacherNames, setTeacherNames] = useState([]);
  const [mergeForm, setMergeForm] = useState({
    old_name: "",
    new_name: ""
  });
  const [selectedBranchId, setSelectedBranchId] = useState(null); // null = all branches
  const [monthSessionsForMerge, setMonthSessionsForMerge] = useState([]); // جلسات الشهر المحدد للدمج
  // Set default to current month and year
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(null); // default to null to show all
  const [selectedMonth, setSelectedMonth] = useState(null); // default to null to show all
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfStatus, setPdfStatus] = useState('');
  const [selectedTeachersPerMonth, setSelectedTeachersPerMonth] = useState({}); // { [branchMonthKey]: [teacherNames...] }

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
        // If operation manager, automatically set branch_id filter
        if (data.is_operation_manager && data.branch_id) {
          setSelectedBranchId(data.branch_id);
        }
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

  // Scroll to expanded month when it changes or data updates
  useEffect(() => {
    if (expandedMonth) {
      console.log("[Scroll] Effect triggered for Reports. expandedMonth:", expandedMonth);
      setTimeout(() => {
        const element = document.querySelector(`[data-month-key="${expandedMonth}"]`);
        console.log("[Scroll] Looking for element with key:", expandedMonth, "Found:", !!element);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    }
  }, [expandedMonth, sessions]);

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
      const uniqueMonthKeys = new Set();
      branchGroups.forEach(bg => {
        bg.months.forEach(m => {
          uniqueMonthKeys.add(`${m.year}-${m.month}`);
        });
      });

      const expensesData = { ...expenses }; // Preserve existing
      let changed = false;

      for (const monthYearKey of uniqueMonthKeys) {
        if (!expensesData[monthYearKey] || expensesData[monthYearKey].length === 0) {
          const [year, month] = monthYearKey.split("-");
          try {
            const data = await apiGet(`/expenses/monthly?year=${year}&month=${month}`, token);
            expensesData[monthYearKey] = Array.isArray(data) ? data : [];
            changed = true;
          } catch (err) {
            console.error(`Error loading expenses for ${monthYearKey}:`, err);
            expensesData[monthYearKey] = [];
            changed = true;
          }
        }
      }

      if (changed) {
        setExpenses(expensesData);
      }
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
      // Auto-expand the latest month that has data
      if (sessionsData.length > 0) {
        const branchGroups = groupSessionsByBranchAndMonth(sessionsData);
        if (branchGroups.length > 0 && branchGroups[0].months.length > 0) {
          const firstBranch = branchGroups[0];
          const latestMonth = firstBranch.months[0];
          const latestKey = `${firstBranch.branchId}-${latestMonth.year}-${latestMonth.month}`;
          console.log("[Reports] Auto-expanding latest month:", latestKey);
          setExpandedMonth(latestKey);
        }
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

  // Filter sessions by year and month
  const filterSessionsByYearAndMonth = (sessions) => {
    if (!selectedYear && !selectedMonth) {
      return sessions;
    }

    return sessions.filter(session => {
      const dateStr = session.session_date;
      if (!dateStr) return false;

      const sessionDate = new Date(dateStr);
      const year = sessionDate.getFullYear();
      const month = sessionDate.getMonth() + 1;

      if (selectedYear && selectedMonth) {
        return year === selectedYear && month === selectedMonth;
      } else if (selectedYear) {
        return year === selectedYear;
      } else if (selectedMonth) {
        return month === selectedMonth;
      }
      return true;
    });
  };

  // Get available years and months from sessions
  const getAvailableYearsAndMonths = (sessions) => {
    const yearsSet = new Set();
    const monthsSet = new Set();

    sessions.forEach(session => {
      const dateStr = session.session_date;
      if (!dateStr) return;

      const sessionDate = new Date(dateStr);
      const year = sessionDate.getFullYear();
      const month = sessionDate.getMonth() + 1;
      yearsSet.add(year);
      monthsSet.add(month);
    });

    return {
      years: Array.from(yearsSet).sort((a, b) => b - a), // من الأحدث للأقدم
      months: Array.from(monthsSet).sort((a, b) => a - b) // من 1 إلى 12
    };
  };

  // Group sessions by branch and month
  const groupSessionsByBranchAndMonth = (sessions) => {
    const grouped = {}; // { branchId: { "2025-1": { year, month, sessions } } }
    const seenSessionIds = new Set(); // Track seen session IDs to avoid duplicates

    sessions.forEach(session => {
      // Skip if session ID is already seen
      if (session.id && seenSessionIds.has(session.id)) {
        return;
      }
      seenSessionIds.add(session.id);

      const branchId = session.branch_id;
      if (!grouped[branchId]) {
        grouped[branchId] = {};
      }

      const dateStr = session.session_date;
      if (!dateStr) return;

      const sessionDate = new Date(dateStr);
      const year = sessionDate.getFullYear();
      const month = sessionDate.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!grouped[branchId][key]) {
        grouped[branchId][key] = {
          year,
          month,
          monthName: monthNames[month],
          sessions: [],
          seenSessionIds: new Set() // Track session IDs in this month
        };
      }

      // Only add session if not already in this month
      if (!grouped[branchId][key].seenSessionIds.has(session.id)) {
        grouped[branchId][key].seenSessionIds.add(session.id);
        grouped[branchId][key].sessions.push(session);
      }
    });

    // Convert to array format: [{ branchId, branchName, months: [...] }]
    return Object.entries(grouped).map(([branchId, months]) => {
      const branch = branches.find(b => b.id === parseInt(branchId));
      const monthsArray = Object.values(months).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      // Remove duplicate months (same year and month) - keep only the first one
      const uniqueMonths = [];
      const seenMonthKeys = new Set();
      monthsArray.forEach(month => {
        const monthKey = `${month.year}-${month.month}`;
        if (!seenMonthKeys.has(monthKey)) {
          seenMonthKeys.add(monthKey);
          uniqueMonths.push(month);
        }
      });

      return {
        branchId: parseInt(branchId),
        branchName: branch ? branch.name : `فرع ${branchId}`,
        months: uniqueMonths
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

  const toggleMonth = (branchId, year, month) => {
    const key = `${branchId}-${year}-${month}`;
    console.log("[Accordion] Toggling Month:", key, "Current expandedMonth:", expandedMonth);
    setExpandedMonth(prev => (prev === key ? null : key));
  };

  const handleAddExpense = async (year, month, branchId, e) => {
    e.preventDefault();
    const key = `${year}-${month}`;

    try {
      const expense = await apiPost("/expenses", {
        ...expenseForm,
        month,
        year,
        branch_id: branchId
      }, token);

      setExpenses(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), expense]
      }));

      setExpenseForm({ title: "", amount: "", branch_id: "", teacher_name: "" });
      setShowExpenseForm(prev => ({ ...prev, [key]: false }));
    } catch (err) {
      showError("حدث خطأ أثناء إضافة المصروف: " + err.message);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseEditForm({
      title: expense.title,
      amount: expense.amount.toString(),
      teacher_name: expense.teacher_name || ""
    });
    setShowExpenseEditModal(true);
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      const updatedExpense = await apiPatch(`/expenses/${editingExpense.id}`, expenseEditForm, token);
      success("تم تحديث المصروف بنجاح!");
      setShowExpenseEditModal(false);
      setEditingExpense(null);

      // Robust state update: search across all keys to ensure the item is updated
      setExpenses(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (Array.isArray(next[key])) {
            next[key] = next[key].map(exp =>
              exp.id === updatedExpense.id ? updatedExpense : exp
            );
          }
        });
        return next;
      });
    } catch (err) {
      showError("حدث خطأ أثناء تحديث المصروف: " + err.message);
    }
  };

  const handleDeleteExpense = async (expense) => {
    confirm(
      "هل أنت متأكد من حذف هذا المصروف؟",
      async () => {
        try {
          await apiDelete(`/expenses/${expense.id}`, token);
          success("تم حذف المصروف بنجاح!");

          // Robust state update: search across all keys to ensure the item is removed
          setExpenses(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
              if (Array.isArray(next[key])) {
                next[key] = next[key].filter(exp => exp.id !== expense.id);
              }
            });
            return next;
          });
        } catch (err) {
          showError("حدث خطأ أثناء حذف المصروف: " + err.message);
        }
      }
    );
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
      loadSessions(selectedBranchId);
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

    // Get session IDs from month sessions for merge
    const sessionIds = monthSessionsForMerge
      .filter(session => session.teacher_name === mergeForm.old_name)
      .map(session => session.id);

    if (sessionIds.length === 0) {
      showError(`لا توجد جلسات في هذا الشهر تحتوي على الاسم "${mergeForm.old_name}"`);
      return;
    }

    confirm(
      `هل أنت متأكد من دمج "${mergeForm.old_name}" مع "${mergeForm.new_name}"؟ سيتم تحديث ${sessionIds.length} جلسة في هذا الشهر فقط.`,
      async () => {
        try {
          const result = await apiPost("/teachers/merge", {
            ...mergeForm,
            session_ids: sessionIds
          }, token);
          success(`تم دمج الأسماء بنجاح! تم تحديث ${result.updated_count} جلسة في هذا الشهر.`);
          setShowMergeModal(false);
          setMergeForm({ old_name: "", new_name: "" });
          setMonthSessionsForMerge([]);
          loadSessions(selectedBranchId); // Reload sessions to reflect the changes
        } catch (err) {
          showError("حدث خطأ أثناء دمج الأسماء: " + err.message);
        }
      }
    );
  };

  const handleOpenMergeModalForMonth = (monthSessions) => {
    // Extract unique teacher names from month sessions
    const uniqueNames = [...new Set(monthSessions.map(s => s.teacher_name))].sort();
    setTeacherNames(uniqueNames);
    setMonthSessionsForMerge(monthSessions);
    setShowMergeModal(true);
  };


  const generateAllTeachersPDF = async (group, teacherStats, branchName) => {
    setIsGeneratingPDF(true);
    setPdfProgress(0);
    setPdfStatus('جاري تحضير التقارير...');

    // Generate PDF for each teacher sequentially
    const totalTeachers = teacherStats.length;
    for (let i = 0; i < teacherStats.length; i++) {
      const stat = teacherStats[i];
      const teacherSessions = group.sessions.filter(s => s.teacher_name === stat.teacher_name);
      if (teacherSessions.length > 0) {
        setPdfProgress(Math.round((i / totalTeachers) * 80));
        setPdfStatus(`جاري إنشاء تقرير ${i + 1} من ${totalTeachers}: ${stat.teacher_name}`);

        // Call generateTeacherPDF without showing modal (we handle it here)
        await generateTeacherPDFInternal(stat, teacherSessions, group, branchName, false);

        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setPdfProgress(100);
    setPdfStatus('تم التحميل بنجاح!');
    success(`تم تحميل ${teacherStats.length} ملف PDF للمدرسين`);

    // Close modal after 1 second
    setTimeout(() => {
      setIsGeneratingPDF(false);
      setPdfProgress(0);
      setPdfStatus('');
    }, 1000);
  };

  const generateTeacherPDFInternal = async (teacherStat, teacherSessions, group, branchName, showModal = true) => {
    if (showModal) {
      setIsGeneratingPDF(true);
      setPdfProgress(0);
      setPdfStatus('جاري إعداد التقرير...');
    }

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
            <span>${session.duration_hours} - ${session.duration_text}</span>
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

    if (showModal) {
      setPdfProgress(20);
      setPdfStatus('جاري تحضير المحتوى...');
    }

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      if (showModal) {
        setPdfProgress(40);
        setPdfStatus('جاري تحويل المحتوى إلى صورة...');
      }

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

      if (showModal) {
        setPdfProgress(60);
        setPdfStatus('جاري إنشاء ملف PDF...');
      }

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      if (showModal) {
        setPdfProgress(75);
      }

      // Add additional pages if needed with top margin
      while (heightLeft > 0) {
        position = heightLeft - imgHeight - topMargin; // Add top margin for new pages
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - topMargin); // Account for margin in remaining height
      }

      if (showModal) {
        setPdfProgress(90);
        setPdfStatus('جاري حفظ الملف...');
      }

      // Save PDF with teacher name and month
      const fileName = `تقرير_${teacherStat.teacher_name.replace(/\s/g, "_")}_${group.monthName}_${group.year}.pdf`;
      pdf.save(fileName);

      if (showModal) {
        setPdfProgress(100);
        setPdfStatus('تم التحميل بنجاح!');

        // Close modal after 1 second
        setTimeout(() => {
          setIsGeneratingPDF(false);
          setPdfProgress(0);
          setPdfStatus('');
        }, 1000);
      }

      console.log('Teacher PDF generated successfully');
    } catch (err) {
      console.error('Error generating teacher PDF:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
      if (showModal) {
        setIsGeneratingPDF(false);
        setPdfProgress(0);
        setPdfStatus('');
      }
    } finally {
      // Clean up
      if (document.body.contains(printContent)) {
        document.body.removeChild(printContent);
      }
    }
  };

  const generateTeacherPDF = async (teacherStat, teacherSessions, group, branchName) => {
    await generateTeacherPDFInternal(teacherStat, teacherSessions, group, branchName, true);
  };

  const generateComprehensiveMonthlyReport = async () => {
    if (!selectedYear || !selectedMonth) {
      showError("يرجى تحديد السنة والشهر أولاً");
      return;
    }

    setIsGeneratingPDF(true);
    setPdfProgress(0);
    setPdfStatus('جاري إعداد التقرير الشامل...');

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

      // pdfmake-rtl has built-in RTL support, no need for additional setup

      // Get all sessions for the selected month and year
      const filteredSessions = filterSessionsByYearAndMonth(sessions);

      // Remove duplicates from sessions before processing
      const uniqueMonthSessions = [];
      const seenSessionIds = new Set();
      filteredSessions.forEach(session => {
        if (session.id && !seenSessionIds.has(session.id)) {
          seenSessionIds.add(session.id);
          uniqueMonthSessions.push(session);
        }
      });

      if (uniqueMonthSessions.length === 0) {
        showError("لا توجد جلسات في الشهر والسنة المحددين");
        setIsGeneratingPDF(false);
        setPdfProgress(0);
        setPdfStatus('');
        return;
      }

      setPdfProgress(10);

      // Group sessions by branch
      const allBranchGroups = groupSessionsByBranchAndMonth(uniqueMonthSessions);

      // Filter branch groups to only include those with sessions in the selected month
      // and remove duplicate branches
      const branchGroups = [];
      const seenBranchIds = new Set();
      allBranchGroups.forEach(branchGroup => {
        // Check if this branch has sessions in the selected month
        const hasSessionsInMonth = branchGroup.months.some(month =>
          month.year === selectedYear && month.month === selectedMonth && month.sessions.length > 0
        );

        // Only add if has sessions and not already seen
        if (hasSessionsInMonth && !seenBranchIds.has(branchGroup.branchId)) {
          seenBranchIds.add(branchGroup.branchId);
          branchGroups.push(branchGroup);
        }
      });

      const monthKey = `${selectedYear}-${selectedMonth}`;
      const monthName = monthNames[selectedMonth];

      // Get expenses for the month
      const monthExpenses = expenses[monthKey] || [];

      // Calculate overall statistics
      let totalInternal = 0;
      let totalExternal = 0;
      let totalExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      let totalSessions = 0;
      let totalHours = 0;

      uniqueMonthSessions.forEach(session => {
        const amount = parseFloat(session.calculated_amount || 0);
        totalSessions++;
        totalHours += parseFloat(session.duration_hours || 0);
        if (session.location === "external") {
          totalExternal += amount;
        } else {
          totalInternal += amount;
        }
      });

      const grandTotal = totalInternal + totalExternal + totalExpenses;

      setPdfProgress(20);
      setPdfStatus('جاري بناء محتوى التقرير...');

      let docDefinition;

      // Special handling for Operation Managers:
      // They should see the "Branch Report" layout even when clicking "Comprehensive".
      // This gives them the detailed view for their single branch instead of a summary table.
      if (userInfo && userInfo.is_operation_manager && !userInfo.is_super_admin && !userInfo.is_backdoor) {
        if (branchGroups.length === 0) {
          throw new Error("لا توجد بيانات للفرع الحالي");
        }

        const branchGroup = branchGroups[0];
        // Find the specific month data within the branch group
        const monthGroup = branchGroup.months.find(m => m.year === selectedYear && m.month === selectedMonth);

        if (!monthGroup) {
          throw new Error("لا توجد بيانات لهذا الشهر");
        }

        docDefinition = buildBranchMonthlyReportPDF(
          monthGroup.sessions,
          branchGroup.branchName,
          selectedYear,
          selectedMonth,
          monthName,
          monthExpenses,
          calculateTeacherStats,
          calculateTotals,
          convertTo12Hour
        );
      } else {
        // Standard Comprehensive Report (Multi-Branch Summary) for Admins
        docDefinition = buildComprehensiveMonthlyReportPDF(
          uniqueMonthSessions,
          branchGroups,
          selectedYear,
          selectedMonth,
          monthName,
          monthExpenses,
          expenses,
          calculateTeacherStats,
          calculateTotals,
          convertTo12Hour
        );
      }

      setPdfProgress(50);
      setPdfStatus('جاري إنشاء ملف PDF...');

      // Generate and download PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);

      setPdfProgress(80);
      setPdfStatus('جاري حفظ الملف...');

      const fileName = `تقرير_شامل_${monthName}_${selectedYear}.pdf`;
      pdfDoc.download(fileName);

      setPdfProgress(100);
      setPdfStatus('تم التحميل بنجاح!');

      console.log('Comprehensive monthly report generated successfully');

      // Close modal after 1 second
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfProgress(0);
        setPdfStatus('');
      }, 1000);
    } catch (err) {
      console.error('Error generating comprehensive report:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
      setIsGeneratingPDF(false);
      setPdfProgress(0);
      setPdfStatus('');
    }
  };

  const generatePDF = async (group, monthExpenses, teacherStats, totals, branchName) => {
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

      setPdfProgress(10);
      setPdfStatus('جاري بناء محتوى التقرير...');

      // Build PDF document definition using pdfmake
      const docDefinition = buildBranchMonthlyReportPDF(
        group.sessions,
        branchName,
        group.year,
        group.month,
        group.monthName,
        monthExpenses,
        calculateTeacherStats,
        calculateTotals,
        convertTo12Hour
      );

      setPdfProgress(50);
      setPdfStatus('جاري إنشاء ملف PDF...');

      // Generate and download PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);

      setPdfProgress(80);
      setPdfStatus('جاري حفظ الملف...');

      const fileName = `تقرير_${group.monthName}_${group.year}_${branchName.replace(/\s/g, "_")}.pdf`;
      pdfDoc.download(fileName);

      setPdfProgress(100);
      setPdfStatus('تم التحميل بنجاح!');

      console.log('Branch monthly report generated successfully');

      // Close modal after 1 second
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfProgress(0);
        setPdfStatus('');
      }, 1000);
    } catch (err) {
      console.error('Error generating branch report:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
      setIsGeneratingPDF(false);
      setPdfProgress(0);
      setPdfStatus('');
    }
  };

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

  // منع مدير المبيعات من الوصول إلى هذه الصفحة
  if (userInfo && userInfo.is_sales_manager && !userInfo.is_backdoor) {
    return (
      <>
        <div className="container">
          <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container">
        {loading && (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#6B7280", fontSize: "14px" }}>جاري التحميل...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-error">
            <p style={{ margin: "0 0 0.75rem 0" }}>
              <strong>خطأ:</strong> {error}
            </p>
            <button className="btn" onClick={loadSessions}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#6B7280", fontSize: "14px" }}>
              لا توجد جلسات موافق عليها للعرض
            </p>
          </div>
        )}

        {!loading && !error && (() => {
          const filteredSessions = filterSessionsByYearAndMonth(sessions);
          const { years, months } = getAvailableYearsAndMonths(sessions);
          const filteredBranchGroups = groupSessionsByBranchAndMonth(filteredSessions);

          if (filteredBranchGroups.length === 0) {
            return (
              <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
                <p style={{ color: "#6B7280", fontSize: "14px" }}>
                  لا توجد جلسات متطابقة مع الفلاتر المحددة
                </p>
              </div>
            );
          }

          return (
            <div>
              {/* Header Controls */}
              <div className="filters-bar">
                <h3 style={{ margin: 0 }}>الجلسات الموافق عليها ({filteredSessions.length})</h3>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginRight: "auto" }}>
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
                  <select
                    value={selectedMonth || ""}
                    onChange={(e) => {
                      const month = e.target.value ? parseInt(e.target.value) : null;
                      setSelectedMonth(month);
                    }}
                    style={{ minWidth: "140px" }}
                  >
                    <option value="">جميع الأشهر</option>
                    {months.map(month => (
                      <option key={month} value={month}>{monthNames[month]}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear || ""}
                    onChange={(e) => {
                      const year = e.target.value ? parseInt(e.target.value) : null;
                      setSelectedYear(year);
                    }}
                    style={{ minWidth: "120px" }}
                  >
                    <option value="">جميع السنوات</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {selectedYear && selectedMonth && (
                    <button
                      className="btn primary"
                      onClick={generateComprehensiveMonthlyReport}
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                      title="تحميل تقرير شامل لكل الفروع"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      تقرير شامل للشهر
                    </button>
                  )}
                  {(selectedYear || selectedMonth || selectedBranchId) && (
                    <button
                      className="btn"
                      onClick={() => {
                        setSelectedYear(null);
                        setSelectedMonth(null);
                        setSelectedBranchId(null);
                      }}
                      style={{ backgroundColor: "#DC2626", color: "white", border: "none" }}
                    >
                      إزالة الفلاتر
                    </button>
                  )}
                </div>
              </div>

              {filteredBranchGroups.map((branchGroup) => (
                <div key={branchGroup.branchId} style={{ marginBottom: "2rem" }}>
                  <h2 style={{
                    color: "#2B2A2A",
                    marginBottom: "1rem",
                    fontSize: "18px",
                    fontWeight: 600
                  }}>
                    {branchGroup.branchName}
                  </h2>

                  {branchGroup.months.map((group) => {
                    const branchMonthKey = `${branchGroup.branchId}-${group.year}-${group.month}`;
                    const monthYearKey = `${group.year}-${group.month}`;
                    const isExpanded = expandedMonth === branchMonthKey;
                    // Diagnostic log for render
                    if (isExpanded) console.log("[Render] Month Group Expanded:", branchMonthKey);
                    // Filter expenses for this specific branch only
                    const allMonthExpenses = expenses[monthYearKey] || [];
                    const monthExpenses = allMonthExpenses.filter(e => e.branch_id === branchGroup.branchId);
                    const teacherStats = calculateTeacherStats(group.sessions);
                    const totals = calculateTotals(group.sessions, monthExpenses);

                    return (
                      <div
                        key={branchMonthKey}
                        className="panel"
                        style={{
                          marginBottom: "1.5rem"
                        }}
                      >
                        {/* Month Header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            padding: "1rem",
                            backgroundColor: "#F9FAFB",
                            borderRadius: "6px",
                            marginBottom: isExpanded ? "1rem" : "0",
                            border: "1px solid #E5E7EB"
                          }}
                          onClick={() => toggleMonth(branchGroup.branchId, group.year, group.month)}
                        >
                          <h3 style={{ margin: 0, color: "#2B2A2A", fontSize: "16px", fontWeight: 600 }}>
                            {group.monthName} {group.year}
                          </h3>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <button
                              className="btn btn-small primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                generatePDF(group, monthExpenses, teacherStats, totals, branchGroup.branchName);
                              }}
                              title="تحميل PDF"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              PDF
                            </button>
                            <span style={{ color: "#6B7280", fontSize: "13px" }}>
                              عدد الجلسات: <strong>{group.sessions.length}</strong>
                            </span>
                            <span style={{ color: "#5A7ACD", fontWeight: 600, fontSize: "14px" }}>
                              الإجمالي: {totals.grandTotal.toFixed(2)} درهم
                            </span>
                            <span style={{ fontSize: "14px", color: "#6B7280" }}>
                              {isExpanded ? "▼" : "▶"}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div data-month-key={branchMonthKey}>
                            {/* Statistics Cards */}
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                              gap: "1rem",
                              marginBottom: "1.5rem"
                            }}>
                              <div className="branch-card" style={{ cursor: "default" }}>
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <div style={{ color: "#6B7280", fontSize: "12px", marginBottom: "0.25rem" }}>الإجمالي الداخلي</div>
                                  <div style={{ fontSize: "20px", fontWeight: 600, color: "#5A7ACD" }}>
                                    {totals.internalTotal.toFixed(2)} درهم
                                  </div>
                                </div>
                              </div>
                              <div className="branch-card" style={{ cursor: "default" }}>
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <div style={{ color: "#6B7280", fontSize: "12px", marginBottom: "0.25rem" }}>الإجمالي الخارجي</div>
                                  <div style={{ fontSize: "20px", fontWeight: 600, color: "#FEB05D" }}>
                                    {totals.externalTotal.toFixed(2)} درهم
                                  </div>
                                </div>
                              </div>
                              <div className="branch-card" style={{ cursor: "default" }}>
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <div style={{ color: "#6B7280", fontSize: "12px", marginBottom: "0.25rem" }}>إجمالي المصاريف</div>
                                  <div style={{ fontSize: "20px", fontWeight: 600, color: "#DC2626" }}>
                                    {totals.expensesTotal.toFixed(2)} درهم
                                  </div>
                                </div>
                              </div>
                              <div className="branch-card" style={{ cursor: "default" }}>
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <div style={{ color: "#6B7280", fontSize: "12px", marginBottom: "0.25rem" }}>الإجمالي الكامل</div>
                                  <div style={{ fontSize: "20px", fontWeight: 600, color: "#10B981" }}>
                                    {totals.grandTotal.toFixed(2)} درهم
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Teacher Statistics */}
                            <div style={{ marginBottom: "1.5rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                                <h4 style={{ color: "#2B2A2A", margin: 0, fontSize: "16px", fontWeight: 600 }}>إحصائيات المدرسين</h4>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                                  <button
                                    className="btn btn-small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenMergeModalForMonth(group.sessions);
                                    }}
                                    title="دمج أسماء المدرسين في هذا الشهر"
                                    style={{ backgroundColor: "#10B981", color: "white", border: "none" }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17 3a2.828 2.828 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                    دمج الأسماء
                                  </button>
                                  <button
                                    className="btn btn-small primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateAllTeachersPDF(group, teacherStats, branchGroup.branchName);
                                    }}
                                    title="تحميل PDF لكل المدرسين"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="7 10 12 15 17 10"></polyline>
                                      <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    تحميل PDF لكل المدرسين
                                  </button>
                                </div>
                              </div>
                              <div className="table-container">
                                <table>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: "center" }}>اسم المدرس</th>
                                      <th style={{ textAlign: "center" }} data-type="number">عدد الساعات</th>
                                      <th style={{ textAlign: "center" }} data-type="number">الإجمالي</th>
                                      <th style={{ textAlign: "center" }}>داخلي/خارجي</th>
                                      <th style={{ textAlign: "center" }}>PDF</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {teacherStats.map((stat, idx) => (
                                      <tr key={idx}>
                                        <td style={{ textAlign: "center" }}>{stat.teacher_name}</td>
                                        <td style={{ textAlign: "center" }} data-type="number">{stat.total_hours.toFixed(2)}</td>
                                        <td style={{ textAlign: "center" }} data-type="number">{stat.total_amount.toFixed(2)} درهم</td>
                                        <td style={{ textAlign: "center" }}>
                                          <span className={`status ${stat.location === "external" ? "status-pending" : "status-active"}`}>
                                            {stat.location === "external" ? "خارجي" : "داخلي"}
                                          </span>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                          <button
                                            className="btn btn-small primary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const teacherSessions = group.sessions.filter(s => s.teacher_name === stat.teacher_name);
                                              generateTeacherPDF(stat, teacherSessions, group, branchGroup.branchName);
                                            }}
                                            title={`تحميل PDF لـ ${stat.teacher_name}`}
                                          >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                              <polyline points="7 10 12 15 17 10"></polyline>
                                              <line x1="12" y1="15" x2="12" y2="3"></line>
                                            </svg>
                                            PDF
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Add Expense Button */}
                            <div style={{ marginBottom: "1rem" }}>
                              {!showExpenseForm[branchMonthKey] ? (
                                <button
                                  className="btn primary"
                                  onClick={() => setShowExpenseForm(prev => ({ ...prev, [branchMonthKey]: true }))}
                                >
                                  + إضافة مصروف إضافي
                                </button>
                              ) : (
                                <div className="panel">
                                  <h5 style={{ marginBottom: "0.75rem", fontSize: "14px", fontWeight: 600 }}>إضافة مصروف إضافي</h5>
                                  <form onSubmit={(e) => handleAddExpense(group.year, group.month, branchGroup.branchId, e)}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                      <input
                                        type="text"
                                        placeholder="اسم المدرس"
                                        value={expenseForm.teacher_name}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, teacher_name: e.target.value }))}
                                        className="form-group input"
                                        style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                                      />
                                      <input
                                        type="text"
                                        placeholder="السبب"
                                        value={expenseForm.title}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                                        required
                                        className="form-group input"
                                        style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                                      />
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="المبلغ"
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                                        required
                                        className="form-group input"
                                        style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                                      />
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                      <button type="submit" className="btn primary">
                                        إضافة
                                      </button>
                                      <button
                                        type="button"
                                        className="btn"
                                        onClick={() => {
                                          setShowExpenseForm(prev => ({ ...prev, [branchMonthKey]: false }));
                                          setExpenseForm({ title: "", amount: "", branch_id: branches[0]?.id || "", teacher_name: "" });
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
                              <div style={{ marginBottom: "1.5rem" }}>
                                <h4 style={{ color: "#2B2A2A", marginBottom: "0.75rem", fontSize: "16px", fontWeight: 600 }}>
                                  المصاريف الإضافية ({monthExpenses.length})
                                </h4>
                                <div className="table-container">
                                  <table>
                                    <thead>
                                      <tr>
                                        <th style={{ textAlign: "center" }}>اسم الفرع</th>
                                        <th style={{ textAlign: "center" }}>اسم المدرس</th>
                                        <th style={{ textAlign: "center" }}>السبب</th>
                                        <th style={{ textAlign: "center" }} data-type="number">المبلغ</th>
                                        <th style={{ textAlign: "center" }}>الإجراءات</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {monthExpenses.map((expense) => (
                                        <tr key={expense.id}>
                                          <td style={{ textAlign: "center" }}>{getBranchName(expense.branch_id)}</td>
                                          <td style={{ textAlign: "center" }}>{expense.teacher_name || "-"}</td>
                                          <td style={{ textAlign: "center" }}>{expense.title}</td>
                                          <td data-type="number" style={{ textAlign: "center", fontWeight: 600, color: "#DC2626" }}>
                                            {parseFloat(expense.amount || 0).toFixed(2)} درهم
                                          </td>
                                          <td style={{ textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                                              <button
                                                className="btn btn-small"
                                                onClick={() => handleEditExpense(expense)}
                                                style={{
                                                  padding: "0.25rem 0.5rem",
                                                  backgroundColor: "#FEB05D",
                                                  color: "white",
                                                  border: "none"
                                                }}
                                                title="تعديل"
                                              >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                                </svg>
                                              </button>
                                              <button
                                                className="btn btn-small btn-danger"
                                                onClick={() => handleDeleteExpense(expense)}
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
                            )}

                            {/* Sessions Table */}
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                                <h4 style={{ color: "#2B2A2A", margin: 0, fontSize: "16px", fontWeight: 600 }}>
                                  الجلسات ({group.sessions.filter(s => {
                                    const selected = selectedTeachersPerMonth[branchMonthKey] || [];
                                    return selected.length === 0 || selected.includes(s.teacher_name);
                                  }).length})
                                </h4>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                  <span style={{ fontSize: "13px", color: "#6B7280" }}>فلتر المدرسين:</span>
                                  <MultiSelect
                                    placeholder="جميع المدرسين"
                                    options={teacherStats.map(stat => ({ label: stat.teacher_name, value: stat.teacher_name }))}
                                    selectedValues={selectedTeachersPerMonth[branchMonthKey] || []}
                                    onChange={(vals) => {
                                      setSelectedTeachersPerMonth(prev => ({
                                        ...prev,
                                        [branchMonthKey]: vals
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="table-container" style={{ overflowX: "auto" }}>
                                <table>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: "center" }}>الفرع</th>
                                      <th style={{ textAlign: "center" }}>المدرس</th>
                                      <th style={{ textAlign: "center" }}>الطالب</th>
                                      <th style={{ textAlign: "center" }}>تاريخ الجلسة</th>
                                      <th style={{ textAlign: "center" }}>من الساعة</th>
                                      <th style={{ textAlign: "center" }}>إلى الساعة</th>
                                      <th style={{ textAlign: "center" }}>المدة</th>
                                      <th style={{ textAlign: "center" }}>رقم العقد</th>
                                      <th style={{ textAlign: "center" }} data-type="number">سعر الساعة</th>
                                      <th style={{ textAlign: "center" }} data-type="number">الإجمالي</th>
                                      <th style={{ textAlign: "center" }}>داخلي/خارجي</th>
                                      <th style={{ textAlign: "center" }}>الإجراءات</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.sessions
                                      .filter(session => {
                                        const selected = selectedTeachersPerMonth[branchMonthKey] || [];
                                        return selected.length === 0 || selected.includes(session.teacher_name);
                                      })
                                      .map((session) => (
                                        <tr key={session.id}>
                                          <td style={{ textAlign: "center" }}>{getBranchName(session.branch_id)}</td>
                                          <td style={{ textAlign: "center" }}>{session.teacher_name}</td>
                                          <td style={{ textAlign: "center" }}>{session.student_name}</td>
                                          <td style={{ textAlign: "center" }}>{session.session_date}</td>
                                          <td style={{ textAlign: "center" }}>{convertTo12Hour(session.start_time)}</td>
                                          <td style={{ textAlign: "center" }}>{convertTo12Hour(session.end_time)}</td>
                                          <td style={{ textAlign: "center" }}>{session.duration_hours} - {session.duration_text}</td>
                                          <td style={{ textAlign: "center", fontWeight: 600, color: "#5A7ACD" }}>{session.contract_number}</td>
                                          <td data-type="number" style={{ textAlign: "center" }}>{parseFloat(session.hourly_rate || 0).toFixed(2)} درهم</td>
                                          <td data-type="number" style={{ textAlign: "center", fontWeight: 600, color: "#10B981" }}>
                                            {parseFloat(session.calculated_amount || 0).toFixed(2)} درهم
                                          </td>
                                          <td style={{ textAlign: "center" }}>
                                            <span className={`status ${session.location === "external" ? "status-pending" : "status-active"}`}>
                                              {session.location === "external" ? "خارجي" : "داخلي"}
                                            </span>
                                          </td>
                                          <td style={{ textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                                              <button
                                                className="btn btn-small"
                                                onClick={() => handleEdit(session)}
                                                style={{
                                                  padding: "0.25rem 0.5rem",
                                                  backgroundColor: "#FEB05D",
                                                  color: "white",
                                                  border: "none"
                                                }}
                                                title="تعديل"
                                              >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                                </svg>
                                              </button>
                                              <button
                                                className="btn btn-small btn-danger"
                                                onClick={() => handleDelete(session.id)}
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
          );
        })()}
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
              <div className="modal-body" style={{ padding: "1.5rem" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "1.25rem",
                  alignItems: "start"
                }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>اسم المدرس</label>
                    <input
                      placeholder="اسم المدرس"
                      value={editForm.teacher_name}
                      onChange={(e) => setEditForm({ ...editForm, teacher_name: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>اسم الطالب</label>
                    <input
                      placeholder="اسم الطالب"
                      value={editForm.student_name}
                      onChange={(e) => setEditForm({ ...editForm, student_name: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>تاريخ الجلسة</label>
                    <input
                      type="date"
                      value={editForm.session_date}
                      onChange={(e) => setEditForm({ ...editForm, session_date: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>الوقت (من - إلى)</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="time"
                        value={editForm.start_time}
                        onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                        style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem", flex: 1 }}
                      />
                      <input
                        type="time"
                        value={editForm.end_time}
                        onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                        style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem", flex: 1 }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>عدد الساعات</label>
                    <input
                      type="number"
                      step="0.25"
                      placeholder="عدد الساعات"
                      value={editForm.duration_hours}
                      onChange={(e) => setEditForm({ ...editForm, duration_hours: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>المدة (نص)</label>
                    <input
                      placeholder="نص المدة (مثال: ساعتان)"
                      value={editForm.duration_text}
                      onChange={(e) => setEditForm({ ...editForm, duration_text: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>رقم العقد</label>
                    <input
                      placeholder="رقم العقد"
                      value={editForm.contract_number}
                      onChange={(e) => setEditForm({ ...editForm, contract_number: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>سعر الساعة</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="سعر الساعة"
                      value={editForm.hourly_rate}
                      onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>الموقع</label>
                    <select
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      style={{ padding: "0.6rem 0.8rem", width: "100%", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.95rem" }}
                    >
                      <option value="internal">داخلي</option>
                      <option value="external">خارجي</option>
                    </select>
                  </div>
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
                  اختر الاسم القديم الذي تريد دمجه مع اسم جديد موحد. سيتم تحديث <strong>الجلسات في هذا الشهر فقط</strong>.
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
                  setMonthSessionsForMerge([]);
                }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Edit Modal */}
      {showExpenseEditModal && editingExpense && (
        <div className="modal-overlay" onClick={() => setShowExpenseEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1rem" }}>تعديل المصروف</h3>
              <button className="modal-close" onClick={() => setShowExpenseEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateExpense}>
              <div className="modal-body" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>اسم المدرس</label>
                    <input
                      type="text"
                      placeholder="اسم المدرس (اختياري)"
                      value={expenseEditForm.teacher_name}
                      onChange={(e) => setExpenseEditForm({ ...expenseEditForm, teacher_name: e.target.value })}
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>السبب</label>
                    <input
                      type="text"
                      placeholder="السبب"
                      value={expenseEditForm.title}
                      onChange={(e) => setExpenseEditForm({ ...expenseEditForm, title: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>المبلغ</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="المبلغ"
                      value={expenseEditForm.amount}
                      onChange={(e) => setExpenseEditForm({ ...expenseEditForm, amount: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn primary" type="submit">تحديث</button>
                <button className="btn" type="button" onClick={() => setShowExpenseEditModal(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Generation Progress Modal */}
      {isGeneratingPDF && (
        <div className="modal-overlay" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className="modal-content" style={{
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                margin: '0 auto 1rem',
                border: '4px solid #E5E7EB',
                borderTop: '4px solid #5A7ACD',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2B2A2A', margin: '0 0 0.5rem 0' }}>
                جاري إنشاء التقرير
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>
                {pdfStatus || 'يرجى الانتظار...'}
              </p>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#E5E7EB',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: `${pdfProgress}%`,
                height: '100%',
                backgroundColor: '#5A7ACD',
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }}></div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0, fontWeight: 600 }}>
              {pdfProgress}%
            </p>
          </div>
        </div>
      )}
    </>
  );
}
