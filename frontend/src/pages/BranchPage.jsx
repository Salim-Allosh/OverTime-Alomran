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
      <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "0" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.2rem",
            background: "var(--bg-white)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--border-radius)",
            color: "var(--text-primary)",
            fontSize: "var(--font-size-body)",
            fontWeight: 500,
            fontFamily: "var(--font-family)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "var(--shadow-sm)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.transform = "translateX(-3px)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-white)";
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.transform = "translateX(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "18px", height: "18px" }}
          >
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          العودة
        </button>
      </div>
      <div className="container">
        <form className="panel" onSubmit={submit} style={{ maxWidth: "600px", margin: "0 auto", padding: "1.25rem" }}>
          <h3 style={{ textAlign: "center", marginBottom: "1.25rem" }}>تسجيل جلسة إضافية - {branch.name}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                placeholder="اسم المدرس"
                value={form.teacher_name}
                onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                required
                style={{ width: "100%", padding: "0.5rem 0.75rem" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                placeholder="اسم الطالب"
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                required
                style={{ width: "100%", padding: "0.5rem 0.75rem" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="date"
                value={form.session_date}
                onChange={(e) => setForm({ ...form, session_date: e.target.value })}
                required
                style={{ width: "100%", padding: "0.5rem 0.75rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "0.35rem", display: "block" }}>
                وقت الجلسة (من - إلى)
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <input
                    type="time"
                    placeholder="من الساعة"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem" }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <input
                    type="time"
                    placeholder="إلى الساعة"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem" }}
                  />
                </div>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="number"
                step="0.25"
                placeholder="عدد الساعات"
                value={form.duration_hours}
                onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
                required
                style={{ width: "100%", padding: "0.5rem 0.75rem" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                placeholder="نص المدة (مثال: ساعتان)"
                value={form.duration_text}
                onChange={(e) => setForm({ ...form, duration_text: e.target.value })}
                required
                style={{ width: "100%", padding: "0.5rem 0.75rem" }}
              />
            </div>
          </div>
          <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn primary" type="submit">إرسال المسودة</button>
          </div>
        </form>
      </div>
    </>
  );
}

