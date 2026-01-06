import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete, apiPatch } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import BranchModal from "../components/BranchModal";
import AccountModal from "../components/AccountModal";
import CourseModal from "../components/CourseModal";
import PaymentMethodModal from "../components/PaymentMethodModal";
import SalesStaffModal from "../components/SalesStaffModal";

export default function AdminPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error, confirm } = useNotification();
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [salesStaff, setSalesStaff] = useState([]);
  const [courses, setCourses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  // Modal state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showSalesStaffModal, setShowSalesStaffModal] = useState(false);

  // Editing state
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [editingSalesStaff, setEditingSalesStaff] = useState(null);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    branches: false,
    accounts: false,
    salesStaff: false,
    courses: false,
    paymentMethods: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const loadBranches = async () => {
    try {
      const data = await apiGet("/branches", token);
      setBranches(data);
    } catch (err) {
      console.error("Error loading branches:", err);
      setBranches([]);
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await apiGet("/operation-accounts", token);
      setAccounts(data);
    } catch (error) {
      console.error("Error loading accounts:", error);
      setAccounts([]);
    }
  };

  const loadSalesStaff = async () => {
    try {
      let url = "/sales-staff";
      // إذا كان مدير مبيعات، جلب موظفي فرعه فقط
      if (userInfo && userInfo.is_sales_manager && !userInfo.is_super_admin && userInfo.branch_id) {
        url += `?branch_id=${userInfo.branch_id}`;
      }
      const data = await apiGet(url, token);
      setSalesStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading sales staff:", error);
      setSalesStaff([]);
    }
  };

  const loadCourses = async () => {
    try {
      console.log("[AdminPage] Loading courses...");
      const data = await apiGet("/courses", token);
      console.log("[AdminPage] Courses loaded:", data);
      console.log("[AdminPage] Courses count:", Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data)) {
        setCourses(data);
        console.log("[AdminPage] Courses state updated:", data);
      } else {
        console.warn("[AdminPage] Courses data is not an array:", data);
        setCourses([]);
      }
    } catch (err) {
      console.error("[AdminPage] Error loading courses:", err);
      console.error("[AdminPage] Error details:", err.message, err.stack);
      setCourses([]);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      console.log("[AdminPage] Loading payment methods...");
      const data = await apiGet("/payment-methods", token);
      console.log("[AdminPage] Payment methods loaded:", data);
      console.log("[AdminPage] Payment methods count:", Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data)) {
        setPaymentMethods(data);
        console.log("[AdminPage] Payment methods state updated:", data);
      } else {
        console.warn("[AdminPage] Payment methods data is not an array:", data);
        setPaymentMethods([]);
      }
    } catch (err) {
      console.error("[AdminPage] Error loading payment methods:", err);
      console.error("[AdminPage] Error details:", err.message, err.stack);
      setPaymentMethods([]);
    }
  };

  useEffect(() => {
    if (!token) return;

    apiGet("/auth/me", token)
      .then((userData) => {
        setUserInfo(userData);
      })
      .catch(console.error);

    loadBranches();
    loadAccounts();
  }, [token]);

  // تحميل الكورسات وطرق الدفع عند تحميل userInfo
  useEffect(() => {
    if (!token || !userInfo) {
      console.log("[AdminPage] useEffect - token or userInfo missing:", { token: !!token, userInfo: !!userInfo });
      return;
    }

    console.log("[AdminPage] useEffect - userInfo:", userInfo);
    console.log("[AdminPage] useEffect - is_super_admin:", userInfo.is_super_admin);

    if (userInfo.is_super_admin) {
      console.log("[AdminPage] Loading courses and payment methods...");
      loadCourses();
      loadPaymentMethods();
    } else {
      console.log("[AdminPage] User is not super admin, skipping courses and payment methods");
    }

    // جلب موظفي المبيعات للسوبر أدمن أو مدير المبيعات
    if (userInfo.is_super_admin || (userInfo.is_sales_manager && !userInfo.is_super_admin)) {
      loadSalesStaff();
    }
  }, [userInfo, token]);

  // Branch handlers
  const handleBranchSubmit = async (formData) => {
    try {
      if (editingBranch) {
        await apiPatch(`/branches/${editingBranch.id}`, formData, token);
        success("تم تحديث الفرع بنجاح!");
      } else {
        await apiPost("/branches", formData, token);
        success("تم إنشاء الفرع بنجاح!");
      }
      setEditingBranch(null);
      setShowBranchModal(false);
      loadBranches();
    } catch (err) {
      error("حدث خطأ أثناء " + (editingBranch ? "تحديث" : "إنشاء") + " الفرع");
    }
  };

  const handleDeleteBranch = async (branchId) => {
    confirm(
      "هل أنت متأكد من حذف هذا الفرع؟",
      async () => {
        try {
          await apiDelete(`/branches/${branchId}`, token);
          success("تم حذف الفرع بنجاح!");
          loadBranches();
        } catch (err) {
          error("حدث خطأ أثناء حذف الفرع");
        }
      }
    );
  };

  // Account handlers
  const handleAccountSubmit = async (formData) => {
    try {
      const accountData = {
        username: formData.username,
        branch_id: parseInt(formData.branch_id),
        is_super_admin: formData.account_type === "super_admin",
        is_sales_manager: formData.account_type === "sales_manager",
        is_operation_manager: formData.account_type === "operation_manager",
        is_branch_account: formData.account_type === "branch_account",
        is_backdoor: false,
        is_active: formData.is_active !== undefined ? formData.is_active : true
      };

      if (editingAccount) {
        if (formData.password && formData.password.length > 0) {
          accountData.password = formData.password;
        }
        await apiPatch(`/operation-accounts/${editingAccount.id}`, accountData, token);
        success("تم تحديث الحساب بنجاح!");
      } else {
        accountData.password = formData.password;
        await apiPost("/operation-accounts", accountData, token);
        success("تم إنشاء الحساب بنجاح!");
      }
      setEditingAccount(null);
      setShowAccountModal(false);
      loadAccounts();
    } catch (err) {
      error("حدث خطأ أثناء " + (editingAccount ? "تحديث" : "إنشاء") + " الحساب: " + (err.message || ""));
    }
  };

  const handleDeleteAccount = async (accountId) => {
    confirm(
      "هل أنت متأكد من حذف هذا الحساب؟",
      async () => {
        try {
          await apiDelete(`/operation-accounts/${accountId}`, token);
          success("تم حذف الحساب بنجاح!");
          loadAccounts();
        } catch (err) {
          error("حدث خطأ أثناء حذف الحساب");
        }
      }
    );
  };

  // Course handlers
  const handleCourseSubmit = async (formData) => {
    try {
      if (editingCourse) {
        await apiPatch(`/courses/${editingCourse.id}`, formData, token);
        success("تم تحديث الكورس بنجاح!");
      } else {
        await apiPost("/courses", formData, token);
        success("تم إنشاء الكورس بنجاح!");
      }
      setEditingCourse(null);
      setShowCourseModal(false);
      loadCourses();
    } catch (err) {
      error("حدث خطأ أثناء " + (editingCourse ? "تحديث" : "إنشاء") + " الكورس: " + (err.message || ""));
    }
  };

  const handleDeleteCourse = async (courseId) => {
    confirm(
      "هل أنت متأكد من حذف هذا الكورس؟",
      async () => {
        try {
          await apiDelete(`/courses/${courseId}`, token);
          success("تم حذف الكورس بنجاح!");
          loadCourses();
        } catch (err) {
          error("حدث خطأ أثناء حذف الكورس");
        }
      }
    );
  };

  const handleMoveCourse = async (courseId, direction) => {
    const currentIndex = courses.findIndex(c => c.id === courseId);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === courses.length - 1) return;

    const newCourses = [...courses];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newCourses[currentIndex], newCourses[swapIndex]] = [newCourses[swapIndex], newCourses[currentIndex]];

    // Optimistic update
    setCourses(newCourses);

    try {
      await apiPost("/courses/reorder", { ids: newCourses.map(c => c.id) }, token);
    } catch (err) {
      error("حدث خطأ أثناء إعادة ترتيب الكورسات");
      loadCourses(); // Rollback
    }
  };

  // Payment Method handlers
  const handlePaymentMethodSubmit = async (formData) => {
    try {
      const submitData = {
        ...formData,
        discount_percentage: parseFloat(formData.discount_percentage) || 0
      };
      if (editingPaymentMethod) {
        await apiPatch(`/payment-methods/${editingPaymentMethod.id}`, submitData, token);
        success("تم تحديث طريقة الدفع بنجاح!");
      } else {
        await apiPost("/payment-methods", submitData, token);
        success("تم إنشاء طريقة الدفع بنجاح!");
      }
      setEditingPaymentMethod(null);
      setShowPaymentMethodModal(false);
      loadPaymentMethods();
    } catch (err) {
      error("حدث خطأ أثناء " + (editingPaymentMethod ? "تحديث" : "إنشاء") + " طريقة الدفع: " + (err.message || ""));
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    confirm(
      "هل أنت متأكد من حذف طريقة الدفع هذه؟",
      async () => {
        try {
          await apiDelete(`/payment-methods/${paymentMethodId}`, token);
          success("تم حذف طريقة الدفع بنجاح!");
          loadPaymentMethods();
        } catch (err) {
          error("حدث خطأ أثناء حذف طريقة الدفع");
        }
      }
    );
  };

  // Sales Staff handlers
  const handleSalesStaffSubmit = async (formData) => {
    try {
      // إذا كان مدير مبيعات (وليس سوبر أدمن)، يجب أن يكون branch_id هو فرعه فقط
      let branchId = parseInt(formData.branch_id);
      if (isSalesManager && !isSuperAdmin && userInfo?.branch_id) {
        branchId = userInfo.branch_id;
      }

      const submitData = {
        branch_id: branchId,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        is_active: formData.is_active
      };
      if (editingSalesStaff) {
        await apiPatch(`/sales-staff/${editingSalesStaff.id}`, submitData, token);
        success("تم تحديث موظف المبيعات بنجاح!");
      } else {
        await apiPost("/sales-staff", submitData, token);
        success("تم إنشاء موظف المبيعات بنجاح!");
      }
      setEditingSalesStaff(null);
      setShowSalesStaffModal(false);
      loadSalesStaff();
    } catch (err) {
      error("حدث خطأ أثناء " + (editingSalesStaff ? "تحديث" : "إنشاء") + " موظف المبيعات: " + (err.message || ""));
    }
  };

  const handleDeleteSalesStaff = async (staffId) => {
    confirm(
      "هل أنت متأكد من حذف موظف المبيعات هذا؟",
      async () => {
        try {
          await apiDelete(`/sales-staff/${staffId}`, token);
          success("تم حذف موظف المبيعات بنجاح!");
          loadSalesStaff();
        } catch (err) {
          error("حدث خطأ أثناء حذف موظف المبيعات");
        }
      }
    );
  };


  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };


  if (!userInfo || (!userInfo.is_super_admin && !userInfo.is_sales_manager && !userInfo.is_operation_manager)) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "#6B7280", fontSize: "14px" }}>ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = userInfo?.is_super_admin;
  const isSalesManager = userInfo?.is_sales_manager;

  // Debug: Log courses and payment methods
  console.log("[AdminPage] Render - courses:", courses);
  console.log("[AdminPage] Render - paymentMethods:", paymentMethods);
  console.log("[AdminPage] Render - isSuperAdmin:", isSuperAdmin);
  console.log("[AdminPage] Render - courses.length:", courses.length);
  console.log("[AdminPage] Render - paymentMethods.length:", paymentMethods.length);

  return (
    <div className="container">
      <h1 className="main-title" style={{ marginBottom: "2rem" }}>الإعدادات - مركز العمران للتدريب والتطوير</h1>

      {/* Branches Section - فقط للسوبر أدمن */}
      {isSuperAdmin && (
        <div className="panel panel-collapsible" style={{ marginBottom: "2rem" }}>
          <div
            className="panel-header-clickable"
            onClick={() => toggleSection('branches')}
          >
            <h2 style={{ margin: 0, color: "#2B2A2A", fontSize: "18px", fontWeight: 600 }}>إدارة الفروع</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                className="btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingBranch(null);
                  setShowBranchModal(true);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "0.5rem" }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                إضافة فرع جديد
              </button>
              <svg
                className={`chevron-icon ${expandedSections.branches ? 'expanded' : ''}`}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          {expandedSections.branches && (
            <div className="panel-content">
              <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: "600px" }}>
                  <thead>
                    <tr>
                      <th>اسم الفرع</th>
                      <th data-type="number">سعر الساعة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(branch => (
                      <tr key={branch.id}>
                        <td style={{ fontWeight: 600, color: "#2B2A2A" }}>{branch.name}</td>
                        <td data-type="number">{parseFloat(branch.default_hourly_rate || 0).toFixed(2)} درهم</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                            <button
                              className="btn btn-small"
                              style={{ backgroundColor: "#FEB05D", color: "white", border: "none" }}
                              onClick={() => {
                                setEditingBranch(branch);
                                setShowBranchModal(true);
                              }}
                              title="تعديل"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteBranch(branch.id)}
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
        </div>
      )}

      {/* Accounts Section - للسوبر أدمن فقط */}
      {isSuperAdmin && (
        <div className="panel panel-collapsible" style={{ marginBottom: "2rem" }}>
          <div
            className="panel-header-clickable"
            onClick={() => toggleSection('accounts')}
          >
            <h2 style={{ margin: 0, color: "#2B2A2A", fontSize: "18px", fontWeight: 600 }}>إدارة الحسابات</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                className="btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingAccount(null);
                  setShowAccountModal(true);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "0.5rem" }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                إنشاء حساب جديد
              </button>
              <svg
                className={`chevron-icon ${expandedSections.accounts ? 'expanded' : ''}`}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          {expandedSections.accounts && (
            <div className="panel-content">
              <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: "600px" }}>
                  <thead>
                    <tr>
                      <th>اسم المستخدم</th>
                      <th>الفرع</th>
                      <th>النوع</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(account => (
                      <tr key={account.id}>
                        <td style={{ fontWeight: 600, color: "#2B2A2A" }}>{account.username}</td>
                        <td>{getBranchName(account.branch_id)}</td>
                        <td>
                          {account.is_super_admin ? "Super Admin" :
                            account.is_operation_manager ? "مدير أوبريشن" :
                              account.is_sales_manager ? "مدير مبيعات" :
                                account.is_branch_account ? "حساب الفرع" :
                                  "موظف عادي"}
                        </td>
                        <td>
                          <span className={`status ${account.is_active ? "status-active" : "status-rejected"}`}>
                            {account.is_active ? "نشط" : "معطل"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                            <button
                              className="btn btn-small"
                              style={{ backgroundColor: "#FEB05D", color: "white", border: "none" }}
                              onClick={() => {
                                setEditingAccount(account);
                                setShowAccountModal(true);
                              }}
                              title="تعديل"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteAccount(account.id)}
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
        </div>
      )}

      {/* Sales Staff Section - للسوبر أدمن ومدير المبيعات */}
      {(isSuperAdmin || (isSalesManager && !isSuperAdmin)) && (
        <div className="panel panel-collapsible" style={{ marginBottom: "2rem" }}>
          <div
            className="panel-header-clickable"
            onClick={() => toggleSection('salesStaff')}
          >
            <h2 style={{ margin: 0, color: "#2B2A2A", fontSize: "18px", fontWeight: 600 }}>إدارة موظفي المبيعات</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {(isSuperAdmin || isSalesManager) && (
                <button
                  className="btn primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSalesStaff(null);
                    setShowSalesStaffModal(true);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "0.5rem" }}>
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  إضافة موظف مبيعات
                </button>
              )}
              <svg
                className={`chevron-icon ${expandedSections.salesStaff ? 'expanded' : ''}`}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          {expandedSections.salesStaff && (
            <div className="panel-content">
              <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: "600px" }}>
                  <thead>
                    <tr>
                      <th>اسم الموظف</th>
                      <th>الفرع</th>
                      <th>رقم الهاتف</th>
                      <th>البريد الإلكتروني</th>
                      <th>الحالة</th>
                      {(isSuperAdmin || isSalesManager) && <th>الإجراءات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {salesStaff.map(staff => (
                      <tr key={staff.id}>
                        <td style={{ fontWeight: 600, color: "#2B2A2A" }}>{staff.name}</td>
                        <td>{getBranchName(staff.branch_id)}</td>
                        <td>{staff.phone || "-"}</td>
                        <td>{staff.email || "-"}</td>
                        <td>
                          <span className={`status ${staff.is_active ? "status-active" : "status-rejected"}`}>
                            {staff.is_active ? "نشط" : "معطل"}
                          </span>
                        </td>
                        {(isSuperAdmin || (isSalesManager && staff.branch_id === userInfo?.branch_id)) && (
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                              <button
                                className="btn btn-small"
                                style={{ backgroundColor: "#FEB05D", color: "white", border: "none" }}
                                onClick={() => {
                                  setEditingSalesStaff(staff);
                                  setShowSalesStaffModal(true);
                                }}
                                title="تعديل"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => handleDeleteSalesStaff(staff.id)}
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
                    {salesStaff.length === 0 && (
                      <tr>
                        <td colSpan={(isSuperAdmin || isSalesManager) ? "6" : "5"} style={{ textAlign: "center", padding: "2rem", color: "#6B7280" }}>
                          لا يوجد موظفي مبيعات
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses Section - فقط للسوبر أدمن */}
      {isSuperAdmin && (
        <div className="panel panel-collapsible" style={{ marginBottom: "2rem" }}>
          <div
            className="panel-header-clickable"
            onClick={() => toggleSection('courses')}
          >
            <h2 style={{ margin: 0, color: "#2B2A2A", fontSize: "18px", fontWeight: 600 }}>إدارة الكورسات</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                className="btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCourse(null);
                  setShowCourseModal(true);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "0.5rem" }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                إضافة كورس جديد
              </button>
              <svg
                className={`chevron-icon ${expandedSections.courses ? 'expanded' : ''}`}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>


          {expandedSections.courses && (
            <div className="panel-content">
              <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                {courses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#6B7280" }}>
                    <p style={{ margin: 0, fontSize: "14px" }}>لا توجد كورسات حالياً</p>
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "12px" }}>تأكد من تنفيذ ملف SQL migration لإضافة الكورسات الافتراضية</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", minWidth: "600px" }}>
                    <thead>
                      <tr>
                        <th>الترتيب</th>
                        <th>اسم الكورس</th>
                        <th>النوع</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => (
                        <tr key={course.id}>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                              <button
                                className="btn btn-small"
                                style={{ padding: "1px 4px", fontSize: "10px", background: index === 0 ? "#E5E7EB" : "#F3F4F6", cursor: index === 0 ? "not-allowed" : "pointer" }}
                                onClick={() => handleMoveCourse(course.id, 'up')}
                                disabled={index === 0}
                              >
                                ▲
                              </button>
                              <button
                                className="btn btn-small"
                                style={{ padding: "1px 4px", fontSize: "10px", background: index === courses.length - 1 ? "#E5E7EB" : "#F3F4F6", cursor: index === courses.length - 1 ? "not-allowed" : "pointer" }}
                                onClick={() => handleMoveCourse(course.id, 'down')}
                                disabled={index === courses.length - 1}
                              >
                                ▼
                              </button>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: "#2B2A2A" }}>{course.name}</td>
                          <td>{course.type || "-"}</td>
                          <td>
                            <span className={`status ${course.is_active ? "status-active" : "status-rejected"}`}>
                              {course.is_active ? "نشط" : "معطل"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                              <button
                                className="btn btn-small"
                                style={{ backgroundColor: "#FEB05D", color: "white", border: "none" }}
                                onClick={() => {
                                  setEditingCourse(course);
                                  setShowCourseModal(true);
                                }}
                                title="تعديل"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => handleDeleteCourse(course.id)}
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
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Methods Section - فقط للسوبر أدمن */}
      {isSuperAdmin && (
        <div className="panel panel-collapsible" style={{ marginBottom: "2rem" }}>
          <div
            className="panel-header-clickable"
            onClick={() => toggleSection('paymentMethods')}
          >
            <h2 style={{ margin: 0, color: "#2B2A2A", fontSize: "18px", fontWeight: 600 }}>إدارة طرق الدفع</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                className="btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPaymentMethod(null);
                  setShowPaymentMethodModal(true);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "0.5rem" }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                إضافة طريقة دفع جديدة
              </button>
              <svg
                className={`chevron-icon ${expandedSections.paymentMethods ? 'expanded' : ''}`}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>


          {expandedSections.paymentMethods && (
            <div className="panel-content">
              <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                {paymentMethods.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#6B7280" }}>
                    <p style={{ margin: 0, fontSize: "14px" }}>لا توجد طرق دفع حالياً</p>
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "12px" }}>تأكد من تنفيذ ملف SQL migration لإضافة طرق الدفع الافتراضية</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", minWidth: "600px", textAlign: "center" }}>
                    <thead style={{ textAlign: "center" }}>
                      <tr style={{ textAlign: "center" }}>
                        <th style={{ textAlign: "center" }}>اسم طريقة الدفع</th>
                        <th style={{ textAlign: "center" }} data-type="number">الضريبة الأساسية</th>
                        <th style={{ textAlign: "center" }} data-type="number">نسبة الخصم</th>
                        <th style={{ textAlign: "center" }}>الحالة</th>
                        <th style={{ textAlign: "center" }}>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentMethods.map(pm => (
                        <tr key={pm.id}>
                          <td style={{ fontWeight: 600, color: "#2B2A2A" }}>{pm.name}</td>
                          <td data-type="number">{(parseFloat(pm.tax_percentage || 0) * 100).toFixed(2)}%</td>
                          <td data-type="number">{(parseFloat(pm.discount_percentage || 0) * 100).toFixed(2)}%</td>
                          <td>
                            <span className={`status ${pm.is_active ? "status-active" : "status-rejected"}`}>
                              {pm.is_active ? "نشط" : "معطل"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                              <button
                                className="btn btn-small"
                                style={{ backgroundColor: "#FEB05D", color: "white", border: "none" }}
                                onClick={() => {
                                  setEditingPaymentMethod(pm);
                                  setShowPaymentMethodModal(true);
                                }}
                                title="تعديل"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => handleDeletePaymentMethod(pm.id)}
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
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BranchModal
        isOpen={showBranchModal}
        onClose={() => {
          setShowBranchModal(false);
          setEditingBranch(null);
        }}
        onSubmit={handleBranchSubmit}
        branch={editingBranch}
      />

      <AccountModal
        isOpen={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setEditingAccount(null);
        }}
        onSubmit={handleAccountSubmit}
        account={editingAccount}
        branches={branches.filter(b => isSuperAdmin || b.id === userInfo?.branch_id)}
        isSuperAdmin={isSuperAdmin}
        userBranchId={userInfo?.branch_id}
      />

      <CourseModal
        isOpen={showCourseModal}
        onClose={() => {
          setShowCourseModal(false);
          setEditingCourse(null);
        }}
        onSubmit={handleCourseSubmit}
        course={editingCourse}
      />

      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => {
          setShowPaymentMethodModal(false);
          setEditingPaymentMethod(null);
        }}
        onSubmit={handlePaymentMethodSubmit}
        paymentMethod={editingPaymentMethod}
      />

      <SalesStaffModal
        show={showSalesStaffModal}
        onClose={() => {
          setShowSalesStaffModal(false);
          setEditingSalesStaff(null);
        }}
        onSubmit={handleSalesStaffSubmit}
        editingStaff={editingSalesStaff}
        branches={branches}
        isSuperAdmin={isSuperAdmin}
        userBranchId={userInfo?.branch_id}
      />
    </div>
  );
}
