import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { useNotification } from "../contexts/NotificationContext";

export default function DailySalesReportsPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [reports, setReports] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [branches, setBranches] = useState([]);
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
    teacher_name: "",
    student_name: "",
    contract_number: "",
    start_date: "",
    end_date: "",
    hourly_rate: ""
  });
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    
    if (activeTab === "reports") {
      loadReports();
    } else if (activeTab === "contracts") {
      loadContracts();
    }
  }, [token, dateFrom, dateTo, activeTab]);

  // تحميل التقارير عند تغيير selectedBranchId
  useEffect(() => {
    if (!token) return;
    if (activeTab === "reports") {
      loadReports();
    }
  }, [selectedBranchId]);

  // تحميل العقود عند تغيير selectedContractBranchId
  useEffect(() => {
    if (!token) return;
    if (activeTab === "contracts") {
      loadContracts();
    }
  }, [selectedContractBranchId]);

  const loadSalesStaff = async (branchId = null) => {
    try {
      let url = "/sales-staff";
      if (branchId) {
        url += `?branch_id=${branchId}`;
      } else if (userInfo && userInfo.is_sales_manager && !userInfo.is_super_admin && !userInfo.is_backdoor && userInfo.branch_id) {
        // إذا كان مدير مبيعات، فلتر حسب فرعه
        url += `?branch_id=${userInfo.branch_id}`;
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
      if (dateFrom) params.push(`date_from=${dateFrom}`);
      if (dateTo) params.push(`date_to=${dateTo}`);
      if (params.length > 0) url += "?" + params.join("&");
      
      const data = await apiGet(url, token);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading reports:", err);
      setReports([]);
    }
  };

  const loadContracts = async () => {
    try {
      let url = "/contracts";
      const params = [];
      if (selectedContractBranchId) params.push(`branch_id=${selectedContractBranchId}`);
      if (params.length > 0) url += "?" + params.join("&");
      
      const data = await apiGet(url, token);
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading contracts:", err);
      setContracts([]);
    }
  };

  // Check if report exists for staff on the same date
  const checkDuplicateReport = async (salesStaffId, reportDate) => {
    try {
      const url = `/daily-sales-reports?date_from=${reportDate}&date_to=${reportDate}`;
      const data = await apiGet(url, token);
      const existingReport = Array.isArray(data) ? data.find(r => 
        r.sales_staff_id === salesStaffId && r.report_date === reportDate
      ) : null;
      return existingReport !== null;
    } catch (err) {
      console.error("Error checking duplicate report:", err);
      return false;
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Check for duplicate report
    if (form.sales_staff_id && form.report_date) {
      const isDuplicate = await checkDuplicateReport(parseInt(form.sales_staff_id), form.report_date);
      if (isDuplicate) {
        showError("يوجد تقرير بالفعل لهذا الموظف في نفس التاريخ");
        return;
      }
    }
    
    try {
      await apiPost("/daily-sales-reports", {
        branch_id: parseInt(form.branch_id),
        sales_staff_id: parseInt(form.sales_staff_id),
        report_date: form.report_date,
        sales_amount: 0, // قيمة افتراضية
        number_of_deals: parseInt(form.number_of_deals),
        daily_calls: parseInt(form.daily_calls),
        hot_calls: parseInt(form.hot_calls),
        walk_ins: parseInt(form.walk_ins),
        branch_leads: parseInt(form.branch_leads),
        online_leads: parseInt(form.online_leads),
        extra_leads: parseInt(form.extra_leads),
        number_of_visits: parseInt(form.number_of_visits),
        notes: form.notes || null,
        visits: form.visits.map((v, idx) => ({
          branch_id: parseInt(v.branch_id),
          update_details: v.update_details || null,
          visit_order: idx + 1
        }))
      }, token);
      success("تم إنشاء التقرير بنجاح!");
      resetForm();
      setShowForm(false);
      loadReports();
    } catch (err) {
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

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/contracts", {
        ...contractForm,
        branch_id: parseInt(contractForm.branch_id),
        hourly_rate: parseFloat(contractForm.hourly_rate),
        end_date: contractForm.end_date || null
      }, token);
      success("تم إنشاء العقد بنجاح!");
      resetContractForm();
      setShowContractForm(false);
      loadContracts();
    } catch (err) {
      showError("حدث خطأ أثناء إنشاء العقد: " + err.message);
    }
  };

  const handleUpdateContract = async (e) => {
    e.preventDefault();
    if (!editingContract) return;
    
    try {
      const updateData = {
        ...contractForm,
        branch_id: parseInt(contractForm.branch_id),
        hourly_rate: contractForm.hourly_rate ? parseFloat(contractForm.hourly_rate) : undefined,
        end_date: contractForm.end_date || null
      };
      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      
      await apiPatch(`/contracts/${editingContract.id}`, updateData, token);
      success("تم تحديث العقد بنجاح!");
      setShowContractForm(false);
      setEditingContract(null);
      loadContracts();
    } catch (err) {
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
    setContractForm({
      branch_id: contract.branch_id.toString(),
      teacher_name: contract.teacher_name,
      student_name: contract.student_name,
      contract_number: contract.contract_number,
      start_date: contract.start_date,
      end_date: contract.end_date || "",
      hourly_rate: contract.hourly_rate.toString()
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
    setForm({
      ...form,
      visits: [...form.visits, { branch_id: "", update_details: "" }]
    });
  };

  const removeVisit = (index) => {
    setForm({
      ...form,
      visits: form.visits.filter((_, i) => i !== index),
      number_of_visits: (form.visits.length - 1).toString()
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
      setForm({ ...form, number_of_visits: value, visits: newVisits });
    } else if (numVisits < currentVisits) {
      // حذف زيارات
      const newVisits = form.visits.slice(0, numVisits);
      setForm({ ...form, number_of_visits: value, visits: newVisits });
    } else {
      setForm({ ...form, number_of_visits: value });
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
    
    setContractForm({
      branch_id: defaultBranchId,
      teacher_name: "",
      student_name: "",
      contract_number: "",
      start_date: "",
      end_date: "",
      hourly_rate: ""
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

  return (
    <>
      <div className="container">
        {/* Daily Reports Tab */}
        {activeTab === "reports" && (
          <div className="panel">
            <div className="filters-bar">
              {/* Tabs */}
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.5rem" }}>
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
                    transition: "all 0.2s"
                  }}
                >
                  العقود
                </button>
              </div>

              {/* Filters and Actions */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                {activeTab === "reports" ? (
                  <>
                    {(!userInfo?.is_sales_manager || userInfo?.is_super_admin || userInfo?.is_backdoor) && (
                      <select 
                        value={selectedBranchId || ""} 
                        onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع الفروع</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                    <input
                      type="date"
                      placeholder="من تاريخ"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                    />
                    <input
                      type="date"
                      placeholder="إلى تاريخ"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                    />
                    {!userInfo?.is_branch_account && isSalesManager && (
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
                  </>
                ) : (
                  <>
                    {(!userInfo?.is_sales_manager || userInfo?.is_super_admin || userInfo?.is_backdoor) && (
                      <select 
                        value={selectedContractBranchId || ""} 
                        onChange={(e) => setSelectedContractBranchId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع الفروع</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                    {!userInfo?.is_branch_account && isSalesManager && (
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
                  </>
                )}
              </div>
            </div>

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
                      disabled={editingReport !== null || !form.branch_id}
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    >
                      <option value="">اختر موظف المبيعات</option>
                      {salesStaff.filter(s => {
                        // إذا كان هناك فرع محدد في النموذج، اعرض فقط موظفي ذلك الفرع
                        if (form.branch_id) {
                          return s.branch_id === parseInt(form.branch_id);
                        }
                        // إذا كان مدير مبيعات، اعرض فقط موظفي فرعه
                        if (userInfo && userInfo.is_sales_manager && !userInfo.is_super_admin && !userInfo.is_backdoor && userInfo.branch_id) {
                          return s.branch_id === userInfo.branch_id;
                        }
                        // خلاف ذلك، اعرض الجميع (للسوبر أدمن)
                        return true;
                      }).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
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
                      disabled={editingReport !== null}
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد الصفقات *</label>
                    <input
                      type="number"
                      value={form.number_of_deals}
                      onChange={(e) => setForm({ ...form, number_of_deals: e.target.value })}
                      required
                      min="0"
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد الاتصالات اليومية *</label>
                    <input
                      type="number"
                      value={form.daily_calls}
                      onChange={(e) => setForm({ ...form, daily_calls: e.target.value })}
                      required
                      min="0"
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد الهوت كول *</label>
                    <input
                      type="number"
                      value={form.hot_calls}
                      onChange={(e) => setForm({ ...form, hot_calls: e.target.value })}
                      required
                      min="0"
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد الووك ان *</label>
                    <input
                      type="number"
                      value={form.walk_ins}
                      onChange={(e) => setForm({ ...form, walk_ins: e.target.value })}
                      required
                      min="0"
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد ليدز الفرع *</label>
                    <input
                      type="number"
                      value={form.branch_leads}
                      onChange={(e) => setForm({ ...form, branch_leads: e.target.value })}
                      required
                      min="0"
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد ليدز الاونلاين *</label>
                    <input
                      type="number"
                      value={form.online_leads}
                      onChange={(e) => setForm({ ...form, online_leads: e.target.value })}
                      required
                      min="0"
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد الليدز الاضافي *</label>
                    <input
                      type="number"
                      value={form.extra_leads}
                      onChange={(e) => setForm({ ...form, extra_leads: e.target.value })}
                      required
                      min="0"
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>عدد الزيارات *</label>
                    <input
                      type="number"
                      value={form.number_of_visits}
                      onChange={(e) => handleNumberOfVisitsChange(e.target.value)}
                      required
                      min="0"
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>ملاحظات</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", minHeight: "80px", fontSize: "13px", width: "100%" }}
                    />
                  </div>
                </div>

                {/* Visits Section */}
                {parseInt(form.number_of_visits) > 0 && (
                  <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                    <h5 style={{ color: "#2B2A2A", marginBottom: "1rem", fontSize: "14px", fontWeight: 600 }}>
                      تفاصيل الزيارات ({form.visits.length})
                    </h5>
                    {form.visits.map((visit, index) => (
                      <div key={index} style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#F9FAFB", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <h6 style={{ color: "#5A7ACD", fontSize: "13px", fontWeight: 600, margin: 0 }}>
                            زيارة {index + 1}
                          </h6>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                          <div className="form-group">
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>الفرع المزار *</label>
                            <select
                              value={visit.branch_id || ""}
                              onChange={(e) => updateVisit(index, "branch_id", e.target.value)}
                              required
                              style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px", width: "100%" }}
                            >
                              <option value="">اختر الفرع</option>
                              {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2A2A", marginBottom: "0.5rem" }}>التحديث الخاص بالزيارة</label>
                            <textarea
                              value={visit.update_details || ""}
                              onChange={(e) => updateVisit(index, "update_details", e.target.value)}
                              style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", minHeight: "60px", fontSize: "13px", width: "100%" }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
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

            {reports.length === 0 ? (
              <div className="table-container">
                <table>
                  <tbody>
                    <tr>
                      <td colSpan={userInfo?.is_branch_account ? 12 : 13} style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>
                        لا توجد تقارير حالياً
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: "1000px" }}>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>الفرع</th>
                      <th>موظف المبيعات</th>
                      <th style={{ textAlign: "left" }}>عدد الصفقات</th>
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
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td>{report.report_date}</td>
                        <td>{getBranchName(report.branch_id)}</td>
                        <td>{getSalesStaffName(report.sales_staff_id)}</td>
                        <td className="number" data-type="number">{report.number_of_deals || 0}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === "contracts" && (
          <div className="panel">
            <div className="filters-bar">
              {/* Tabs */}
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", borderBottom: "2px solid #E5E7EB", paddingBottom: "0.5rem" }}>
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
                    transition: "all 0.2s"
                  }}
                >
                  العقود
                </button>
              </div>

              {/* Filters and Actions */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                {activeTab === "reports" ? (
                  <>
                    {(!userInfo?.is_sales_manager || userInfo?.is_super_admin || userInfo?.is_backdoor) && (
                      <select 
                        value={selectedBranchId || ""} 
                        onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع الفروع</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                    <input
                      type="date"
                      placeholder="من تاريخ"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                    />
                    <input
                      type="date"
                      placeholder="إلى تاريخ"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                    />
                    {!userInfo?.is_branch_account && isSalesManager && (
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
                  </>
                ) : (
                  <>
                    {(!userInfo?.is_sales_manager || userInfo?.is_super_admin || userInfo?.is_backdoor) && (
                      <select 
                        value={selectedContractBranchId || ""} 
                        onChange={(e) => setSelectedContractBranchId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #E5E7EB", fontFamily: "Cairo", fontSize: "13px" }}
                      >
                        <option value="">جميع الفروع</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                    {!userInfo?.is_branch_account && isSalesManager && (
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
                  </>
                )}
              </div>
            </div>


            {contracts.length === 0 ? (
              <div className="table-container">
                <table>
                  <tbody>
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>لا توجد عقود حالياً</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>الفرع</th>
                      <th>المدرس</th>
                      <th>الطالب</th>
                      <th>رقم العقد</th>
                      <th>تاريخ البدء</th>
                      <th>تاريخ الانتهاء</th>
                      <th style={{ textAlign: "left" }}>سعر الساعة</th>
                      {!userInfo?.is_branch_account && <th>الإجراءات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map(contract => (
                      <tr key={contract.id}>
                        <td>{getBranchName(contract.branch_id)}</td>
                        <td>{contract.teacher_name}</td>
                        <td>{contract.student_name}</td>
                        <td>{contract.contract_number}</td>
                        <td>{contract.start_date}</td>
                        <td>{contract.end_date || "-"}</td>
                        <td className="number" data-type="number">{contract.hourly_rate} درهم</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contract Form Modal - خارج الـ panels */}
        {showContractForm && (
          <div className="modal-overlay" onClick={() => {
            setShowContractForm(false);
            setEditingContract(null);
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
              <div className="modal-header">
                <h3 style={{ fontSize: "1rem" }}>{editingContract ? "تعديل العقد" : "إضافة عقد جديد"}</h3>
                <button className="modal-close" onClick={() => {
                  setShowContractForm(false);
                  setEditingContract(null);
                }}>×</button>
              </div>
              <form onSubmit={editingContract ? handleUpdateContract : handleCreateContract}>
                <div className="modal-body">
                  <div className="grid">
                    <select
                      value={contractForm.branch_id}
                      onChange={(e) => setContractForm({ ...contractForm, branch_id: e.target.value })}
                      required
                      disabled={userInfo?.is_sales_manager && !userInfo?.is_super_admin && !userInfo?.is_backdoor}
                      style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                    >
                      <option value="">اختر الفرع</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <input
                      placeholder="اسم المدرس"
                      value={contractForm.teacher_name}
                      onChange={(e) => setContractForm({ ...contractForm, teacher_name: e.target.value })}
                      required
                    />
                    <input
                      placeholder="اسم الطالب"
                      value={contractForm.student_name}
                      onChange={(e) => setContractForm({ ...contractForm, student_name: e.target.value })}
                      required
                    />
                    <input
                      placeholder="رقم العقد"
                      value={contractForm.contract_number}
                      onChange={(e) => setContractForm({ ...contractForm, contract_number: e.target.value })}
                      required
                    />
                    <input
                      type="date"
                      placeholder="تاريخ البدء"
                      value={contractForm.start_date}
                      onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })}
                      required
                    />
                    <input
                      type="date"
                      placeholder="تاريخ الانتهاء (اختياري)"
                      value={contractForm.end_date}
                      onChange={(e) => setContractForm({ ...contractForm, end_date: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="سعر الساعة"
                      value={contractForm.hourly_rate}
                      onChange={(e) => setContractForm({ ...contractForm, hourly_rate: e.target.value })}
                      required
                    />
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
      </div>
    </>
  );
}
