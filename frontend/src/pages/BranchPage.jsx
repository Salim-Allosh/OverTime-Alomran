import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../api";
import { useState, useEffect } from "react";
import { useNotification } from "../contexts/NotificationContext";

export default function BranchPage() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [branch, setBranch] = useState(null);
  const [form, setForm] = useState({
    teacher_name: "",
    student_name: "",
    session_date: "",
    start_time: "",
    end_time: "",
    duration_hours: "",
    duration_text: ""
  });

  useEffect(() => {
    apiGet("/branches", "")
      .then(branches => {
        const found = branches.find(b => b.id === parseInt(branchId));
        if (found) {
          setBranch(found);
        } else {
          navigate("/");
        }
      })
      .catch((err) => {
        console.error("Error loading branch:", err);
        navigate("/");
      });
  }, [branchId, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/drafts", { ...form, branch_id: branch.id });
      setForm({ teacher_name: "", student_name: "", session_date: "", start_time: "", end_time: "", duration_hours: "", duration_text: "" });
      success("تم إرسال المسودة بنجاح!");
    } catch (err) {
      error("حدث خطأ أثناء إرسال المسودة");
    }
  };

  if (!branch) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <>
      <div className="page-header">
        <button className="back-button" onClick={() => navigate("/")}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          العودة
        </button>
        <h1 className="main-title">تسجيل جلسة إضافية - {branch.name}</h1>
      </div>
      <div className="container">
        <form className="panel" onSubmit={submit}>
          <h3>تسجيل جلسة إضافية - {branch.name}</h3>
          <div className="grid">
            <input 
              placeholder="اسم المدرس" 
              value={form.teacher_name} 
              onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} 
              required 
            />
            <input 
              placeholder="اسم الطالب" 
              value={form.student_name} 
              onChange={(e) => setForm({ ...form, student_name: e.target.value })} 
              required 
            />
            <input 
              type="date" 
              value={form.session_date} 
              onChange={(e) => setForm({ ...form, session_date: e.target.value })} 
              required 
            />
            <input 
              type="time" 
              placeholder="من الساعة" 
              value={form.start_time} 
              onChange={(e) => setForm({ ...form, start_time: e.target.value })} 
            />
            <input 
              type="time" 
              placeholder="إلى الساعة" 
              value={form.end_time} 
              onChange={(e) => setForm({ ...form, end_time: e.target.value })} 
            />
            <input 
              type="number" 
              step="0.25" 
              placeholder="عدد الساعات" 
              value={form.duration_hours} 
              onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} 
              required 
            />
            <input 
              placeholder="نص المدة (مثال: ساعتان)" 
              value={form.duration_text} 
              onChange={(e) => setForm({ ...form, duration_text: e.target.value })} 
              required 
            />
          </div>
          <button className="btn primary" type="submit">إرسال المسودة</button>
        </form>
      </div>
    </>
  );
}

