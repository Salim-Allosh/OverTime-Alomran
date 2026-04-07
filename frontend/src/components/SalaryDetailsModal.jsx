import React, { useMemo } from 'react';

const SalaryDetailsModal = ({ show, onClose, branchName, monthName, month, year, data, onEmployeeClick }) => {
    if (!show || !data) return null;

    const daysInMonth = new Date(year, month, 0).getDate();

    const formatNumber = (num) => {
        if (num === undefined || num === null || isNaN(num)) return "0.00";
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const totals = useMemo(() => {
        return data.reduce((acc, item) => {
            const salary = item.salary_record || {};
            const employee = item.employee || {};
            const items = salary.items || [];
            
            const additions = items.filter(i => i.type === 'addition');
            const deductions = items.filter(i => i.type === 'deduction');

            const adds = additions.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
            const deds = deductions.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
            
            return {
                contract: acc.contract + (parseFloat(employee.salary || 0)),
                base: acc.base + (parseFloat(salary.base_salary || employee.salary || 0)),
                entitled: acc.entitled + parseFloat(salary.entitled_salary || 0),
                additions: acc.additions + adds,
                deductions: acc.deductions + deds,
                net: acc.net + parseFloat(salary.net_salary || 0)
            };
        }, { contract: 0, base: 0, entitled: 0, additions: 0, deductions: 0, net: 0 });
    }, [data]);

    return (
        <div className="modal-overlay" onClick={onClose} style={{ 
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", 
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 2000,
            overflow: "hidden"
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
                maxWidth: "1350px", 
                width: "98%", 
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                borderRadius: "20px", 
                border: "none",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
                backgroundColor: "white",
                overflow: "hidden"
            }}>
                <div className="modal-header" style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "1.25rem 2rem", 
                    borderBottom: "1px solid #F3F4F6",
                    background: "white"
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800", color: "#111827" }}>
                            تفاصيل رواتب فرع: {branchName}
                        </h3>
                        <p style={{ margin: "0.25rem 0 0 0", color: "#6B7280", fontSize: "0.9rem" }}>
                            الفترة المالية: {monthName} {year}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ 
                        background: "#F3F4F6", 
                        border: "none", 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "10px", 
                        fontSize: "1.5rem", 
                        cursor: "pointer", 
                        color: "#6B7280",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                    }} onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"} onMouseLeave={e => e.currentTarget.style.background = "#F3F4F6"}>&times;</button>
                </div>

                <div className="modal-body" style={{ padding: "1.5rem", overflowY: "auto", flex: 1, backgroundColor: "#F9FAFB" }}>
                    <div className="table-container" style={{ 
                        backgroundColor: "white", 
                        borderRadius: "12px", 
                        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
                        overflowX: "auto",
                        border: "1px solid #E5E7EB"
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>الرقم</th>
                                    <th style={{ padding: "14px 10px", textAlign: "right", fontSize: "0.85rem", color: "#4B5563" }}>الموظف</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>أيام الشهر</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>الراتب الأساسي</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>أيام الدوام</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>المستحق</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>أيام الإضافي</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>راتب الاضافي</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>مبلغ الإضافي</th>
                                    <th style={{ padding: "14px 10px", textAlign: "right", fontSize: "0.8rem", color: "#4B5563" }}>سبب الإضافة</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.85rem", color: "#4B5563" }}>مبلغ الخصم</th>
                                    <th style={{ padding: "14px 10px", textAlign: "right", fontSize: "0.8rem", color: "#4B5563" }}>سبب الخصم</th>
                                    <th style={{ padding: "14px 10px", textAlign: "center", fontSize: "1rem", color: "#111827", fontWeight: "700" }}>الصافي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, idx) => {
                                    const salary = item.salary_record || {};
                                    const employee = item.employee || {};
                                    const items = salary.items || [];
                                    
                                    const additions = items.filter(i => i.type === 'addition');
                                    const deductions = items.filter(i => i.type === 'deduction');
                                    const overtimeItem = additions.find(i => i.is_automatic);

                                    const addsTotal = additions.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
                                    const dedsTotal = deductions.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
                                    const addReasons = additions.map(i => i.reason).filter(Boolean).join(' | ');
                                    const dedReasons = deductions.map(i => i.reason).filter(Boolean).join(' | ');

                                    return (
                                        <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6", transition: "background-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                                            <td style={{ padding: "12px 10px", textAlign: "center", color: "#6B7280", fontSize: "0.9rem" }}>{item.employee.employment_number || '-'}</td>
                                            <td 
                                                style={{ 
                                                    padding: "12px 10px", 
                                                    fontWeight: "600", 
                                                    color: "#3B82F6", 
                                                    cursor: "pointer"
                                                }}
                                                onClick={() => onEmployeeClick(item.employee.id)}
                                                title="اضغط لمعالجة راتب هذا الموظف"
                                            >
                                                {item.employee.name}
                                            </td>
                                            <td style={{ padding: "12px 10px", textAlign: "center" }}>{daysInMonth}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: "500" }}>{formatNumber(employee.salary)}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "center" }}>{salary.working_days || 0}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "center", color: "#4B5563" }}>{formatNumber(salary.entitled_salary)}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "center" }}>{overtimeItem ? overtimeItem.days : 0}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "center" }}>{formatNumber(salary.base_salary || employee.salary)}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "center", color: "#10B981", fontWeight: "700" }}>{formatNumber(addsTotal)}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "right", fontSize: "0.75rem", color: "#6B7280", minWidth: "120px" }}>{addReasons || '-'}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "center", color: "#EF4444", fontWeight: "700" }}>{formatNumber(dedsTotal)}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "right", fontSize: "0.75rem", color: "#6B7280", minWidth: "120px" }}>{dedReasons || '-'}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: "800", color: "#1F2937" }}>{formatNumber(salary.net_salary)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ backgroundColor: "#EFF6FF", borderTop: "2px solid #BFDBFE" }}>
                                    <td colSpan="3" style={{ padding: "16px", textAlign: "center", fontWeight: "800", color: "#1E40AF" }}>إجمالي الفرع</td>
                                    <td style={{ padding: "16px", textAlign: "center", fontWeight: "700" }}>{formatNumber(totals.contract)}</td>
                                    <td style={{ padding: "16px", textAlign: "center" }}>-</td>
                                    <td style={{ padding: "16px", textAlign: "center", fontWeight: "700" }}>{formatNumber(totals.entitled)}</td>
                                    <td style={{ padding: "16px", textAlign: "center" }}>-</td>
                                    <td style={{ padding: "16px", textAlign: "center", fontWeight: "700" }}>{formatNumber(totals.base)}</td>
                                    <td style={{ padding: "16px", textAlign: "center", color: "#059669", fontWeight: "800" }}>{formatNumber(totals.additions)}</td>
                                    <td></td>
                                    <td style={{ padding: "16px", textAlign: "center", color: "#DC2626", fontWeight: "800" }}>{formatNumber(totals.deductions)}</td>
                                    <td></td>
                                    <td style={{ padding: "16px", textAlign: "center", fontSize: "1.1rem", color: "#1E40AF", fontWeight: "900" }}>{formatNumber(totals.net)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="modal-footer" style={{ 
                    padding: "1.25rem 2rem", 
                    borderTop: "1px solid #F3F4F6", 
                    display: "flex", 
                    justifyContent: "flex-end",
                    background: "white",
                    gap: "1rem"
                }}>
                    <button className="btn secondary" onClick={onClose} style={{ 
                        height: "44px", 
                        padding: "0 2.5rem", 
                        borderRadius: "12px", 
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        backgroundColor: "#F3F4F6",
                        color: "#4B5563",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#E5E7EB"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "#F3F4F6"}>إغلاق</button>
                    {/* Add download PDF button directly in the modal for convenience? Optional but high quality */}
                </div>
            </div>
        </div>
    );
};

export default SalaryDetailsModal;
