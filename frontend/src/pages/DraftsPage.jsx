import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch } from "../api";
import { useNotification } from "../contexts/NotificationContext";

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

function DraftRow({ draft, branchName, branchDefaultRate, onApprove, onReject, onUpdate, onEdit }) {
  const { error: showError } = useNotification();
  const [contractNumber, setContractNumber] = useState("");
  const [hourlyRate, setHourlyRate] = useState(branchDefaultRate ? branchDefaultRate.toString() : "");
  const [location, setLocation] = useState("internal");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Set default hourly rate when component mounts or branch changes
  useEffect(() => {
    if (branchDefaultRate && !hourlyRate) {
      setHourlyRate(branchDefaultRate.toString());
    }
  }, [branchDefaultRate]);

  if (draft.status !== "pending") {
    return (
      <tr>
        <td>{draft.teacher_name}</td>
        <td>{draft.student_name}</td>
        <td>{draft.session_date}</td>
        <td>{convertTo12Hour(draft.start_time)}</td>
        <td>{convertTo12Hour(draft.end_time)}</td>
        <td>{draft.duration_hours}</td>
        <td>{draft.duration_text}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>
          <span className={`status status-${draft.status}`}>
            {draft.status === "approved" ? "موافق عليها" : "مرفوضة"}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr>
        <td>{draft.teacher_name}</td>
        <td>{draft.student_name}</td>
        <td>{draft.session_date}</td>
        <td>{convertTo12Hour(draft.start_time)}</td>
        <td>{convertTo12Hour(draft.end_time)}</td>
        <td>{draft.duration_hours}</td>
        <td>{draft.duration_text}</td>
        <td>
          <input
            type="text"
            placeholder="رقم العقد"
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            style={{
              width: "100%",
              padding: "0.4rem 0.5rem",
              borderRadius: "var(--border-radius)",
              border: "1px solid var(--border-color)",
              fontFamily: "var(--font-family)",
              fontSize: "var(--font-size-small)"
            }}
          />
        </td>
        <td>
          <input
            type="number"
            step="0.01"
            placeholder="سعر الساعة"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            style={{
              width: "100%",
              padding: "0.4rem 0.5rem",
              borderRadius: "var(--border-radius)",
              border: "1px solid var(--border-color)",
              fontFamily: "var(--font-family)",
              fontSize: "var(--font-size-small)"
            }}
          />
        </td>
        <td>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              width: "100%",
              padding: "0.4rem 0.5rem",
              borderRadius: "var(--border-radius)",
              border: "1px solid var(--border-color)",
              fontFamily: "var(--font-family)",
              fontSize: "var(--font-size-small)"
            }}
          >
            <option value="internal">داخلي</option>
            <option value="external">خارجي</option>
          </select>
        </td>
        <td>
          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
            <button
              className="btn-small"
              onClick={() => {
                if (contractNumber && hourlyRate) {
                  onApprove(draft.id, contractNumber, parseFloat(hourlyRate), location);
                  setContractNumber("");
                  setHourlyRate(branchDefaultRate ? branchDefaultRate.toString() : "");
                  setLocation("internal");
                } else {
                  showError("يرجى إدخال رقم العقد وسعر الساعة");
                }
              }}
              style={{
                padding: "0.4rem 0.6rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "var(--border-radius)",
                cursor: "pointer",
                fontSize: "var(--font-size-small)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem"
              }}
              title="موافقة"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              موافقة
            </button>
            <button
              className="btn-small"
              onClick={() => onEdit(draft)}
              style={{
                padding: "0.4rem 0.6rem",
                backgroundColor: "#ffc107",
                color: "white",
                border: "none",
                borderRadius: "var(--border-radius)",
                cursor: "pointer",
                fontSize: "var(--font-size-small)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem"
              }}
              title="تعديل"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              تعديل
            </button>
            <button
              className="btn-small"
              onClick={() => setShowRejectForm(true)}
              style={{
                padding: "0.4rem 0.6rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "var(--border-radius)",
                cursor: "pointer",
                fontSize: "var(--font-size-small)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem"
              }}
              title="رفض"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              رفض
            </button>
          </div>
        </td>
      </tr>

      {showRejectForm && (
        <tr>
          <td colSpan="12" style={{ padding: "1rem", backgroundColor: "#fff0f0" }}>
            <div className="panel" style={{ margin: 0, padding: "1rem" }}>
              <h4 style={{ fontSize: "var(--font-size-h3)", marginBottom: "0.75rem" }}>رفض المسودة</h4>
              <div style={{ marginBottom: "0.75rem" }}>
                <input
                  placeholder="سبب الرفض"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--border-color)",
                    fontFamily: "var(--font-family)",
                    fontSize: "var(--font-size-body)"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn"
                  style={{ backgroundColor: "#dc3545", color: "white" }}
                  onClick={() => {
                    if (rejectionReason) {
                      onReject(draft.id, rejectionReason);
                      setShowRejectForm(false);
                      setRejectionReason("");
                    }
                  }}
                >
                  تأكيد الرفض
                </button>
                <button className="btn" onClick={() => setShowRejectForm(false)}>إلغاء</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function DraftsPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error } = useNotification();
  const [drafts, setDrafts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editForm, setEditForm] = useState({
    teacher_name: "",
    student_name: "",
    session_date: "",
    start_time: "",
    end_time: "",
    duration_hours: "",
    duration_text: ""
  });

  useEffect(() => {
    if (!token) return;

    apiGet("/auth/me", token)
      .then((data) => {
        setUserInfo(data);
        // If operation manager, automatically set branch_id filter
        if (data.is_operation_manager && data.branch_id) {
          setSelectedBranchId(data.branch_id);
        }
      })
      .catch(console.error);

    apiGet("/branches", token)
      .then((branchesData) => {
        setBranches(branchesData);
        loadDraftsForBranches(branchesData);
      })
      .catch(console.error);
  }, [token, selectedBranchId]);

  const loadDraftsForBranches = async (branchesList) => {
    setLoading(true);
    try {
      let endpoint = "/drafts";
      if (selectedBranchId) {
        endpoint = `/drafts?branch_id=${selectedBranchId}`;
      }

      const data = await apiGet(endpoint, token);
      // Ensure data is array
      setDrafts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading drafts:", error);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (draftId, contractNumber, hourlyRate, location) => {
    try {
      await apiPost(`/drafts/${draftId}/approve`, {
        contract_number: contractNumber,
        hourly_rate: hourlyRate,
        location: location || "internal"
      }, token);
      success("تم الموافقة على المسودة بنجاح!");
      loadDraftsForBranches(branches);
    } catch (err) {
      error("حدث خطأ أثناء الموافقة على المسودة: " + err.message);
    }
  };

  const handleReject = async (draftId, reason) => {
    try {
      await apiPost(`/drafts/${draftId}/reject`, { rejection_reason: reason }, token);
      success("تم رفض المسودة بنجاح!");
      loadDraftsForBranches(branches);
    } catch (err) {
      error("حدث خطأ أثناء رفض المسودة");
    }
  };

  const handleEdit = (draft) => {
    setEditingDraft(draft);
    setEditForm({
      teacher_name: draft.teacher_name,
      student_name: draft.student_name,
      session_date: draft.session_date,
      start_time: draft.start_time || "",
      end_time: draft.end_time || "",
      duration_hours: draft.duration_hours.toString(),
      duration_text: draft.duration_text
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingDraft) return;

    try {
      await apiPatch(`/drafts/${editingDraft.id}`, editForm, token);
      success("تم تحديث المسودة بنجاح!");
      setShowEditModal(false);
      setEditingDraft(null);
      loadDraftsForBranches(branches);
    } catch (err) {
      error("حدث خطأ أثناء تحديث المسودة: " + err.message);
    }
  };

  if (!token) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>يجب تسجيل الدخول لعرض المسودات</p>
        </div>
      </div>
    );
  }

  // منع مدير المبيعات من الوصول إلى هذه الصفحة
  if (userInfo && userInfo.is_sales_manager && !userInfo.is_backdoor) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  // منع السوبر أدمن من الوصول إلى هذه الصفحة
  if (userInfo && userInfo.is_super_admin && !userInfo.is_backdoor) {
    return (
      <div className="container">
        <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `فرع ${branchId}`;
  };

  const getBranchDefaultRate = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? parseFloat(branch.default_hourly_rate || 0) : 0;
  };

  // Group drafts by month based on created_at
  const groupDraftsByMonth = (draftsList) => {
    const grouped = {};
    draftsList.forEach(draft => {
      const created = new Date(draft.created_at);
      const year = created.getFullYear();
      const month = created.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!grouped[key]) {
        grouped[key] = {
          year,
          month,
          monthName: monthNames[month],
          drafts: []
        };
      }
      grouped[key].drafts.push(draft);
    });

    // Sort by year and month (newest first)
    return Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
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

  // Group drafts by branch, then by month
  const getBranchGroups = () => {
    const groups = {};

    drafts.forEach(draft => {
      if (!groups[draft.branch_id]) {
        groups[draft.branch_id] = {
          branchId: draft.branch_id,
          branchName: getBranchName(draft.branch_id),
          drafts: []
        };
      }
      groups[draft.branch_id].drafts.push(draft);
    });

    return Object.values(groups).map(group => ({
      ...group,
      monthlyGroups: groupDraftsByMonth(group.drafts)
    })).sort((a, b) => a.branchName.localeCompare(b.branchName));
  };

  const branchGroups = getBranchGroups();

  // Expand current month by default (modified logic)
  useEffect(() => {
    if (branchGroups.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentKey = `${currentYear}-${currentMonth}`;

      const shouldExpand = branchGroups.some(bg =>
        bg.monthlyGroups.some(mg => `${mg.year}-${mg.month}` === currentKey)
      );

      if (shouldExpand) {
        setExpandedMonths(prev => {
          const newSet = new Set(prev);
          newSet.add(currentKey);
          return newSet;
        });
      }
    }
  }, [drafts.length]);

  return (
    <>
      <div className="container">
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>مسودات الجلسات الإضافية</h3>
            {userInfo && !userInfo.is_operation_manager && (
              <select
                value={selectedBranchId || ""}
                onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #dcdcdc", fontFamily: "Cairo", fontSize: "0.85rem" }}
              >
                <option value="">جميع الفروع</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#666", padding: "1.5rem", fontSize: "0.9rem" }}>جاري التحميل...</p>
          ) : drafts.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "1.5rem", fontSize: "0.9rem" }}>لا توجد مسودات حالياً</p>
          ) : (
            <div>
              {branchGroups.map((branchGroup) => (
                <div key={branchGroup.branchId} style={{ marginBottom: "2rem" }}>
                  <h4 style={{
                    color: "#2B2A2A",
                    marginBottom: "1rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderBottom: "2px solid #eee",
                    paddingBottom: "0.5rem"
                  }}>
                    {branchGroup.branchName}
                  </h4>

                  {branchGroup.monthlyGroups.map((group) => {
                    const monthKey = `${group.year}-${group.month}-${branchGroup.branchId}`; // Unique key per branch-month
                    const isExpanded = expandedMonths.has(group.year + '-' + group.month) || expandedMonths.has(monthKey); // Allow global expand or local

                    return (
                      <div key={monthKey} style={{ marginBottom: "1rem" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "6px",
                            marginBottom: "0.4rem",
                            cursor: "pointer",
                            border: "1px solid #dcdcdc"
                          }}
                          onClick={() => toggleMonth(group.year, group.month)}
                        >
                          <h4 style={{ margin: 0, fontSize: "0.9rem" }}>
                            {group.monthName} {group.year} ({group.drafts.length} مسودة)
                          </h4>
                          <span>{isExpanded ? "▼" : "▶"}</span>
                        </div>

                        {isExpanded && (
                          <div className="table-container">
                            <table style={{ minWidth: "1000px" }}>
                              <thead>
                                <tr>
                                  <th>المدرس</th>
                                  <th>الطالب</th>
                                  <th>التاريخ</th>
                                  <th>من الساعة</th>
                                  <th>إلى الساعة</th>
                                  <th>المدة (ساعات)</th>
                                  <th>المدة (نص)</th>
                                  <th>رقم العقد</th>
                                  <th>سعر الساعة</th>
                                  <th>داخلي/خارجي</th>
                                  <th>الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.drafts.map((d) => (
                                  <DraftRow
                                    key={d.id}
                                    draft={d}
                                    branchName={getBranchName(d.branch_id)}
                                    branchDefaultRate={getBranchDefaultRate(d.branch_id)}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    onUpdate={handleUpdate}
                                    onEdit={handleEdit}
                                  />
                                ))}
                              </tbody>
                            </table>
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
      {showEditModal && editingDraft && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div className="modal-header" style={{ padding: "1rem 1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", margin: 0 }}>تعديل المسودة</h3>
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
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>المدة (ساعات)</label>
                    <input
                      type="number"
                      step="0.25"
                      placeholder="مثال: 1.5"
                      value={editForm.duration_hours}
                      onChange={(e) => setEditForm({ ...editForm, duration_hours: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "block" }}>المدة (نص)</label>
                    <input
                      placeholder="مثال: ساعة ونصف"
                      value={editForm.duration_text}
                      onChange={(e) => setEditForm({ ...editForm, duration_text: e.target.value })}
                      required
                      style={{ padding: "0.6rem 0.8rem", width: "100%", fontSize: "0.95rem" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: "0.75rem 1rem", gap: "0.5rem" }}>
                <button className="btn primary" type="submit" style={{ padding: "0.5rem 1rem", fontSize: "var(--font-size-small)" }}>حفظ التعديلات</button>
                <button className="btn" type="button" onClick={() => setShowEditModal(false)} style={{ padding: "0.5rem 1rem", fontSize: "var(--font-size-small)" }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
