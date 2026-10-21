import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenCheck, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useApp } from "@/app/providers/AppContext";
import AuthShowcase from "./AuthShowcase";
import { verifyAccount } from "./accounts";

const TEACHER_PASSCODE = "955110";

export default function LoginScreen() {
  const { setStudentId, setRole } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState("student");
  const [studentValue, setStudentValue] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [teacherValue, setTeacherValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "student") {
      const trimmed = studentValue.trim();
      if (!trimmed) return setError("Please enter your student ID");
      if (!/^\d{6,12}$/.test(trimmed)) {
        return setError("Student ID should be 6–12 digits");
      }
      if (!studentPassword) return setError("Please enter your password");

      setBusy(true);
      try {
        const result = await verifyAccount(trimmed, studentPassword);
        if (!result.ok) {
          setError(result.error === "not-found"
            ? "No account for this ID yet. Please create one first."
            : "Incorrect password");
          return;
        }
        setStudentId(trimmed);
        setRole("student");
        navigate("/student", { replace: true });
      } catch {
        setError("This browser cannot hash passwords. Open the app via localhost or https.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (teacherValue.trim() !== TEACHER_PASSCODE) {
      return setError("Incorrect teacher passcode");
    }
    setStudentId("");
    setRole("teacher");
    navigate("/teacher", { replace: true });
  };

  const onChangeMode = (next) => {
    setMode(next);
    setError("");
  };

  return (
    <div className="lg-screen">
      <AuthShowcase />

      <main className="lg-main">
        <form className="lg-form" onSubmit={submit}>
          <h1>Sign in</h1>
          <p className="lg-sub">Choose your role to open the 955110 Dashboard</p>

          <div className="lg-roles" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "student"}
              className={mode === "student" ? "on" : ""}
              onClick={() => onChangeMode("student")}
            >
              <GraduationCap size={17} />
              <span>Student</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "teacher"}
              className={mode === "teacher" ? "on" : ""}
              onClick={() => onChangeMode("teacher")}
            >
              <BookOpenCheck size={17} />
              <span>Teacher</span>
            </button>
          </div>

          {mode === "student" ? (
            <div className="lg-stack">
              <label className="lg-field" htmlFor="login-student">
                <span>Student ID</span>
                <input
                  id="login-student"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 682110192"
                  value={studentValue}
                  onChange={(e) => {
                    setStudentValue(e.target.value);
                    setError("");
                  }}
                  autoFocus
                />
              </label>
              <label className="lg-field" htmlFor="login-student-password">
                <span>Password</span>
                <div className="lg-pass">
                  <input
                    id="login-student-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={studentPassword}
                    onChange={(e) => {
                      setStudentPassword(e.target.value);
                      setError("");
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            </div>
          ) : (
            <label className="lg-field" htmlFor="login-teacher">
              <span>Teacher passcode</span>
              <input
                id="login-teacher"
                type="password"
                placeholder="Enter your password"
                value={teacherValue}
                onChange={(e) => {
                  setTeacherValue(e.target.value);
                  setError("");
                }}
                autoFocus
              />
            </label>
          )}

          {error && <div className="lg-error" role="alert">{error}</div>}

          <button type="submit" className="lg-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>

          {mode === "student" ? (
            <p className="lg-switch">Don't have an account? <Link to="/signup">Create one</Link></p>
          ) : (
            <p className="lg-hint">Sign in to manage announcements and meetings, and to see how the whole class is keeping up.</p>
          )}
        </form>
      </main>
    </div>
  );
}
