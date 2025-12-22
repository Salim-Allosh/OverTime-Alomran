import React from "react";

export default function BranchCard({ branch, onSelect, colorClass }) {
  const icons = {
    red: "🕐",
    green: "📚",
    blue: "💰",
    purple: "🎓",
    orange: "📖",
    teal: "✏️",
    pink: "📝",
    indigo: "📋",
    amber: "📊"
  };

  const getBranchInfo = (branch, colorClass) => {
    return {
      title: branch.name,
      description: `اختر هذا الفرع لتسجيل الجلسات الإضافية`
    };
  };

  const branchInfo = getBranchInfo(branch, colorClass);

  return (
    <div className={`card card-${colorClass}`} onClick={() => onSelect(branch)}>
      <div className="card-header">
        <div className="card-icon">{icons[colorClass] || icons.red}</div>
        <div className="card-title">{branchInfo.title}</div>
      </div>
      <div className="card-body">
        <p>{branchInfo.description}</p>
      </div>
      <div className="card-footer">
        <button className="card-button" type="button">اختيار الفرع</button>
      </div>
    </div>
  );
}


