import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Library, Save } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";
import { CourseColorPicker } from "./components/CourseColorPicker";
import CourseExceptionsEditor from "./components/CourseExceptionsEditor";
import WeeklySessionEditor, { emptySession } from "./components/WeeklySessionEditor";
import { ScheduleDatePicker } from "./components/ScheduleFormControls";

const EMPTY_FORM = {
  courseCode: "",
  courseName: "",
  color: "#2563eb",
  defaultLocation: "",
  termStart: "",
  termEnd: "",
  notes: "",
  privateNote: "",
  sessions: [emptySession()],
  exceptions: [],
};

export default function StudentCourseFormPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const routeState = useLocation().state;
  const returnTo = routeState?.from || "/student/schedule";
  const termDefaults = routeState?.term;
  const { studentId, addCourse, updateCourse, getCourseById } = useApp();
  const existing = useMemo(() => courseId ? getCourseById(courseId) : null, [courseId, getCourseById]);
  const newCourseForm = useMemo(
    () => ({ ...EMPTY_FORM, termStart: termDefaults?.start ?? "", termEnd: termDefaults?.end ?? "" }),
    [termDefaults]
  );
  const [form, setForm] = useState(() => existing ? { ...EMPTY_FORM, ...existing, sessions: existing.sessions.map((session) => ({ ...session })) } : newCourseForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const initialSnapshot = useMemo(
    () => JSON.stringify(existing ? { ...EMPTY_FORM, ...existing, sessions: existing.sessions } : newCourseForm),
    [existing, newCourseForm]
  );
  const dirty = JSON.stringify(form) !== initialSnapshot;

  useEffect(() => {
    const warn = (event) => {
      if (!dirty || saving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  const goBack = () => {
    if (dirty && !saving && !window.confirm("Discard your unsaved course changes?")) return;
    navigate(returnTo);
  };

  if (courseId && (!existing || existing.studentId !== studentId)) {
    return (
      <div className="main-wrapper course-form-page"><main className="main-content course-form-shell">
        <button className="back-btn" onClick={() => navigate(returnTo)}><ArrowLeft size={18} /> Back</button>
        <div className="course-form-missing"><BookOpen size={32} /><h1>Course not found</h1><p>This course does not exist or you cannot edit it.</p></div>
      </main></div>
    );
  }

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();
    setSaving(true);
    const result = courseId ? updateCourse(courseId, form) : addCourse(form);
    if (!result.ok) {
      setErrors(result.errors || { form: result.error || "Unable to save this course." });
      setSaving(false);
      return;
    }
    navigate(returnTo, { replace: true });
  };

  return (
    <div className="main-wrapper course-form-page">
      <main className="main-content course-form-shell">
        <button className="back-btn" type="button" onClick={goBack}><ArrowLeft size={18} /> {returnTo === "/student/schedule" ? "Back to schedule" : "Back to my courses"}</button>
        <header className="course-form-title-row">
          <div><span>Personal timetable</span><h1>{courseId ? "Edit course" : "Add course"}</h1><p>Set the term dates and every weekly class time.</p></div>
          <div className="course-form-title-actions">
            {!courseId && (
              <button type="button" className="course-cancel-btn course-list-link" onClick={() => navigate("/student/schedule/courses")}>
                <Library size={16} /> My courses
              </button>
            )}
            <div className="course-form-status">{existing?.verificationStatus === "verified" ? "Verified course" : "Self-reported"}</div>
          </div>
        </header>

        <form className="course-form-card" onSubmit={submit}>
          <section className="course-form-section">
            <div className="course-form-grid two">
              <label><span>Course code *</span><input value={form.courseCode} onChange={(event) => update("courseCode", event.target.value)} placeholder="955110" />{errors.courseCode && <small>{errors.courseCode}</small>}</label>
              <label><span>Course name *</span><input value={form.courseName} onChange={(event) => update("courseName", event.target.value)} placeholder="Digital Technology" />{errors.courseName && <small>{errors.courseName}</small>}</label>
            </div>
            <div className="course-form-grid three">
              <label><span>Term starts *</span><ScheduleDatePicker value={form.termStart} onChange={(value) => update("termStart", value)} placeholder="Select start date" />{errors.termStart && <small>{errors.termStart}</small>}</label>
              <label><span>Term ends *</span><ScheduleDatePicker value={form.termEnd} onChange={(value) => update("termEnd", value)} placeholder="Select end date" />{errors.termEnd && <small>{errors.termEnd}</small>}</label>
              <label><span>Course color</span><CourseColorPicker value={form.color} onChange={(value) => update("color", value)} /></label>
            </div>
            <label><span>Default room / location</span><input value={form.defaultLocation} onChange={(event) => update("defaultLocation", event.target.value)} placeholder="Used when a class time has no location" /></label>
          </section>

          <WeeklySessionEditor sessions={form.sessions} onChange={(sessions) => update("sessions", sessions)} errors={errors} />

          {courseId && (
            <CourseExceptionsEditor exceptions={form.exceptions || []} onChange={(exceptions) => update("exceptions", exceptions)} />
          )}

          <section className="course-form-section course-form-notes">
            <label><span>Verification note visible to teacher</span><textarea rows={3} value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Section number or supporting timetable information" /></label>
            <label><span>Private note</span><textarea rows={3} value={form.privateNote} onChange={(event) => update("privateNote", event.target.value)} placeholder="Only you can see this note" /></label>
          </section>

          {errors.form && <div className="course-form-error">{errors.form}</div>}
          <footer className="course-form-actions">
            <button type="button" className="course-cancel-btn" onClick={goBack}>Cancel</button>
            <button type="submit" className="course-save-btn" disabled={saving}><Save size={17} /> {courseId ? "Save changes" : "Add course"}</button>
          </footer>
        </form>
      </main>
    </div>
  );
}
