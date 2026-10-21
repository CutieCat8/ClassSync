import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useApp } from "@/app/providers/AppContext";
import AuthShowcase from "./AuthShowcase";
import { createAccount } from "./accounts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const { setStudentId, setRole } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: "", lastName: "", studentId: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "Please enter your first name";
    if (!form.lastName.trim()) next.lastName = "Please enter your last name";
    if (!/^\d{6,12}$/.test(form.studentId.trim())) next.studentId = "Student ID should be 6–12 digits";
    if (!EMAIL_PATTERN.test(form.email.trim())) next.email = "That email address doesn't look right";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters";
    if (!agreed) next.agreed = "Please accept the terms to continue";
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate();
    if (Object.keys(found).length) return setErrors(found);

    setBusy(true);
    try {
      const studentId = form.studentId.trim();
      const result = await createAccount({ ...form, studentId });
      if (!result.ok) {
        setErrors({ studentId: "An account already exists for this student ID. Try signing in instead." });
        return;
      }
      setStudentId(studentId);
      setRole("student");
      navigate("/student", { replace: true });
    } catch {
      setErrors({ form: "This browser cannot hash passwords. Open the app via localhost or https." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lg-screen">
      <AuthShowcase />

      <main className="lg-main">
        <form className="lg-form" onSubmit={submit} noValidate>
          <h1>Create an account</h1>
          <p className="lg-sub">For students of course 955110</p>

          <div className="lg-stack">
            <div className="lg-grid-2">
              <label className="lg-field">
                <span>First name</span>
                <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} autoComplete="given-name" autoFocus />
                {errors.firstName && <small>{errors.firstName}</small>}
              </label>
              <label className="lg-field">
                <span>Last name</span>
                <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} autoComplete="family-name" />
                {errors.lastName && <small>{errors.lastName}</small>}
              </label>
            </div>

            <label className="lg-field">
              <span>Student ID</span>
              <input value={form.studentId} onChange={(e) => update("studentId", e.target.value)} inputMode="numeric" placeholder="e.g. 682110192" />
              {errors.studentId && <small>{errors.studentId}</small>}
            </label>

            <label className="lg-field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" placeholder="name@example.com" />
              {errors.email && <small>{errors.email}</small>}
            </label>

            <label className="lg-field">
              <span>Password</span>
              <div className="lg-pass">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <small>{errors.password}</small>}
            </label>
          </div>

          <label className="lg-check">
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((c) => ({ ...c, agreed: undefined })); }} />
            <span>I agree to the terms of use and privacy policy for course 955110</span>
          </label>
          {errors.agreed && <small className="lg-check-error">{errors.agreed}</small>}

          {errors.form && <div className="lg-error" role="alert">{errors.form}</div>}

          <button type="submit" className="lg-submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>

          <p className="lg-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </form>
      </main>
    </div>
  );
}
