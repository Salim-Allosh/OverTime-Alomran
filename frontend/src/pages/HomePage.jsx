import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BranchCard from "../components/BranchCard";
import { apiGet } from "../api";

export default function HomePage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    apiGet("/branches", token)
      .then(setBranches)
      .catch((err) => {
        console.error("Error loading branches:", err);
        setBranches([]);
      });
  }, [token]);

  const handleSelectBranch = (branch) => {
    navigate(`/branch/${branch.id}`);
  };

  return (
    <>
      <main className="container">
        {branches.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#6B7280", fontSize: "14px" }}>
              {token ? "لا توجد فروع متاحة حالياً" : "يرجى تسجيل الدخول لعرض الفروع"}
            </p>
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
