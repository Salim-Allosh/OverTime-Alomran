import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./contexts/NotificationContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import BranchPage from "./pages/BranchPage";
import DraftsPage from "./pages/DraftsPage";
import AdminPage from "./pages/AdminPage";
import ReportsPage from "./pages/ReportsPage";
import ContractsPage from "./pages/ContractsPage";
import DailyReportsPage from "./pages/DailyReportsPage";
import { apiGet } from "./api";

export default function App() {
  const [branches, setBranches] = useState([]);
  const colorClasses = ["red", "green", "blue", "purple", "orange", "teal", "pink", "indigo", "amber"];

  useEffect(() => {
    apiGet("/branches", "")
      .then(setBranches)
      .catch((err) => {
        console.error("Error loading branches:", err);
        setBranches([]);
      });
  }, []);

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage branches={branches} colorClasses={colorClasses} />} />
            <Route path="/branch/:branchId" element={<BranchPage />} />
            <Route path="/drafts" element={<DraftsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/daily-reports" element={<DailyReportsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </NotificationProvider>
  );
}
