import React from "react";
import { useNavigate } from "react-router-dom";
import BranchCard from "../components/BranchCard";

export default function HomePage({ branches }) {
  const navigate = useNavigate();

  const handleSelectBranch = (branch) => {
    navigate(`/branch/${branch.id}`);
  };

  return (
    <>
      <main className="container">
        {branches.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#6B7280", fontSize: "14px" }}>لا توجد فروع متاحة حالياً</p>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
            gap: "1rem"
          }}>
            {branches.map((b) => (
              <BranchCard 
                key={b.id} 
                branch={b} 
                onSelect={handleSelectBranch}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
