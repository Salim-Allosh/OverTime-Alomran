import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import { SalaryPDF } from "../utils/SalaryPDF";
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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

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

  const handleEmployeeDetailsClick = (employeeId) => {
    setShowDetailsModal(false);
    setSelectedEmployeeId(employeeId);
    setShowProcessModal(true);
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
      success('جاري تحضير التقرير، يرجى الانتظار...');
      const response = await apiGet(`/salaries/monthly-report?month=${group.month}&year=${group.year}`, token);
      const detailedData = response.data;

      if (!detailedData || detailedData.length === 0) {
        showError('لا توجد بيانات رواتب لهذا الشهر');
        return;
      }

      SalaryPDF.generateMonthly(group, detailedData);
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء إنشاء ملف PDF: ' + err.message);
    }
  };

  const generateMonthlyExcel = async (group) => {
    try {
      success('جاري تحضير ملف Excel، يرجى الانتظار...');
      const response = await apiGet(`/salaries/monthly-report?month=${group.month}&year=${group.year}`, token);
      
      // API structure is { month, year, data: [ { branch_name, salaries: [] } ] }
      const branches = response.data || [];

      if (!branches || branches.length === 0) {
        showError('لا توجد بيانات رواتب لهذا الشهر');
        return;
      }

      // CSV Headers
      const headers = [
        "الفرع", "رقم الموظف", "اسم الموظف", "ايام الشهر", "الراتب الاساسي", 
        "ايام الدوام", "الراتب المستحق", "ايام الاضافي", "مبلغ الاضافي", 
        "سبب الاضافة", "مبلغ الخصم", "سبب الخصم", "الملاحظات", "الصافي"
      ];

      const daysInMonth = new Date(group.year, group.month, 0).getDate();

      // Convert to CSV
      const rows = branches.flatMap(branch => 
        (branch.salaries || []).map(emp => {
          const items = emp.items || [];
          
          // Calculate OT (Automatic Additions)
          const otItems = items.filter(it => it.type === 'addition' && it.is_automatic);
          const otDays = otItems.reduce((sum, it) => sum + (parseFloat(it.days) || 0), 0);
          const otAmount = otItems.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
          
          // Manual Additions
          const manualAdditions = items.filter(it => it.type === 'addition' && !it.is_automatic);
          const additionReasons = manualAdditions.map(it => it.reason).join(" | ");
          
          // Deductions
          const deductionItems = items.filter(it => it.type === 'deduction');
          const deductionAmount = deductionItems.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
          const deductionReasons = deductionItems.map(it => it.reason).join(" | ");
          
          return [
            branch.branch_name || "",
            emp.employment_number || "",
            emp.employee_name || "",
            daysInMonth,
            emp.base_salary || 0,
            emp.working_days || 0,
            emp.entitled_salary || 0,
            otDays,
            otAmount,
            additionReasons,
            deductionAmount,
            deductionReasons,
            emp.notes || "",
            emp.net_salary || 0
          ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
        })
      );

      const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `رواتب_${group.month_name}_${group.year}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      success('تم تحميل ملف Excel بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء إنشاء ملف Excel: ' + err.message);
    }
  };

  const generateSingleBranchPDF = async (branch, group) => {
    try {
      success('جاري تحضير التقرير، يرجى الانتظار...');
      const response = await apiGet(`/salaries/branch-data?branch_id=${branch.branch_id}&month=${group.month}&year=${group.year}`, token);
      const employees = response;

      if (!employees || employees.length === 0) {
        showError('لا توجد بيانات رواتب لهذا الفرع');
        return;
      }

      SalaryPDF.generateSingleBranch(branch, group, employees);
    } catch (err) {
      console.error(err);
      showError('خطأ في إنشاء ملف الـ PDF: ' + err.message);
    }
  };

  const generateYearlyPDF = async () => {
    if (!monthlyGroups || monthlyGroups.length === 0) {
      showError('لا توجد بيانات متاحة للسنة المختارة');
      return;
    }

    try {
      setLoading(true);
      success('جاري تجميع بيانات السنة كاملة، قد يستغرق ذلك بضع ثوانٍ...');
      
      const allYearData = [];
      // Sequential fetch to avoid hitting rate limits or overwhelming the server
      for (let m = 1; m <= 12; m++) {
        try {
          const response = await apiGet(`/salaries/monthly-report?month=${m}&year=${appliedYear}`, token);
          if (response && response.data) {
            allYearData.push({ month: m, branches: response.data });
          }
        } catch (mErr) {
          console.warn(`No data for month ${m}`);
        }
      }

      if (allYearData.length === 0) {
        showError('لم يتم العثور على بيانات تفصيلية للسنة المختارة');
        return;
      }

      SalaryPDF.generateYearlyDetailed(appliedYear, allYearData);
    } catch (err) {
      console.error(err);
      showError('خطأ في إنشاء التقرير السنوي التفصيلي');
    } finally {
      setLoading(false);
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

  if (!userInfo || (!userInfo.is_super_admin && !userInfo.is_hr_manager) || userInfo.is_backdoor) {
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
                        backgroundColor: "#3B82F6", 
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
                    <button 
                      className="btn-small"
                      title="تحميل Excel"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateMonthlyExcel(group);
                      }}
                      style={{ 
                        padding: "0.3rem 0.6rem", 
                        fontSize: "0.75rem", 
                        backgroundColor: "#10B981", 
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
                      <span style={{fontSize: "12px"}}>📊</span> Excel
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
          onClose={() => {
            setShowProcessModal(false);
            setSelectedEmployeeId(null);
          }}
          onSubmit={onSalarySubmit}
          branchName={selectedBranchInfo?.branch_name}
          employees={selectedBranchEmployees}
          month={activeMonthDetails.month}
          year={activeMonthDetails.year}
          monthName={activeMonthDetails.name}
          initialEmployeeId={selectedEmployeeId}
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
          onEmployeeClick={handleEmployeeDetailsClick}
        />
      )}
    </div>
  );
}
