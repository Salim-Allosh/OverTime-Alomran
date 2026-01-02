import React from "react";

export default function BranchCard({ branch, onSelect }) {
  return (
    <div
      className="branch-card"
      onClick={() => onSelect(branch)}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "0.75rem"
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: "16px",
            margin: 0,
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "#2B2A2A"
          }}>
            {branch.name}
          </h3>
          <p style={{
            fontSize: "12px",
            color: "#6B7280",
            margin: 0,
            lineHeight: 1.5
          }}>
            اختر هذا الفرع لتسجيل الجلسات الإضافية
          </p>
        </div>
      </div>
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingTop: "0.75rem",
        borderTop: "1px solid #E5E7EB"
      }}>
        <button
          className="btn primary btn-small"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(branch);
          }}
        >
          اختيار الفرع
        </button>
      </div>
    </div>
  );
}
