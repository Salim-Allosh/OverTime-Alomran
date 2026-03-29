import React, { useMemo } from 'react';

const SalaryDetailsModal = ({ show, onClose, branchName, monthName, year, data, onEmployeeClick }) => {
    if (!show || !data) return null;

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
    };

    const totals = useMemo(() => {
        return data.reduce((acc, item) => {
            const salary = item.salary_record || {};
            const items = salary.items || [];
            const adds = items.filter(i => i.type === 'addition').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
            const deds = items.filter(i => i.type === 'deduction').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
            
            return {
                base: acc.base + parseFloat(salary.base_salary || 0),
                entitled: acc.entitled + parseFloat(salary.entitled_salary || 0),
                additions: acc.additions + adds,
                deductions: acc.deductions + deds,
                net: acc.net + parseFloat(salary.net_salary || 0)
            };
        }, { base: 0, entitled: 0, additions: 0, deductions: 0, net: 0 });
    }, [data]);

    return (
        <div className="modal-overlay" onClick={onClose} style={{ 
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)", 
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            zIndex: 2000,
            overflow: "hidden"
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
                maxWidth: "1100px", 
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
                <div className="modal-header" style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "1.25rem 1.5rem", 
                    borderBottom: "1px solid #E5E7EB",
                    background: "white"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#1F2937" }}>
                        تفاصيل رواتب فرع: {branchName} - {monthName} {year}
                    </h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9CA3AF" }}>&times;</button>
                </div>

                <div className="modal-body" style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
                    <div className="table-container">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#F9FAFB" }}>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #E5E7EB", textAlign: "center" }}>الرقم</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #E5E7EB" }}>الموظف</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #E5E7EB", textAlign: "center" }}>الأساسي</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #E5E7EB", textAlign: "center" }}>المستحق</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #E5E7EB", textAlign: "center" }}>الإضافات</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #E5E7EB", textAlign: "center" }}>الخصومات</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #E5E7EB", textAlign: "center" }}>الصافي</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #E5E7EB" }}>ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, idx) => {
                                    const salary = item.salary_record || {};
                                    const items = salary.items || [];
                                    const adds = items.filter(i => i.type === 'addition').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
                                    const deds = items.filter(i => i.type === 'deduction').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

                                    return (
                                        <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                                            <td style={{ padding: "10px", textAlign: "center", color: "#6B7280" }}>{item.employee.employment_number || '-'}</td>
                                            <td 
                                                style={{ 
                                                    padding: "10px", 
                                                    fontWeight: "600", 
                                                    color: "#5A7ACD", 
                                                    cursor: "pointer",
                                                    textDecoration: "underline"
                                                }}
                                                onClick={() => onEmployeeClick(item.employee.id)}
                                                title="اضغط لمعالجة راتب هذا الموظف"
                                            >
                                                {item.employee.name}
                                            </td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>{formatNumber(salary.base_salary)}</td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>{formatNumber(salary.entitled_salary)}</td>
                                            <td style={{ padding: "10px", textAlign: "center", color: "#10B981", fontWeight: "600" }}>{adds > 0 ? `+${formatNumber(adds)}` : '-'}</td>
                                            <td style={{ padding: "10px", textAlign: "center", color: "#EF4444", fontWeight: "600" }}>{deds > 0 ? `-${formatNumber(deds)}` : '-'}</td>
                                            <td style={{ padding: "10px", textAlign: "center", fontWeight: "700", color: "#1F2937" }}>{formatNumber(salary.net_salary)}</td>
                                            <td style={{ padding: "10px", fontSize: "0.75rem", color: "#6B7280", maxWidth: "200px" }}>{salary.notes || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ backgroundColor: "#EFF6FF", fontWeight: "700" }}>
                                    <td colSpan="2" style={{ padding: "12px", textAlign: "center" }}>إجمالي الفرع</td>
                                    <td style={{ padding: "12px", textAlign: "center" }}>{formatNumber(totals.base)}</td>
                                    <td style={{ padding: "12px", textAlign: "center" }}>{formatNumber(totals.entitled)}</td>
                                    <td style={{ padding: "12px", textAlign: "center", color: "#059669" }}>{formatNumber(totals.additions)}</td>
                                    <td style={{ padding: "12px", textAlign: "center", color: "#DC2626" }}>{formatNumber(totals.deductions)}</td>
                                    <td style={{ padding: "12px", textAlign: "center", fontSize: "1rem", color: "#1E40AF" }}>{formatNumber(totals.net)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="modal-footer" style={{ 
                    padding: "1.25rem 1.5rem", 
                    borderTop: "1px solid #E5E7EB", 
                    display: "flex", 
                    justifyContent: "flex-end",
                    background: "#F9FAFB"
                }}>
                    <button className="btn secondary" onClick={onClose} style={{ height: "42px", padding: "0 2rem", borderRadius: "4px", fontWeight: "600" }}>إغلاق</button>
                </div>
            </div>
        </div>
    );
};

export default SalaryDetailsModal;
