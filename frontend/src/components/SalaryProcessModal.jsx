import React, { useState, useEffect, useMemo } from "react";
import { useNotification } from "../contexts/NotificationContext";
 
const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null || isNaN(num)) return "0.00";
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export default function SalaryProcessModal({
  show,
  onClose,
  onSubmit,
  employees, // List of { employee, salary_record }
  month,
  year,
  monthName
}) {
  const { error: showError } = useNotification();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({
    working_days: "",
    notes: "",
    custom_base_salary: "", // For additions calculation
    additions: [], // { amount, reason, is_automatic }
    deductions: [] // { amount, reason }
  });
  const [isSaving, setIsSaving] = useState(false);

  // Modification 1: Find first unprocessed employee index on mount/show
  useEffect(() => {
    if (show && employees.length > 0) {
      const startIndex = employees.findIndex(e => !e.salary_record || !e.salary_record.is_processed);
      if (startIndex !== -1) {
        setCurrentIndex(startIndex);
      } else {
        setCurrentIndex(0); // All processed, start from beginning
      }
    }
  }, [show]); // Only trigger when modal opens

  const currentEmployeeData = useMemo(() => employees[currentIndex], [employees, currentIndex]);
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  useEffect(() => {
    if (currentEmployeeData) {
      const record = currentEmployeeData.salary_record;
      if (record) {
        setFormData({
          working_days: record.working_days.toString(),
          notes: record.notes || "",
          custom_base_salary: (record.base_salary || currentEmployeeData.employee.salary).toString(),
          additions: (record.items || []).filter(i => i.type === 'addition').map(i => ({
            ...i,
            is_automatic: !!i.is_automatic,
            days: (i.days || "").toString()
          })),
          deductions: (record.items || []).filter(i => i.type === 'deduction')
        });
      } else {
        // Default for new record
        setFormData({
          working_days: daysInMonth.toString(),
          notes: "",
          custom_base_salary: currentEmployeeData.employee.salary.toString(),
          additions: [],
          deductions: []
        });
      }
    }
  }, [currentEmployeeData, daysInMonth, show]);

  const calculations = useMemo(() => {
    if (!currentEmployeeData) return { entitled: 0, autoAddition: 0, net: 0 };
    
    const base = parseFloat(currentEmployeeData.employee.salary || 0);
    const customBase = parseFloat(formData.custom_base_salary || base);
    const wDays = parseInt(formData.working_days) || 0;
    
    const entitled = (base / daysInMonth) * wDays;
    
    // Dynamically update automatic additions in formData if they exist
    const totalAdditions = formData.additions.reduce((sum, item) => {
      if (item.is_automatic) {
        const itemDays = parseFloat(item.days || 0);
        const amount = itemDays * (customBase / daysInMonth);
        return sum + amount;
      }
      return sum + parseFloat(item.amount || 0);
    }, 0);
    
    const totalDeductions = formData.deductions.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    
    const net = entitled + totalAdditions - totalDeductions;
    
    return { entitled, autoAddition: (daysInMonth - wDays) * (customBase / daysInMonth), net };
  }, [currentEmployeeData, formData, daysInMonth]);

  const submitSalary = async (shouldClose = true) => {
    const wDays = parseInt(formData.working_days) || 0;
    const autoDays = formData.additions
      .filter(a => a.is_automatic)
      .reduce((sum, a) => sum + (parseFloat(a.days) || 0), 0);
    
    const totalDaysMatched = wDays + autoDays;

    // If total days don't cover the full month, notes are REQUIRED
    if (totalDaysMatched < daysInMonth && !formData.notes.trim()) {
      showError(`الرجاء كتابة سبب نقص الراتب عن عدد الايام حيث تم تغطية ${totalDaysMatched} من اصل ${daysInMonth} يوجد فرق ${daysInMonth - totalDaysMatched} يوم`);
      return false;
    }

    setIsSaving(true);
    const payload = {
      employee_id: currentEmployeeData.employee.id,
      branch_id: currentEmployeeData.employee.branch_id,
      month,
      year,
      base_salary: parseFloat(formData.custom_base_salary),
      working_days: wDays,
      entitled_salary: calculations.entitled,
      net_salary: calculations.net,
      notes: formData.notes,
      items: [
        ...formData.additions.map(a => {
          if (a.is_automatic) {
            const amt = parseFloat(a.days || 0) * (parseFloat(formData.custom_base_salary) / daysInMonth);
            return { ...a, amount: amt.toFixed(2), type: 'addition' };
          }
          return { ...a, type: 'addition' };
        }),
        ...formData.deductions.map(d => ({ ...d, type: 'deduction' }))
      ]
    };
    
    const success = await onSubmit(payload, shouldClose);
    setIsSaving(false);
    return success;
  };

  const handleSaveAndClose = () => {
    submitSalary(true);
  };

  const handleNext = async () => {
    if (currentIndex < employees.length - 1) {
      const success = await submitSalary(false);
      if (success) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const addAddition = (isAuto = false) => {
    const newItems = [...formData.additions];
    if (isAuto) {
      const gapDays = daysInMonth - parseInt(formData.working_days || 0);
      newItems.push({ 
        days: gapDays.toString(), 
        reason: "إضافة تلقائية (فرق أيام الدوام)", 
        is_automatic: true 
      });
    } else {
      newItems.push({ amount: "", reason: "", is_automatic: false });
    }
    setFormData({ ...formData, additions: newItems });
  };

  const addDeduction = () => {
    setFormData({ ...formData, deductions: [...formData.deductions, { amount: "", reason: "" }] });
  };

  if (!show || !currentEmployeeData) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ 
      backgroundColor: "rgba(0,0,0,0.4)", 
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      overflow: "hidden"
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
        maxWidth: "1000px", 
        width: "100%", 
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        borderRadius: "16px", 
        border: "none",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        backgroundColor: "white",
        overflow: "hidden"
      }}>
        {/* Sticky Header */}
        <div className="modal-header" style={{ 
          borderBottom: "1px solid rgba(255,255,255,0.1)", 
          padding: "1.25rem 1.5rem", 
          backgroundColor: "#1F2937", // Elegant dark background 
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "900", margin: 0, color: "white" }}>
              احتساب راتب: {monthName} {year}
            </h2>
            <div style={{ 
              fontSize: "12px", 
              color: "#60A5FA", 
              background: "rgba(96, 165, 250, 0.1)", 
              padding: "0.25rem 0.75rem", 
              borderRadius: "20px", 
              fontWeight: "700",
              border: "1px solid rgba(96, 165, 250, 0.2)"
            }}>
              الموظف رقم {currentIndex + 1} من أصل {employees.length}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ fontSize: "28px", color: "white", opacity: 0.7 }}>×</button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}>
            
            {/* 1. قسم معلومات الموظف - Single Line */}
            <div className="panel" style={{ margin: 0, padding: "0.4rem 1.25rem", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "700", color: "#5A7ACD", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                        <i className="fas fa-id-card"></i> المعلومات الأساسية:
                    </h4>
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                        <div>
                            <span style={{ fontSize: "12px", color: "#6B7280" }}>الاسم: </span>
                            <span style={{ fontWeight: "700", fontSize: "15px", color: "#2B2A2A" }}>{currentEmployeeData.employee.name}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: "12px", color: "#6B7280" }}>رقم الملف: </span>
                            <span style={{ fontWeight: "600", fontSize: "14px", color: "#4B5563" }}>{currentEmployeeData.employee.employment_number}</span>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: "left" }}>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>الراتب التعاقدي: </span>
                    <span style={{ fontWeight: "800", fontSize: "20px", color: "#111827" }}>
                        {formatNumber(currentEmployeeData.employee.salary)} <span style={{fontSize: "12px", fontWeight: "600", color: "#6B7280"}}>د.إ</span>
                    </span>
                </div>
            </div>

            <div style={{ display: "flex", gap: "1.25rem", alignItems: "stretch" }}>
                {/* 2. قسم الراتب المستحق - Compact width */}
                <div className="panel" style={{ width: "fit-content", minWidth: "180px", margin: 0, padding: "1rem", border: "1px solid #E5E7EB", backgroundColor: "#FDFDFD", borderRadius: "12px", minHeight: "220px", display: "flex", flexDirection: "column" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "1rem", color: "#3B82F6", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <i className="fas fa-clock"></i> استحقاق الدوام
                    </h4>
                    <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                        <div style={{ position: "relative" }}>
                            <input 
                                type="number"
                                className="form-control"
                                value={formData.working_days}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const wDays = parseInt(val) || 0;
                                    const gapDays = daysInMonth - wDays;
                                    
                                    // Update working days AND any automatic additions in the list
                                    const newAdditions = formData.additions.map(a => 
                                        a.is_automatic ? { ...a, days: gapDays.toString() } : a
                                    );
                                    
                                    setFormData({ 
                                        ...formData, 
                                        working_days: val,
                                        additions: newAdditions
                                    });
                                }}
                                style={{ width: "100%", padding: "0.5rem", fontSize: "16px", borderRadius: "4px", border: "1px solid #D1D1D1", fontWeight: "700", textAlign: "center" }}
                            />
                            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "#6B7280" }}>يوم</span>
                        </div>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "#0ea5e9", textAlign: "center", marginTop: "auto", paddingBottom: "0.5rem" }}>
                        {formatNumber(calculations.entitled)} <span style={{fontSize: "14px"}}>د.إ</span>
                    </div>
                </div>

                {/* 3. قسم الإضافات */}
                <div className="panel" style={{ flex: 1.2, margin: 0, padding: "1rem", border: "1px solid #E5E7EB", borderRadius: "12px", minHeight: "220px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#10B981", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                            <i className="fas fa-plus"></i> الإضافات
                        </h4>
                        {/* Editable Salary for Additions - Only if Auto exists */}
                        {formData.additions.some(a => a.is_automatic) && (
                            <div style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                gap: "0.3rem", 
                                background: "#F0FDF4", 
                                padding: "0 0.8rem", 
                                borderRadius: "6px", 
                                border: "1px solid #DCFCE7", 
                                color: "#059669", 
                                width: "fit-content", 
                                minWidth: "200px", 
                                height: "32px" 
                            }}>
                                <span style={{ fontSize: "11px", fontWeight: "600", display: "flex", alignItems: "center", height: "100%" }}>الراتب المخصص للاضافة:</span>
                                <input 
                                    type="number"
                                    value={formData.custom_base_salary}
                                    onChange={(e) => setFormData({ ...formData, custom_base_salary: e.target.value })}
                                    style={{ 
                                        width: "80px", 
                                        height: "22px", 
                                        border: "1px solid #059669", 
                                        borderRadius: "3px", 
                                        padding: "0", 
                                        fontSize: "11px", 
                                        fontWeight: "800", 
                                        textAlign: "center", 
                                        backgroundColor: "white", 
                                        color: "#111827",
                                        margin: "0"
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem", width: "100%" }}>
                            <button 
                                className="btn primary" 
                                onClick={() => addAddition(true)} 
                                style={{ flex: 1, fontSize: "10px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontWeight: "700", background: "#3B82F6", border: "none" }}
                            >
                                <i className="fas fa-magic" style={{fontSize: "10px"}}></i>
                                تلقائي ({formatNumber(calculations.autoAddition, 0)})
                            </button>
                            <button 
                                className="btn secondary outline" 
                                onClick={() => addAddition(false)} 
                                style={{ flex: 1, fontSize: "10px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontWeight: "600", border: "1px solid #D1D1D1" }}
                            >
                                <i className="fas fa-plus" style={{fontSize: "10px"}}></i>
                                يدوي
                            </button>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {formData.additions.length > 0 && (
                            <div style={{ display: "flex", gap: "0.3rem", padding: "0 0.25rem", marginBottom: "-0.2rem" }}>
                                <div style={{ width: "70px", fontSize: "10px", color: "#6B7280", fontWeight: "600", textAlign: "center" }}>القيمة / الأيام</div>
                                <div style={{ flex: 1, fontSize: "10px", color: "#6B7280", fontWeight: "600", paddingRight: "0.2rem" }}>السبب / التفاصيل</div>
                                <div style={{ width: "70px", fontSize: "10px", color: "#6B7280", fontWeight: "600", textAlign: "left" }}>الإجمالي</div>
                                <div style={{ width: "16px" }}></div>
                            </div>
                        )}
                        {formData.additions.length === 0 && <div style={{ fontSize: "10px", color: "#9CA3AF", textAlign: "center", padding: "1rem", border: "1px dashed #E5E7EB", borderRadius: "4px" }}>فارغ</div>}
                        {formData.additions.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "0.3rem", alignItems: "center", background: item.is_automatic ? "#F0FDF4" : "#f8fafc", padding: "0.25rem", borderRadius: "4px", border: item.is_automatic ? "1px solid #BBF7D0" : "1px solid #F1F5F9" }}>
                                {item.is_automatic ? (
                                    <>
                                        <div style={{ width: "45px" }}>
                                            <input 
                                                type="number" 
                                                value={item.days}
                                                onChange={(e) => {
                                                    const newArr = [...formData.additions];
                                                    newArr[idx].days = e.target.value;
                                                    setFormData({ ...formData, additions: newArr });
                                                }}
                                                style={{ width: "100%", padding: "0.35rem 0.2rem", fontSize: "13px", border: "1px solid #059669", borderRadius: "4px", textAlign: "center", fontWeight: "700", backgroundColor: "white", color: "#059669" }}
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="..."
                                            value={item.reason}
                                            onChange={(e) => {
                                                const newArr = [...formData.additions];
                                                newArr[idx].reason = e.target.value;
                                                setFormData({ ...formData, additions: newArr });
                                            }}
                                            style={{ flex: 1, padding: "0.3rem", fontSize: "12px", border: "1px solid #BBF7D0", borderRadius: "4px", backgroundColor: "#F9FAFB" }}
                                        />
                                        <div style={{ width: "70px", fontSize: "13px", fontWeight: "900", color: "#059669", textAlign: "left", paddingLeft: "0.2rem" }}>
                                            {formatNumber(parseFloat(item.days || 0) * (parseFloat(formData.custom_base_salary) / daysInMonth))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <input 
                                            type="number" 
                                            placeholder="0"
                                            value={item.amount}
                                            onChange={(e) => {
                                                const newArr = [...formData.additions];
                                                newArr[idx].amount = e.target.value;
                                                setFormData({ ...formData, additions: newArr });
                                            }}
                                            style={{ width: "70px", padding: "0.3rem", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "4px", textAlign: "center", fontWeight: "700", backgroundColor: "white" }}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="..."
                                            value={item.reason}
                                            onChange={(e) => {
                                                const newArr = [...formData.additions];
                                                newArr[idx].reason = e.target.value;
                                                setFormData({ ...formData, additions: newArr });
                                            }}
                                            style={{ flex: 1, padding: "0.3rem", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px", backgroundColor: "white" }}
                                        />
                                    </>
                                )}
                                <button style={{ border: "none", background: "none", color: "#EF4444", cursor: "pointer", fontSize: "16px", padding: "0 0.1rem" }} onClick={() => {
                                    setFormData({ ...formData, additions: formData.additions.filter((_, i) => i !== idx) });
                                }}>×</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. قسم الاقتطاعات */}
                <div className="panel" style={{ flex: 1, margin: 0, padding: "1rem", border: "1px solid #E5E7EB", borderRadius: "12px", minHeight: "220px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#DC2626", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                            <i className="fas fa-minus-circle"></i> الاقتطاعات
                        </h4>
                        <button 
                            className="btn primary" 
                            onClick={addDeduction} 
                            style={{ fontSize: "10px", height: "28px", padding: "0 0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: "700", background: "#3B82F6", border: "none" }}
                        >
                            <i className="fas fa-minus" style={{fontSize: "10px"}}></i>
                            إضافة
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {formData.deductions.length > 0 && (
                            <div style={{ display: "flex", gap: "0.3rem", padding: "0 0.25rem", marginBottom: "-0.2rem" }}>
                                <div style={{ width: "75px", fontSize: "10px", color: "#6B7280", fontWeight: "600", textAlign: "center" }}>القيمة</div>
                                <div style={{ flex: 1, fontSize: "10px", color: "#6B7280", fontWeight: "600", paddingRight: "0.2rem" }}>السبب / التفاصيل</div>
                                <div style={{ width: "16px" }}></div>
                            </div>
                        )}
                        {formData.deductions.length === 0 && <div style={{ fontSize: "10px", color: "#9CA3AF", textAlign: "center", padding: "1.5rem", border: "1px dashed #E5E7EB", borderRadius: "4px" }}>فارغ</div>}
                        {formData.deductions.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "0.3rem", alignItems: "center", background: "#fef2f2", padding: "0.25rem", borderRadius: "4px", border: "1px solid #FEE2E2" }}>
                                <input 
                                    type="number" 
                                    placeholder="0"
                                    value={item.amount}
                                    onChange={(e) => {
                                        const newArr = [...formData.deductions];
                                        newArr[idx].amount = e.target.value;
                                        setFormData({ ...formData, deductions: newArr });
                                    }}
                                    style={{ width: "75px", padding: "0.3rem", fontSize: "13px", border: "1px solid #FECACA", borderRadius: "4px", textAlign: "center", fontWeight: "700" }}
                                />
                                <input 
                                    type="text" 
                                    placeholder="..."
                                    value={item.reason}
                                    onChange={(e) => {
                                        const newArr = [...formData.deductions];
                                        newArr[idx].reason = e.target.value;
                                        setFormData({ ...formData, deductions: newArr });
                                    }}
                                    style={{ flex: 1, padding: "0.3rem", fontSize: "12px", border: "1px solid #FECACA", borderRadius: "4px" }}
                                />
                                <button style={{ border: "none", background: "none", color: "#EF4444", cursor: "pointer", fontSize: "16px", padding: "0 0.1rem" }} onClick={() => {
                                    setFormData({ ...formData, deductions: formData.deductions.filter((_, i) => i !== idx) });
                                }}>×</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        
            {/* 4. قسم الملاحظات */}
            <div className="panel" style={{ margin: 0, padding: "0.75rem 1.25rem", border: "1px solid #E5E7EB", backgroundColor: "#FFFBEB", borderRadius: "12px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "0.5rem", color: "#D97706", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fas fa-comment-dots"></i> الملاحظات والمراجعة المالية
                </h4>
                <textarea 
                    className="form-control"
                    placeholder="اكتب أي ملاحظات إدارية أو توضيحات حول الراتب هنا ليتم حفظها مع السجل..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: "0.6rem 0.75rem", 
                      minHeight: "45px", 
                      height: "45px",
                      fontSize: "14px", 
                      borderRadius: "8px", 
                      border: "1px solid #FCD34D", 
                      fontFamily: "Cairo", 
                      backgroundColor: "white",
                      lineHeight: "1.4",
                      resize: "none"
                    }}
                />
            </div>
        </div>

        {/* 5. Sticky Footer Summary */}
        <div className="modal-footer" style={{ 
          borderTop: "2px solid #E5E7EB", 
          padding: "1.5rem 2rem", 
          backgroundColor: "#F9FAFB", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexShrink: 0
        }}>
            <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                    className="btn secondary" 
                    disabled={currentIndex === 0 || isSaving}
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                    style={{ height: "42px", padding: "0 1.5rem", borderRadius: "4px", fontWeight: "600" }}
                >السابق</button>
                <button 
                    className="btn primary"
                    disabled={currentIndex === employees.length - 1 || isSaving}
                    onClick={handleNext}
                    style={{ 
                        height: "42px", 
                        padding: "0 1.5rem", 
                        borderRadius: "4px", 
                        fontWeight: "700",
                        backgroundColor: "#10B981", 
                        border: "none",
                        minWidth: "120px"
                    }}
                >
                    {isSaving ? "جاري الحفظ..." : "حفظ والتالي"}
                </button>
            </div>

            <div style={{ 
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              background: "#1F2937",
              padding: "0 1.5rem",
              height: "42px",
              borderRadius: "4px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
            }}>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", lineHeight: "1" }}>صافي الراتب</div>
                </div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#60A5FA", display: "flex", alignItems: "baseline", gap: "0.25rem", lineHeight: "1" }}>
                    {formatNumber(calculations.net)}
                    <span style={{fontSize: "11px", fontWeight: "600", color: "#9CA3AF"}}>د.إ</span>
                </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                  className="btn primary" 
                  disabled={isSaving}
                  onClick={handleSaveAndClose}
                  style={{ height: "42px", padding: "0 2rem", borderRadius: "4px", fontWeight: "700", boxShadow: "0 4px 6px -1px rgba(90, 122, 205, 0.3)" }}
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ وإغلاق"}
                </button>
                <button 
                  className="btn secondary outline" 
                  onClick={onClose}
                  style={{ height: "42px", padding: "0 1.5rem", borderRadius: "4px", fontWeight: "600", border: "1px solid #D1D1D1" }}
                >إلغاء</button>
            </div>
        </div>
      </div>
    </div>
  );
}
