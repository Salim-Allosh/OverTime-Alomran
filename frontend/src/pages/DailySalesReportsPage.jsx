import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import pdfMake from "pdfmake-rtl/build/pdfmake";
import { vfs } from "../fonts/vfs_fonts_custom";

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};

export default function DailySalesReportsPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [reports, setReports] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allBranches, setAllBranches] = useState([]); // For dropdowns requiring all branches (e.g. Joint Contract)
  const [salesStaff, setSalesStaff] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("reports"); // "reports" or "contracts"
  const [showForm, setShowForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedContractBranchId, setSelectedContractBranchId] = useState(null);
  const [form, setForm] = useState({
    branch_id: "",
    sales_staff_id: "",
    report_date: "",
    number_of_deals: "0",
    daily_calls: "0",
    hot_calls: "0",
    walk_ins: "0",
    branch_leads: "0",
    online_leads: "0",
    extra_leads: "0",
    number_of_visits: "0",
    notes: "",
    visits: []
  });
  const [contractForm, setContractForm] = useState({
    branch_id: "",
    student_name: "",
    contract_number: "",
    sales_staff_id: "",
    contract_type: "new", // new, shared, old_payment
    shared_branch_id: "",
    shared_sales_staff_id: "",
    shared_amount: "",
    parent_contract_id: null,
    search_contract_number: "",
    search_student_name: "",
    searched_contracts: [],
    total_amount: "",
    payment_amount: "", // للتوافق مع البيانات القديمة
    payment_method_id: "", // للتوافق مع البيانات القديمة
    payment_number: "", // للتوافق مع البيانات القديمة
    payments: [], // الدفعات المتعددة [{ payment_amount, payment_method_id, payment_number }]
    course_id: "",
    client_phone: "",
    registration_source: "",
    contract_date: "", // تاريخ العقد
    notes: ""
  });
  const [courses, setCourses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedSalesStaffId, setSelectedSalesStaffId] = useState(null);
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [expandedContractMonth, setExpandedContractMonth] = useState(null);
  const [selectedContractYear, setSelectedContractYear] = useState(null);
  const [selectedContractMonth, setSelectedContractMonth] = useState(null);
  const [selectedContractSalesStaffId, setSelectedContractSalesStaffId] = useState(null);
  const [contractSearchQuery, setContractSearchQuery] = useState("");

  useEffect(() => {
    if (!token) return;

    apiGet("/auth/me", token)
      .then((userData) => {
        setUserInfo(userData);
        // تعيين فرع مدير المبيعات تلقائياً
        if (userData && userData.is_sales_manager && !userData.is_super_admin && !userData.is_backdoor && userData.branch_id) {
          setSelectedBranchId(userData.branch_id);
          setSelectedContractBranchId(userData.branch_id);
          // تحميل موظفي المبيعات لفرع مدير المبيعات
          loadSalesStaff(userData.branch_id);
        } else {
          loadSalesStaff();
        }
      })
      .catch(console.error);

    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);

    // Fetch ALL branches for dropdowns (Shared Contract) regardless of user role
    apiGet("/branches?lookup=true", token)
      .then(setAllBranches)
      .catch(console.error);

    apiGet("/courses", token)
      .then(setCourses)
      .catch(console.error);

    apiGet("/payment-methods", token)
      .then(setPaymentMethods)
      .catch(console.error);

    // تحميل التقارير دائماً لعرضها في البطاقة اليومية
    loadReports();
    // تحميل العقود دائماً لعرضها في البطاقة اليومية
    loadContracts();
  }, [token, selectedYear, selectedMonth, activeTab]);

  // تحميل التقارير عند تغيير selectedBranchId
  useEffect(() => {
    if (!token) return;
    if (activeTab === "reports") {
      loadReports();
    }
  }, [selectedBranchId, selectedYear, selectedMonth, selectedSalesStaffId]);

  // Scroll to expanded month when it changes or data updates
  useEffect(() => {
    if (expandedMonth && activeTab === "reports") {
      console.log("[Scroll] Effect triggered for Reports. expandedMonth:", expandedMonth);
      setTimeout(() => {
        const element = document.querySelector(`[data-month-key="${expandedMonth}"]`);
        console.log("[Scroll] Looking for element with key:", expandedMonth, "Found:", !!element);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    }
  }, [expandedMonth, reports, activeTab]);

  useEffect(() => {
    if (expandedContractMonth && activeTab === "contracts") {
      console.log("[Scroll] Effect triggered for Contracts. expandedContractMonth:", expandedContractMonth);
      setTimeout(() => {
        const element = document.querySelector(`[data-month-key="${expandedContractMonth}"]`);
        console.log("[Scroll] Looking for element with key:", expandedContractMonth, "Found:", !!element);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    }
  }, [expandedContractMonth, contracts, activeTab]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "contracts") {
      loadContracts();
    }
  }, [selectedContractBranchId, selectedContractYear, selectedContractMonth, selectedContractSalesStaffId]);

  const loadSalesStaff = async (branchId = null) => {
    try {
      let url = "/sales-staff?include_trashed=true";
      if (branchId) {
        url += `&branch_id=${branchId}`;
      } else if (userInfo && userInfo.is_sales_manager && !userInfo.is_super_admin && !userInfo.is_backdoor && userInfo.branch_id) {
        // إذا كان مدير مبيعات، فلتر حسب فرعه
        url += `&branch_id=${userInfo.branch_id}`;
      }
      const data = await apiGet(url, token);
      setSalesStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading sales staff:", err);
      setSalesStaff([]);
    }
  };

  const loadReports = async () => {
    try {
      let url = "/daily-sales-reports";
      const params = [];
      if (selectedBranchId) params.push(`branch_id=${selectedBranchId}`);
      if (params.length > 0) url += "?" + params.join("&");

      const data = await apiGet(url, token);
      console.log("[DailySalesReports] Loaded reports:", data);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading reports:", err);
      setReports([]);
    }
  };

  // Filter reports by year, month, and sales staff
  const filterReportsByYearAndMonth = (reportsList) => {
    let filtered = reportsList;

    // Filter by sales staff
    if (selectedSalesStaffId) {
      filtered = filtered.filter(report => report.sales_staff_id === selectedSalesStaffId);
    }

    // Filter by year and month
    if (!selectedYear && !selectedMonth) {
      return filtered;
    }

    filtered = filtered.filter(report => {
      if (!report.report_date) return false;
      const reportDate = new Date(report.report_date);
      if (isNaN(reportDate.getTime())) return false;

      const year = reportDate.getFullYear();
      const month = reportDate.getMonth() + 1;

      if (selectedYear && selectedMonth) {
        return year === selectedYear && month === selectedMonth;
      } else if (selectedYear) {
        return year === selectedYear;
      } else if (selectedMonth) {
        return month === selectedMonth;
      }
      return true;
    });

    console.log("[DailySalesReports] Filtering reports:", {
      total: reportsList.length,
      filtered: filtered.length,
      selectedYear,
      selectedMonth,
      selectedSalesStaffId
    });

    return filtered;
  };

  // Get available years and months from reports
  const getAvailableYearsAndMonths = (reportsList) => {
    const yearsSet = new Set();
    const monthsSet = new Set();

    reportsList.forEach(report => {
      const reportDate = new Date(report.report_date);
      const year = reportDate.getFullYear();
      const month = reportDate.getMonth() + 1;
      yearsSet.add(year);
      monthsSet.add(month);
    });

    return {
      years: Array.from(yearsSet).sort((a, b) => b - a),
      months: Array.from(monthsSet).sort((a, b) => a - b)
    };
  };

  // Group reports by branch and month
  const groupReportsByBranchAndMonth = (reportsList) => {
    const grouped = {};

    reportsList.forEach(report => {
      const branchId = report.branch_id;
      if (!grouped[branchId]) {
        grouped[branchId] = {};
      }

      const reportDate = new Date(report.report_date);
      const year = reportDate.getFullYear();
      const month = reportDate.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!grouped[branchId][key]) {
        grouped[branchId][key] = {
          year,
          month,
          monthName: monthNames[month],
          reports: []
        };
      }

      grouped[branchId][key].reports.push(report);
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

  const toggleMonth = (branchId, year, month) => {
    const key = `${branchId}-${year}-${month}`;
    console.log("[Accordion] Toggling Month:", key, "Current expandedMonth:", expandedMonth);
    setExpandedMonth(prev => (prev === key ? null : key));
  };

  const toggleContractMonth = (branchId, year, month) => {
    const key = `${branchId}-${year}-${month}`;
    console.log("[Accordion] Toggling Contract Month:", key, "Current expandedContractMonth:", expandedContractMonth);
    setExpandedContractMonth(prev => (prev === key ? null : key));
  };

  // Filter contracts by year, month, branch, sales staff, and search query
  const filterContractsByYearAndMonth = (contractsList) => {
    let filtered = contractsList;

    // Filter by branch
    if (selectedContractBranchId) {
      filtered = filtered.filter(contract => contract.branch_id === selectedContractBranchId);
    }

    // Filter by sales staff
    if (selectedContractSalesStaffId) {
      filtered = filtered.filter(contract => contract.sales_staff_id === selectedContractSalesStaffId);
    }

    // Filter by year and month (use contract_date if available, otherwise created_at)
    if (selectedContractYear || selectedContractMonth) {
      filtered = filtered.filter(contract => {
        // استخدام contract_date إذا كان موجوداً، وإلا استخدام created_at
        const dateToUse = contract.contract_date || contract.created_at;
        if (!dateToUse) return false;
        const contractDate = new Date(dateToUse);
        if (isNaN(contractDate.getTime())) return false;

        const year = contractDate.getFullYear();
        const month = contractDate.getMonth() + 1;

        if (selectedContractYear && selectedContractMonth) {
          return year === selectedContractYear && month === selectedContractMonth;
        } else if (selectedContractYear) {
          return year === selectedContractYear;
        } else if (selectedContractMonth) {
          return month === selectedContractMonth;
        }
        return true;
      });
    }

    // Filter by search query
    if (contractSearchQuery && contractSearchQuery.trim() !== "") {
      const searchLower = contractSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(contract => {
        // Search in student name
        const studentName = (contract.student_name || "").toLowerCase();
        if (studentName.includes(searchLower)) return true;

        // Search in contract number
        const contractNumber = (contract.contract_number || "").toLowerCase();
        if (contractNumber.includes(searchLower)) return true;

        // Search in client phone
        const clientPhone = (contract.client_phone || "").toLowerCase();
        if (clientPhone.includes(searchLower)) return true;

        // Search in sales staff name
        if (contract.sales_staff_id) {
          const staff = salesStaff.find(s => s.id === contract.sales_staff_id);
          if (staff) {
            const staffName = (staff.name || "").toLowerCase();
            if (staffName.includes(searchLower)) return true;
          }
        }

        return false;
      });
    }

    return filtered;
  };

  // Get available years and months from contracts
  const getAvailableContractYearsAndMonths = (contractsList) => {
    const yearsSet = new Set();
    const monthsSet = new Set();

    contractsList.forEach(contract => {
      // استخدام contract_date إذا كان موجوداً، وإلا استخدام created_at
      const dateToUse = contract.contract_date || contract.created_at;
      if (!dateToUse) return;
      const contractDate = new Date(dateToUse);
      if (isNaN(contractDate.getTime())) return;
      const year = contractDate.getFullYear();
      const month = contractDate.getMonth() + 1;
      yearsSet.add(year);
      monthsSet.add(month);
    });

    return {
      years: Array.from(yearsSet).sort((a, b) => b - a),
      months: Array.from(monthsSet).sort((a, b) => a - b)
    };
  };

  // Group contracts by branch and month
  const groupContractsByBranchAndMonth = (contractsList) => {
    const grouped = {};

    if (!contractsList || contractsList.length === 0) {
      return [];
    }

    contractsList.forEach(contract => {
      if (!contract || !contract.branch_id) {
        console.warn("[DailySalesReports] Invalid contract:", contract);
        return;
      }

      // استخدام contract_date إذا كان موجوداً، وإلا استخدام created_at
      const dateToUse = contract.contract_date || contract.created_at;
      if (!dateToUse) {
        console.warn("[DailySalesReports] Contract has no date:", contract);
        return;
      }

      const branchId = contract.branch_id;
      if (!grouped[branchId]) {
        grouped[branchId] = {};
      }

      const contractDate = new Date(dateToUse);
      if (isNaN(contractDate.getTime())) {
        console.warn("[DailySalesReports] Invalid contract date:", dateToUse);
        return;
      }

      const year = contractDate.getFullYear();
      const month = contractDate.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!grouped[branchId][key]) {
        grouped[branchId][key] = {
          year,
          month,
          monthName: monthNames[month],
          contracts: []
        };
      }

      grouped[branchId][key].contracts.push(contract);
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

  const loadContracts = async () => {
    try {
      let url = "/contracts";
      const params = [];
      if (selectedContractBranchId) params.push(`branch_id=${selectedContractBranchId}`);
      if (params.length > 0) url += "?" + params.join("&");

      const data = await apiGet(url, token);
      console.log("[DailySalesReports] Loaded contracts:", data);
      if (Array.isArray(data) && data.length > 0) {
        console.log("[DailySalesReports] First contract sample:", JSON.stringify(data[0], null, 2));
        console.log("[DailySalesReports] First contract shared_branch_id:", data[0].shared_branch_id);
        console.log("[DailySalesReports] First contract shared_amount:", data[0].shared_amount);
      }
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading contracts:", err);
      setContracts([]);
    }
  };

  // Check if daily sales report exists for staff on the same date
  const checkDuplicateReport = async (salesStaffId, reportDate) => {
    console.log("  [checkDuplicateReport] ========== START: Duplicate Check ==========");
    try {
      console.log("  [checkDuplicateReport] Step A1: Input parameters:", {
        salesStaffId: salesStaffId,
        salesStaffIdType: typeof salesStaffId,
        reportDate: reportDate,
        reportDateType: typeof reportDate
      });

      // تحويل التاريخ إلى تنسيق YYYY-MM-DD للتأكد من التطابق
      const dateStr = typeof reportDate === 'string' ? reportDate : reportDate.split('T')[0];
      console.log("  [checkDuplicateReport] Step A2: Date string extracted:", dateStr);

      // البحث عن تقارير يومية (daily-sales-reports) في نفس التاريخ - وليس عقود
      const url = `/daily-sales-reports?date_from=${dateStr}&date_to=${dateStr}`;
      console.log("  [checkDuplicateReport] Step A3: API URL:", url);
      console.log("  [checkDuplicateReport] Step A4: Making GET request to fetch reports...");

      const data = await apiGet(url, token);

      console.log("  [checkDuplicateReport] Step A5: API response received");
      console.log("  [checkDuplicateReport] Step A5.1: Response type:", typeof data);
      console.log("  [checkDuplicateReport] Step A5.2: Is array?", Array.isArray(data));
      console.log("  [checkDuplicateReport] Step A5.3: Total reports found:", Array.isArray(data) ? data.length : "N/A (not an array)");

      if (Array.isArray(data) && data.length > 0) {
        console.log("  [checkDuplicateReport] Step A5.4: First report sample:", {
          id: data[0].id,
          sales_staff_id: data[0].sales_staff_id,
          sales_staff_id_type: typeof data[0].sales_staff_id,
          report_date: data[0].report_date,
          report_date_type: typeof data[0].report_date,
          has_daily_calls: data[0].hasOwnProperty('daily_calls'),
          has_hot_calls: data[0].hasOwnProperty('hot_calls'),
          has_walk_ins: data[0].hasOwnProperty('walk_ins')
        });
      }

      console.log("  [checkDuplicateReport] Step A6: Starting comparison loop...");
      console.log("  [checkDuplicateReport] Step A6.1: Search criteria:", {
        searchStaffId: salesStaffId,
        searchStaffIdType: typeof salesStaffId,
        searchDate: dateStr
      });

      // البحث عن تقرير يومي (daily sales report) لنفس الموظف في نفس التاريخ
      let existingReport = null;

      if (Array.isArray(data) && data.length > 0) {
        console.log("  [checkDuplicateReport] Step A6.2: Array has", data.length, "items, starting comparison...");
        existingReport = data.find((r, index) => {
          console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}: Checking report #${index + 1} (ID: ${r.id})`);

          // التأكد من أن r هو تقرير يومي وليس عقد
          if (!r.hasOwnProperty('report_date') || !r.hasOwnProperty('sales_staff_id')) {
            console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}.1: ❌ Skipping - missing report_date or sales_staff_id`);
            console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}.1: Report object keys:`, Object.keys(r));
            return false;
          }

          console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}.2: Report has required fields`);
          console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}.3: Report values:`, {
            report_sales_staff_id: r.sales_staff_id,
            report_sales_staff_id_type: typeof r.sales_staff_id,
            report_report_date: r.report_date,
            report_report_date_type: typeof r.report_date
          });

          // تحويل sales_staff_id إلى رقم للمقارنة
          const reportStaffId = typeof r.sales_staff_id === 'number' ? r.sales_staff_id : parseInt(r.sales_staff_id);
          const searchStaffId = typeof salesStaffId === 'number' ? salesStaffId : parseInt(salesStaffId);

          console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}.4: Staff ID comparison:`, {
            reportStaffId: reportStaffId,
            searchStaffId: searchStaffId,
            staffMatch: reportStaffId === searchStaffId
          });

          // مقارنة sales_staff_id و report_date
          const reportDateStr = typeof r.report_date === 'string' ? r.report_date.split('T')[0] : String(r.report_date).split('T')[0];
          const staffMatch = reportStaffId === searchStaffId;
          const dateMatch = reportDateStr === dateStr;
          const match = staffMatch && dateMatch;

          console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}.5: Date comparison:`, {
            reportDateStr: reportDateStr,
            searchDateStr: dateStr,
            dateMatch: dateMatch
          });

          console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}.6: Final match result:`, {
            staffMatch: staffMatch,
            dateMatch: dateMatch,
            overallMatch: match
          });

          if (match) {
            console.error(`  [checkDuplicateReport] Step A6.2.${index + 1}.7: ❌❌❌ MATCH FOUND! This report is a duplicate:`, r);
          } else {
            console.log(`  [checkDuplicateReport] Step A6.2.${index + 1}.7: ✅ No match - different staff or date`);
          }

          return match;
        });
      } else {
        console.log("  [checkDuplicateReport] Step A6.2: Array is empty or not an array, no reports to check");
      }

      // existingReport will be undefined if find() doesn't find anything, or null if data is not an array
      // We need to check if it's a valid object (not null and not undefined)
      // existingReport will be undefined if find() doesn't find anything, or null if data is not an array
      // We need to check if it's a valid object (not null and not undefined)
      const isDuplicate = existingReport != null; // Using != instead of !== to catch both null and undefined

      console.log("  [checkDuplicateReport] Step A7: Final result:", {
        isDuplicate: isDuplicate,
        existingReport: existingReport,
        existingReportType: typeof existingReport,
        existingReportIsNull: existingReport === null,
        existingReportIsUndefined: existingReport === undefined,
        dataLength: Array.isArray(data) ? data.length : "N/A"
      });

      if (isDuplicate) {
        console.error("  [checkDuplicateReport] ❌❌❌ DUPLICATE FOUND!");
        console.error("  [checkDuplicateReport] Duplicate report details:", existingReport);
      } else {
        console.log("  [checkDuplicateReport] ✅✅✅ NO DUPLICATE - Safe to create");
      }

      console.log("  [checkDuplicateReport] ========== END: Duplicate Check ==========");
      return isDuplicate;
    } catch (err) {
      console.error("  [checkDuplicateReport] ❌ ERROR:", err);
      console.error("  [checkDuplicateReport] Error stack:", err.stack);
      console.log("  [checkDuplicateReport] ========== END: Error in Duplicate Check ==========");
      return false;
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    console.log("=".repeat(80));
    console.log("[DailySalesReports] ========== START: Creating Daily Sales Report ==========");
    console.log("[DailySalesReports] Step 1: Form data:", {
      branch_id: form.branch_id,
      sales_staff_id: form.sales_staff_id,
      sales_staff_id_type: typeof form.sales_staff_id,
      report_date: form.report_date,
      report_date_type: typeof form.report_date,
      daily_calls: form.daily_calls,
      hot_calls: form.hot_calls,
      walk_ins: form.walk_ins
    });

    // حساب عدد الزيارات تلقائياً من form.visits
    const actualVisitsCount = form.visits ? form.visits.filter(v => v.branch_id && v.branch_id.trim() !== "").length : 0;
    console.log("[DailySalesReports] Step 2: Calculated visits count:", actualVisitsCount);

    // Check for duplicate DAILY SALES REPORT (not contract)
    if (form.sales_staff_id && form.report_date) {
      console.log("[DailySalesReports] Step 3: Starting duplicate check...");
      console.log("[DailySalesReports] Step 3.1: Input values:", {
        sales_staff_id_raw: form.sales_staff_id,
        sales_staff_id_parsed: parseInt(form.sales_staff_id),
        report_date_raw: form.report_date
      });

      const isDuplicate = await checkDuplicateReport(parseInt(form.sales_staff_id), form.report_date);

      console.log("[DailySalesReports] Step 3.2: Duplicate check result:", isDuplicate);

      if (isDuplicate) {
        console.error("[DailySalesReports] ❌ DUPLICATE FOUND - Stopping creation");
        console.error("[DailySalesReports] This means a report already exists for:");
        console.error("[DailySalesReports]   - sales_staff_id:", parseInt(form.sales_staff_id));
        console.error("[DailySalesReports]   - report_date:", form.report_date);
        showError("يوجد تقرير يومي بالفعل لهذا الموظف في نفس التاريخ");
        console.log("=".repeat(80));
        return;
      }
      console.log("[DailySalesReports] Step 3.3: ✅ No duplicate found - proceeding");
    } else {
      console.warn("[DailySalesReports] Step 3: Skipping duplicate check - missing sales_staff_id or report_date");
    }

    try {
      console.log("[DailySalesReports] Step 4: Preparing payload for API call...");
      const payload = {
        branch_id: parseInt(form.branch_id),
        sales_staff_id: parseInt(form.sales_staff_id),
        report_date: form.report_date,
        sales_amount: 0, // قيمة افتراضية
        number_of_deals: parseInt(form.number_of_deals) || 0,
        daily_calls: parseInt(form.daily_calls) || 0,
        hot_calls: parseInt(form.hot_calls) || 0,
        walk_ins: parseInt(form.walk_ins) || 0,
        branch_leads: parseInt(form.branch_leads) || 0,
        online_leads: parseInt(form.online_leads) || 0,
        extra_leads: parseInt(form.extra_leads) || 0,
        number_of_visits: actualVisitsCount, // استخدام العدد الفعلي للزيارات
        notes: form.notes || null,
        visits: form.visits.filter(v => v.branch_id && v.branch_id.trim() !== "").map((v, idx) => ({
          branch_id: parseInt(v.branch_id),
          update_details: v.update_details || null,
          visit_order: idx + 1
        }))
      };

      console.log("[DailySalesReports] Step 4.1: Payload prepared:", payload);
      console.log("[DailySalesReports] Step 4.2: Payload details:", {
        sales_staff_id: payload.sales_staff_id,
        sales_staff_id_type: typeof payload.sales_staff_id,
        report_date: payload.report_date,
        report_date_type: typeof payload.report_date,
        visits_count: payload.visits.length
      });

      console.log("[DailySalesReports] Step 5: Sending POST request to /daily-sales-reports...");
      const response = await apiPost("/daily-sales-reports", payload, token);

      console.log("[DailySalesReports] Step 6: ✅ Report created successfully:", response);
      console.log("[DailySalesReports] ========== END: Report Created Successfully ==========");
      console.log("=".repeat(80));

      success("تم إنشاء التقرير بنجاح!");
      resetForm();
      setShowForm(false);
      loadReports();
    } catch (err) {
      console.error("[DailySalesReports] ❌ ERROR in Step 5 or 6:");
      console.error("[DailySalesReports] Error message:", err.message);
      console.error("[DailySalesReports] Error details:", err);
      console.error("[DailySalesReports] ========== END: Error Occurred ==========");
      console.log("=".repeat(80));
      showError("حدث خطأ أثناء إنشاء التقرير: " + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    try {
      await apiPatch(`/daily-sales-reports/${editingReport.id}`, {
        number_of_deals: form.number_of_deals ? parseInt(form.number_of_deals) : undefined,
        daily_calls: form.daily_calls ? parseInt(form.daily_calls) : undefined,
        hot_calls: form.hot_calls ? parseInt(form.hot_calls) : undefined,
        walk_ins: form.walk_ins ? parseInt(form.walk_ins) : undefined,
        branch_leads: form.branch_leads ? parseInt(form.branch_leads) : undefined,
        online_leads: form.online_leads ? parseInt(form.online_leads) : undefined,
        extra_leads: form.extra_leads ? parseInt(form.extra_leads) : undefined,
        number_of_visits: form.number_of_visits ? parseInt(form.number_of_visits) : undefined,
        notes: form.notes || null
      }, token);
      success("تم تحديث التقرير بنجاح!");
      setShowForm(false);
      setEditingReport(null);
      loadReports();
    } catch (err) {
      showError("حدث خطأ أثناء تحديث التقرير: " + err.message);
    }
  };

  const handleDelete = async (reportId) => {
    confirm(
      "هل أنت متأكد من حذف هذا التقرير؟",
      async () => {
        try {
          await apiDelete(`/daily-sales-reports/${reportId}`, token);
          success("تم حذف التقرير بنجاح!");
          loadReports();
        } catch (err) {
          showError("حدث خطأ أثناء حذف التقرير");
        }
      }
    );
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setForm({
      branch_id: report.branch_id.toString(),
      sales_staff_id: report.sales_staff_id?.toString() || "",
      report_date: report.report_date,
      number_of_deals: report.number_of_deals.toString(),
      daily_calls: (report.daily_calls || 0).toString(),
      hot_calls: (report.hot_calls || 0).toString(),
      walk_ins: (report.walk_ins || 0).toString(),
      branch_leads: (report.branch_leads || 0).toString(),
      online_leads: (report.online_leads || 0).toString(),
      extra_leads: (report.extra_leads || 0).toString(),
      number_of_visits: (report.number_of_visits || 0).toString(),
      notes: report.notes || "",
      visits: report.visits || []
    });
    setShowForm(true);
  };

  const searchContracts = async () => {
    try {
      const params = new URLSearchParams();
      if (contractForm.search_contract_number) {
        params.append("contract_number", contractForm.search_contract_number);
      }
      if (contractForm.search_student_name) {
        params.append("student_name", contractForm.search_student_name);
      }
      const data = await apiGet(`/contracts/search?${params.toString()}`, token);
      setContractForm({ ...contractForm, searched_contracts: data || [] });
    } catch (err) {
      showError("حدث خطأ أثناء البحث: " + err.message);
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      console.log("[DailySalesReports] Creating contract with form data:", contractForm);

      // تحويل الدفعات المتعددة إلى التنسيق الصحيح
      const payments = contractForm.payments && contractForm.payments.length > 0
        ? contractForm.payments
          .filter(p => p.payment_amount && p.payment_method_id) // فقط الدفعات المكتملة
          .map(p => ({
            payment_amount: parseFloat(p.payment_amount),
            payment_method_id: parseInt(p.payment_method_id),
            payment_number: p.payment_number || null
          }))
        : null;

      console.log("[DailySalesReports] Processed payments:", payments);

      // التحقق من أن موظف المبيعات مطلوب
      if (!contractForm.sales_staff_id) {
        showError("يجب اختيار موظف المبيعات");
        return;
      }

      const payload = {
        ...contractForm,
        branch_id: parseInt(contractForm.branch_id),
        sales_staff_id: parseInt(contractForm.sales_staff_id),
        contract_type: contractForm.contract_type,
        shared_branch_id: contractForm.shared_branch_id ? parseInt(contractForm.shared_branch_id) : null,
        shared_amount: contractForm.shared_amount ? parseFloat(contractForm.shared_amount) : null,
        parent_contract_id: contractForm.parent_contract_id ? parseInt(contractForm.parent_contract_id) : null,
        total_amount: contractForm.total_amount ? parseFloat(contractForm.total_amount) : null,
        payment_amount: contractForm.payment_amount ? parseFloat(contractForm.payment_amount) : null, // للتوافق مع البيانات القديمة
        payment_method_id: contractForm.payment_method_id ? parseInt(contractForm.payment_method_id) : null, // للتوافق مع البيانات القديمة
        payments: payments, // الدفعات المتعددة
        course_id: contractForm.course_id ? parseInt(contractForm.course_id) : null,
        client_phone: contractForm.client_phone || null,
        registration_source: contractForm.registration_source || null,
        contract_date: contractForm.contract_date || null, // تاريخ العقد
        payment_number: contractForm.payment_number || null, // للتوافق مع البيانات القديمة
        notes: contractForm.notes || null
      };

      console.log("[DailySalesReports] Payload before cleanup:", payload);

      // إزالة الحقول غير المطلوبة حسب نوع العقد
      if (contractForm.contract_type === "new") {
        delete payload.shared_branch_id;
        delete payload.shared_sales_staff_id;
        delete payload.shared_amount;
        delete payload.parent_contract_id;
      } else if (contractForm.contract_type === "shared") {
        delete payload.shared_sales_staff_id;
        delete payload.parent_contract_id;
      } else if (contractForm.contract_type === "shared_same_branch") {
        delete payload.shared_branch_id;
        delete payload.parent_contract_id;
      } else if (contractForm.contract_type === "old_payment") {
        delete payload.shared_branch_id;
        delete payload.shared_sales_staff_id;
        delete payload.shared_amount;
        delete payload.student_name;
        delete payload.contract_number;
      }

      // إزالة الحقول الفارغة
      Object.keys(payload).forEach(key => {
        if (payload[key] === "" || payload[key] === undefined) {
          delete payload[key];
        }
      });

      console.log("[DailySalesReports] Final payload to send:", payload);
      console.log("[DailySalesReports] Sending POST request to /contracts");

      const response = await apiPost("/contracts", payload, token);

      console.log("[DailySalesReports] Contract created successfully:", response);
      success("تم إنشاء العقد بنجاح!");
      resetContractForm();
      setShowContractForm(false);
      loadContracts();
    } catch (err) {
      console.error("[DailySalesReports] Error creating contract:", err);
      console.error("[DailySalesReports] Error details:", {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      showError("حدث خطأ أثناء إنشاء العقد: " + err.message);
    }
  };

  const handleUpdateContract = async (e) => {
    e.preventDefault();
    if (!editingContract) return;

    try {
      // معالجة الدفعات المتعددة (إن وجدت)
      const payments = contractForm.payments && contractForm.payments.length > 0
        ? contractForm.payments
          .filter(p => p.payment_amount && p.payment_method_id)
          .map(p => ({
            payment_amount: parseFloat(p.payment_amount),
            payment_method_id: parseInt(p.payment_method_id),
            payment_number: p.payment_number || null
          }))
        : null;

      const updateData = {
        ...contractForm,
        branch_id: parseInt(contractForm.branch_id),
        sales_staff_id: contractForm.sales_staff_id ? parseInt(contractForm.sales_staff_id) : null,
        shared_branch_id: contractForm.shared_branch_id ? parseInt(contractForm.shared_branch_id) : null,
        shared_amount: contractForm.shared_amount ? parseFloat(contractForm.shared_amount) : null,
        parent_contract_id: contractForm.parent_contract_id ? parseInt(contractForm.parent_contract_id) : null,
        total_amount: contractForm.total_amount ? parseFloat(contractForm.total_amount) : null,
        payment_amount: contractForm.payment_amount && contractForm.payment_amount !== "" ? parseFloat(contractForm.payment_amount) : null,
        payment_method_id: contractForm.payment_method_id && contractForm.payment_method_id !== "" ? parseInt(contractForm.payment_method_id) : null,
        payments: payments,
        course_id: contractForm.course_id ? parseInt(contractForm.course_id) : null,
        client_phone: contractForm.client_phone || null,
        registration_source: contractForm.registration_source || null,
        contract_date: contractForm.contract_date || null,
        payment_number: contractForm.payment_number || null,
        notes: contractForm.notes || null
      };

      // إزالة الحقول الفارغة (strings فارغة، undefined، null للقيم الاختيارية)
      Object.keys(updateData).forEach(key => {
        const value = updateData[key];
        // إزالة القيم الفارغة أو undefined
        if (value === "" || value === undefined) {
          delete updateData[key];
        }
        // إزالة null للقيم الاختيارية القديمة (payment_amount, payment_method_id) إذا كانت null
        // لكن نترك null للقيم المطلوبة مثل shared_branch_id إذا كانت null
        if (value === null && (key === "payment_amount" || key === "payment_method_id")) {
          delete updateData[key];
        }
      });

      await apiPatch(`/contracts/${editingContract.id}`, updateData, token);
      success("تم تحديث العقد بنجاح!");
      setShowContractForm(false);
      setEditingContract(null);
      loadContracts();
    } catch (err) {
      console.error("[DailySalesReports] Error updating contract:", err);
      showError("حدث خطأ أثناء تحديث العقد: " + err.message);
    }
  };

  const handleDeleteContract = async (contractId) => {
    confirm(
      "هل أنت متأكد من حذف هذا العقد؟",
      async () => {
        try {
          await apiDelete(`/contracts/${contractId}`, token);
          success("تم حذف العقد بنجاح!");
          loadContracts();
        } catch (err) {
          showError("حدث خطأ أثناء حذف العقد");
        }
      }
    );
  };

  const handleEditContract = (contract) => {
    setEditingContract(contract);
    // تعيين تاريخ اليوم كتاريخ افتراضي للعقد إذا لم يكن موجوداً
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    setContractForm({
      branch_id: contract.branch_id.toString(),
      student_name: contract.student_name,
      contract_number: contract.contract_number,
      sales_staff_id: contract.sales_staff_id ? contract.sales_staff_id.toString() : "",
      contract_type: contract.contract_type || "new",
      shared_branch_id: contract.shared_branch_id ? contract.shared_branch_id.toString() : "",
      shared_amount: contract.shared_amount ? contract.shared_amount.toString() : "",
      parent_contract_id: contract.parent_contract_id || null,
      search_contract_number: "",
      search_student_name: "",
      searched_contracts: [],
      total_amount: contract.total_amount ? contract.total_amount.toString() : "",
      payment_amount: contract.payment_amount ? contract.payment_amount.toString() : "",
      payment_method_id: contract.payment_method_id ? contract.payment_method_id.toString() : "",
      payment_number: contract.payment_number || "",
      payments: contract.payments && contract.payments.length > 0
        ? contract.payments.map(p => ({
          payment_amount: p.payment_amount ? p.payment_amount.toString() : "",
          payment_method_id: p.payment_method_id ? p.payment_method_id.toString() : "",
          payment_number: p.payment_number || ""
        }))
        : [{ payment_amount: "", payment_method_id: "", payment_number: "" }],
      course_id: contract.course_id ? contract.course_id.toString() : "",
      client_phone: contract.client_phone || "",
      registration_source: contract.registration_source || "",
      contract_date: contract.contract_date || formattedDate, // تاريخ العقد أو تاريخ اليوم
      notes: contract.notes || ""
    });
    setShowContractForm(true);
  };

  const resetForm = () => {
    // تعيين فرع مدير المبيعات تلقائياً إذا كان مدير مبيعات
    let defaultBranchId = "";
    if (userInfo && userInfo.is_sales_manager && !userInfo.is_super_admin && !userInfo.is_backdoor && userInfo.branch_id) {
      defaultBranchId = userInfo.branch_id.toString();
    } else if (branches.length > 0) {
      defaultBranchId = branches[0].id.toString();
    }

    setForm({
      branch_id: defaultBranchId,
      sales_staff_id: "",
      report_date: "",
      number_of_deals: "0",
      daily_calls: "0",
      hot_calls: "0",
      walk_ins: "0",
      branch_leads: "0",
      online_leads: "0",
      extra_leads: "0",
      number_of_visits: "0",
      notes: "",
      visits: []
    });
  };

  const addVisit = () => {
    const newVisits = [...form.visits, { branch_id: "", update_details: "" }];
    setForm({
      ...form,
      visits: newVisits,
      number_of_visits: newVisits.length.toString() // تحديث عدد الزيارات تلقائياً
    });
  };

  const removeVisit = (index) => {
    const newVisits = form.visits.filter((_, i) => i !== index);
    setForm({
      ...form,
      visits: newVisits,
      number_of_visits: newVisits.length.toString() // تحديث عدد الزيارات تلقائياً
    });
  };

  const updateVisit = (index, field, value) => {
    const newVisits = [...form.visits];
    newVisits[index] = { ...newVisits[index], [field]: value };
    setForm({ ...form, visits: newVisits });
  };

  const handleNumberOfVisitsChange = (value) => {
    const numVisits = parseInt(value) || 0;
    const currentVisits = form.visits.length;

    if (numVisits > currentVisits) {
      // إضافة زيارات جديدة
      const newVisits = [...form.visits];
      for (let i = currentVisits; i < numVisits; i++) {
        newVisits.push({ branch_id: "", update_details: "" });
      }
      setForm({ ...form, number_of_visits: numVisits.toString(), visits: newVisits });
    } else if (numVisits < currentVisits) {
      // حذف زيارات
      const newVisits = form.visits.slice(0, numVisits);
      setForm({ ...form, number_of_visits: numVisits.toString(), visits: newVisits });
    } else {
      setForm({ ...form, number_of_visits: numVisits.toString() });
    }
  };

  const resetContractForm = () => {
    // تعيين فرع مدير المبيعات تلقائياً إذا كان مدير مبيعات
    let defaultBranchId = "";
    if (userInfo && userInfo.is_sales_manager && !userInfo.is_super_admin && !userInfo.is_backdoor && userInfo.branch_id) {
      defaultBranchId = userInfo.branch_id.toString();
    } else if (branches.length > 0) {
      defaultBranchId = branches[0].id.toString();
    }

    // تعيين تاريخ اليوم كتاريخ افتراضي للعقد
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    setContractForm({
      branch_id: defaultBranchId,
      student_name: "",
      contract_number: "",
      sales_staff_id: "",
      contract_type: "new",
      shared_branch_id: "",
      shared_sales_staff_id: "",
      shared_amount: "",
      parent_contract_id: null,
      search_contract_number: "",
      search_student_name: "",
      searched_contracts: [],
      total_amount: "",
      payment_amount: "",
      payment_method_id: "",
      payment_number: "",
      payments: [{ payment_amount: "", payment_method_id: "", payment_number: "" }], // دفعة واحدة افتراضياً
      course_id: "",
      client_phone: "",
      registration_source: "",
      contract_date: formattedDate, // تاريخ اليوم بشكل افتراضي
      notes: ""
    });
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  const getSalesStaffName = (staffId) => {
    const staff = salesStaff.find(s => s.id === staffId);
    return staff ? staff.name : `موظف ${staffId}`;
  };

  const getCourseName = (courseId) => {
    if (!courseId) return "-";
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : `كورس ${courseId}`;
  };

  const getPaymentMethodName = (paymentMethodId) => {
    if (!paymentMethodId) return "-";
    const method = paymentMethods.find(pm => pm.id === paymentMethodId);
    return method ? method.name : `طريقة ${paymentMethodId}`;
  };

  // Generate PDF for monthly reports
  const generateMonthlyReportsPDF = (group, branchName) => {
    try {
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
          bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Bold.ttf'
        }
      };

      const formatArabicText = (text) => {
        if (!text || typeof text !== 'string') return text;
        return text.trim().replace(/\s+/g, ' ').replace(/[()]/g, '');
      };

      const formatNumber = (num, decimals = 2) => {
        if (typeof num !== 'number' || isNaN(num)) return num;
        return num.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      };

      const docDefinition = {
        defaultStyle: {
          font: 'Cairo',
          fontSize: 9,
          alignment: 'right'
        },
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [30, 50, 30, 50],
        content: [],
        info: {
          title: `تقرير التقارير اليومية - ${group.monthName} ${group.year}`
        },
        footer: function (currentPage, pageCount) {
          return {
            text: formatArabicText(`صفحة ${currentPage} من ${pageCount}`),
            alignment: 'center',
            fontSize: 8,
            color: '#6B7280',
            margin: [0, 10, 0, 0]
          };
        }
      };

      // Title page
      docDefinition.content.push(
        {
          text: formatArabicText('تقرير التقارير اليومية'),
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: formatArabicText('مركز العمران للتدريب والتطوير'),
          style: 'subtitle',
          alignment: 'center',
          margin: [0, 0, 0, 3]
        },
        {
          text: formatArabicText(`${branchName} - ${group.monthName} ${group.year}`),
          style: 'subtitle2',
          alignment: 'center',
          margin: [0, 0, 0, 15]
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }],
          margin: [0, 0, 0, 15]
        }
      );

      // Summary
      const totalReports = group.reports.length;
      const totalDailyCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.daily_calls) || 0), 0);
      const totalHotCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.hot_calls) || 0), 0);
      const totalWalkIns = group.reports.reduce((sum, r) => sum + (parseInt(r.walk_ins) || 0), 0);
      const totalVisits = group.reports.reduce((sum, r) => sum + (parseInt(r.number_of_visits) || 0), 0);

      docDefinition.content.push(
        {
          text: formatArabicText('ملخص التقارير'),
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('عدد التقارير'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalReports), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الاتصالات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalDailyCalls), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الهوت كول'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalHotCalls), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الووك ان'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalWalkIns), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الزيارات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalVisits), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            }
          ],
          margin: [0, 0, 0, 15]
        },
        {
          text: formatArabicText('تفاصيل التقارير'),
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        }
      );

      // Reports table
      const tableBody = [
        [
          { text: formatArabicText('اليوم'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('التاريخ'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('موظف المبيعات'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الاتصالات'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الهوت كول'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الووك ان'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('ليدز الفرع'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('ليدز الاونلاين'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الليدز الاضافي'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('عدد الزيارات'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الملاحظات'), style: 'tableHeader', alignment: 'center' }
        ]
      ];

      group.reports.forEach(report => {
        const getDayName = (dateStr) => {
          if (!dateStr) return '-';
          try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ar-SA', { weekday: 'long' });
          } catch (e) { return '-'; }
        };

        const formatDateShort = (dateStr) => {
          if (!dateStr) return '-';
          try {
            const date = new Date(dateStr);
            const day = String(date.getDate()).padStart(2, '0');
            const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
            return `${day} ${monthNames[date.getMonth()]}`;
          } catch (e) { return dateStr; }
        };

        tableBody.push([
          { text: formatArabicText(getDayName(report.report_date)), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(formatDateShort(report.report_date)), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(getSalesStaffName(report.sales_staff_id)), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseInt(report.daily_calls) || 0), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseInt(report.hot_calls) || 0), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseInt(report.walk_ins) || 0), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseInt(report.branch_leads) || 0), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseInt(report.online_leads) || 0), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseInt(report.extra_leads) || 0), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseInt(report.number_of_visits) || 0), alignment: 'center', fontSize: 7 },
          { text: formatArabicText((report.notes || '-').substring(0, 30)), alignment: 'center', fontSize: 6 }
        ]);
      });

      docDefinition.content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
          body: tableBody
        },
        layout: {
          hLineWidth: function (i, node) { return i === 0 || i === node.table.body.length ? 1 : 0.5; },
          vLineWidth: function (i, node) { return 0.5; },
          hLineColor: function (i, node) { return '#E5E7EB'; },
          vLineColor: function (i, node) { return '#E5E7EB'; },
          paddingLeft: function (i) { return 2; },
          paddingRight: function (i) { return 2; },
          paddingTop: function (i) { return 2; },
          paddingBottom: function (i) { return 2; }
        },
        margin: [0, 0, 0, 15]
      });

      // Styles
      docDefinition.styles = {
        title: {
          fontSize: 18,
          bold: true,
          color: '#2B2A2A',
          margin: [0, 0, 0, 5]
        },
        subtitle: {
          fontSize: 14,
          color: '#5A7ACD',
          margin: [0, 0, 0, 3]
        },
        subtitle2: {
          fontSize: 12,
          color: '#6B7280',
          margin: [0, 0, 0, 15]
        },
        sectionTitle: {
          fontSize: 12,
          bold: true,
          color: '#2B2A2A',
          margin: [0, 0, 0, 10]
        },
        statLabel: {
          fontSize: 9,
          color: '#6B7280'
        },
        statValue: {
          fontSize: 11,
          bold: true,
          color: '#2B2A2A'
        },
        tableHeader: {
          fontSize: 8,
          bold: true,
          color: '#FFFFFF',
          fillColor: '#5A7ACD'
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(`تقرير_التقارير_اليومية_${branchName}_${group.monthName}_${group.year}.pdf`);
      success(`تم تحميل تقرير التقارير اليومية لشهر ${group.monthName} ${group.year}`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
    }
  };

  // Generate PDF for monthly contracts
  const generateMonthlyContractsPDF = (group, branchName) => {
    try {
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
          bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Bold.ttf'
        }
      };

      const formatArabicText = (text) => {
        if (!text || typeof text !== 'string') return text;
        return text.trim().replace(/\s+/g, ' ').replace(/[()]/g, '');
      };

      const formatNumber = (num, decimals = 2) => {
        if (typeof num !== 'number' || isNaN(num)) return num;
        return num.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      };

      const docDefinition = {
        defaultStyle: {
          font: 'Cairo',
          fontSize: 7,
          alignment: 'right'
        },
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [20, 50, 20, 50],
        content: [],
        info: {
          title: `تقرير العقود - ${group.monthName} ${group.year}`
        },
        footer: function (currentPage, pageCount) {
          return {
            text: formatArabicText(`صفحة ${currentPage} من ${pageCount}`),
            alignment: 'center',
            fontSize: 8,
            color: '#6B7280',
            margin: [0, 10, 0, 0]
          };
        }
      };

      // Title page
      docDefinition.content.push(
        {
          text: formatArabicText('تقرير العقود'),
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: formatArabicText('مركز العمران للتدريب والتطوير'),
          style: 'subtitle',
          alignment: 'center',
          margin: [0, 0, 0, 3]
        },
        {
          text: formatArabicText(`${branchName} - ${group.monthName} ${group.year}`),
          style: 'subtitle2',
          alignment: 'center',
          margin: [0, 0, 0, 15]
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 750, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }],
          margin: [0, 0, 0, 15]
        }
      );

      // Summary
      const salesContracts = group.contracts.filter(c => c.contract_type !== 'old_payment' && c.contract_type !== 'payment');
      const totalContracts = salesContracts.length;
      const totalAmount = salesContracts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0);
      const totalPaid = group.contracts.reduce((sum, c) => sum + parseFloat(c.payment_amount || 0), 0);
      const totalRemaining = group.contracts.reduce((sum, c) => sum + parseFloat(c.remaining_amount || 0), 0);
      const totalNet = group.contracts.reduce((sum, c) => sum + parseFloat(c.net_amount || 0), 0);

      docDefinition.content.push(
        {
          text: formatArabicText('ملخص العقود'),
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('الصافي'), style: 'statLabel', alignment: 'center' },
                { text: `${formatNumber(totalNet)} ${formatArabicText('درهم')}`, style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('المتبقي'), style: 'statLabel', alignment: 'center' },
                { text: `${formatNumber(totalRemaining)} ${formatArabicText('درهم')}`, style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('المدفوع'), style: 'statLabel', alignment: 'center' },
                { text: `${formatNumber(totalPaid)} ${formatArabicText('درهم')}`, style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('القيمة الإجمالية'), style: 'statLabel', alignment: 'center' },
                { text: `${formatNumber(totalAmount)} ${formatArabicText('درهم')}`, style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('عدد العقود'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalContracts), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            }
          ],
          margin: [0, 0, 0, 15]
        },
        {
          text: formatArabicText('تفاصيل العقود'),
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        }
      );

      // Contracts table
      const tableBody = [
        [
          { text: formatArabicText('رقم العقد'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('اسم العميل'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('رقم الهاتف'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('موظف المبيعات'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('القيمة الإجمالية'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('المدفوع'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('المتبقي'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('نوع العقد'), style: 'tableHeader', alignment: 'center' }
        ]
      ];

      group.contracts.forEach(contract => {
        const contractType = contract.contract_type === "new" ? "جديد" :
          (contract.contract_type === "shared" || contract.contract_type === "shared_same_branch") ? "مشترك" : "دفعة قديمة";
        tableBody.push([
          { text: formatArabicText(contract.contract_number || '-'), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contract.student_name || '-'), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contract.client_phone || '-'), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contract.sales_staff_id ? getSalesStaffName(contract.sales_staff_id) : '-'), alignment: 'center', fontSize: 7 },
          {
            text: `${formatNumber(parseFloat(contract.total_amount || 0))
              } ${formatArabicText('درهم')} `, alignment: 'center', fontSize: 7
          },
          { text: `${formatNumber(parseFloat(contract.payment_amount || 0))} ${formatArabicText('درهم')} `, alignment: 'center', fontSize: 7 },
          { text: `${formatNumber(parseFloat(contract.remaining_amount || 0))} ${formatArabicText('درهم')} `, alignment: 'center', fontSize: 7 },
          { text: `${formatNumber(parseFloat(contract.net_amount || 0))} ${formatArabicText('درهم')} `, alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contractType), alignment: 'center', fontSize: 7 }
        ]);
      });

      docDefinition.content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*'],
          body: tableBody
        },
        layout: {
          hLineWidth: function (i, node) { return i === 0 || i === node.table.body.length ? 1 : 0.5; },
          vLineWidth: function (i, node) { return 0.5; },
          hLineColor: function (i, node) { return '#E5E7EB'; },
          vLineColor: function (i, node) { return '#E5E7EB'; },
          paddingLeft: function (i) { return 3; },
          paddingRight: function (i) { return 3; },
          paddingTop: function (i) { return 2; },
          paddingBottom: function (i) { return 2; }
        },
        margin: [0, 0, 0, 15]
      });

      // Styles
      docDefinition.styles = {
        title: {
          fontSize: 18,
          bold: true,
          color: '#2B2A2A',
          margin: [0, 0, 0, 5]
        },
        subtitle: {
          fontSize: 14,
          color: '#5A7ACD',
          margin: [0, 0, 0, 3]
        },
        subtitle2: {
          fontSize: 12,
          color: '#6B7280',
          margin: [0, 0, 0, 15]
        },
        sectionTitle: {
          fontSize: 12,
          bold: true,
          color: '#2B2A2A',
          margin: [0, 0, 0, 10]
        },
        statLabel: {
          fontSize: 9,
          color: '#6B7280'
        },
        statValue: {
          fontSize: 11,
          bold: true,
          color: '#2B2A2A'
        },
        tableHeader: {
          fontSize: 7,
          bold: true,
          color: '#FFFFFF',
          fillColor: '#5A7ACD'
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(`تقرير_العقود_${branchName}_${group.monthName}_${group.year}.pdf`);
      success(`تم تحميل تقرير العقود لشهر ${group.monthName} ${group.year} `);
    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
    }
  };

  // Generate PDF for today's daily report
  const generateDailyReportPDF = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      // 1. Fetch Data
      let reportsUrl = `/daily-sales-reports?date_from=${todayStr}&date_to=${todayStr}`;
      // Force all branches for super admin, else respect filter
      if (selectedBranchId && !userInfo?.is_super_admin) {
        reportsUrl += `&branch_id=${selectedBranchId}`;
      }
      const todayReports = await apiGet(reportsUrl, token);
      const reportsArray = Array.isArray(todayReports) ? todayReports : [];

      // Fetch Monthly Reports for Cumulative Section (Month-to-Date)
      let monthlyReportsUrl = `/daily-sales-reports?date_from=${monthStartStr}&date_to=${todayStr}`;
      if (selectedBranchId && !userInfo?.is_super_admin) {
        monthlyReportsUrl += `&branch_id=${selectedBranchId}`;
      }
      const monthlyReportsData = await apiGet(monthlyReportsUrl, token);
      const monthlyReportsArray = Array.isArray(monthlyReportsData) ? monthlyReportsData : [];

      let contractsUrl = "/contracts";
      if (selectedContractBranchId && !userInfo?.is_super_admin) {
        contractsUrl += `?branch_id=${selectedContractBranchId}`;
      }
      const allContracts = await apiGet(contractsUrl, token);
      const contractsArray = Array.isArray(allContracts) ? allContracts : [];

      // Today's Contracts
      const todayContracts = contractsArray.filter(contract => {
        const dateToUse = contract.contract_date || contract.created_at;
        if (!dateToUse) return false;
        const contractDateStr = new Date(dateToUse).toISOString().split('T')[0];
        return contractDateStr === todayStr;
      });

      // Monthly Contracts (Month-to-Date)
      const monthlyContracts = contractsArray.filter(contract => {
        const dateToUse = contract.contract_date || contract.created_at;
        if (!dateToUse) return false;
        const contractDateStr = new Date(dateToUse).toISOString().split('T')[0];
        return contractDateStr >= monthStartStr && contractDateStr <= todayStr;
      });

      // 2. Prepare Data Structures
      // Group Reports by Branch
      const branchesData = {};
      // Helper to init branch object
      const getBranchObj = (id, name) => {
        if (!branchesData[id]) {
          branchesData[id] = {
            id,
            name,
            reports: [],
            contracts: [],
            stats: {
              daily_calls: 0, hot_calls: 0, walk_ins: 0,
              branch_leads: 0, online_leads: 0, extra_leads: 0,
              visits_count: 0
            },
            financials: {
              net_total: 0,
              paid_total: 0,
              remaining_total: 0,
              total_amount: 0
            }
          };
        }
        return branchesData[id];
      };

      // Process Reports
      reportsArray.forEach(report => {
        const branchName = report.branch ? report.branch.name : getBranchName(report.branch_id);
        const branchObj = getBranchObj(report.branch_id, branchName);
        branchObj.reports.push(report);

        branchObj.stats.daily_calls += parseInt(report.daily_calls) || 0;
        branchObj.stats.hot_calls += parseInt(report.hot_calls) || 0;
        branchObj.stats.walk_ins += parseInt(report.walk_ins) || 0;
        branchObj.stats.branch_leads += parseInt(report.branch_leads) || 0;
        branchObj.stats.online_leads += parseInt(report.online_leads) || 0;
        branchObj.stats.extra_leads += parseInt(report.extra_leads) || 0;
        branchObj.stats.visits_count += parseInt(report.number_of_visits) || 0;
      });

      // Process Contracts
      todayContracts.forEach(contract => {
        const branchName = contract.branch ? contract.branch.name : getBranchName(contract.branch_id);
        const branchObj = getBranchObj(contract.branch_id, branchName);
        branchObj.contracts.push(contract);

        branchObj.financials.net_total += parseFloat(contract.net_amount || 0);
        branchObj.financials.paid_total += parseFloat(contract.payment_amount || 0);
        branchObj.financials.remaining_total += parseFloat(contract.remaining_amount || 0);
        branchObj.financials.total_amount += parseFloat(contract.total_amount || 0);
      });

      const sortedBranches = Object.values(branchesData).sort((a, b) => a.id - b.id);

      // Calculate Today's Grand Totals
      let grandTotal = {
        visits_count: 0, extra_leads: 0, online_leads: 0, branch_leads: 0,
        net_total: 0, paid_total: 0, remaining_total: 0,
        walk_ins: 0, hot_calls: 0, daily_calls: 0,
        total_reports: reportsArray.length,
        total_contracts: todayContracts.length,
        total_contracts_value: todayContracts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0)
      };

      sortedBranches.forEach(b => {
        grandTotal.visits_count += b.stats.visits_count;
        grandTotal.extra_leads += b.stats.extra_leads;
        grandTotal.online_leads += b.stats.online_leads;
        grandTotal.branch_leads += b.stats.branch_leads;
        grandTotal.walk_ins += b.stats.walk_ins;
        grandTotal.hot_calls += b.stats.hot_calls;
        grandTotal.daily_calls += b.stats.daily_calls;

        grandTotal.net_total += b.financials.net_total;
        grandTotal.paid_total += b.financials.paid_total;
        grandTotal.remaining_total += b.financials.remaining_total;
      });

      // Calculate Month-to-Date Grand Totals for Cumulative Section
      const monthGrandTotal = {
        total_reports: monthlyReportsArray.length,
        total_contracts: monthlyContracts.length,
        total_contracts_value: monthlyContracts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0),
        paid_total: monthlyContracts.reduce((sum, c) => sum + parseFloat(c.payment_amount || 0), 0),
        remaining_total: monthlyContracts.reduce((sum, c) => sum + parseFloat(c.remaining_amount || 0), 0),
        net_total: monthlyContracts.reduce((sum, c) => sum + parseFloat(c.net_amount || 0), 0),
        daily_calls: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.daily_calls) || 0), 0),
        hot_calls: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.hot_calls) || 0), 0),
        walk_ins: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.walk_ins) || 0), 0),
        branch_leads: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.branch_leads) || 0), 0),
        online_leads: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.online_leads) || 0), 0),
        extra_leads: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.extra_leads) || 0), 0),
        visits_count: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.number_of_visits) || 0), 0),
      };

      // 3. PDF Usage Helpers
      const arabicDate = `${today.getDate()} ${monthNames[today.getMonth() + 1]} ${today.getFullYear()} `;
      const formatArabicText = (text) => {
        if (!text || typeof text !== 'string') return text;
        let trimmedText = text.trim();
        trimmedText = trimmedText.replace(/\s+/g, ' ');
        trimmedText = trimmedText.replace(/[()]/g, '');
        return trimmedText;
      };
      const formatNumber = (num, currency = false) => {
        if (typeof num !== 'number' || isNaN(num)) return num;
        return num.toLocaleString('en-US') + (currency ? ' درهم' : '');
      };

      pdfMake.vfs = vfs;
      pdfMake.fonts = {
        Cairo: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' },
        Roboto: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' },
        Nillima: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf', italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf' } // Fix for unknown font request
      };

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 8, alignment: 'right' },
        direction: 'rtl',
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [30, 50, 30, 50],
        content: [],
        info: {
          title: 'التقرير اليومي الشامل'
        },
        footer: function (currentPage, pageCount) {
          return {
            text: formatArabicText(`صفحة ${currentPage} من ${pageCount} `),
            alignment: 'center',
            fontSize: 8,
            color: '#6B7280',
            margin: [0, 10, 0, 0],
            direction: 'rtl'
          };
        },
        styles: {
          title: { fontSize: 18, bold: true, color: '#5A7ACD', alignment: 'center', margin: [0, 0, 0, 5] },
          subtitle: { fontSize: 14, bold: true, color: '#2B2A2A', alignment: 'center', margin: [0, 0, 0, 3] },
          subtitle2: { fontSize: 12, bold: true, color: '#6B7280', alignment: 'center', margin: [0, 0, 0, 15] },
          sectionTitle: { fontSize: 12, bold: true, color: '#2B2A2A', margin: [0, 15, 0, 8], alignment: 'right' },
          statLabel: { fontSize: 8, color: '#6B7280', margin: [0, 0, 0, 3], alignment: 'center' },
          statValue: { fontSize: 12, bold: true, alignment: 'center', color: '#2B2A2A' },
          tableHeader: { fontSize: 8, bold: true, fillColor: '#F3F4F6', color: '#1F2937', alignment: 'center', margin: [0, 2, 0, 2] },
          tableCell: { fontSize: 8, alignment: 'center', color: '#374151', margin: [0, 2, 0, 2] },
          branchTitle: { fontSize: 14, bold: true, color: '#5A7ACD', alignment: 'center', margin: [0, 20, 0, 5] },
          branchSubtitle: { fontSize: 10, bold: true, color: '#6B7280', alignment: 'center', margin: [0, 0, 0, 12] }
        }
      };

      // Header
      const reportTitle = userInfo?.is_super_admin ? 'التقرير اليومي الشامل' : 'التقرير اليومي';
      docDefinition.content.push(
        { text: formatArabicText(reportTitle), style: 'title' },
        { text: formatArabicText('مركز العمران للتدريب والتطوير'), style: 'subtitle' },
        { text: formatArabicText(`تاريخ التقرير: ${arabicDate} `), style: 'subtitle2' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 0, 0, 15] }
      );

      // --- SECTION 1: CUMULATIVE STATISTICS (SUPER ADMIN ONLY) ---
      if (userInfo?.is_super_admin) {
        docDefinition.content.push({ text: formatArabicText('الإحصائيات التراكمية (هذا الشهر)'), style: 'sectionTitle' });

        docDefinition.content.push({
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('صافي المبيعات'), style: 'statLabel' },
                { text: formatArabicText(formatNumber(monthGrandTotal.net_total, true)), style: 'statValue', color: '#28a745' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('الزيارات'), style: 'statLabel' },
                { text: formatNumber(monthGrandTotal.visits_count), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز +'), style: 'statLabel' },
                { text: formatNumber(monthGrandTotal.extra_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز اونلاين'), style: 'statLabel' },
                { text: formatNumber(monthGrandTotal.online_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز الفرع'), style: 'statLabel' },
                { text: formatNumber(monthGrandTotal.branch_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ووك ان'), style: 'statLabel' },
                { text: formatNumber(monthGrandTotal.walk_ins), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('هوت كول'), style: 'statLabel' },
                { text: formatNumber(monthGrandTotal.hot_calls), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('اتصالات'), style: 'statLabel' },
                { text: formatNumber(monthGrandTotal.daily_calls), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            }
          ],
          margin: [0, 0, 0, 20]
        });

        docDefinition.content.push({ text: formatArabicText('الإحصائيات الإجمالية'), style: 'sectionTitle' });

        docDefinition.content.push({
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('صافي المبيعات'), style: 'statLabel' },
                { text: formatArabicText(formatNumber(grandTotal.net_total, true)), style: 'statValue', color: '#5A7ACD' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الزيارات'), style: 'statLabel' },
                { text: formatNumber(grandTotal.visits_count), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز +'), style: 'statLabel' },
                { text: formatNumber(grandTotal.extra_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز اونلاين'), style: 'statLabel' },
                { text: formatNumber(grandTotal.online_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز الفرع'), style: 'statLabel' },
                { text: formatNumber(grandTotal.branch_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ووك ان'), style: 'statLabel' },
                { text: formatNumber(grandTotal.walk_ins), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('هوت كول'), style: 'statLabel' },
                { text: formatNumber(grandTotal.hot_calls), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('اتصالات'), style: 'statLabel' },
                { text: formatNumber(grandTotal.daily_calls), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            }
          ],
          margin: [0, 0, 0, 20]
        });

        // --- SECTION 2: BRANCH PERFORMANCE SUMMARY (FIRST PAGE) ---
        docDefinition.content.push({ text: formatArabicText('ملخص أداء الفروع'), style: 'sectionTitle' });

        const branchSummaryBody = [
          [
            { text: formatArabicText('صافي المبيعات'), style: 'tableHeader' },
            { text: formatArabicText('المدفوع'), style: 'tableHeader' },
            { text: formatArabicText('عدد العقود'), style: 'tableHeader' },
            { text: formatArabicText('الزيارات'), style: 'tableHeader' },
            { text: formatArabicText('ليدز +'), style: 'tableHeader' },
            { text: formatArabicText('ليدز اونلاين'), style: 'tableHeader' },
            { text: formatArabicText('الاتصالات'), style: 'tableHeader' },
            { text: formatArabicText('الفرع'), style: 'tableHeader' }
          ]
        ];

        sortedBranches.forEach(b => {
          // Only include branches with activity in the summary
          if (b.reports.length === 0 && b.contracts.length === 0) return;

          branchSummaryBody.push([
            { text: formatArabicText(formatNumber(b.financials.net_total)), style: 'tableCell', color: '#5A7ACD', bold: true },
            { text: formatArabicText(formatNumber(b.financials.paid_total)), style: 'tableCell', color: '#10B981' },
            { text: formatNumber(b.contracts.length), style: 'tableCell' },
            { text: formatNumber(b.stats.visits_count), style: 'tableCell' },
            { text: formatNumber(b.stats.extra_leads), style: 'tableCell' },
            { text: formatNumber(b.stats.online_leads), style: 'tableCell' },
            { text: formatNumber(b.stats.daily_calls), style: 'tableCell' },
            { text: formatArabicText(b.name), style: 'tableCell', bold: true, fillColor: '#F9FAFB' }
          ]);
        });

        // Add Grand Total row
        branchSummaryBody.push([
          { text: formatArabicText(formatNumber(grandTotal.net_total)), style: 'tableCell', bold: true, fillColor: '#F3F4F6', color: '#5A7ACD' },
          { text: formatArabicText(formatNumber(grandTotal.paid_total)), style: 'tableCell', bold: true, fillColor: '#F3F4F6', color: '#10B981' },
          { text: formatNumber(grandTotal.total_contracts), style: 'tableCell', bold: true, fillColor: '#F3F4F6' },
          { text: formatNumber(grandTotal.visits_count), style: 'tableCell', bold: true, fillColor: '#F3F4F6' },
          { text: formatNumber(grandTotal.extra_leads), style: 'tableCell', bold: true, fillColor: '#F3F4F6' },
          { text: formatNumber(grandTotal.online_leads), style: 'tableCell', bold: true, fillColor: '#F3F4F6' },
          { text: formatNumber(grandTotal.daily_calls), style: 'tableCell', bold: true, fillColor: '#F3F4F6' },
          { text: formatArabicText('الإجمالي'), style: 'tableCell', bold: true, fillColor: '#F3F4F6' }
        ]);

        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
            body: branchSummaryBody
          },
          layout: {
            hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
            vLineWidth: function (i, node) { return 0.3; },
            hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
            vLineColor: function (i, node) { return '#E5E7EB'; },
            paddingLeft: function (i) { return 4; },
            paddingRight: function (i) { return 4; },
            paddingTop: function (i) { return 3; },
            paddingBottom: function (i) { return 3; }
          },
          margin: [0, 0, 0, 20]
        });
      }


      // --- PER BRANCH DETAILS ---
      sortedBranches.forEach((branch, index) => {
        // Only show branch section if there are reports OR contracts
        if (branch.reports.length === 0 && branch.contracts.length === 0) return;

        docDefinition.content.push(
          { text: formatArabicText(branch.name), style: 'branchTitle', pageBreak: (userInfo?.is_super_admin || index > 0) ? 'before' : undefined },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 0, 0, 10] }
        );

        // Branch Statistics Cards
        docDefinition.content.push({ text: formatArabicText('ملخص الفرع'), style: 'sectionTitle' });

        // Operational Stats (now including Net Sales)
        docDefinition.content.push({
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('صافي المبيعات'), style: 'statLabel' },
                { text: formatArabicText(formatNumber(branch.financials.net_total, true)), style: 'statValue', color: '#5A7ACD' }
              ],
              margin: [1, 0, 1, 0]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('الزيارات'), style: 'statLabel' },
                { text: formatNumber(branch.stats.visits_count), style: 'statValue' }
              ],
              margin: [1, 0, 1, 0]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز +'), style: 'statLabel' },
                { text: formatNumber(branch.stats.extra_leads), style: 'statValue' }
              ],
              margin: [1, 0, 1, 0]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز اونلاين'), style: 'statLabel' },
                { text: formatNumber(branch.stats.online_leads), style: 'statValue' }
              ],
              margin: [1, 0, 1, 0]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز الفرع'), style: 'statLabel' },
                { text: formatNumber(branch.stats.branch_leads), style: 'statValue' }
              ],
              margin: [1, 0, 1, 0]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ووك ان'), style: 'statLabel' },
                { text: formatNumber(branch.stats.walk_ins), style: 'statValue' }
              ],
              margin: [1, 0, 1, 0]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('هوت كول'), style: 'statLabel' },
                { text: formatNumber(branch.stats.hot_calls), style: 'statValue' }
              ],
              margin: [1, 0, 1, 0]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('اتصالات'), style: 'statLabel' },
                { text: formatNumber(branch.stats.daily_calls), style: 'statValue' }
              ],
              margin: [1, 0, 1, 0]
            }
          ],
          margin: [0, 0, 0, 15]
        });

        // 2. Employee Performance
        if (branch.reports.length > 0) {
          docDefinition.content.push({ text: formatArabicText('أداء الموظفين'), style: 'sectionTitle' });

          const staffBody = [
            [
              { text: formatArabicText('الموظف'), style: 'tableHeader' },
              { text: formatArabicText('اتصالات'), style: 'tableHeader' },
              { text: formatArabicText('هوت كول'), style: 'tableHeader' },
              { text: formatArabicText('ووك ان'), style: 'tableHeader' },
              { text: formatArabicText('ليدز فرع'), style: 'tableHeader' },
              { text: formatArabicText('ليدز اونلاين'), style: 'tableHeader' },
              { text: formatArabicText('ليدز +'), style: 'tableHeader' },
              { text: formatArabicText('زيارات'), style: 'tableHeader' },
              { text: formatArabicText('ملاحظات'), style: 'tableHeader' }
            ]
          ];

          branch.reports.forEach(r => {
            const staffName = r.sales_staff ? r.sales_staff.name : getSalesStaffName(r.sales_staff_id);
            staffBody.push([
              { text: formatArabicText(staffName), style: 'tableCell', bold: true },
              { text: formatNumber(parseInt(r.daily_calls) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.hot_calls) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.walk_ins) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.branch_leads) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.online_leads) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.extra_leads) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.number_of_visits) || 0), style: 'tableCell' },
              { text: formatArabicText((r.notes || '-').substring(0, 30)), style: 'tableCell', fontSize: 6, alignment: 'right' }
            ]);
          });

          docDefinition.content.push({
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
              body: staffBody
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
              vLineWidth: function (i, node) { return 0.3; },
              hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
              vLineColor: function (i, node) { return '#E5E7EB'; },
              paddingLeft: function (i) { return 4; },
              paddingRight: function (i) { return 4; },
              paddingTop: function (i) { return 3; },
              paddingBottom: function (i) { return 3; }
            },
            margin: [0, 0, 0, 15]
          });
        }

        // 3. Visit Details
        const visitsList = [];
        branch.reports.forEach(r => {
          if (r.visits && r.visits.length > 0) {
            r.visits.forEach(v => {
              visitsList.push({
                staffName: r.sales_staff ? r.sales_staff.name : getSalesStaffName(r.sales_staff_id),
                details: v.update_details,
                targetBranch: v.branch_id ? getBranchName(v.branch_id) : '-'
              });
            });
          }
        });

        if (visitsList.length > 0) {
          docDefinition.content.push({ text: formatArabicText('تفاصيل الزيارات'), style: 'sectionTitle' });

          const visitsBody = [
            [
              { text: formatArabicText('الموظف'), style: 'tableHeader' },
              { text: formatArabicText('الوجهة (الفرع)'), style: 'tableHeader' },
              { text: formatArabicText('تفاصيل الزيارة'), style: 'tableHeader' }
            ]
          ];

          visitsList.forEach(v => {
            visitsBody.push([
              { text: formatArabicText(v.staffName), style: 'tableCell' },
              { text: formatArabicText(v.targetBranch), style: 'tableCell' },
              { text: formatArabicText(v.details || '-'), style: 'tableCell', alignment: 'right' }
            ]);
          });

          docDefinition.content.push({
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', '*'],
              body: visitsBody
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
              vLineWidth: function (i, node) { return 0.3; },
              hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
              vLineColor: function (i, node) { return '#E5E7EB'; },
              paddingLeft: function (i) { return 4; },
              paddingRight: function (i) { return 4; },
              paddingTop: function (i) { return 3; },
              paddingBottom: function (i) { return 3; }
            },
            margin: [0, 0, 0, 15]
          });
        }

        // 4. Contracts
        docDefinition.content.push({ text: formatArabicText('العقود المنجزة'), style: 'sectionTitle' });

        if (branch.contracts.length > 0) {
          const contractsBody = [
            [
              { text: formatArabicText('رقم العقد'), style: 'tableHeader' },
              { text: formatArabicText('الطالب'), style: 'tableHeader' },
              { text: formatArabicText('الموظف'), style: 'tableHeader' },
              { text: formatArabicText('النوع'), style: 'tableHeader' },
              { text: formatArabicText('الإجمالي'), style: 'tableHeader' },
              { text: formatArabicText('المدفوع'), style: 'tableHeader' },
              { text: formatArabicText('المتبقي'), style: 'tableHeader' },
              { text: formatArabicText('الصافي'), style: 'tableHeader' }
            ]
          ];

          branch.contracts.forEach(c => {
            const staffName = c.sales_staff ? c.sales_staff.name : getSalesStaffName(c.sales_staff_id);
            const type = c.contract_type === 'new' ? 'جديد' : ((c.contract_type === 'shared' || c.contract_type === 'shared_same_branch') ? 'مشترك' : 'دفعة');
            contractsBody.push([
              { text: formatArabicText(c.contract_number), style: 'tableCell' },
              { text: formatArabicText(c.student_name), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(staffName), style: 'tableCell' },
              { text: formatArabicText(type), style: 'tableCell' },
              { text: formatNumber(parseFloat(c.total_amount || 0)), style: 'tableCell' },
              { text: formatNumber(parseFloat(c.payment_amount || 0)), style: 'tableCell', color: '#10B981', bold: true },
              { text: formatNumber(parseFloat(c.remaining_amount || 0)), style: 'tableCell', color: '#DC2626' },
              { text: formatNumber(parseFloat(c.net_amount || 0)), style: 'tableCell', color: '#5A7ACD', bold: true }
            ]);
          });

          docDefinition.content.push({
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: contractsBody
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
              vLineWidth: function (i, node) { return 0.3; },
              hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
              vLineColor: function (i, node) { return '#E5E7EB'; },
              paddingLeft: function (i) { return 4; },
              paddingRight: function (i) { return 4; },
              paddingTop: function (i) { return 3; },
              paddingBottom: function (i) { return 3; }
            },
            margin: [0, 0, 0, 20]
          });
        } else {
          docDefinition.content.push({
            text: formatArabicText('لا يوجد عقود لهذا اليوم'),
            style: 'subtitle2',
            margin: [0, 10, 0, 20]
          });
        }

      }); // End Branches Loop

      // Signature Section
      docDefinition.content.push(
        { text: formatArabicText('التوقيعات والتوثيق'), style: 'sectionTitle', alignment: 'center', margin: [0, 30, 0, 20] },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('اعتماد الإدارة'), style: 'tableHeader', alignment: 'center', margin: [0, 0, 0, 40] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: '#9CA3AF' }], alignment: 'center' }
              ]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('توقيع المسؤول'), style: 'tableHeader', alignment: 'center', margin: [0, 0, 0, 40] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: '#9CA3AF' }], alignment: 'center' }
              ]
            }
          ],
          margin: [20, 0, 20, 0]
        }
      );

      pdfMake.createPdf(docDefinition).download(`تقرير_يومي_شامل_${todayStr}.pdf`);
      success(`تم تحميل التقرير اليومي الشامل`);

    } catch (err) {
      console.error('Error in PDF generation:', err);
      showError('خطأ في إنشاء التقرير: ' + err.message);
    }
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض التقارير</p>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحيات
  if (!userInfo || (!userInfo.is_super_admin && !userInfo.is_sales_manager && !userInfo.is_operation_manager && !userInfo.is_backdoor)) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  const isSalesManager = userInfo?.is_sales_manager;

  // Show buttons if Super Admin OR (Sales Manager AND NOT Branch Account)
  const showActionButtons = userInfo?.is_super_admin || (userInfo?.is_sales_manager && !userInfo?.is_branch_account);

  return (
    <>
      <div className="container">
        {/* Tabs and Filters - Separate Card at Top */}
        <div className="panel" style={{ marginBottom: "1rem" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "1rem", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
            <button
              onClick={() => setActiveTab("reports")}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: activeTab === "reports" ? "#5A7ACD" : "#6B7280",
                borderBottom: activeTab === "reports" ? "2px solid #5A7ACD" : "2px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s"
              }}
            >
              التقارير اليومية
            </button>
            <button
              onClick={() => setActiveTab("contracts")}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: activeTab === "contracts" ? "#5A7ACD" : "#6B7280",
                borderBottom: activeTab === "contracts" ? "2px solid #5A7ACD" : "2px solid transparent",
                marginBottom: "-2px",
              }}
            >
              العقود
            </button>
            {showActionButtons && (
              <button
                className="btn"
                onClick={generateDailyReportPDF}
                style={{
                  backgroundColor: "#5A7ACD",
                  color: "white",
                  border: "none",
                  marginRight: "auto",
                  fontSize: "13px",
                  padding: "0.4rem 1rem",
                  cursor: "pointer"
                }}
              >
                📄 تحميل تقرير يومي
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="filters-bar">
            {activeTab === "reports" ? (
              (() => {
                const filteredReports = filterReportsByYearAndMonth(reports);
                const { years, months } = getAvailableYearsAndMonths(reports);
                // Get available sales staff based on selected branch
                const availableSalesStaff = selectedBranchId
                  ? salesStaff.filter(s => s.branch_id === selectedBranchId)
                  : salesStaff;
                return (
                  <>
                    <h3 style={{ margin: 0 }}>التقارير اليومية ({filteredReports.length})</h3>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginRight: "auto" }}>
                      {(!userInfo?.is_sales_manager || userInfo?.is_super_admin || userInfo?.is_backdoor) && (
                        <select
                          value={selectedBranchId || ""}
                          onChange={(e) => {
                            const branchId = e.target.value ? parseInt(e.target.value) : null;
                            setSelectedBranchId(branchId);
                            // Reset sales staff when branch changes
                            setSelectedSalesStaffId(null);
                          }}
                          style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                        >
                          <option value="">جميع الفروع</option>
                          {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                          ))}
                        </select>
                      )}
                      <select
                        value={selectedSalesStaffId || ""}
                        onChange={(e) => {
                          const staffId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedSalesStaffId(staffId);
                        }}
                        style={{ minWidth: "160px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع موظفي المبيعات</option>
                        {availableSalesStaff.map(staff => (
                          <option key={staff.id} value={staff.id}>{staff.name}</option>
                        ))}
                      </select>
                      <select
                        value={selectedMonth || ""}
                        onChange={(e) => {
                          const month = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedMonth(month);
                        }}
                        style={{ minWidth: "140px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
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
                        style={{ minWidth: "120px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع السنوات</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {(selectedYear || selectedMonth || selectedBranchId || selectedSalesStaffId) && (
                        <button
                          className="btn"
                          onClick={() => {
                            setSelectedYear(null);
                            setSelectedMonth(null);
                            setSelectedBranchId(null);
                            setSelectedSalesStaffId(null);
                          }}
                          style={{ backgroundColor: "#DC2626", color: "white", border: "none" }}
                        >
                          إزالة الفلاتر
                        </button>
                      )}
                      {showActionButtons && (
                        <button
                          className="btn primary"
                          onClick={() => {
                            setEditingReport(null);
                            resetForm();
                            setShowForm(true);
                          }}
                        >
                          إضافة تقرير يومي
                        </button>
                      )}
                    </div>
                  </>
                );
              })()
            ) : (
              (() => {
                const filteredContracts = filterContractsByYearAndMonth(contracts);
                const { years, months } = getAvailableContractYearsAndMonths(contracts);
                // Get available sales staff based on selected branch
                const availableContractSalesStaff = selectedContractBranchId
                  ? salesStaff.filter(s => s.branch_id === selectedContractBranchId)
                  : salesStaff;
                return (
                  <>
                    <h3 style={{ margin: 0 }}>العقود ({filteredContracts.length})</h3>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginRight: "auto" }}>
                      {(!userInfo?.is_sales_manager || userInfo?.is_super_admin || userInfo?.is_backdoor) && (
                        <select
                          value={selectedContractBranchId || ""}
                          onChange={(e) => {
                            setSelectedContractBranchId(e.target.value ? parseInt(e.target.value) : null);
                            // Reset sales staff when branch changes
                            setSelectedContractSalesStaffId(null);
                          }}
                          style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                        >
                          <option value="">جميع الفروع</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      )}
                      <select
                        value={selectedContractSalesStaffId || ""}
                        onChange={(e) => {
                          const staffId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedContractSalesStaffId(staffId);
                        }}
                        style={{ minWidth: "160px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع موظفي المبيعات</option>
                        {availableContractSalesStaff.map(staff => (
                          <option key={staff.id} value={staff.id}>{staff.name}</option>
                        ))}
                      </select>
                      <select
                        value={selectedContractMonth || ""}
                        onChange={(e) => {
                          const month = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedContractMonth(month);
                        }}
                        style={{ minWidth: "140px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع الأشهر</option>
                        {months.map(month => (
                          <option key={month} value={month}>{monthNames[month]}</option>
                        ))}
                      </select>
                      <select
                        value={selectedContractYear || ""}
                        onChange={(e) => {
                          const year = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedContractYear(year);
                        }}
                        style={{ minWidth: "120px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع السنوات</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="بحث: اسم العميل، رقم العقد، رقم الهاتف، موظف المبيعات"
                        value={contractSearchQuery}
                        onChange={(e) => setContractSearchQuery(e.target.value)}
                        style={{
                          minWidth: "280px",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #E5E7EB",
                          fontFamily: "Cairo",
                          fontSize: "13px",
                          direction: "rtl"
                        }}
                      />
                      {(selectedContractYear || selectedContractMonth || selectedContractBranchId || selectedContractSalesStaffId || contractSearchQuery) && (
                        <button
                          className="btn"
                          onClick={() => {
                            setSelectedContractYear(null);
                            setSelectedContractMonth(null);
                            setSelectedContractBranchId(null);
                            setSelectedContractSalesStaffId(null);
                            setContractSearchQuery("");
                          }}
                          style={{ backgroundColor: "#DC2626", color: "white", border: "none" }}
                        >
                          إزالة الفلاتر
                        </button>
                      )}
                      {!userInfo?.is_branch_account && (userInfo?.is_sales_manager || userInfo?.is_super_admin) && (
                        <button
                          className="btn primary"
                          onClick={() => {
                            setEditingContract(null);
                            resetContractForm();
                            setShowContractForm(true);
                          }}
                        >
                          إضافة عقد جديد
                        </button>
                      )}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* Today's Reports Card - Only show when activeTab is "reports" */}
        {activeTab === "reports" && (() => {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

          const todayReports = reports.filter(report => {
            if (!report.report_date) return false;
            const reportDate = new Date(report.report_date);
            const reportDateStr = reportDate.toISOString().split('T')[0];
            return reportDateStr === todayStr;
          });

          console.log("[Today's Card] Today's date:", todayStr);
          console.log("[Today's Card] Total reports:", reports.length);
          console.log("[Today's Card] Today's reports:", todayReports.length);

          if (todayReports.length === 0) return null;

          const arabicDate = today.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          return (
            <div className="panel" style={{ marginBottom: "1.5rem", backgroundColor: "#FFF7ED", border: "2px solid #FEB05D" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid #E5E7EB" }}>
                <h3 style={{ margin: 0, color: "#2B2A2A", fontSize: "18px", fontWeight: 600 }}>
                  التقارير الخاصة باليوم - {arabicDate}
                </h3>
              </div>

              {/* Today's Reports */}
              {todayReports.length > 0 && (
                <div style={{ padding: "1rem" }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "#2B2A2A", fontSize: "16px", fontWeight: 600 }}>
                    التقارير اليومية ({todayReports.length})
                  </h4>
                  <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: "1200px" }}>
                      <thead>
                        <tr>
                          <th>الفرع</th>
                          <th>موظف المبيعات</th>
                          <th>اليوم</th>
                          <th>تاريخ التقرير</th>
                          <th style={{ textAlign: "left" }}>الاتصالات اليومية</th>
                          <th style={{ textAlign: "left" }}>الهوت كول</th>
                          <th style={{ textAlign: "left" }}>الووك ان</th>
                          <th style={{ textAlign: "left" }}>ليدز الفرع</th>
                          <th style={{ textAlign: "left" }}>ليدز الاونلاين</th>
                          <th style={{ textAlign: "left" }}>الليدز الاضافي</th>
                          <th style={{ textAlign: "left" }}>عدد الزيارات</th>
                          {!userInfo?.is_branch_account && <th>الإجراءات</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {todayReports.map(report => {
                          const getDayName = (dateStr) => {
                            if (!dateStr) return '-';
                            try {
                              const date = new Date(dateStr);
                              return date.toLocaleDateString('ar-SA', { weekday: 'long' });
                            } catch (e) { return '-'; }
                          };

                          const formatDateShort = (dateStr) => {
                            if (!dateStr) return '-';
                            try {
                              const date = new Date(dateStr);
                              const day = String(date.getDate()).padStart(2, '0');
                              const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                              return `${day} ${monthNames[date.getMonth()]}`;
                            } catch (e) { return dateStr; }
                          };

                          return (
                            <tr key={report.id}>
                              <td>{getBranchName(report.branch_id)}</td>
                              <td>{getSalesStaffName(report.sales_staff_id)}</td>
                              <td style={{ fontWeight: 600, color: "#5A7ACD" }}>{getDayName(report.report_date)}</td>
                              <td>{formatDateShort(report.report_date)}</td>
                              <td className="number" data-type="number">{report.daily_calls || 0}</td>
                              <td className="number" data-type="number">{report.hot_calls || 0}</td>
                              <td className="number" data-type="number">{report.walk_ins || 0}</td>
                              <td className="number" data-type="number">{report.branch_leads || 0}</td>
                              <td className="number" data-type="number">{report.online_leads || 0}</td>
                              <td className="number" data-type="number">{report.extra_leads || 0}</td>
                              <td className="number" data-type="number">{report.number_of_visits || 0}</td>
                              {!userInfo?.is_branch_account && (
                                <td>
                                  <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                                    <button
                                      className="btn btn-small"
                                      onClick={() => handleEdit(report)}
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
                                      onClick={() => handleDelete(report.id)}
                                      title="حذف"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Today's Contracts Card - Only show when activeTab is "contracts" */}
        {activeTab === "contracts" && (() => {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

          const todayContracts = contracts.filter(contract => {
            const dateToUse = contract.contract_date || contract.created_at;
            if (!dateToUse) return false;
            try {
              const contractDate = new Date(dateToUse);
              if (isNaN(contractDate.getTime())) return false;
              const contractDateStr = contractDate.toISOString().split('T')[0];
              return contractDateStr === todayStr;
            } catch (e) {
              console.error("[Today's Card] Error parsing contract date:", dateToUse, e);
              return false;
            }
          });

          console.log("[Today's Card] Today's date:", todayStr);
          console.log("[Today's Card] Total contracts:", contracts.length);
          console.log("[Today's Card] Today's contracts:", todayContracts.length);
          if (contracts.length > 0) {
            console.log("[Today's Card] Sample contract:", {
              id: contracts[0].id,
              contract_date: contracts[0].contract_date,
              created_at: contracts[0].created_at,
              dateToUse: contracts[0].contract_date || contracts[0].created_at
            });
          }

          if (todayContracts.length === 0) return null;

          const arabicDate = today.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          return (
            <div className="panel" style={{ marginBottom: "1.5rem", backgroundColor: "#FFF7ED", border: "2px solid #FEB05D" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid #E5E7EB" }}>
                <h3 style={{ margin: 0, color: "#2B2A2A", fontSize: "18px", fontWeight: 600 }}>
                  العقود الخاصة باليوم - {arabicDate}
                </h3>
              </div>

              {/* Today's Contracts */}
              <div style={{ padding: "1rem" }}>
                <h4 style={{ margin: "0 0 1rem 0", color: "#2B2A2A", fontSize: "16px", fontWeight: 600 }}>
                  العقود ({todayContracts.length})
                </h4>
                <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: "1200px" }}>
                    <thead>
                      <tr>
                        <th>رقم العقد</th>
                        <th>اسم الطالب</th>
                        <th>رقم هاتف العميل</th>
                        <th>الفرع</th>
                        <th>موظف المبيعات</th>
                        <th>الدورة</th>
                        <th style={{ textAlign: "left" }}>المبلغ الإجمالي</th>
                        <th style={{ textAlign: "left" }}>المبلغ المدفوع</th>
                        <th style={{ textAlign: "left" }}>طريقة الدفع</th>
                        <th style={{ textAlign: "left" }}>رقم الدفعة</th>
                        <th style={{ textAlign: "left" }}>المتبقي</th>
                        <th style={{ textAlign: "left" }}>المبلغ الصافي</th>
                        <th>تاريخ العقد</th>
                        {!userInfo?.is_branch_account && <th>الإجراءات</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {todayContracts.map(contract => {
                        const totalPaid = parseFloat(contract.payment_amount || 0);

                        const contractDate = contract.contract_date || contract.created_at;
                        const dateToDisplay = contractDate ? new Date(contractDate).toISOString().split('T')[0] : '-';

                        // Fallback mechanism for Payment Method and Number
                        const displayPaymentMethodId = contract.payment_method_id || (contract.payments && contract.payments.length > 0 ? contract.payments[0].payment_method_id : null);
                        const displayPaymentNumber = contract.payment_number || (contract.payments && contract.payments.length > 0 ? contract.payments[0].payment_number : "-");

                        return (
                          <tr key={contract.id}>
                            <td>{contract.contract_number}</td>
                            <td>{contract.student_name}</td>
                            <td>{contract.client_phone || "-"}</td>
                            <td>{getBranchName(contract.branch_id)}</td>
                            <td>{getSalesStaffName(contract.sales_staff_id)}</td>
                            <td>{contract.course ? contract.course.name : "-"}</td>
                            <td className="number" data-type="number" style={{ direction: 'ltr' }}>{parseFloat(contract.total_amount || 0).toFixed(2)} درهم</td>
                            <td className="number" data-type="number" style={{ direction: 'ltr' }}>{totalPaid.toFixed(2)} درهم</td>
                            <td>{getPaymentMethodName(displayPaymentMethodId)}</td>
                            <td>{displayPaymentNumber}</td>
                            <td className="number" data-type="number" style={{ direction: 'ltr' }}>{parseFloat(contract.remaining_amount || 0).toFixed(2)} درهم</td>
                            <td className="number" data-type="number" style={{ direction: 'ltr' }}>{parseFloat(contract.net_amount || 0).toFixed(2)} درهم</td>
                            <td>{dateToDisplay}</td>
                            {!userInfo?.is_branch_account && (
                              <td>
                                <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                                  <button
                                    className="btn btn-small"
                                    onClick={() => handleEditContract(contract)}
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
                                    onClick={() => handleDeleteContract(contract.id)}
                                    title="حذف"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Daily Reports Tab */}
        {activeTab === "reports" && (
          <div className="panel">

            {/* Report Form Modal */}
            {showForm && (
              <div className="modal-overlay" onClick={() => {
                setShowForm(false);
                setEditingReport(null);
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}>
                  <div className="modal-header">
                    <h3 style={{ fontSize: "1rem" }}>{editingReport ? "تعديل التقرير" : "إضافة تقرير يومي جديد"}</h3>
                    <button className="modal-close" onClick={() => {
                      setShowForm(false);
                      setEditingReport(null);
                    }}>×</button>
                  </div>
                  <form onSubmit={editingReport ? handleUpdate : handleCreate}>
                    <div className="modal-body">
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>الفرع *</label>
                          <select
                            value={form.branch_id}
                            onChange={(e) => {
                              const newBranchId = e.target.value;
                              setForm({ ...form, branch_id: newBranchId, sales_staff_id: "" }); // إعادة تعيين موظف المبيعات عند تغيير الفرع
                              // تحميل موظفي المبيعات للفرع الجديد
                              if (newBranchId) {
                                loadSalesStaff(parseInt(newBranchId));
                              } else {
                                loadSalesStaff();
                              }
                            }}
                            required
                            disabled={editingReport !== null || (userInfo?.is_sales_manager && !userInfo?.is_super_admin && !userInfo?.is_backdoor)}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          >
                            <option value="">اختر الفرع</option>
                            {branches.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>موظف المبيعات *</label>
                          <select
                            value={form.sales_staff_id}
                            onChange={(e) => setForm({ ...form, sales_staff_id: e.target.value })}
                            required
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          >
                            <option value="">اختر موظف المبيعات</option>
                            {salesStaff.filter(s => s.is_active || s.id === parseInt(form.sales_staff_id)).map(staff => (
                              <option key={staff.id} value={staff.id}>{staff.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>تاريخ التقرير *</label>
                          <input
                            type="date"
                            value={form.report_date}
                            onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                            required
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>الاتصالات اليومية</label>
                          <input
                            type="number"
                            value={form.daily_calls}
                            onChange={(e) => setForm({ ...form, daily_calls: e.target.value })}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>الهوت كول</label>
                          <input
                            type="number"
                            value={form.hot_calls}
                            onChange={(e) => setForm({ ...form, hot_calls: e.target.value })}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>الووك ان</label>
                          <input
                            type="number"
                            value={form.walk_ins}
                            onChange={(e) => setForm({ ...form, walk_ins: e.target.value })}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>ليدز الفرع</label>
                          <input
                            type="number"
                            value={form.branch_leads}
                            onChange={(e) => setForm({ ...form, branch_leads: e.target.value })}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>ليدز الاونلاين</label>
                          <input
                            type="number"
                            value={form.online_leads}
                            onChange={(e) => setForm({ ...form, online_leads: e.target.value })}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>الليدز الاضافي</label>
                          <input
                            type="number"
                            value={form.extra_leads}
                            onChange={(e) => setForm({ ...form, extra_leads: e.target.value })}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد الزيارات</label>
                          <input
                            type="number"
                            value={form.number_of_visits}
                            onChange={(e) => handleNumberOfVisitsChange(e.target.value)}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                          />
                        </div>
                        <div className="form-group" style={{ gridColumn: "span 4" }}>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>الملاحظات</label>
                          <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%", minHeight: "80px" }}
                          />
                        </div>
                      </div>

                      {/* Visits Section */}
                      {form.number_of_visits > 0 && (
                        <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #E5E7EB" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "1rem", color: "#2B2A2A" }}>تفاصيل الزيارات</h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {form.visits.map((visit, index) => (
                              <div key={index} style={{ padding: "1rem", backgroundColor: "#F9FAFB", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "0.75rem" }}>
                                  <div className="form-group">
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>الفرع</label>
                                    <select
                                      value={visit.branch_id}
                                      onChange={(e) => updateVisit(index, "branch_id", e.target.value)}
                                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                                    >
                                      <option value="">اختر الفرع</option>
                                      {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="form-group">
                                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2A2A", marginBottom: "0.5rem" }}>تفاصيل الزيارة</label>
                                  <textarea
                                    value={visit.update_details || ""}
                                    onChange={(e) => updateVisit(index, "update_details", e.target.value)}
                                    style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", minHeight: "60px", fontSize: "13px", width: "100%" }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                    <div className="modal-footer">
                      <button className="btn primary" type="submit">
                        {editingReport ? "تحديث" : "إضافة"}
                      </button>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingReport(null);
                        }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {(() => {
              const filteredReports = filterReportsByYearAndMonth(reports);
              const branchGroups = groupReportsByBranchAndMonth(filteredReports);

              console.log("[DailySalesReports] Rendering reports:", {
                totalReports: reports.length,
                filteredReports: filteredReports.length,
                branchGroups: branchGroups.length,
                selectedYear,
                selectedMonth
              });

              if (filteredReports.length === 0) {
                return (
                  <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
                    <p style={{ color: "#6B7280", fontSize: "14px" }}>
                      لا توجد تقارير حالياً
                    </p>
                  </div>
                );
              }

              if (branchGroups.length === 0) {
                return (
                  <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
                    <p style={{ color: "#6B7280", fontSize: "14px" }}>
                      لا توجد تقارير متطابقة مع الفلاتر المحددة
                    </p>
                  </div>
                );
              }

              return (
                <div>
                  {branchGroups.map((branchGroup) => (
                    <div key={branchGroup.branchId} style={{ marginBottom: "2rem" }}>
                      {/* Branch Header Card */}
                      <div className="panel" style={{
                        marginBottom: "1rem",
                        padding: "1rem",
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E5E7EB"
                      }}>
                        <h2 style={{
                          color: "#2B2A2A",
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 600
                        }}>
                          {branchGroup.branchName}
                        </h2>
                      </div>

                      {branchGroup.months.map((group) => {
                        const monthKey = `${branchGroup.branchId}-${group.year}-${group.month}`;
                        const isExpanded = expandedMonth === monthKey;
                        // Diagnostic log for render
                        if (isExpanded) console.log("[Render] Month Group Expanded:", monthKey);

                        return (
                          <div
                            key={monthKey}
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
                                <span style={{ color: "#6B7280", fontSize: "13px" }}>
                                  عدد التقارير: <strong>{group.reports.length}</strong>
                                </span>
                                <button
                                  className="btn-small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateMonthlyReportsPDF(group, branchGroup.branchName);
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
                                  title="تحميل PDF"
                                >
                                  📄 PDF
                                </button>
                                <span style={{ fontSize: "14px", color: "#6B7280" }}>
                                  {isExpanded ? "▼" : "▶"}
                                </span>
                              </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div data-month-key={monthKey}>
                                {/* Reports Table */}
                                <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                                  <table style={{ width: "100%", minWidth: "1000px" }}>
                                    <thead>
                                      <tr>
                                        <th>اليوم</th>
                                        <th>التاريخ</th>
                                        <th>موظف المبيعات</th>
                                        <th style={{ textAlign: "left" }}>الاتصالات اليومية</th>
                                        <th style={{ textAlign: "left" }}>الهوت كول</th>
                                        <th style={{ textAlign: "left" }}>الووك ان</th>
                                        <th style={{ textAlign: "left" }}>ليدز الفرع</th>
                                        <th style={{ textAlign: "left" }}>ليدز الاونلاين</th>
                                        <th style={{ textAlign: "left" }}>الليدز الاضافي</th>
                                        <th style={{ textAlign: "left" }}>عدد الزيارات</th>
                                        <th>الملاحظات</th>
                                        {!userInfo?.is_branch_account && <th>الإجراءات</th>}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.reports.map(report => {
                                        const getDayName = (dateStr) => {
                                          if (!dateStr) return '-';
                                          try {
                                            const date = new Date(dateStr);
                                            return date.toLocaleDateString('ar-SA', { weekday: 'long' });
                                          } catch (e) { return '-'; }
                                        };

                                        const formatDateShort = (dateStr) => {
                                          if (!dateStr) return '-';
                                          try {
                                            const date = new Date(dateStr);
                                            const day = String(date.getDate()).padStart(2, '0');
                                            const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                                            return `${day} ${monthNames[date.getMonth()]}`;
                                          } catch (e) { return dateStr; }
                                        };

                                        return (
                                          <tr key={report.id}>
                                            <td style={{ fontWeight: 600, color: "#5A7ACD" }}>{getDayName(report.report_date)}</td>
                                            <td>{formatDateShort(report.report_date)}</td>
                                            <td>{getSalesStaffName(report.sales_staff_id)}</td>
                                            <td className="number" data-type="number">{report.daily_calls || 0}</td>
                                            <td className="number" data-type="number">{report.hot_calls || 0}</td>
                                            <td className="number" data-type="number">{report.walk_ins || 0}</td>
                                            <td className="number" data-type="number">{report.branch_leads || 0}</td>
                                            <td className="number" data-type="number">{report.online_leads || 0}</td>
                                            <td className="number" data-type="number">{report.extra_leads || 0}</td>
                                            <td className="number" data-type="number">{report.number_of_visits || 0}</td>
                                            <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={report.notes || ""}>
                                              {report.notes || "-"}
                                            </td>
                                            {!userInfo?.is_branch_account && (
                                              <td>
                                                <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                                                  <button
                                                    className="btn btn-small"
                                                    onClick={() => handleEdit(report)}
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
                                                    onClick={() => handleDelete(report.id)}
                                                    title="حذف"
                                                  >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                      <polyline points="3 6 5 6 21 6"></polyline>
                                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                  </button>
                                                </div>
                                              </td>
                                            )}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
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
        )}

        {/* Contracts Tab */}
        {activeTab === "contracts" && (
          <div className="panel">
            {/* Contracts List */}
            {(() => {
              const filteredContracts = filterContractsByYearAndMonth(contracts);
              console.log("[DailySalesReports] Contracts display:", {
                totalContracts: contracts.length,
                filteredContracts: filteredContracts.length,
                selectedContractYear,
                selectedContractMonth,
                selectedContractBranchId,
                selectedContractSalesStaffId,
                sampleContracts: contracts.slice(0, 2)
              });
              const branchGroups = groupContractsByBranchAndMonth(filteredContracts);

              if (filteredContracts.length === 0) {
                return (
                  <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
                    <p style={{ color: "#6B7280", fontSize: "14px" }}>
                      لا توجد عقود حالياً
                    </p>
                  </div>
                );
              }

              if (branchGroups.length === 0) {
                return (
                  <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
                    <p style={{ color: "#6B7280", fontSize: "14px" }}>
                      لا توجد عقود متطابقة مع الفلاتر المحددة
                    </p>
                  </div>
                );
              }

              return (
                <div>
                  {branchGroups.map((branchGroup) => (
                    <div key={branchGroup.branchId} style={{ marginBottom: "2rem" }}>
                      {/* Branch Header Card */}
                      <div className="panel" style={{
                        marginBottom: "1rem",
                        padding: "1rem",
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E5E7EB"
                      }}>
                        <h2 style={{
                          color: "#2B2A2A",
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 600
                        }}>
                          {branchGroup.branchName}
                        </h2>
                      </div>

                      {branchGroup.months.map((group) => {
                        const monthKey = `${branchGroup.branchId}-${group.year}-${group.month}`;
                        const isExpanded = expandedContractMonth === monthKey;
                        // Diagnostic log for render
                        if (isExpanded) console.log("[Render] Contract Group Expanded:", monthKey);

                        return (
                          <div
                            key={monthKey}
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
                              onClick={() => toggleContractMonth(branchGroup.branchId, group.year, group.month)}
                            >
                              <h3 style={{ margin: 0, color: "#2B2A2A", fontSize: "16px", fontWeight: 600 }}>
                                {group.monthName} {group.year}
                              </h3>
                              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                <span style={{ color: "#6B7280", fontSize: "13px" }}>
                                  عدد العقود: <strong>{group.contracts.length}</strong>
                                </span>
                                <button
                                  className="btn-small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateMonthlyContractsPDF(group, branchGroup.branchName);
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
                                  title="تحميل PDF"
                                >
                                  📄 PDF
                                </button>
                                <span style={{ fontSize: "14px", color: "#6B7280" }}>
                                  {isExpanded ? "▼" : "▶"}
                                </span>
                              </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div data-month-key={monthKey}>
                                {/* Contracts Table */}
                                <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                                  <table style={{ width: "100%", fontSize: "11px", tableLayout: "auto", borderCollapse: "collapse" }}>
                                    <thead>
                                      <tr>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>رقم العقد</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>الفرع</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>موظف المبيعات</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>اسم العميل</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>رقم هاتف العميل</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>مصدر التسجيل</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>الدورة المسجلة</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>القيمة الإجمالية</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>قيمة الدفعة</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>طريقة الدفع</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>رقم الدفعة</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>المتبقي</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>الصافي للفرع</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>نوع العقد</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>ملاحظات</th>
                                        <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>الإجراءات</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.contracts.map(contract => (
                                        <tr key={contract.id}>
                                          <td style={{ fontWeight: 600, color: "#5A7ACD", padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.contract_number}</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{getBranchName(contract.branch_id)}</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.sales_staff_id ? getSalesStaffName(contract.sales_staff_id) : "-"}</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.student_name}</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.client_phone || "-"}</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.registration_source || "-"}</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{getCourseName(contract.course_id)}</td>
                                          <td data-type="number" style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.total_amount ? parseFloat(contract.total_amount).toFixed(2) : "0.00"} درهم</td>
                                          <td data-type="number" style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.payment_amount ? parseFloat(contract.payment_amount).toFixed(2) : "0.00"} درهم</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{getPaymentMethodName(contract.payment_method_id)}</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.payment_number || "-"}</td>
                                          <td data-type="number" style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.remaining_amount ? parseFloat(contract.remaining_amount).toFixed(2) : "0.00"} درهم</td>
                                          <td data-type="number" style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>{contract.net_amount ? parseFloat(contract.net_amount).toFixed(2) : "0.00"} درهم</td>
                                          <td style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px" }}>
                                            <span className={`status ${contract.contract_type === "new" ? "status-active" : (contract.contract_type === "shared" || contract.contract_type === "shared_same_branch") ? "status-pending" : "status-rejected"} `} style={{ fontSize: "10px", padding: "0.2rem 0.4rem" }}>
                                              {contract.contract_type === "new" ? "جديد" : (contract.contract_type === "shared" || contract.contract_type === "shared_same_branch") ? "مشترك" : "دفعة قديمة"}
                                            </span>
                                          </td>
                                          <td style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0.4rem", textAlign: "center", fontSize: "11px" }} title={contract.notes || ""}>{contract.notes || "-"}</td>
                                          <td>
                                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                                              <button
                                                className="btn btn-small"
                                                onClick={() => {
                                                  handleEditContract(contract);
                                                }}
                                                style={{
                                                  padding: "0.2rem 0.4rem",
                                                  backgroundColor: "#FEB05D",
                                                  color: "white",
                                                  border: "none",
                                                  fontSize: "10px",
                                                  borderRadius: "4px",
                                                  cursor: "pointer"
                                                }}
                                                title="تعديل"
                                              >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                                </svg>
                                              </button>
                                              <button
                                                className="btn btn-small btn-danger"
                                                onClick={() => {
                                                  confirm(
                                                    "هل أنت متأكد من حذف هذا العقد؟",
                                                    async () => {
                                                      try {
                                                        await apiDelete(`/contracts/${contract.id}`, token);
                                                        success("تم حذف العقد بنجاح!");
                                                        loadContracts();
                                                      } catch (err) {
                                                        showError("حدث خطأ أثناء حذف العقد");
                                                      }
                                                    }
                                                  );
                                                }}
                                                style={{
                                                  padding: "0.2rem 0.4rem",
                                                  fontSize: "10px",
                                                  borderRadius: "4px"
                                                }}
                                                title="حذف"
                                              >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Contract Form Modal - خارج الـ panels */}
        {showContractForm && (
          <div className="modal-overlay" onClick={() => {
            setShowContractForm(false);
            setEditingContract(null);
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "1100px", overflowY: "auto", overflowX: "hidden" }}>
              <div className="modal-header">
                <h3 style={{ fontSize: "1rem" }}>{editingContract ? "تعديل العقد" : "إضافة عقد جديد"}</h3>
                <button className="modal-close" onClick={() => {
                  setShowContractForm(false);
                  setEditingContract(null);
                }}>×</button>
              </div>
              <form onSubmit={editingContract ? handleUpdateContract : handleCreateContract}>
                <div className="modal-body">
                  {!editingContract && (
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>نوع العقد</label>
                      <select
                        value={contractForm.contract_type}
                        onChange={(e) => setContractForm({ ...contractForm, contract_type: e.target.value, parent_contract_id: null, searched_contracts: [] })}
                        style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                        required
                      >
                        <option value="new">عقد جديد</option>
                        <option value="shared">عقد مشترك (خارجي)</option>
                        <option value="shared_same_branch">مشترك بنفس الفرع</option>
                        <option value="old_payment">عقد قديم (دفعة)</option>
                      </select>
                    </div>
                  )}

                  {contractForm.contract_type === "old_payment" && !editingContract && (
                    <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>البحث عن العقد</label>
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <input
                          placeholder="رقم العقد"
                          value={contractForm.search_contract_number}
                          onChange={(e) => setContractForm({ ...contractForm, search_contract_number: e.target.value })}
                          style={{ flex: 1 }}
                        />
                        <input
                          placeholder="اسم صاحب العقد"
                          value={contractForm.search_student_name}
                          onChange={(e) => setContractForm({ ...contractForm, search_student_name: e.target.value })}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="btn primary" onClick={searchContracts}>بحث</button>
                      </div>
                      {contractForm.searched_contracts.length > 0 && (
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                          {contractForm.searched_contracts.map(c => (
                            <div
                              key={c.id}
                              onClick={() => setContractForm({ ...contractForm, parent_contract_id: c.id })}
                              style={{
                                padding: "0.75rem",
                                marginBottom: "0.5rem",
                                border: contractForm.parent_contract_id === c.id ? "2px solid #5a7acd" : "1px solid #dcdcdc",
                                borderRadius: "6px",
                                cursor: "pointer",
                                backgroundColor: contractForm.parent_contract_id === c.id ? "#e8edff" : "white"
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>{c.contract_number}</div>
                              <div style={{ fontSize: "0.875rem", color: "#666" }}>{c.student_name}</div>
                              <div style={{ fontSize: "0.75rem", color: "#999" }}>
                                المتبقي: {c.remaining_amount ? c.remaining_amount.toFixed(2) : "0.00"} ر.س
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                    {contractForm.contract_type !== "old_payment" && (
                      <>
                        <select
                          value={contractForm.branch_id}
                          onChange={(e) => {
                            const branchId = e.target.value;
                            setContractForm({ ...contractForm, branch_id: branchId, sales_staff_id: "" });
                            if (branchId) {
                              loadSalesStaff(parseInt(branchId));
                            } else {
                              loadSalesStaff();
                            }
                          }}
                          required
                          disabled={userInfo?.is_sales_manager && !userInfo?.is_super_admin && !userInfo?.is_backdoor}
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                        >
                          <option value="">اختر الفرع</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <select
                          value={contractForm.sales_staff_id}
                          onChange={(e) => setContractForm({ ...contractForm, sales_staff_id: e.target.value })}
                          required
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                        >
                          <option value="">اختر موظف المبيعات *</option>
                          {salesStaff.filter(s => {
                            if (contractForm.branch_id && s.branch_id !== parseInt(contractForm.branch_id)) {
                              return false;
                            }
                            return s.is_active || s.id === parseInt(contractForm.sales_staff_id);
                          }).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <input
                          placeholder="اسم صاحب العقد"
                          value={contractForm.student_name}
                          onChange={(e) => setContractForm({ ...contractForm, student_name: e.target.value })}
                          required
                        />
                        <input
                          placeholder="رقم هاتف العميل"
                          value={contractForm.client_phone || ""}
                          onChange={(e) => setContractForm({ ...contractForm, client_phone: e.target.value })}
                        />
                        <input
                          placeholder="رقم العقد"
                          value={contractForm.contract_number}
                          onChange={(e) => setContractForm({ ...contractForm, contract_number: e.target.value })}
                          required
                        />
                      </>
                    )}

                    {contractForm.contract_type === "shared" && (
                      <>
                        <select
                          value={contractForm.shared_branch_id}
                          onChange={(e) => setContractForm({ ...contractForm, shared_branch_id: e.target.value })}
                          required
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                        >
                          <option value="">اختر الفرع المشترك</option>
                          {allBranches.filter(b => b.id !== parseInt(contractForm.branch_id || 0)).map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="المبلغ المشترك"
                          value={contractForm.shared_amount}
                          onChange={(e) => setContractForm({ ...contractForm, shared_amount: e.target.value })}
                          required
                        />
                      </>
                    )}

                    {contractForm.contract_type === "shared_same_branch" && (
                      <>
                        <select
                          value={contractForm.shared_sales_staff_id}
                          onChange={(e) => setContractForm({ ...contractForm, shared_sales_staff_id: e.target.value })}
                          required
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                        >
                          <option value="">اختر موظف المبيعات الثاني *</option>
                          {salesStaff.filter(s => {
                            if (contractForm.branch_id && s.branch_id !== parseInt(contractForm.branch_id)) {
                              return false;
                            }
                            // منع اختيار نفس الموظف مرتين
                            if (s.id === parseInt(contractForm.sales_staff_id)) {
                              return false;
                            }
                            return s.is_active || s.id === parseInt(contractForm.shared_sales_staff_id);
                          }).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e8edff', padding: '0.5rem', borderRadius: '8px', fontSize: '13px', color: '#5a7acd' }}>
                          سيتم تقسيم قيمة العقد والدفعات بالتساوي بين الموظفين
                        </div>
                      </>
                    )}

                    <input
                      type="number"
                      step="0.01"
                      placeholder="القيمة الإجمالية للعقد"
                      value={contractForm.total_amount || ""}
                      onChange={(e) => setContractForm({ ...contractForm, total_amount: e.target.value })}
                      required={contractForm.contract_type !== "old_payment"}
                    />
                    {contractForm.contract_type !== "old_payment" && (
                      <>
                        <select
                          value={contractForm.registration_source || ""}
                          onChange={(e) => setContractForm({ ...contractForm, registration_source: e.target.value })}
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                        >
                          <option value="">اختر مصدر التسجيل</option>
                          <option value="تجديد">تجديد</option>
                          <option value="داتا شخصية">داتا شخصية</option>
                          <option value="Leads">Leads</option>
                          <option value="ووك ان">ووك ان</option>
                          <option value="هوت كول">هوت كول</option>
                          <option value="كولد كول">كولد كول</option>
                          <option value="دفعة قديمة">دفعة قديمة</option>
                        </select>
                        <input
                          type="date"
                          placeholder="تاريخ العقد"
                          value={contractForm.contract_date || ""}
                          onChange={(e) => setContractForm({ ...contractForm, contract_date: e.target.value })}
                        />
                      </>
                    )}
                    {contractForm.contract_type === "old_payment" && (
                      <input
                        placeholder="رقم الدفعة"
                        value={contractForm.payment_number || ""}
                        onChange={(e) => setContractForm({ ...contractForm, payment_number: e.target.value })}
                      />
                    )}
                    {contractForm.contract_type !== "old_payment" && (
                      <>
                        <select
                          value={contractForm.course_id || ""}
                          onChange={(e) => setContractForm({ ...contractForm, course_id: e.target.value })}
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                        >
                          <option value="">اختر الدورة (اختياري)</option>
                          {courses.filter(c => c.is_active).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        {/* الدفعات المتعددة */}
                        <div style={{ gridColumn: "1 / -1", marginTop: "1rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <label style={{ fontWeight: 600 }}>الدفعات</label>
                            <button
                              type="button"
                              className="btn primary"
                              onClick={() => {
                                setContractForm({
                                  ...contractForm,
                                  payments: [...contractForm.payments, { payment_amount: "", payment_method_id: "", payment_number: "" }]
                                });
                              }}
                              style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                            >
                              + إضافة دفعة
                            </button>
                          </div>
                          {/* عرض صافي المبلغ والمتبقي */}
                          {(() => {
                            const totalAmount = parseFloat(contractForm.total_amount || 0);
                            const totalPayments = contractForm.payments.reduce((sum, p) => sum + parseFloat(p.payment_amount || 0), 0);
                            const remainingAmount = totalAmount - totalPayments;

                            // حساب الصافي بناءً على طريقة الدفع لكل دفعة
                            const calculateNetAmount = (paymentAmount, paymentMethodId) => {
                              if (!paymentAmount || paymentAmount <= 0) return 0;

                              const paymentMethod = paymentMethods.find(pm => pm.id === parseInt(paymentMethodId));

                              if (!paymentMethod) {
                                return paymentAmount;
                              }

                              const taxPercentage = parseFloat(paymentMethod.tax_percentage || 0);
                              const baseAmount = paymentAmount / (1 + taxPercentage);
                              const discountPercentage = parseFloat(paymentMethod.discount_percentage || 0);

                              // Formula: (Amount / (1 + Tax)) - (Amount * Discount)
                              return baseAmount - (paymentAmount * discountPercentage);
                            };

                            const totalNetAmount = contractForm.payments.reduce((sum, p) => {
                              const paymentAmount = parseFloat(p.payment_amount || 0);
                              const net = calculateNetAmount(paymentAmount, p.payment_method_id);
                              return sum + net;
                            }, 0);

                            return (
                              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", padding: "0.75rem", backgroundColor: "white", borderRadius: "6px", border: "1px solid #dcdcdc" }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>صافي المبلغ (المدفوع)</div>
                                  <div style={{ fontSize: "1rem", fontWeight: "600", color: "#28a745" }}>{totalNetAmount.toFixed(2)} درهم</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>المتبقي</div>
                                  <div style={{ fontSize: "1rem", fontWeight: "600", color: remainingAmount >= 0 ? "#dc3545" : "#28a745" }}>{remainingAmount.toFixed(2)} درهم</div>
                                </div>
                              </div>
                            );
                          })()}
                          {contractForm.payments.map((payment, index) => (
                            <div key={index} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "0.75rem", padding: "0.5rem", backgroundColor: "white", borderRadius: "6px", border: "1px solid #dcdcdc" }}>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="قيمة الدفعة"
                                value={payment.payment_amount || ""}
                                onChange={(e) => {
                                  const newPayments = [...contractForm.payments];
                                  newPayments[index].payment_amount = e.target.value;
                                  setContractForm({ ...contractForm, payments: newPayments });
                                }}
                                required
                                style={{ padding: "0.5rem" }}
                              />
                              <select
                                value={payment.payment_method_id || ""}
                                onChange={(e) => {
                                  const newPayments = [...contractForm.payments];
                                  newPayments[index].payment_method_id = e.target.value;
                                  setContractForm({ ...contractForm, payments: newPayments });
                                }}
                                style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                                required
                              >
                                <option value="">اختر طريقة الدفع</option>
                                {paymentMethods.filter(pm => pm.is_active).map(pm => (
                                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                                ))}
                              </select>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                  placeholder="رقم الدفعة"
                                  value={payment.payment_number || ""}
                                  onChange={(e) => {
                                    const newPayments = [...contractForm.payments];
                                    newPayments[index].payment_number = e.target.value;
                                    setContractForm({ ...contractForm, payments: newPayments });
                                  }}
                                  style={{ flex: 1, padding: "0.5rem" }}
                                />
                                {contractForm.payments.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => {
                                      const newPayments = contractForm.payments.filter((_, i) => i !== index);
                                      setContractForm({ ...contractForm, payments: newPayments });
                                    }}
                                    style={{ padding: "0.5rem", minWidth: "40px" }}
                                    title="حذف"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <textarea
                          placeholder="ملاحظات (اختياري)"
                          value={contractForm.notes || ""}
                          onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                          rows={3}
                          style={{ gridColumn: "1 / -1" }}
                        />
                      </>
                    )}
                    {contractForm.contract_type === "old_payment" && (
                      <select
                        value={contractForm.payment_method_id || ""}
                        onChange={(e) => setContractForm({ ...contractForm, payment_method_id: e.target.value })}
                        style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                        required
                      >
                        <option value="">اختر طريقة الدفع</option>
                        {paymentMethods.filter(pm => pm.is_active).map(pm => (
                          <option key={pm.id} value={pm.id}>{pm.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn primary" type="submit">
                    {editingContract ? "تحديث" : "إضافة"}
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      setShowContractForm(false);
                      setEditingContract(null);
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div >
    </>
  );
}
