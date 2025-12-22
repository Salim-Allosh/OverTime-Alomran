import React from "react";
import { useNavigate } from "react-router-dom";
import BranchCard from "../components/BranchCard";

export default function HomePage({ branches, colorClasses }) {
  const navigate = useNavigate();

  const handleSelectBranch = (branch) => {
    navigate(`/branch/${branch.id}`);
  };

  return (
    <>
      <main className="container">
        {branches.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>لا توجد فروع متاحة حالياً</p>
          </div>
        ) : (
          <div className="cards-grid">
            {branches.map((b, index) => (
              <BranchCard 
                key={b.id} 
                branch={b} 
                onSelect={handleSelectBranch}
                colorClass={colorClasses[index % colorClasses.length]}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}


