import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete, apiPatch } from "../api";
import { useNotification } from "../contexts/NotificationContext";

export default function AdminPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error, confirm } = useNotification();
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [branchForm, setBranchForm] = useState({ name: "", default_hourly_rate: "" });
  const [accountForm, setAccountForm] = useState({ 
    username: "", 
    password: "", 
    branch_id: "", 
    is_super_admin: false, 
    is_sales_manager: false,
    is_operation_manager: false,
    is_branch_account: false,
    is_backdoor: false,
    is_active: true
  });

  useEffect(() => {
    if (!token) return;
    
    apiGet("/auth/me", token)
      .then(setUserInfo)
      .catch(console.error);
    
    apiGet("/branches", token)
      .then(setBranches)
      .catch(console.error);
    
    loadAccounts();
  }, [token]);

  const loadAccounts = async () => {
    try {
      const data = await apiGet("/operation-accounts", token);
      setAccounts(data);
    } catch (error) {
      console.error("Error loading accounts:", error);
      setAccounts([]);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/branches", branchForm, token);
      success("تم إنشاء الفرع بنجاح!");
      setBranchForm({ name: "", default_hourly_rate: "" });
      setShowBranchForm(false);
      apiGet("/branches", token).then(setBranches).catch(console.error);
    } catch (err) {
      error("حدث خطأ أثناء إنشاء الفرع");
    }
  };

  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    try {
      await apiPatch(`/branches/${editingBranch.id}`, branchForm, token);
      success("تم تحديث الفرع بنجاح!");
      setEditingBranch(null);
      setBranchForm({ name: "", default_hourly_rate: "" });
      setShowBranchForm(false);
      apiGet("/branches", token).then(setBranches).catch(console.error);
    } catch (err) {
      error("حدث خطأ أثناء تحديث الفرع");
    }
  };

  const handleDeleteBranch = async (branchId) => {
    confirm(
      "هل أنت متأكد من حذف هذا الفرع؟",
      async () => {
        try {
          await apiDelete(`/branches/${branchId}`, token);
          success("تم حذف الفرع بنجاح!");
          apiGet("/branches", token).then(setBranches).catch(console.error);
        } catch (err) {
          error("حدث خطأ أثناء حذف الفرع");
        }
      }
    );
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/operation-accounts", {
        username: accountForm.username,
        password: accountForm.password,
        branch_id: parseInt(accountForm.branch_id),
        is_super_admin: accountForm.is_super_admin || false,
        is_sales_manager: accountForm.is_sales_manager || false,
        is_operation_manager: accountForm.is_operation_manager || false,
        is_branch_account: accountForm.is_branch_account || false,
        is_backdoor: false,
        is_active: accountForm.is_active !== undefined ? accountForm.is_active : true
      }, token);
      success("تم إنشاء الحساب بنجاح!");
      setAccountForm({ 
        username: "", 
        password: "", 
        branch_id: userInfo?.is_sales_manager ? userInfo.branch_id.toString() : "", 
        is_super_admin: false, 
        is_sales_manager: false,
        is_operation_manager: false,
        is_branch_account: false,
        is_backdoor: false,
        is_active: true
      });
      setShowAccountForm(false);
      loadAccounts();
    } catch (err) {
      error("حدث خطأ أثناء إنشاء الحساب: " + (err.message || ""));
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        username: accountForm.username,
        branch_id: parseInt(accountForm.branch_id),
        is_super_admin: accountForm.is_super_admin,
        is_sales_manager: accountForm.is_sales_manager,
        is_operation_manager: accountForm.is_operation_manager,
        is_branch_account: accountForm.is_branch_account,
        is_backdoor: false, // لا يمكن تعديل Backdoor من الواجهة
        is_active: accountForm.is_active
      };
      if (accountForm.password && accountForm.password.length > 0) {
        updateData.password = accountForm.password;
      }
      await apiPatch(`/operation-accounts/${editingAccount.id}`, updateData, token);
      success("تم تحديث الحساب بنجاح!");
      setEditingAccount(null);
      setAccountForm({ username: "", password: "", branch_id: "", is_super_admin: false });
      setShowAccountForm(false);
      loadAccounts();
    } catch (err) {
      error("حدث خطأ أثناء تحديث الحساب");
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

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  if (!userInfo || (!userInfo.is_super_admin && !userInfo.is_sales_manager && !userInfo.is_operation_manager)) {
    return (
      <>
        <h1 className="main-title">لوحة التحكم - مركز العمران للتدريب والتطوير</h1>
        <div className="container">
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      </>
    );
  }

  const isSuperAdmin = userInfo.is_super_admin;
  const isSalesManager = userInfo.is_sales_manager;

  return (
    <>
      <h1 className="main-title">لوحة التحكم - مركز العمران للتدريب والتطوير</h1>
      <div className="container">
        <div className="panel">
          <h3>{isSuperAdmin ? "لوحة تحكم Super Admin" : "إعدادات الفرع"}</h3>
          
          {/* Branches Section - فقط للسوبر أدمن */}
          {isSuperAdmin && (
          <div style={{ marginTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4>إدارة الفروع</h4>
              <button className="btn primary" onClick={() => {
                setEditingBranch(null);
                setBranchForm({ name: "", default_hourly_rate: "" });
                setShowBranchForm(true);
              }}>
                إضافة فرع جديد
              </button>
            </div>

            {showBranchForm && (
              <form className="panel" style={{ marginBottom: "1rem", backgroundColor: "#f8f9fa" }} onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch}>
                <h4>{editingBranch ? "تعديل الفرع" : "إضافة فرع جديد"}</h4>
                <div className="grid">
                  <input
                    placeholder="اسم الفرع"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="سعر الساعة الافتراضي"
                    value={branchForm.default_hourly_rate}
                    onChange={(e) => setBranchForm({ ...branchForm, default_hourly_rate: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                  <button className="btn primary" type="submit">
                    {editingBranch ? "تحديث" : "إضافة"}
                  </button>
                  <button className="btn" type="button" onClick={() => {
                    setShowBranchForm(false);
                    setEditingBranch(null);
                  }}>
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            <div className="table">
              <div className="row head" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                <span>اسم الفرع</span>
                <span>سعر الساعة</span>
                <span>الحسابات</span>
                <span>الإجراءات</span>
              </div>
              {branches.map(branch => (
                <div key={branch.id} className="row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  <span>{branch.name}</span>
                  <span>{branch.default_hourly_rate} درهم</span>
                  <span>-</span>
                  <span>
                    <button 
                      className="btn-small" 
                      style={{ backgroundColor: "#007bff", color: "white", marginRight: "0.5rem" }}
                      onClick={() => {
                        setEditingBranch(branch);
                        setBranchForm({ name: branch.name, default_hourly_rate: branch.default_hourly_rate });
                        setShowBranchForm(true);
                      }}
                    >
                      تعديل
                    </button>
                    <button 
                      className="btn-small btn-danger"
                      onClick={() => handleDeleteBranch(branch.id)}
                    >
                      حذف
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Accounts Section */}
          <div style={{ marginTop: isSuperAdmin ? "3rem" : "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4>{isSuperAdmin ? "إدارة الحسابات" : "إدارة موظفي الفرع"}</h4>
              {(isSuperAdmin || isSalesManager) && (
                <button className="btn primary" onClick={() => {
                  setEditingAccount(null);
                  setAccountForm({ 
                    username: "", 
                    password: "", 
                    branch_id: isSalesManager ? userInfo.branch_id.toString() : "", 
                    is_super_admin: false,
                    is_sales_manager: false,
                    is_operation_manager: false,
                    is_branch_account: false,
                    is_backdoor: false,
                    is_active: true
                  });
                  setShowAccountForm(true);
                }}>
                  إنشاء حساب جديد
                </button>
              )}
            </div>

            {showAccountForm && (
              <form className="panel" style={{ marginBottom: "1rem", backgroundColor: "#f8f9fa" }} onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}>
                <h4>{editingAccount ? "تعديل الحساب" : "إنشاء حساب جديد"}</h4>
                <div className="grid">
                  <input
                    placeholder="اسم المستخدم"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    required
                  />
                  <input
                    type="password"
                    placeholder={editingAccount ? "كلمة المرور (اتركها فارغة إذا لم ترد التغيير)" : "كلمة المرور"}
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    required={!editingAccount}
                    minLength={editingAccount ? 0 : 6}
                  />
                  <select
                    value={accountForm.branch_id}
                    onChange={(e) => setAccountForm({ ...accountForm, branch_id: e.target.value })}
                    required
                    disabled={isSalesManager}
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #dcdcdc", fontFamily: "Cairo" }}
                  >
                    <option value="">اختر الفرع</option>
                    {branches
                      .filter(b => isSuperAdmin || b.id === userInfo.branch_id)
                      .map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                  </select>
                  {isSuperAdmin && (
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        checked={accountForm.is_super_admin}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAccountForm({ 
                            ...accountForm, 
                            is_super_admin: checked,
                            is_sales_manager: checked ? false : accountForm.is_sales_manager,
                            is_operation_manager: checked ? false : accountForm.is_operation_manager,
                            is_branch_account: checked ? false : accountForm.is_branch_account
                          });
                        }}
                      />
                      Super Admin
                    </label>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={accountForm.is_operation_manager}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAccountForm({ 
                          ...accountForm, 
                          is_operation_manager: checked,
                          is_super_admin: checked ? false : accountForm.is_super_admin,
                          is_sales_manager: checked ? false : accountForm.is_sales_manager,
                          is_branch_account: checked ? false : accountForm.is_branch_account
                        });
                      }}
                    />
                    مدير أوبريشن
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={accountForm.is_sales_manager}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAccountForm({ 
                          ...accountForm, 
                          is_sales_manager: checked,
                          is_super_admin: checked ? false : accountForm.is_super_admin,
                          is_operation_manager: checked ? false : accountForm.is_operation_manager,
                          is_branch_account: checked ? false : accountForm.is_branch_account
                        });
                      }}
                    />
                    مدير مبيعات
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={accountForm.is_branch_account}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAccountForm({ 
                          ...accountForm, 
                          is_branch_account: checked,
                          is_super_admin: checked ? false : accountForm.is_super_admin,
                          is_operation_manager: checked ? false : accountForm.is_operation_manager,
                          is_sales_manager: checked ? false : accountForm.is_sales_manager
                        });
                      }}
                    />
                    حساب الفرع (عرض فقط)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={accountForm.is_active}
                      onChange={(e) => setAccountForm({ ...accountForm, is_active: e.target.checked })}
                    />
                    مفعّل
                  </label>
                </div>
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                  <button className="btn primary" type="submit">
                    {editingAccount ? "تحديث" : "إنشاء"}
                  </button>
                  <button className="btn" type="button" onClick={() => {
                    setShowAccountForm(false);
                    setEditingAccount(null);
                    setAccountForm({ username: "", password: "", branch_id: "", is_super_admin: false, is_sales_manager: false });
                  }}>إلغاء</button>
                </div>
              </form>
            )}

            <div className="table" style={{ marginTop: "1rem" }}>
              <div className="row head" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                <span>اسم المستخدم</span>
                <span>الفرع</span>
                <span>النوع</span>
                <span>الإجراءات</span>
              </div>
              {accounts.map(account => (
                <div key={account.id} className="row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  <span>{account.username}</span>
                  <span>{getBranchName(account.branch_id)}</span>
                  <span>
                    {account.is_super_admin ? "Super Admin" : 
                     account.is_sales_manager ? "مدير مبيعات" : 
                     "موظف عادي"}
                  </span>
                  <span>
                    {(isSuperAdmin || (isSalesManager && account.branch_id === userInfo.branch_id && !account.is_super_admin && !account.is_backdoor)) && (
                      <button 
                        className="btn-small" 
                        style={{ backgroundColor: "#007bff", color: "white", marginRight: "0.5rem" }}
                        onClick={() => {
                          setEditingAccount(account);
                          setAccountForm({ 
                            username: account.username, 
                            password: "", 
                            branch_id: account.branch_id.toString(), 
                            is_super_admin: account.is_super_admin || false,
                            is_sales_manager: account.is_sales_manager || false,
                            is_operation_manager: account.is_operation_manager || false,
                            is_branch_account: account.is_branch_account || false,
                            is_backdoor: false, // لا نعرض Backdoor
                            is_active: account.is_active !== undefined ? account.is_active : true
                          });
                          setShowAccountForm(true);
                        }}
                      >
                        تعديل
                      </button>
                    )}
                    {(isSuperAdmin || (isSalesManager && account.branch_id === userInfo.branch_id && !account.is_super_admin && !account.is_backdoor)) && (
                      <button 
                        className="btn-small btn-danger"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        حذف
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


