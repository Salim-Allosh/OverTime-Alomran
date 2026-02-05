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
  const [showCancellationForm, setShowCancellationForm] = useState(false);
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
    search_client_phone: "",
    searched_contracts: [],
    total_amount: "",
    payment_amount: "", // للتوافق مع البيانات القديمة
    payment_method_id: "", // للتوافق مع البيانات القديمة
    payment_number: "", // للتوافق مع البيانات القديمة
    payments: [], // الدفعات المتعددة [{ payment_amount, payment_method_id, payment_number }]
    is_shared_old: false,
    is_shared_same_branch_old: false,
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
  const [showHistoricalDateModal, setShowHistoricalDateModal] = useState(false);
  const [selectedHistoricalDate, setSelectedHistoricalDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Debounced search for old contracts
  useEffect(() => {
    if (!token || editingContract) return;

    // Trigger search for either old payment (Add Payment) or if the Cancellation form is open
    const isSearchMode = contractForm.contract_type === "old_payment" || showCancellationForm;
    if (!isSearchMode) return;

    const hasSearchQuery =
      (contractForm.search_contract_number && contractForm.search_contract_number.trim() !== "") ||
      (contractForm.search_student_name && contractForm.search_student_name.trim() !== "") ||
      (contractForm.search_client_phone && contractForm.search_client_phone.trim() !== "");

    if (!hasSearchQuery) {
      if (contractForm.searched_contracts.length > 0) {
        setContractForm(prev => ({ ...prev, searched_contracts: [] }));
      }
      return;
    }

    const timer = setTimeout(() => {
      searchContracts();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    contractForm.search_contract_number,
    contractForm.search_student_name,
    contractForm.search_client_phone,
    contractForm.contract_type,
    showCancellationForm
  ]);

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

    const actualVisitsCount = form.visits ? form.visits.filter(v => v.branch_id && v.branch_id.trim() !== "").length : 0;

    try {
      await apiPatch(`/daily-sales-reports/${editingReport.id}`, {
        branch_id: parseInt(form.branch_id),
        sales_staff_id: parseInt(form.sales_staff_id),
        report_date: form.report_date,
        number_of_deals: parseInt(form.number_of_deals) || 0,
        daily_calls: parseInt(form.daily_calls) || 0,
        hot_calls: parseInt(form.hot_calls) || 0,
        walk_ins: parseInt(form.walk_ins) || 0,
        branch_leads: parseInt(form.branch_leads) || 0,
        online_leads: parseInt(form.online_leads) || 0,
        extra_leads: parseInt(form.extra_leads) || 0,
        number_of_visits: actualVisitsCount,
        notes: form.notes || null,
        visits: form.visits.filter(v => v.branch_id && v.branch_id.trim() !== "").map((v, idx) => ({
          branch_id: parseInt(v.branch_id),
          update_details: v.update_details || null,
          visit_order: idx + 1
        }))
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
    const numVisits = parseInt(report.number_of_visits || 0);
    const existingVisits = Array.isArray(report.visits) ? report.visits : [];

    // Ensure visits array length matches number_of_visits
    const visitsForForm = [];
    for (let i = 0; i < numVisits; i++) {
      const v = existingVisits[i] || {};
      visitsForForm.push({
        branch_id: v.branch_id?.toString() || "",
        update_details: v.update_details || ""
      });
    }

    setEditingReport(report);
    setForm({
      branch_id: report.branch_id.toString(),
      sales_staff_id: report.sales_staff_id?.toString() || "",
      report_date: report.report_date,
      number_of_deals: (report.number_of_deals || 0).toString(),
      daily_calls: (report.daily_calls || 0).toString(),
      hot_calls: (report.hot_calls || 0).toString(),
      walk_ins: (report.walk_ins || 0).toString(),
      branch_leads: (report.branch_leads || 0).toString(),
      online_leads: (report.online_leads || 0).toString(),
      extra_leads: (report.extra_leads || 0).toString(),
      number_of_visits: numVisits.toString(),
      notes: report.notes || "",
      visits: visitsForForm
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
      if (contractForm.search_client_phone) {
        params.append("client_phone", contractForm.search_client_phone);
      }

      // إضافة branch_id لتقييد البحث بفرع الموظف/الفرع المحدد فقط
      if (contractForm.branch_id) {
        params.append("branch_id", contractForm.branch_id);
      } else if (selectedBranchId) {
        params.append("branch_id", selectedBranchId);
      }

      const data = await apiGet(`/contracts/search?${params.toString()}`, token);
      setContractForm({ ...contractForm, searched_contracts: data || [] });
    } catch (err) {
      showError("حدث خطأ أثناء البحث: " + err.message);
    }
  };

  const selectOldContract = (c) => {
    // تحميل الموظفين للفرع المقابل للعقد القديم
    if (c.branch_id) {
      loadSalesStaff(parseInt(c.branch_id));
    }

    // التحقق مما إذا كان العقد الأصلي مشتركاً
    const isSharedSameBranch = c.contract_type === "shared_same_branch";
    const isSharedInterBranch = c.contract_type === "shared" || c.contract_number.endsWith("-S");
    const isSharedParent = isSharedInterBranch || isSharedSameBranch;

    let sharedSalesStaffId = "";
    if (isSharedSameBranch) {
      // البحث عن العقد الشريك في نتائج البحث الحالية لتحديد الموظف الثاني
      const partner = contractForm.searched_contracts.find(pc =>
        pc.contract_number === c.contract_number && pc.id !== c.id
      );
      if (partner) {
        sharedSalesStaffId = partner.sales_staff_id ? partner.sales_staff_id.toString() : "";
      }
    }

    setContractForm({
      ...contractForm,
      parent_contract_id: c.id,
      student_name: c.student_name,
      client_phone: c.client_phone || "",
      course_id: c.course_id ? c.course_id.toString() : "",
      branch_id: c.branch_id.toString(),
      sales_staff_id: c.sales_staff_id ? c.sales_staff_id.toString() : "",
      shared_sales_staff_id: sharedSalesStaffId,
      original_total_amount: c.total_amount,
      original_paid_amount: c.payment_amount,
      total_amount: "0", // نضعه 0 لكي لا يتم احتسابه كقيمة عقد جديد في الاحصائيات
      contract_number: c.contract_number,
      registration_source: "عقد قديم (دفعة)",
      // إذا كان العقد الأصلي مشتركاً، نقترح تفعيل المشاركة في الدفعة أيضاً
      shared_branch_id: c.shared_branch_id ? c.shared_branch_id.toString() : "",
      is_shared_old: isSharedParent,
      is_shared_same_branch_old: isSharedSameBranch,
      searched_contracts: []
    });
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
        shared_sales_staff_id: contractForm.shared_sales_staff_id ? parseInt(contractForm.shared_sales_staff_id) : null,
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
        // إبقاء حقول المشاركة إذا كان العقد القديم مشتركاً
        if (!contractForm.is_shared_old && !contractForm.shared_branch_id && !contractForm.shared_sales_staff_id) {
          delete payload.shared_branch_id;
          delete payload.shared_sales_staff_id;
          delete payload.shared_amount;
        }
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

  const handleCreateCancellation = async (e) => {
    e.preventDefault();
    try {
      if (!contractForm.parent_contract_id) {
        showError("يجب اختيار العقد المراد كنسلته");
        return;
      }

      if (!contractForm.payments || contractForm.payments.length === 0 || !contractForm.payments[0].payment_amount) {
        showError("يجب تحديد مبلغ الكنسلة");
        return;
      }

      if (!contractForm.sales_staff_id) {
        showError("يجب اختيار موظف المبيعات");
        return;
      }

      // Automatically negate amounts if they are positive
      const payments = contractForm.payments
        .filter(p => p.payment_amount && p.payment_method_id)
        .map(p => ({
          payment_amount: Math.abs(parseFloat(p.payment_amount)), // We'll let backend negate it based on contract_type
          payment_method_id: parseInt(p.payment_method_id),
          payment_number: p.payment_number || null
        }));

      const payload = {
        ...contractForm,
        branch_id: parseInt(contractForm.branch_id),
        sales_staff_id: parseInt(contractForm.sales_staff_id),
        contract_type: 'cancellation',
        parent_contract_id: parseInt(contractForm.parent_contract_id),
        payments: payments,
        contract_date: contractForm.contract_date || new Date().toISOString().split('T')[0],
        notes: contractForm.notes || null,
        student_name: contractForm.student_name,
        client_phone: contractForm.client_phone,
        course_id: contractForm.course_id
      };

      // Ensure total_amount is also correct (though backend overrides it to 0 for the CAN record)
      payload.total_amount = 0;

      // Clean up sharing fields if not sharing
      if (!contractForm.shared_branch_id && !contractForm.shared_sales_staff_id) {
        delete payload.shared_branch_id;
        delete payload.shared_sales_staff_id;
        delete payload.shared_amount;
      }

      const response = await apiPost("/contracts", payload, token);
      success("تمت عملية الكنسلة بنجاح!");
      setShowCancellationForm(false);
      resetContractForm();
      loadContracts();
    } catch (err) {
      console.error("Error creating cancellation:", err);
      showError("حدث خطأ أثناء الكنسلة: " + (err.response?.data?.message || err.message));
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
    // حساب عدد العقود التابعة (الدفعات القديمة المرتبطة)
    const childrenCount = contracts.filter(c => c.parent_contract_id === contractId).length;

    let confirmMsg = "هل أنت متأكد من حذف هذا العقد؟";
    if (childrenCount > 0) {
      confirmMsg = `هذا العقد مرتبط به عدد (${childrenCount}) من العقود/الدفعات التابعة. حذف هذا العقد سيؤدي إلى حذف جميع هذه التوابع. هل أنت متأكد؟`;
    }

    confirm(
      confirmMsg,
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

  const handleCancelDeletionRequest = async (contractId) => {
    confirm(
      "هل أنت متأكد من إلغاء/رفض طلب الحذف؟",
      async () => {
        try {
          await apiPost(`/contracts/${contractId}/cancel-deletion`, {}, token);
          success("تم إلغاء طلب الحذف بنجاح!");
          loadContracts();
        } catch (err) {
          showError("حدث خطأ أثناء إلغاء طلب الحذف");
        }
      }
    );
  };

  const handleEditContract = (contract, isAssignment = false) => {
    setEditingContract({ ...contract, isAssignment });
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
      search_client_phone: "",
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
      contract_date: contract.contract_date
        ? (typeof contract.contract_date === 'string' ? contract.contract_date.split('T')[0].split(' ')[0] : contract.contract_date)
        : formattedDate,
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
      is_shared_old: false,
      is_shared_same_branch_old: false,
      parent_contract_id: null,
      search_contract_number: "",
      search_student_name: "",
      search_client_phone: "",
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
    const id = parseInt(branchId);
    const branch = allBranches.find(b => b.id === id) || branches.find(b => b.id === id);
    return branch ? branch.name : `فرع ${id}`;
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
          { text: formatArabicText(report.notes || '-'), alignment: 'center', fontSize: 6 }
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

  // Helper function to get local ISO date (YYYY-MM-DD)
  const toLocalISOString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate PDF for a specific daily report
  const generateDailyReportPDF = async (dateOverride = null) => {
    try {
      const targetDate = dateOverride ? new Date(dateOverride) : new Date();
      const todayStr = toLocalISOString(targetDate);
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthStartStr = toLocalISOString(monthStart);

      // 1. Fetch Data
      // 1. Fetch Data
      let reportsUrl = `/daily-sales-reports?date_from=${todayStr}&date_to=${todayStr}`;
      // Force filter if branch selected (even for super admin)
      if (selectedBranchId) {
        reportsUrl += `&branch_id=${selectedBranchId}`;
      }
      const todayReports = await apiGet(reportsUrl, token);
      const reportsArray = Array.isArray(todayReports) ? todayReports : [];

      // Fetch Monthly Reports for Cumulative Section (Month-to-Date)
      let monthlyReportsUrl = `/daily-sales-reports?date_from=${monthStartStr}&date_to=${todayStr}`;
      if (selectedBranchId) {
        monthlyReportsUrl += `&branch_id=${selectedBranchId}`;
      }
      const monthlyReportsData = await apiGet(monthlyReportsUrl, token);
      const monthlyReportsArray = Array.isArray(monthlyReportsData) ? monthlyReportsData : [];

      let contractsUrl = "/contracts";
      if (selectedContractBranchId) {
        contractsUrl += `?branch_id=${selectedContractBranchId}`;
      } else if (selectedBranchId) {
        contractsUrl += `?branch_id=${selectedBranchId}`;
      }

      const allContracts = await apiGet(contractsUrl, token);
      const contractsArray = Array.isArray(allContracts) ? allContracts : [];

      // Today's Contracts (For Counts/Values - Exclude Technical Types)
      const todayContracts = contractsArray.filter(contract => {
        const dateToUse = contract.contract_date || contract.created_at;
        if (!dateToUse) return false;
        const contractDateStr = toLocalISOString(new Date(dateToUse));

        // Matches StatisticsController logic: exclude 'payment', 'old_payment', 'cancellation'
        const isSalesContract = !['old_payment', 'payment', 'cancellation'].includes(contract.contract_type);
        return isSalesContract && contractDateStr === todayStr;
      });

      // Monthly Contracts (For Counts/Values - Exclude Technical Types)
      const monthlyContracts = contractsArray.filter(contract => {
        const dateToUse = contract.contract_date || contract.created_at;
        if (!dateToUse) return false;
        const contractDateStr = toLocalISOString(new Date(dateToUse));

        const isSalesContract = !['old_payment', 'payment', 'cancellation'].includes(contract.contract_type);
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
            },
            cumulative: {
              daily_calls: 0, hot_calls: 0, walk_ins: 0,
              branch_leads: 0, online_leads: 0, extra_leads: 0,
              visits_count: 0,
              net_total: 0,
              paid_total: 0,
              other_collections_paid: 0,
              other_collections_net: 0
            }
          };
        }
        return branchesData[id];
      };

      // Process Reports (Today)
      reportsArray.forEach(report => {
        // If filtering by branch, skip others (double check)
        if (selectedBranchId && parseInt(report.branch_id) !== parseInt(selectedBranchId)) return;

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

      // Process Monthly Reports (Cumulative)
      monthlyReportsArray.forEach(report => {
        if (selectedBranchId && parseInt(report.branch_id) !== parseInt(selectedBranchId)) return;

        const branchName = report.branch ? report.branch.name : getBranchName(report.branch_id);
        const branchObj = getBranchObj(report.branch_id, branchName);
        branchObj.cumulative.daily_calls += parseInt(report.daily_calls) || 0;
        branchObj.cumulative.hot_calls += parseInt(report.hot_calls) || 0;
        branchObj.cumulative.walk_ins += parseInt(report.walk_ins) || 0;
        branchObj.cumulative.branch_leads += parseInt(report.branch_leads) || 0;
        branchObj.cumulative.online_leads += parseInt(report.online_leads) || 0;
        branchObj.cumulative.extra_leads += parseInt(report.extra_leads) || 0;
        branchObj.cumulative.visits_count += parseInt(report.number_of_visits) || 0;
      });

      // Process Contracts and Payments (Today and Cumulative)
      // Logic: Iterate over ALL contracts to find payments in target dates
      contractsArray.forEach(contract => {
        if (selectedBranchId && parseInt(contract.branch_id) !== parseInt(selectedBranchId)) return;

        const branchName = contract.branch ? contract.branch.name : getBranchName(contract.branch_id);
        const branchObj = getBranchObj(contract.branch_id, branchName);

        // A. Sales Stats (Based on contract creation date) - Exclude Technical Types
        const isSalesContract = !['old_payment', 'payment', 'cancellation'].includes(contract.contract_type);
        const dateToUse = contract.contract_date || contract.created_at;

        if (dateToUse && isSalesContract) {
          const contractDateStr = toLocalISOString(new Date(dateToUse));
          // Today's Sales Value
          if (contractDateStr === todayStr) {
            branchObj.contracts.push(contract);
            branchObj.financials.total_amount += parseFloat(contract.total_amount || 0);
            branchObj.financials.remaining_total += parseFloat(contract.remaining_amount || 0);
          }
        }


        // B. Cashflow Stats (Based on payment creation date)
        if (Array.isArray(contract.payments)) {
          contract.payments.forEach(payment => {
            if (!payment.created_at) return;
            const paymentDateStr = toLocalISOString(new Date(payment.created_at));

            // Today's Payments
            if (paymentDateStr === todayStr) {
              const dateToUse = contract.contract_date || contract.created_at;
              const contractDateStr = dateToUse ? toLocalISOString(new Date(dateToUse)) : null;

              if (contractDateStr === todayStr) {
                // Performance Payment (Current Sales)
                branchObj.financials.paid_total += parseFloat(payment.payment_amount || 0);
                branchObj.financials.net_total += parseFloat(payment.net_amount || 0);
              } else {
                // Other Collection
                if (!branchObj.financials.other_collections_paid) branchObj.financials.other_collections_paid = 0;
                if (!branchObj.financials.other_collections_net) branchObj.financials.other_collections_net = 0;
                branchObj.financials.other_collections_paid += parseFloat(payment.payment_amount || 0);
                branchObj.financials.other_collections_net += parseFloat(payment.net_amount || 0);
              }
            }

            // Monthly (Cumulative) Payments
            if (paymentDateStr >= monthStartStr && paymentDateStr <= todayStr) {
              const dateToUse = contract.contract_date || contract.created_at;
              const contractDateStr = dateToUse ? toLocalISOString(new Date(dateToUse)) : null;

              if (contractDateStr >= monthStartStr && contractDateStr <= todayStr) {
                // Performance Payment
                branchObj.cumulative.paid_total += parseFloat(payment.payment_amount || 0);
                branchObj.cumulative.net_total += parseFloat(payment.net_amount || 0);
              } else {
                // Other Collection
                branchObj.cumulative.other_collections_paid += parseFloat(payment.payment_amount || 0);
                branchObj.cumulative.other_collections_net += parseFloat(payment.net_amount || 0);
              }
            }
          });
        }
      });

      const sortedBranches = Object.values(branchesData).sort((a, b) => a.id - b.id);

      // Calculate Today's Grand Totals
      let grandTotal = {
        visits_count: 0, extra_leads: 0, online_leads: 0, branch_leads: 0,
        net_total: 0, paid_total: 0, remaining_total: 0,
        other_collections_paid: 0,
        walk_ins: 0, hot_calls: 0, daily_calls: 0,
        total_reports: 0,
        total_contracts: 0,
        total_contracts_value: 0
      };

      // Recalculate based on filtered branch buckets
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
        grandTotal.other_collections_paid += (b.financials.other_collections_paid || 0);
        grandTotal.remaining_total += b.financials.remaining_total;

        grandTotal.total_reports += b.reports.length;
        grandTotal.total_contracts += b.contracts.length;
        grandTotal.total_contracts_value += b.financials.total_amount;
      });

      // Calculate Month-to-Date Grand Totals for Cumulative Section
      const monthGrandTotal = {
        total_reports: monthlyReportsArray.length,
        total_contracts: monthlyContracts.length,
        total_contracts_value: monthlyContracts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0),
        paid_total: sortedBranches.reduce((sum, b) => sum + b.cumulative.paid_total, 0),
        other_collections_paid: sortedBranches.reduce((sum, b) => sum + b.cumulative.other_collections_paid, 0),
        remaining_total: monthlyContracts.reduce((sum, c) => sum + parseFloat(c.remaining_amount || 0), 0),
        net_total: sortedBranches.reduce((sum, b) => sum + b.cumulative.net_total, 0),
        daily_calls: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.daily_calls) || 0), 0),
        hot_calls: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.hot_calls) || 0), 0),
        walk_ins: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.walk_ins) || 0), 0),
        branch_leads: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.branch_leads) || 0), 0),
        online_leads: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.online_leads) || 0), 0),
        extra_leads: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.extra_leads) || 0), 0),
        visits_count: monthlyReportsArray.reduce((sum, r) => sum + (parseInt(r.number_of_visits) || 0), 0),
      };

      // 3. PDF Usage Helpers
      const dayNames = ["الأحد", "الأثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const dayName = dayNames[targetDate.getDay()];
      const arabicDate = `${dayName} ${targetDate.getDate()} ${monthNames[targetDate.getMonth() + 1]} ${targetDate.getFullYear()} `;
      const formatArabicText = (text) => {
        if (!text || typeof text !== 'string') return text;
        let trimmedText = text.trim();
        trimmedText = trimmedText.replace(/\s+/g, ' ');
        trimmedText = trimmedText.replace(/[()]/g, '');
        return trimmedText;
      };
      const formatNumber = (num, currency = false) => {
        if (typeof num !== 'number' || isNaN(num)) return num;
        return num.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + (currency ? ' درهم' : '');
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
      const branchNameLabel = selectedBranchId ? getBranchName(selectedBranchId) : (userInfo?.is_sales_manager ? getBranchName(userBranchId) : '');
      const reportTitleBase = userInfo?.is_super_admin && !selectedBranchId ? 'التقرير اليومي الشامل' : 'التقرير اليومي';
      const reportTitle = branchNameLabel ? `${reportTitleBase} لفرع ${branchNameLabel}` : reportTitleBase;

      docDefinition.content.push(
        { text: formatArabicText(reportTitle), style: 'title', alignment: 'center' },
        { text: formatArabicText('مركز العمران للتدريب والتطوير'), style: 'subtitle', alignment: 'center' },
        { text: formatArabicText(`تاريخ التقرير: ${arabicDate} `), style: 'subtitle2', alignment: 'center' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], alignment: 'center', margin: [0, 0, 0, 15] }
      );


      // --- SECTION 2: CUMULATIVE STATISTICS ---
      if (userInfo?.is_super_admin || userInfo?.is_sales_manager) {
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
                { text: formatArabicText('تحصيلات أخرى'), style: 'statLabel' },
                { text: formatArabicText(formatNumber(monthGrandTotal.other_collections_paid || 0, true)), style: 'statValue', color: '#10B981' }
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
                { text: formatArabicText('تحصيلات أخرى'), style: 'statLabel' },
                { text: formatArabicText(formatNumber(grandTotal.other_collections_paid || 0, true)), style: 'statValue', color: '#10B981' }
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
            { text: formatArabicText('إجمالي المبيعات'), style: 'tableHeader' },
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
            { text: formatArabicText(formatNumber(b.financials.total_amount)), style: 'tableCell', color: '#5A7ACD' },
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
          { text: formatArabicText(formatNumber(grandTotal.total_contracts_value)), style: 'tableCell', bold: true, fillColor: '#F3F4F6', color: '#5A7ACD' },
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
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
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

        // Force a page break before any branch details in a comprehensive report (Super Admin)
        if (userInfo?.is_super_admin && !selectedBranchId) {
          docDefinition.content.push({ text: '', pageBreak: 'before' });
        }

        // Add Branch Title (Always included in comprehensive report)
        docDefinition.content.push(
          { text: formatArabicText(`تفاصيل فرع ${branch.name}`), style: 'branchTitle' },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#5A7ACD' }], alignment: 'center', margin: [0, 0, 0, 15] }
        );

        // --- Branch Cumulative Statistics ---
        docDefinition.content.push({ text: formatArabicText(`الإحصائيات التراكمية لفرع ${branch.name} (هذا الشهر)`), style: 'sectionTitle' });
        docDefinition.content.push({
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('صافي المبيعات'), style: 'statLabel' },
                { text: formatArabicText(formatNumber(branch.cumulative.net_total, true)), style: 'statValue', color: '#28a745' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('الزيارات'), style: 'statLabel' },
                { text: formatNumber(branch.cumulative.visits_count), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز +'), style: 'statLabel' },
                { text: formatNumber(branch.cumulative.extra_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز اونلاين'), style: 'statLabel' },
                { text: formatNumber(branch.cumulative.online_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ليدز الفرع'), style: 'statLabel' },
                { text: formatNumber(branch.cumulative.branch_leads), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ووك ان'), style: 'statLabel' },
                { text: formatNumber(branch.cumulative.walk_ins), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('هوت كول'), style: 'statLabel' },
                { text: formatNumber(branch.cumulative.hot_calls), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('اتصالات'), style: 'statLabel' },
                { text: formatNumber(branch.cumulative.daily_calls), style: 'statValue' }
              ],
              margin: [2, 0, 2, 5]
            }
          ],
          margin: [0, 0, 0, 15]
        });

        // 1. Employee Performance
        if (branch.reports.length > 0) {
          docDefinition.content.push({ text: formatArabicText('أداء الموظفين اليومي'), style: 'sectionTitle' });

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
            const staff = r.salesStaff || r.sales_staff;
            const staffName = staff ? staff.name : getSalesStaffName(r.sales_staff_id);
            staffBody.push([
              { text: formatArabicText(staffName), style: 'tableCell', bold: true },
              { text: formatNumber(parseInt(r.daily_calls) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.hot_calls) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.walk_ins) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.branch_leads) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.online_leads) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.extra_leads) || 0), style: 'tableCell' },
              { text: formatNumber(parseInt(r.number_of_visits) || 0), style: 'tableCell' },
              { text: formatArabicText(r.notes || '-'), style: 'tableCell', fontSize: 6, alignment: 'right' }
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


        // 4. Contracts
        docDefinition.content.push({ text: formatArabicText('العقود المنجزة'), style: 'sectionTitle' });

        if (branch.contracts.length > 0) {
          const contractsBody = [
            [
              { text: formatArabicText('رقم العقد'), style: 'tableHeader' },
              { text: formatArabicText('الطالب'), style: 'tableHeader' },
              { text: formatArabicText('الموظف'), style: 'tableHeader' },
              { text: formatArabicText('الدورة'), style: 'tableHeader' },
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
            const courseName = c.course ? c.course.name : '-';
            contractsBody.push([
              { text: formatArabicText(c.contract_number), style: 'tableCell' },
              { text: formatArabicText(c.student_name), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(staffName), style: 'tableCell' },
              { text: formatArabicText(courseName), style: 'tableCell' },
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
              widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
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

        // 4. Visit Details (Moved here to be after Contracts)
        const visitsList = [];
        branch.reports.forEach(r => {
          if (r.visits && r.visits.length > 0) {
            r.visits.forEach(v => {
              const staff = r.salesStaff || r.sales_staff;
              visitsList.push({
                staffName: staff ? staff.name : getSalesStaffName(r.sales_staff_id),
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
              { text: formatArabicText('اسم الموظف'), style: 'tableHeader' },
              { text: formatArabicText('الفرع المرسل إليه'), style: 'tableHeader' },
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

      const branchNameSuffix = selectedBranchId ? `_فرع_${getBranchName(selectedBranchId)}` : (userInfo?.is_sales_manager ? `_فرع_${getBranchName(userBranchId)}` : '');
      pdfMake.createPdf(docDefinition).download(`تقرير_يومي_شامل${branchNameSuffix}_${todayStr}.pdf`);
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
  const userBranchId = userInfo?.branch_id;

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
              <div style={{ marginRight: "auto", display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn"
                  onClick={() => generateDailyReportPDF()}
                  style={{
                    backgroundColor: "#5A7ACD",
                    color: "white",
                    border: "none",
                    fontSize: "13px",
                    padding: "0.4rem 1rem",
                    cursor: "pointer"
                  }}
                >
                  📄 تحميل تقرير اليوم
                </button>
                {(userInfo?.is_super_admin || userInfo?.is_sales_manager) && (
                  <button
                    className="btn"
                    onClick={() => setShowHistoricalDateModal(true)}
                    style={{
                      backgroundColor: "#1e3a5f",
                      color: "white",
                      border: "none",
                      fontSize: "13px",
                      padding: "0.4rem 1rem",
                      cursor: "pointer"
                    }}
                  >
                    📅 تقرير يوم سابق
                  </button>
                )}
              </div>
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
                        <div style={{ display: "flex", gap: "0.5rem" }}>
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
                          <button
                            className="btn"
                            onClick={() => {
                              setEditingContract(null);
                              resetContractForm();
                              setShowCancellationForm(true);
                            }}
                            style={{ backgroundColor: "#DC2626", color: "white", border: "none" }}
                          >
                            كنسلة
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* طلبات حذف بانتظار التأكيد (إشعارات) */}
        {(() => {
          const pendingForMe = contracts.filter(c =>
            c.deletion_requested_by_branch_id &&
            c.deletion_requested_by_branch_id !== userBranchId
          );

          const pendingByMe = contracts.filter(c =>
            c.deletion_requested_by_branch_id &&
            c.deletion_requested_by_branch_id === userBranchId
          );

          if (pendingForMe.length === 0 && pendingByMe.length === 0) return null;

          return (
            <div style={{ marginBottom: "1.5rem" }}>
              {pendingForMe.length > 0 && (
                <div className="panel" style={{ marginBottom: "1rem", backgroundColor: "#FEF2F2", border: "2px solid #EF4444" }}>
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #FEE2E2" }}>
                    <h3 style={{ margin: 0, color: "#991B1B", fontSize: "16px", fontWeight: 600 }}>
                      ⚠️ تنبيه: طلبات حذف بانتظار تأكيدك ({pendingForMe.length})
                    </h3>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "12px", color: "#B91C1C" }}>
                      فروع أخرى تطلب حذف هذه العقود المشتركة معك. يرجى التأكيد أو رفض الطلب.
                    </p>
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                      <table style={{ width: "100%", minWidth: "1000px" }}>
                        <thead style={{ backgroundColor: "#FEE2E2" }}>
                          <tr>
                            <th>رقم العقد</th>
                            <th>اسم الطالب</th>
                            <th>الفرع الطالب</th>
                            <th>موظف المبيعات</th>
                            <th>المبلغ</th>
                            <th>تاريخ العقد</th>
                            <th style={{ textAlign: "center" }}>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingForMe.map(c => (
                            <tr key={c.id}>
                              <td>{c.contract_number}</td>
                              <td>{c.student_name}</td>
                              <td>{getBranchName(c.deletion_requested_by_branch_id)}</td>
                              <td>{getSalesStaffName(c.sales_staff_id)}</td>
                              <td>{c.total_amount}</td>
                              <td>{c.contract_date ? new Date(c.contract_date).toISOString().split('T')[0] : '-'}</td>
                              <td style={{ textAlign: "center" }}>
                                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                  <button
                                    className="btn btn-small"
                                    onClick={() => handleCancelDeletionRequest(c.id)}
                                    style={{ backgroundColor: "#6B7280", color: "white", border: "none", padding: "0.4rem 1rem" }}
                                  >
                                    رفض الحذف
                                  </button>
                                  <button
                                    className="btn btn-small"
                                    onClick={() => handleDeleteContract(c.id)}
                                    style={{ backgroundColor: "#DC2626", color: "white", border: "none", padding: "0.4rem 1rem" }}
                                  >
                                    تأكيد الحذف النهائي
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

              {pendingByMe.length > 0 && (
                <div className="panel" style={{ backgroundColor: "#F0F9FF", border: "2px solid #3B82F6" }}>
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #E0F2FE" }}>
                    <h3 style={{ margin: 0, color: "#075985", fontSize: "15px", fontWeight: 600 }}>
                      🔄 طلبات حذف بانتظار تأكيد الفرع الآخر ({pendingByMe.length})
                    </h3>
                  </div>
                  <div style={{ padding: "0.75rem 1rem" }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {pendingByMe.map(c => (
                        <li key={c.id} style={{
                          marginBottom: "0.5rem",
                          padding: "0.5rem",
                          backgroundColor: "white",
                          borderRadius: "6px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          border: "1px solid #E0F2FE"
                        }}>
                          <span style={{ fontSize: "13px", color: "#0369A1" }}>
                            العقد رقم <strong>{c.contract_number}</strong> ({c.student_name}) - بانتظار الفرع المشترك.
                          </span>
                          <button
                            className="btn btn-small"
                            onClick={() => handleCancelDeletionRequest(c.id)}
                            style={{ backgroundColor: "#6B7280", color: "white", border: "none", padding: "0.2rem 0.6rem", fontSize: "11px" }}
                          >
                            إلغاء الطلب
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
          const unassignedSharedContracts = contracts.filter(c => {
            // If user is branch account, only show their unassigned ones
            if (userInfo?.is_branch_account) {
              const myBranchId = parseInt(userInfo.branch_id);
              const isRelevant = c.branch_id === myBranchId && !c.sales_staff_id;
              const isSharedType = c.contract_type === "shared" ||
                c.contract_type === "shared_same_branch" ||
                (c.registration_source && c.registration_source.includes("مشترك"));
              return isRelevant && isSharedType;
            }
            // For Super Admins, show if staff is missing
            const isAnyUnassigned = !c.sales_staff_id;
            const isSharedType = c.contract_type === "shared" ||
              c.contract_type === "shared_same_branch" ||
              (c.registration_source && c.registration_source.includes("مشترك"));
            return isAnyUnassigned && isSharedType;
          });

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
              return false;
            }
          });

          if (unassignedSharedContracts.length === 0 && todayContracts.length === 0) return null;

          const arabicDate = today.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          return (
            <>
              {unassignedSharedContracts.length > 0 && (
                <div className="panel" style={{
                  border: "1px solid #FEF3C7",
                  backgroundColor: "#FFFBEB",
                  marginBottom: "2rem",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{
                      backgroundColor: "#F59E0B",
                      color: "white",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </div>
                    <h3 style={{ margin: 0, color: "#92400E", fontSize: "16px", fontWeight: 700 }}>عقود مشتركة بانتظار إسناد موظف ({unassignedSharedContracts.length})</h3>
                  </div>

                  <div className="table-container" style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #FEF3C7" }}>
                    <table style={{ width: "100%", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#FEF3C7" }}>
                          <th style={{ color: "#92400E", padding: "0.75rem" }}>رقم العقد</th>
                          <th style={{ color: "#92400E", padding: "0.75rem" }}>الفرع الأساسي</th>
                          <th style={{ color: "#92400E", padding: "0.75rem" }}>اسم الطالب</th>
                          <th style={{ color: "#92400E", padding: "0.75rem" }}>المصدر</th>
                          <th style={{ color: "#92400E", padding: "0.75rem" }}>الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unassignedSharedContracts.map(contract => (
                          <tr key={contract.id} style={{ borderBottom: "1px solid #FEF3C7" }}>
                            <td style={{ textAlign: "center", padding: "0.75rem", fontWeight: 600 }}>{contract.contract_number}</td>
                            <td style={{ textAlign: "center", padding: "0.75rem" }}>{getBranchName(contract.branch_id)}</td>
                            <td style={{ textAlign: "center", padding: "0.75rem" }}>{contract.student_name}</td>
                            <td style={{ textAlign: "center", padding: "0.75rem" }}>{contract.registration_source}</td>
                            <td style={{ textAlign: "center", padding: "0.75rem" }}>
                              <button
                                className="btn btn-small"
                                onClick={() => handleEditContract(contract, true)}
                                style={{
                                  backgroundColor: "#F59E0B",
                                  color: "white",
                                  border: "none",
                                  padding: "0.3rem 0.8rem",
                                  fontSize: "11px"
                                }}
                              >
                                تعديل وإسناد
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {todayContracts.length > 0 && (
                <div className="panel" style={{ marginBottom: "1.5rem", backgroundColor: "#FFF7ED", border: "2px solid #FEB05D" }}>
                  <div style={{ padding: "1rem", borderBottom: "1px solid #E5E7EB" }}>
                    <h3 style={{ margin: 0, color: "#2B2A2A", fontSize: "18px", fontWeight: 600 }}>
                      العقود الخاصة باليوم - {arabicDate}
                    </h3>
                  </div>

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
                                      {contract.deletion_requested_by_branch_id ? (
                                        contract.deletion_requested_by_branch_id === userBranchId ? (
                                          <span style={{ fontSize: '11px', color: '#6B7280', alignSelf: 'center', backgroundColor: '#F3F4F6', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                            بانتظار التأكيد
                                          </span>
                                        ) : (
                                          <button
                                            className="btn btn-small"
                                            onClick={() => handleDeleteContract(contract.id)}
                                            style={{
                                              padding: "0.25rem 0.5rem",
                                              backgroundColor: "#10B981",
                                              color: "white",
                                              border: "none"
                                            }}
                                            title="تأكيد الحذف"
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                              </svg>
                                              <span style={{ fontSize: '11px' }}>تأكيد</span>
                                            </div>
                                          </button>
                                        )
                                      ) : (
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
                                      )}
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
              )}
            </>
          );
        })()}

        {/* Modal for selecting historical date */}
        {showHistoricalDateModal && (
          <div className="modal-overlay" onClick={() => setShowHistoricalDateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
              <div className="modal-header">
                <h3 style={{ fontSize: "1rem" }}>تحميل تقرير ليوم سابق</h3>
                <button className="modal-close" onClick={() => setShowHistoricalDateModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>اختر التاريخ</label>
                  <input
                    type="date"
                    value={selectedHistoricalDate}
                    onChange={(e) => setSelectedHistoricalDate(e.target.value)}
                    style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn primary"
                  onClick={() => {
                    generateDailyReportPDF(selectedHistoricalDate);
                    setShowHistoricalDateModal(false);
                  }}
                >
                  تحميل التقرير
                </button>
                <button className="btn" onClick={() => setShowHistoricalDateModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        )}

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
                                      {allBranches.map(b => (
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
              const branchGroups = groupContractsByBranchAndMonth(filteredContracts);

              return (
                <div>
                  {filteredContracts.length === 0 ? (
                    <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
                      <p style={{ color: "#6B7280", fontSize: "14px" }}>
                        لا توجد عقود حالياً
                      </p>
                    </div>
                  ) : branchGroups.length === 0 ? (
                    <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
                      <p style={{ color: "#6B7280", fontSize: "14px" }}>
                        لا توجد عقود متطابقة مع الفلاتر المحددة
                      </p>
                    </div>
                  ) : (
                    branchGroups.map((branchGroup) => (
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
                                        <tr style={{ backgroundColor: "#f2f2f2" }}>
                                          <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>رقم العقد</th>
                                          <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>الفرع</th>
                                          <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>موظف المبيعات</th>
                                          <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>اسم الطالب</th>
                                          <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>رقم الهاتف</th>
                                          <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>المصدر</th>
                                          <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>الدورة</th>
                                          <th style={{ padding: "0.4rem", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" }}>إجمالي العقد</th>
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
                    ))
                  )}
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
              <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h3 style={{ fontSize: "1rem", margin: 0 }}>{editingContract ? "تعديل العقد" : "إضافة عقد جديد"}</h3>
                  {editingContract && contractForm.contract_date && (
                    <div style={{
                      backgroundColor: "#DBEAFE",
                      color: "#1E40AF",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      border: "1px solid #BFDBFE",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      تاريخ العقد: {contractForm.contract_date?.split('-').reverse().join('/')}
                    </div>
                  )}
                </div>
                <button className="modal-close" style={{ position: 'static' }} onClick={() => {
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
                        onChange={(e) => {
                          const type = e.target.value;
                          setContractForm({
                            ...contractForm,
                            contract_type: type,
                            parent_contract_id: null,
                            searched_contracts: [],
                            registration_source: type === "old_payment" ? "عقد قديم (دفعة)" : contractForm.registration_source
                          });
                        }}
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

                  {contractForm.contract_type === "old_payment" && contractForm.is_shared_old && (
                    <div style={{
                      backgroundColor: "#EEF2FF",
                      border: "1px solid #C7D2FE",
                      borderRadius: "12px",
                      padding: "1rem",
                      marginBottom: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem"
                    }}>
                      <div style={{
                        backgroundColor: "#5A7ACD",
                        color: "white",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: "#1E1B4B", fontSize: "14px", fontWeight: 700 }}>تنبيه: العقد الأصلي مشترك</h4>
                        <p style={{ margin: "0.25rem 0 0", color: "#4338CA", fontSize: "13px" }}>
                          هذا العقد مشترك بين فرعين. يمكنك تقسيم هذه الدفعة وتحديد الموظف المسؤول في كل فرع من الحقول في الأسفل.
                        </p>
                      </div>
                    </div>
                  )}

                  {contractForm.contract_type === "old_payment" && !editingContract && (
                    <div style={{ marginBottom: "1.5rem", padding: "1.25rem", backgroundColor: "#F9FAFB", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
                      <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 700, color: "#374151", fontSize: "14px" }}>البحث عن العقد القديم</label>
                      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ flex: 1 }}>
                          <input
                            placeholder="رقم العقد"
                            value={contractForm.search_contract_number}
                            onChange={(e) => setContractForm({ ...contractForm, search_contract_number: e.target.value })}
                            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB", width: "100%", fontSize: "14px" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            placeholder="اسم العميل"
                            value={contractForm.search_student_name}
                            onChange={(e) => setContractForm({ ...contractForm, search_student_name: e.target.value })}
                            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB", width: "100%", fontSize: "14px" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            placeholder="رقم الهاتف"
                            value={contractForm.search_client_phone}
                            onChange={(e) => setContractForm({ ...contractForm, search_client_phone: e.target.value })}
                            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB", width: "100%", fontSize: "14px" }}
                          />
                        </div>
                      </div>

                      {contractForm.searched_contracts.length > 0 && (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "1rem",
                          maxHeight: "350px",
                          overflowY: "auto",
                          padding: "0.5rem",
                          backgroundColor: "#F3F4F6",
                          borderRadius: "8px"
                        }}>
                          {contractForm.searched_contracts.map(c => (
                            <div
                              key={c.id}
                              onClick={() => selectOldContract(c)}
                              style={{
                                padding: "1rem",
                                border: contractForm.parent_contract_id === c.id ? "2px solid #5A7ACD" : "1px solid #E5E7EB",
                                borderRadius: "10px",
                                cursor: "pointer",
                                backgroundColor: contractForm.parent_contract_id === c.id ? "#EEF2FF" : "white",
                                transition: "all 0.2s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                <span style={{ fontWeight: 800, color: "#1F2937", fontSize: "15px" }}>{c.contract_number}</span>
                                <span style={{ fontSize: "12px", padding: "2px 8px", backgroundColor: "#E5E7EB", borderRadius: "12px", color: "#4B5563" }}>
                                  {getBranchName(c.branch_id)}
                                </span>
                              </div>
                              <div style={{ fontWeight: 600, color: "#4B5563", marginBottom: "0.25rem", fontSize: "14px" }}>{c.student_name}</div>
                              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "0.5rem" }}>{c.client_phone || "بدون رقم هاتف"}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F3F4F6", paddingTop: "0.5rem" }}>
                                <span style={{ fontSize: "12px", color: "#9CA3AF" }}>المتبقي:</span>
                                <span style={{ fontWeight: 700, color: "#DC2626", fontSize: "14px" }}>
                                  {c.remaining_amount ? parseFloat(c.remaining_amount).toFixed(2) : "0.00"} درهم
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Helper to detect if this is a received shared contract being edited */}
                  {(() => {
                    // A contract is "received" if it has the shared suffix or indicates it's a shared copy from another branch
                    const isReceivedShared = editingContract &&
                      (editingContract.contract_number?.includes("-S") ||
                        contractForm.registration_source?.includes("مشترك") ||
                        contractForm.contract_type === "shared" ||
                        contractForm.contract_type === "shared_same_branch") &&
                      (editingContract.contract_number?.includes("-S") || editingContract.contract_number?.includes("-SP"));

                    const isFieldLocked = isReceivedShared || editingContract?.isAssignment;

                    return (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
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
                            disabled={(userInfo?.is_sales_manager && !userInfo?.is_super_admin && !userInfo?.is_backdoor) || (contractForm.contract_type === "old_payment" && contractForm.parent_contract_id) || isFieldLocked}
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
                            disabled={(contractForm.contract_type === "old_payment" && contractForm.parent_contract_id) || isFieldLocked}
                          />
                          <input
                            placeholder="رقم هاتف العميل"
                            value={contractForm.client_phone || ""}
                            onChange={(e) => setContractForm({ ...contractForm, client_phone: e.target.value })}
                            disabled={(contractForm.contract_type === "old_payment" && contractForm.parent_contract_id) || isFieldLocked}
                          />
                          <input
                            placeholder="رقم العقد"
                            value={contractForm.contract_number}
                            onChange={(e) => setContractForm({ ...contractForm, contract_number: e.target.value })}
                            required
                            disabled={(contractForm.contract_type === "old_payment" && contractForm.parent_contract_id) || isFieldLocked}
                          />

                          {(contractForm.contract_type === "shared" || (contractForm.contract_type === "old_payment" && contractForm.is_shared_old && !contractForm.is_shared_same_branch_old)) && (
                            <>
                              <select
                                value={contractForm.shared_branch_id}
                                onChange={(e) => setContractForm({ ...contractForm, shared_branch_id: e.target.value })}
                                required
                                disabled={isFieldLocked}
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
                                placeholder={contractForm.contract_type === "old_payment" ? "مبلغ الفرع الآخر من هذه الدفعة" : "المبلغ المشترك (نصف القيمة الإجمالية)"}
                                value={contractForm.shared_amount}
                                onChange={(e) => setContractForm({ ...contractForm, shared_amount: e.target.value })}
                                required
                                disabled={isFieldLocked}
                              />
                            </>
                          )}

                          {(contractForm.contract_type === "shared_same_branch" || (contractForm.contract_type === "old_payment" && contractForm.is_shared_same_branch_old)) && (
                            <>
                              <select
                                value={contractForm.shared_sales_staff_id}
                                onChange={(e) => setContractForm({ ...contractForm, shared_sales_staff_id: e.target.value })}
                                required
                                disabled={isFieldLocked}
                                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                              >
                                <option value="">اختر موظف المبيعات الثاني *</option>
                                {salesStaff.filter(s => {
                                  if (contractForm.branch_id && s.branch_id !== parseInt(contractForm.branch_id)) {
                                    return false;
                                  }
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
                            disabled={(contractForm.contract_type === "old_payment" && contractForm.parent_contract_id) || isFieldLocked}
                          />

                          {contractForm.contract_type !== "old_payment" ? (
                            <select
                              value={contractForm.registration_source || ""}
                              onChange={(e) => setContractForm({ ...contractForm, registration_source: e.target.value })}
                              required
                              disabled={isFieldLocked}
                              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                            >
                              <option value="">مصدر التسجيل *</option>
                              <option value="تجديد">تجديد</option>
                              <option value="ووك ان">ووك ان</option>
                              <option value="ليدز">ليدز</option>
                              <option value="داتا شخصية">داتا شخصية</option>
                              <option value="هوت كول">هوت كول</option>
                              <option value="كولد كول">كولد كول</option>
                            </select>
                          ) : (
                            <input
                              placeholder="مصدر التسجيل"
                              value={contractForm.registration_source || ""}
                              disabled={true}
                              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", backgroundColor: "#f9fafb" }}
                            />
                          )}

                          <select
                            value={contractForm.course_id || ""}
                            onChange={(e) => setContractForm({ ...contractForm, course_id: e.target.value })}
                            required
                            disabled={isFieldLocked}
                            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                          >
                            <option value="">اختر الدورة *</option>
                            {courses.filter(c => c.is_active || c.id === parseInt(contractForm.course_id)).map(c => (
                              <option key={c.course_id || c.id} value={c.course_id || c.id}>{c.name}</option>
                            ))}
                          </select>

                          <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '12px', fontWeight: 700, color: '#4B5563' }}>تاريخ العقد *</label>
                            <input
                              type="date"
                              value={contractForm.contract_date || ""}
                              onChange={(e) => setContractForm({ ...contractForm, contract_date: e.target.value })}
                              required
                              disabled={isFieldLocked}
                              style={{
                                padding: "0.75rem",
                                borderRadius: "8px",
                                border: "2px solid #BFDBFE",
                                fontFamily: "Cairo",
                                width: '100%',
                                backgroundColor: isFieldLocked ? '#f9fafb' : '#F0F9FF',
                                fontWeight: 700,
                                color: '#1E40AF'
                              }}
                            />
                          </div>
                        </div>

                        {/* Payments Section */}
                        <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#2B2A2A" }}>الدفعات</h4>
                            {!isFieldLocked && (
                              <button
                                type="button"
                                className="btn primary"
                                style={{
                                  padding: "0.5rem 1.25rem",
                                  fontSize: "12px",
                                  backgroundColor: "#5A7ACD",
                                  borderColor: "#5A7ACD",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem"
                                }}
                                onClick={() => {
                                  setContractForm({
                                    ...contractForm,
                                    payments: [...contractForm.payments, { payment_amount: "", payment_method_id: "", payment_number: "" }]
                                  });
                                }}
                              >
                                <span>+ إضافة دفعة</span>
                              </button>
                            )}
                          </div>

                          {contractForm.payments.map((p, index) => (
                            <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.75rem", marginBottom: "0.75rem" }}>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="المبلغ"
                                value={p.payment_amount}
                                onChange={(e) => {
                                  const newPayments = [...contractForm.payments];
                                  newPayments[index].payment_amount = e.target.value;
                                  setContractForm({ ...contractForm, payments: newPayments });
                                }}
                                required
                                disabled={isFieldLocked}
                                style={{ padding: "0.5rem" }}
                              />
                              <select
                                value={p.payment_method_id}
                                onChange={(e) => {
                                  const newPayments = [...contractForm.payments];
                                  newPayments[index].payment_method_id = e.target.value;
                                  setContractForm({ ...contractForm, payments: newPayments });
                                }}
                                required
                                disabled={isFieldLocked}
                                style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                              >
                                <option value="">طريقة الدفع</option>
                                {paymentMethods.map(pm => (
                                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                                ))}
                              </select>
                              <input
                                placeholder="رقم العملية (اختياري)"
                                value={p.payment_number || ""}
                                onChange={(e) => {
                                  const newPayments = [...contractForm.payments];
                                  newPayments[index].payment_number = e.target.value;
                                  setContractForm({ ...contractForm, payments: newPayments });
                                }}
                                disabled={isFieldLocked}
                                style={{ padding: "0.5rem" }}
                              />
                              {!isFieldLocked && contractForm.payments.length > 1 && (
                                <button
                                  type="button"
                                  className="btn-danger-small"
                                  onClick={() => {
                                    const newPayments = contractForm.payments.filter((_, i) => i !== index);
                                    setContractForm({ ...contractForm, payments: newPayments });
                                  }}
                                  style={{ padding: "0 0.5rem" }}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}

                          {/* عرض إحصائيات الدفعات: المتبقي والصافي */}
                          <div style={{
                            marginTop: "1.25rem",
                            padding: "1rem",
                            backgroundColor: "white",
                            borderRadius: "10px",
                            border: "1px solid #E5E7EB",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}>
                            <div style={{ textAlign: "center", borderLeft: "1px solid #F3F4F6", paddingLeft: "0.5rem" }}>
                              <div style={{ color: "#6B7280", fontSize: "12px", marginBottom: "0.25rem" }}>المتبقي من العقد</div>
                              <div style={{ fontWeight: 800, color: "#DC2626", fontSize: "16px" }}>
                                {(() => {
                                  const total = parseFloat(contractForm.total_amount) || 0;
                                  const paid = contractForm.payments.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0);
                                  return (total - paid).toFixed(2);
                                })()} <span style={{ fontSize: "12px", fontWeight: 400 }}>درهم</span>
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ color: "#6B7280", fontSize: "12px", marginBottom: "0.25rem" }}>إجمالي الصافي لموظف المبيعات</div>
                              <div style={{ fontWeight: 800, color: "#059669", fontSize: "16px" }}>
                                {(() => {
                                  const net = contractForm.payments.reduce((sum, p) => {
                                    const amount = parseFloat(p.payment_amount) || 0;
                                    const method = paymentMethods.find(m => m.id === parseInt(p.payment_method_id));
                                    if (!method) return sum + amount;
                                    const tax = parseFloat(method.tax_percentage) || 0;
                                    const disc = parseFloat(method.discount_percentage) || 0;
                                    const base = amount / (1 + tax);
                                    return sum + (base - (amount * disc));
                                  }, 0);
                                  return net.toFixed(2);
                                })()} <span style={{ fontSize: "12px", fontWeight: 400 }}>درهم</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: "1rem" }}>
                          <textarea
                            placeholder="ملاحظات العقد"
                            value={contractForm.notes}
                            onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                            disabled={isFieldLocked}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", minHeight: "80px" }}
                          ></textarea>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => { setShowContractForm(false); setEditingContract(null); }}>إلغاء</button>
                  <button type="submit" className="btn primary">{editingContract ? "تحديث العقد" : "إضافة العقد"}</button>
                </div>
              </form>
            </div>
          </div >
        )}

        {/* Cancellation Form Modal */}
        {showCancellationForm && (
          <div className="modal-overlay" onClick={() => {
            setShowCancellationForm(false);
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "1100px", overflowY: "auto", overflowX: "hidden" }}>
              <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h3 style={{ fontSize: "1rem", margin: 0, color: "#DC2626" }}>كنسلة عقد (إرجاع مبلغ)</h3>
                </div>
                <button className="modal-close" style={{ position: 'static' }} onClick={() => {
                  setShowCancellationForm(false);
                }}>×</button>
              </div>
              <form onSubmit={handleCreateCancellation}>
                <div className="modal-body">
                  <div style={{ marginBottom: "1.5rem", padding: "1.25rem", backgroundColor: "#FEF2F2", borderRadius: "12px", border: "1px solid #FECACA" }}>
                    <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 700, color: "#991B1B", fontSize: "14px" }}>البحث عن العقد المراد كنسلته</label>
                    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                      <div style={{ flex: 1 }}>
                        <input
                          placeholder="رقم العقد"
                          value={contractForm.search_contract_number}
                          onChange={(e) => setContractForm({ ...contractForm, search_contract_number: e.target.value })}
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #FCA5A5", width: "100%", fontSize: "14px" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          placeholder="اسم العميل"
                          value={contractForm.search_student_name}
                          onChange={(e) => setContractForm({ ...contractForm, search_student_name: e.target.value })}
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #FCA5A5", width: "100%", fontSize: "14px" }}
                        />
                      </div>
                    </div>

                    {contractForm.searched_contracts.length > 0 && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "1rem",
                        maxHeight: "350px",
                        overflowY: "auto",
                        padding: "0.5rem",
                        backgroundColor: "#F3F4F6",
                        borderRadius: "8px"
                      }}>
                        {contractForm.searched_contracts.map(c => (
                          <div
                            key={c.id}
                            onClick={() => selectOldContract(c)}
                            style={{
                              padding: "1rem",
                              border: contractForm.parent_contract_id === c.id ? "2px solid #5A7ACD" : "1px solid #E5E7EB",
                              borderRadius: "10px",
                              cursor: "pointer",
                              backgroundColor: contractForm.parent_contract_id === c.id ? "#EEF2FF" : "white",
                              transition: "all 0.2s",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <span style={{ fontWeight: 800, color: "#1F2937", fontSize: "15px" }}>{c.contract_number}</span>
                              <span style={{ fontSize: "12px", padding: "2px 8px", backgroundColor: "#E5E7EB", borderRadius: "12px", color: "#4B5563" }}>
                                {getBranchName(c.branch_id)}
                              </span>
                            </div>
                            <div style={{ fontWeight: 600, color: "#4B5563", marginBottom: "0.25rem", fontSize: "14px" }}>{c.student_name}</div>
                            <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "0.5rem" }}>{c.client_phone || "بدون رقم هاتف"}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F3F4F6", paddingTop: "0.5rem" }}>
                              <span style={{ fontSize: "12px", color: "#9CA3AF" }}>المتبقي:</span>
                              <span style={{ fontWeight: 700, color: "#DC2626", fontSize: "14px" }}>
                                {c.remaining_amount ? parseFloat(c.remaining_amount).toFixed(2) : "0.00"} درهم
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {contractForm.parent_contract_id && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{
                        padding: "1.25rem",
                        backgroundColor: "white",
                        borderRadius: "12px",
                        border: "1px solid #E5E7EB",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "1rem",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                      }}>
                        <div style={{ gridColumn: "span 4", borderBottom: "1px solid #F3F4F6", paddingBottom: "0.75rem", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 800, color: "#1F2937", fontSize: "16px" }}>تفاصيل العقد المختار</span>
                          <span style={{ backgroundColor: "#DC2626", color: "white", padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>{contractForm.contract_number}</span>
                        </div>

                        <div>
                          <div style={{ color: "#6B7280", fontSize: "11px", marginBottom: "0.25rem" }}>اسم الطالب</div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>{contractForm.student_name}</div>
                        </div>
                        <div>
                          <div style={{ color: "#6B7280", fontSize: "11px", marginBottom: "0.25rem" }}>الدورة</div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>{getCourseName(contractForm.course_id)}</div>
                        </div>
                        <div>
                          <div style={{ color: "#6B7280", fontSize: "11px", marginBottom: "0.25rem" }}>الفرع</div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>{getBranchName(contractForm.branch_id)}</div>
                        </div>
                        <div>
                          <div style={{ color: "#6B7280", fontSize: "11px", marginBottom: "0.25rem" }}>الموظف المسؤول</div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>{getSalesStaffName(contractForm.sales_staff_id)}</div>
                        </div>

                        <div style={{ gridColumn: "span 4", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid #F3F4F6" }}>
                          <div style={{ textAlign: "center", backgroundColor: "#F9FAFB", padding: "0.5rem", borderRadius: "8px" }}>
                            <div style={{ color: "#6B7280", fontSize: "11px" }}>إجمالي العقد</div>
                            <div style={{ fontWeight: 800, color: "#374151", fontSize: "15px" }}>{parseFloat(contractForm.original_total_amount || 0).toFixed(2)} <span style={{ fontSize: "10px" }}>درهم</span></div>
                          </div>
                          <div style={{ textAlign: "center", backgroundColor: "#F0FDF4", padding: "0.5rem", borderRadius: "8px" }}>
                            <div style={{ color: "#059669", fontSize: "11px" }}>إجمالي المدفوع</div>
                            <div style={{ fontWeight: 800, color: "#059669", fontSize: "15px" }}>{parseFloat(contractForm.original_paid_amount || 0).toFixed(2)} <span style={{ fontSize: "10px" }}>درهم</span></div>
                          </div>
                          <div style={{ textAlign: "center", backgroundColor: "#FEF2F2", padding: "0.5rem", borderRadius: "8px" }}>
                            <div style={{ color: "#DC2626", fontSize: "11px" }}>المتبقي</div>
                            <div style={{ fontWeight: 800, color: "#DC2626", fontSize: "15px" }}>
                              {(parseFloat(contractForm.original_total_amount || 0) - parseFloat(contractForm.original_paid_amount || 0)).toFixed(2)} <span style={{ fontSize: "10px" }}>درهم</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {contractForm.parent_contract_id && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '12px', fontWeight: 700, color: '#4B5563' }}>فرع الكنسلة *</label>
                        <select
                          value={contractForm.branch_id}
                          onChange={(e) => {
                            const branchId = e.target.value;
                            setContractForm({ ...contractForm, branch_id: branchId, sales_staff_id: "" });
                            if (branchId) loadSalesStaff(parseInt(branchId));
                          }}
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                          required
                        >
                          <option value="">اختر الفرع *</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '12px', fontWeight: 700, color: '#4B5563' }}>الموظف المسؤول *</label>
                        <select
                          value={contractForm.sales_staff_id}
                          onChange={(e) => setContractForm({ ...contractForm, sales_staff_id: e.target.value })}
                          required
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", width: "100%" }}
                        >
                          <option value="">اختر الموظف *</option>
                          {salesStaff.filter(s => !contractForm.branch_id || s.branch_id === parseInt(contractForm.branch_id)).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '12px', fontWeight: 700, color: '#4B5563' }}>تاريخ الكنسلة *</label>
                        <input
                          type="date"
                          value={contractForm.contract_date || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setContractForm({ ...contractForm, contract_date: e.target.value })}
                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", width: "100%" }}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {contractForm.parent_contract_id && (
                    <div style={{ marginTop: "1.5rem", padding: "1.25rem", backgroundColor: "#FFF5F5", borderRadius: "12px", border: "1px solid #FECACA" }}>
                      <h4 style={{ margin: "0 0 1rem 0", fontSize: "15px", fontWeight: 800, color: "#DC2626", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        مبلغ الكنسلة (المسترجع)
                      </h4>
                      {contractForm.payments.map((p, index) => (
                        <div key={index} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1rem" }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>المبلغ المراد كنسلته (يدوي) *</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="أدخل المبلغ هنا..."
                              value={p.payment_amount}
                              onChange={(e) => {
                                const newPayments = [...contractForm.payments];
                                newPayments[index].payment_amount = e.target.value;
                                setContractForm({ ...contractForm, payments: newPayments });
                              }}
                              required
                              style={{
                                padding: "0.75rem",
                                fontSize: "16px",
                                fontWeight: 800,
                                border: "2px solid #FCA5A5",
                                borderRadius: "8px",
                                width: "100%",
                                color: "#DC2626",
                                backgroundColor: "white"
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '12px', fontWeight: 700, color: '#4B5563' }}>طريقة الإرجاع *</label>
                            <select
                              value={p.payment_method_id}
                              onChange={(e) => {
                                const newPayments = [...contractForm.payments];
                                newPayments[index].payment_method_id = e.target.value;
                                setContractForm({ ...contractForm, payments: newPayments });
                              }}
                              required
                              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #D1D5DB", fontFamily: "Cairo", width: "100%" }}
                            >
                              <option value="">طريقة الإرجاع</option>
                              {paymentMethods.map(pm => (
                                <option key={pm.id} value={pm.id}>{pm.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '12px', fontWeight: 700, color: '#4B5563' }}>رقم العملية (اختياري)</label>
                            <input
                              placeholder="رقم العملية..."
                              value={p.payment_number || ""}
                              onChange={(e) => {
                                const newPayments = [...contractForm.payments];
                                newPayments[index].payment_number = e.target.value;
                                setContractForm({ ...contractForm, payments: newPayments });
                              }}
                              style={{ padding: "0.75rem", border: "1px solid #D1D5DB", borderRadius: "8px", width: "100%" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: "1rem" }}>
                    <textarea
                      placeholder="سبب الكنسلة / ملاحظات إضافية"
                      value={contractForm.notes}
                      onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo", minHeight: "80px" }}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setShowCancellationForm(false)}>إلغاء</button>
                  <button type="submit" className="btn" style={{ backgroundColor: "#DC2626", color: "white", border: "none" }}>إتمام الكنسلة</button>
                </div>
              </form>
            </div>
          </div>
        )
        }
      </div >
    </>
  );
}
