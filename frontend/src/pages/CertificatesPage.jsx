import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api";
import { useNotification } from "../contexts/NotificationContext";
import FilterDropdown from "../components/FilterDropdown";

const monthNames = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
  5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
  9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
};

const certificateTypes = {
  'local': 'شهادة محلية',
  'international': 'شهادة دولية',
  'knowledge_authority': 'شهادة هيئة المعرفة'
};

export default function CertificatesPage() {
  const token = localStorage.getItem("token") || "";
  const { success, error: showError, confirm } = useNotification();
  const [userInfo, setUserInfo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("requested");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters (Aligned with ReportsPage style/logic)
  const [appliedYearIds, setAppliedYearIds] = useState([new Date().getFullYear()]);
  const [appliedMonthIds, setAppliedMonthIds] = useState([new Date().getMonth() + 1]);
  const [appliedBranchIds, setAppliedBranchIds] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [editData, setEditData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    student_name_ar: "",
    student_name_en: "",
    phone_number: "",
    contract_number: "",
    id_passport_number: "",
    certificate_name: "",
    course_type: "",
    duration: "",
    certificate_type: "local",
    branch_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    if (!token) return;

    apiGet("/auth/me", token)
      .then(user => {
        setUserInfo(user);
        if (user.branch_id && !user.is_super_admin && !user.is_hr_manager) {
          setAppliedBranchIds([user.branch_id]);
          setFormData(prev => ({ ...prev, branch_id: user.branch_id }));
        }
      })
      .catch(console.error);

    apiGet("/branches", token).then(setBranches).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (token) {
      loadCertificates();
    }
  }, [token, appliedYearIds, appliedMonthIds, appliedBranchIds, searchQuery]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      let params = new URLSearchParams();
      appliedYearIds.forEach(y => params.append("year[]", y));
      appliedMonthIds.forEach(m => params.append("month[]", m));
      appliedBranchIds.forEach(b => params.append("branch_id[]", b));
      if (searchQuery) params.append("search", searchQuery);

      const data = await apiGet(`/certificates?${params.toString()}`, token);
      setCertificates(data);
    } catch (err) {
      showError("حدث خطأ أثناء تحميل الشهادات");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/certificates", formData, token);
      success("تم إضافة طلب الشهادة بنجاح");
      setShowAddModal(false);
      resetForm();
      loadCertificates();
    } catch (err) {
      showError("حدث خطأ أثناء إضافة الطلب");
    }
  };

  const resetForm = () => {
    setFormData({
      student_name_ar: "",
      student_name_en: "",
      phone_number: "",
      contract_number: "",
      id_passport_number: "",
      certificate_name: "",
      course_type: "",
      duration: "",
      certificate_type: "local",
      branch_id: userInfo?.branch_id || "",
      month: appliedMonthIds[0],
      year: appliedYearIds[0]
    });
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const fileInput = e.target.elements.certificate_pdf;
    if (!fileInput.files[0]) return;

    const fd = new FormData();
    fd.append("certificate_pdf", fileInput.files[0]);

    setLoading(true);
    try {
      // Use the same base as apiPost/apiGet
      const apiBase = "http://localhost:8000"; 
      const res = await fetch(`${apiBase}/certificates/${selectedCert.id}/upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: fd
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Upload Error Details:", errorText);
        throw new Error(errorText || "Upload failed");
      }

      success("تم رفع الشهادة بنجاح");
      setShowUploadModal(false);
      loadCertificates();
    } catch (err) {
      console.error("Upload Catch Error:", err);
      showError("حدث خطأ أثناء رفع الملف: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (cert) => {
    setEditData({ ...cert });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/certificates/${editData.id}`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(editData)
      });

      if (!res.ok) throw new Error(await res.text());

      success("تم تحديث بيانات الشهادة بنجاح");
      setShowEditModal(false);
      loadCertificates();
    } catch (err) {
      console.error(err);
      showError("حدث خطأ أثناء تحديث البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (id) => {
    confirm("هل تم تسليم الشهادة للطالب فعلاً؟", async () => {
      try {
        await apiPost(`/certificates/${id}/deliver`, {}, token);
        success("تم تحديث حالة الشهادة إلى 'تم التسليم'");
        loadCertificates();
      } catch (err) {
        showError("حدث خطأ أثناء تحديث الحالة");
      }
    });
  };

  const handleDelete = async (id) => {
    confirm("هل أنت متأكد من حذف هذا الطلب؟", async () => {
      try {
        const res = await fetch(`http://localhost:8000/certificates/${id}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (!res.ok) throw new Error("Delete failed");
        success("تم الحذف بنجاح");
        loadCertificates();
      } catch (err) {
        showError("حدث خطأ أثناء الحذف");
      }
    });
  };

  const handleDownload = async (cert) => {
    try {
      const response = await fetch(`http://localhost:8000/certificates/${cert.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `${cert.student_name_ar}-${cert.certificate_name}-${cert.duration}.pdf`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      showError("حدث خطأ أثناء تحميل الشهادة");
    }
  };

  const filteredCerts = certificates.filter(c => c.status === activeTab);

  if (!token) return <div className="container"><div className="panel">يجب تسجيل الدخول</div></div>;

  return (
    <div className="container">
      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <h2 style={{ margin: 0, color: "#2c3e50" }}>نظام إدارة الشهادات</h2>
            <div className="search-box" style={{ position: "relative", width: "100%", maxWidth: "350px" }}>
              <input
                type="text"
                placeholder="بحث باسم الطالب، الهاتف، أو العقد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "0.5rem 2.8rem 0.5rem 1rem",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  width: "100%",
                  fontSize: "0.85rem",
                  fontFamily: "Cairo",
                  backgroundColor: "#ffffff",
                  transition: "all 0.2s ease",
                  outline: "none",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}
                className="search-input"
              />
              <span style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6B7280",
                display: "flex",
                alignItems: "center"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
            </div>
          </div>

          <div className="filters-container" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* Year Filter */}
            <FilterDropdown
              placeholder="السنة"
              options={[2024, 2025, 2026].map(y => ({ value: y, label: y.toString() }))}
              selectedValues={appliedYearIds}
              onChange={ids => setAppliedYearIds(ids)}
              isSingle={false}
            />

            {/* Month Filter */}
            <FilterDropdown
              placeholder="الشهر"
              options={Object.entries(monthNames).map(([id, name]) => ({ value: parseInt(id), label: name }))}
              selectedValues={appliedMonthIds}
              onChange={ids => setAppliedMonthIds(ids)}
              isSingle={false}
            />

            {/* Branch Filter (HR/Admin only) */}
            {!!(userInfo?.is_hr_manager || userInfo?.is_super_admin) && (
              <FilterDropdown
                placeholder="الفرع"
                options={branches.map(b => ({ value: b.id, label: b.name }))}
                selectedValues={appliedBranchIds}
                onChange={ids => setAppliedBranchIds(ids)}
                isSingle={false}
              />
            )}

            {!!(userInfo?.is_operation_manager || userInfo?.is_super_admin) && (
              <button className="btn primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                + طلب شهادة جديد
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <button 
          className={`btn ${activeTab === 'requested' ? 'primary' : 'outline'}`} 
          onClick={() => setActiveTab('requested')}
          style={{ flex: 1 }}
        >
          الشهادات المطلوبة ({certificates.filter(c => c.status === 'requested').length})
        </button>
        <button 
          className={`btn ${activeTab === 'uploaded' ? 'primary' : 'outline'}`} 
          onClick={() => setActiveTab('uploaded')}
          style={{ flex: 1 }}
        >
          الشهادات المصدرة ({certificates.filter(c => c.status === 'uploaded').length})
        </button>
        <button 
          className={`btn ${activeTab === 'delivered' ? 'primary' : 'outline'}`} 
          onClick={() => setActiveTab('delivered')}
          style={{ flex: 1 }}
        >
          الشهادات المسلمة ({certificates.filter(c => c.status === 'delivered').length})
        </button>
      </div>

      <div className="panel">
        {loading ? <p>جاري التحميل...</p> : (
          <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم (عربي)</th>
                  <th>الاسم (En)</th>
                  <th>الهاتف</th>
                  <th>رقم العقد</th>
                  <th>الشهادة</th>
                  <th>النوع</th>
                  <th>المدة</th>
                  <th>الفرع</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map(cert => (
                  <tr key={cert.id}>
                    <td style={{ fontWeight: "bold" }}>{cert.student_name_ar}</td>
                    <td style={{ color: "#475569" }}>{cert.student_name_en}</td>
                    <td>{cert.phone_number || "-"}</td>
                    <td><span className="badge info">{cert.contract_number || "-"}</span></td>
                    <td>{cert.certificate_name}</td>
                    <td>{certificateTypes[cert.certificate_type]}</td>
                    <td>{cert.duration}</td>
                    <td><span style={{ fontSize: "0.85rem", color: "#64748b" }}>{cert.branch?.name}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {cert.file_path && (
                          <div style={{ display: "flex", gap: "0.2rem" }}>
                            <a
                              href={`http://localhost:8000/storage/${cert.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-small success"
                              title="عرض الشهادة"
                              style={{ padding: "0.3rem 0.6rem" }}
                            >
                              👁️
                            </a>
                            <button
                              className="btn btn-small info"
                              onClick={() => handleDownload(cert)}
                              title="تحميل الشهادة"
                              style={{ padding: "0.3rem 0.6rem" }}
                            >
                              ⬇️
                            </button>
                          </div>
                        )}
                        {!!(userInfo?.is_hr_manager || userInfo?.is_super_admin) && cert.status === 'requested' && (
                          <button
                            className="btn btn-small primary"
                            onClick={() => { setSelectedCert(cert); setShowUploadModal(true); }}
                            title="رفع الشهادة"
                          >
                            📁 رفع PDF
                          </button>
                        )}
                        {cert.status === 'uploaded' && !!(userInfo?.is_operation_manager || userInfo?.is_super_admin) && (
                          <button
                            className="btn btn-small warning"
                            onClick={() => handleDeliver(cert.id)}
                            title="تم التسليم"
                          >
                            ✅ تم التسليم
                          </button>
                        )}
                        {!!(userInfo?.is_super_admin || (userInfo?.is_operation_manager && cert.status === 'requested')) && (
                          <div style={{ display: "flex", gap: "0.2rem" }}>
                            <button
                              className="btn btn-small warning"
                              onClick={() => handleEditOpen(cert)}
                              style={{ padding: "0.3rem 0.6rem" }}
                              title="تعديل"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-small danger"
                              onClick={() => handleDelete(cert.id)}
                              style={{ padding: "0.3rem 0.6rem" }}
                              title="حذف"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCerts.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                      لا توجد نتائج في هذا القسم
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ 
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
          backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 
        }}>
          <div className="modal-content" style={{ 
            backgroundColor: "white", padding: "0", borderRadius: "20px", width: "95%", maxWidth: "900px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)", position: "relative", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.7)", maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            {/* Modal Header with Accent */}
            <div style={{ 
              backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0
            }}>
              <div>
                <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem", fontWeight: "700", fontFamily: "Cairo" }}>طلب شهادة جديد</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b", fontFamily: "Cairo" }}>أدخل بيانات المتدرب بدقة لإصدار الشهادة</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ 
                  background: "#f1f5f9", border: "none", width: "32px", height: "32px", 
                  borderRadius: "8px", fontSize: "1.2rem", cursor: "pointer", color: "#64748b",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                }}
              >&times;</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: "1rem", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
                {/* Student Info Section */}
                <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem", marginBottom: "0.25rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#3b82f6", fontWeight: "600", fontFamily: "Cairo" }}>بيانات المتدرب</h4>
                </div>
                
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>الاسم (بالعربي)</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} placeholder="أحمد محمد" value={formData.student_name_ar} onChange={e => setFormData({ ...formData, student_name_ar: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>الاسم (En)</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} placeholder="Ahmed Mohamed" value={formData.student_name_en} onChange={e => setFormData({ ...formData, student_name_en: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>رقم الهاتف</label>
                  <input style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} placeholder="05xxxxxxxx" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                </div>
                
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>رقم العقد</label>
                  <input style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} placeholder="12345" value={formData.contract_number} onChange={e => setFormData({ ...formData, contract_number: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>رقم الهوية أو الجواز</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} placeholder="أدخل رقم الهوية أو الجواز" value={formData.id_passport_number} onChange={e => setFormData({ ...formData, id_passport_number: e.target.value })} />
                </div>

                {/* Course Info Section */}
                <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.25rem", marginBottom: "0", marginTop: "0.5rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#3b82f6", fontWeight: "600", fontFamily: "Cairo" }}>تفاصيل الدورة والشهادة</h4>
                </div>

                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>اسم الدورة</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={formData.certificate_name} onChange={e => setFormData({ ...formData, certificate_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>نوع الكورس</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={formData.course_type} onChange={e => setFormData({ ...formData, course_type: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>المدة</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>نوع الشهادة</label>
                  <select style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem", backgroundColor: "white" }} value={formData.certificate_type} onChange={e => setFormData({ ...formData, certificate_type: e.target.value })}>
                    <option value="local">شهادة محلية</option>
                    <option value="international">شهادة دولية</option>
                    <option value="knowledge_authority">شهادة هيئة المعرفة</option>
                  </select>
                </div>
                {(userInfo?.is_super_admin || userInfo?.is_hr_manager) && (
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>الفرع</label>
                    <select required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem", backgroundColor: "white" }} value={formData.branch_id} onChange={e => setFormData({ ...formData, branch_id: e.target.value })}>
                      <option value="">اختر الفرع</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ marginTop: "0.75rem", textAlign: "left" }}>
                <button type="submit" className="btn primary" style={{ padding: "0.8rem 2rem" }}>إرسال الطلب</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop" style={{ 
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
          backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 
        }}>
          <div className="modal-content" style={{ 
            backgroundColor: "white", padding: "0", borderRadius: "20px", width: "95%", maxWidth: "500px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)", position: "relative", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.7)"
          }}>
            {/* Modal Header */}
            <div style={{ 
              backgroundColor: "#f8fafc", padding: "1.25rem 2rem", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem", fontWeight: "700", fontFamily: "Cairo" }}>رفع ملف الشهادة</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b", fontFamily: "Cairo" }}>يرجى اختيار ملف PDF الخاص بالمتدرب</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                style={{ 
                  background: "#f1f5f9", border: "none", width: "32px", height: "32px", 
                  borderRadius: "8px", fontSize: "1.2rem", cursor: "pointer", color: "#64748b"
                }}
              >&times;</button>
            </div>

            <form onSubmit={handleFileUpload} style={{ padding: "2rem" }}>
              <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f0f9ff", borderRadius: "12px", border: "1px solid #e0f2fe" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#0369a1", fontFamily: "Cairo" }}>
                  سيتم رفع الشهادة للمتدرب: <strong style={{ fontWeight: "700" }}>{selectedCert?.student_name_ar}</strong>
                </p>
              </div>

              <div className="form-group">
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>اختيار ملف PDF</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type="file" 
                    name="certificate_pdf" 
                    accept=".pdf" 
                    required 
                    style={{ 
                      width: "100%", padding: "2rem 1rem", border: "2px dashed #cbd5e1", 
                      borderRadius: "15px", cursor: "pointer", textAlign: "center",
                      backgroundColor: "#f8fafc", transition: "all 0.2s"
                    }}
                  />
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", color: "#64748b", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📄</div>
                    <span style={{ fontSize: "0.85rem", fontFamily: "Cairo" }}>اضغط لاختيار ملف PDF</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button type="submit" 
                  disabled={loading}
                  style={{ 
                    flex: 1, backgroundColor: "#10b981", color: "white", border: "none", 
                    padding: "1rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "700", 
                    fontFamily: "Cairo", cursor: loading ? "not-allowed" : "pointer", 
                    boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)", transition: "all 0.2s",
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? "جاري الرفع..." : "تأكيد الرفع والاعتماد"}
                </button>
                <button type="button" 
                  onClick={() => setShowUploadModal(false)}
                  style={{ 
                    backgroundColor: "#f1f5f9", color: "#64748b", border: "none", 
                    padding: "1rem 1.5rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "600", 
                    fontFamily: "Cairo", cursor: "pointer"
                  }}
                >إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="modal-backdrop" style={{ 
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
          backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 
        }}>
          <div className="modal-content" style={{ 
            backgroundColor: "white", padding: "0", borderRadius: "20px", width: "95%", maxWidth: "900px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)", position: "relative", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.7)", maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            {/* Modal Header with Accent */}
            <div style={{ 
              backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0
            }}>
              <div>
                <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem", fontWeight: "700", fontFamily: "Cairo" }}>تعديل طلب الشهادة</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b", fontFamily: "Cairo" }}>تعديل بيانات المتدرب الحالي</p>
              </div>
              <button 
                onClick={() => { setShowEditModal(false); setEditData(null); }}
                style={{ 
                  background: "#f1f5f9", border: "none", width: "32px", height: "32px", 
                  borderRadius: "8px", fontSize: "1.2rem", cursor: "pointer", color: "#64748b",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                }}
              >&times;</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: "1rem", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
                {/* Student Info Section */}
                <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem", marginBottom: "0.25rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#3b82f6", fontWeight: "600", fontFamily: "Cairo" }}>بيانات المتدرب</h4>
                </div>
                
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>الاسم (بالعربي)</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={editData.student_name_ar} onChange={e => setEditData({ ...editData, student_name_ar: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>الاسم (En)</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={editData.student_name_en} onChange={e => setEditData({ ...editData, student_name_en: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>رقم الهاتف</label>
                  <input style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={editData.phone_number || ""} onChange={e => setEditData({ ...editData, phone_number: e.target.value })} />
                </div>
                
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>رقم العقد</label>
                  <input style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={editData.contract_number || ""} onChange={e => setEditData({ ...editData, contract_number: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>رقم الهوية أو الجواز</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={editData.id_passport_number} onChange={e => setEditData({ ...editData, id_passport_number: e.target.value })} />
                </div>

                {/* Course Info Section */}
                <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.25rem", marginBottom: "0", marginTop: "0.5rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#3b82f6", fontWeight: "600", fontFamily: "Cairo" }}>تفاصيل الدورة والشهادة</h4>
                </div>

                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>اسم الدورة</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={editData.certificate_name} onChange={e => setEditData({ ...editData, certificate_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>نوع الكورس</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={editData.course_type} onChange={e => setEditData({ ...editData, course_type: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>المدة</label>
                  <input required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem" }} value={editData.duration} onChange={e => setEditData({ ...editData, duration: e.target.value })} />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>نوع الشهادة</label>
                  <select style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem", backgroundColor: "white" }} value={editData.certificate_type} onChange={e => setEditData({ ...editData, certificate_type: e.target.value })}>
                    <option value="local">شهادة محلية</option>
                    <option value="international">شهادة دولية</option>
                    <option value="knowledge_authority">شهادة هيئة المعرفة</option>
                  </select>
                </div>
                {!!(userInfo?.is_super_admin || userInfo?.is_hr_manager) && (
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569", fontFamily: "Cairo" }}>الفرع</label>
                    <select required style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "Cairo", fontSize: "0.9rem", backgroundColor: "white" }} value={editData.branch_id} onChange={e => setEditData({ ...editData, branch_id: e.target.value })}>
                      <option value="">اختر الفرع</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn primary" disabled={loading} style={{ flex: 1, padding: "0.8rem", borderRadius: "12px", border: "none", color: "white", fontWeight: "700", fontFamily: "Cairo", cursor: "pointer", backgroundColor: "#3b82f6" }}>{loading ? "جاري الحفظ..." : "حفظ التعديلات"}</button>
                <button type="button" className="btn outline" onClick={() => { setShowEditModal(false); setEditData(null); }} style={{ flex: 1, padding: "0.8rem", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#64748b", fontWeight: "600", fontFamily: "Cairo", cursor: "pointer" }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
