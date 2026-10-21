import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Briefcase, Check, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";
import { ACADEMIC_TERMS, getDefaultTermId, getTermState, groupCoursesByTerm } from "./lib/academic-terms";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_LABEL = { verified: "Verified by teacher", "needs-review": "Needs review", "self-reported": "Self-reported" };
const LIST_PATH = "/student/schedule/courses";
const OTHER = "other";

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthYear(iso, withYear) {
  return new Intl.DateTimeFormat("en-US", withYear ? { month: "short", year: "numeric" } : { month: "short" })
    .format(new Date(`${iso}T00:00:00`));
}

function formatRange(term) {
  const sameYear = term.start.slice(0, 4) === term.end.slice(0, 4);
  return `${monthYear(term.start, !sameYear)} – ${monthYear(term.end, true)}`;
}

function formatDay(iso) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${iso}T00:00:00`));
}

function sortSessions(sessions) {
  return [...sessions].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const { studentId, getCoursesForStudent, removeCourse } = useApp();
  const today = toISO(new Date());
  const [selectedId, setSelectedId] = useState(() => getDefaultTermId(today));
  const [search, setSearch] = useState("");
  const courses = getCoursesForStudent(studentId);

  const { byTerm, unassigned } = useMemo(() => groupCoursesByTerm(courses), [courses]);
  const term = ACADEMIC_TERMS.find((item) => item.id === selectedId) || null;
  const termCourses = selectedId === OTHER ? unassigned : byTerm.get(selectedId) || [];

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...termCourses]
      .filter((course) => !query || `${course.courseCode} ${course.courseName} ${course.defaultLocation}`.toLowerCase().includes(query))
      .sort((a, b) => a.termStart.localeCompare(b.termStart) || a.courseName.localeCompare(b.courseName));
  }, [termCourses, search]);

  const remove = (course) => {
    if (!window.confirm(`Delete ${course.courseCode} ${course.courseName}?`)) return;
    removeCourse(course.id);
  };

  const addToTerm = () => navigate("/student/schedule/add-course", {
    state: { from: LIST_PATH, term: term ? { start: term.start, end: term.end } : undefined },
  });

  const verifiedCount = termCourses.filter((course) => course.verificationStatus === "verified").length;
  const courseWord = (count) => `${count} ${count === 1 ? "course" : "courses"}`;

  return (
    <div className="main-wrapper course-form-page mc-page">
      <main className="main-content course-form-shell">
        <button className="back-btn" type="button" onClick={() => navigate("/student/schedule")}>
          <ArrowLeft size={18} /> Back to schedule
        </button>

        <header className="course-form-title-row">
          <div>
            <span>Programme timeline</span>
            <h1>My courses</h1>
            <p>{courseWord(courses.length)} registered across your 3-year programme.</p>
          </div>
          <div className="course-form-title-actions">
            <button type="button" className="course-save-btn" onClick={addToTerm}>
              <Plus size={17} /> Add course
            </button>
          </div>
        </header>

        <div className="mc-layout">
          <nav className="mc-rail" aria-label="Programme terms">
            <ol>
              {ACADEMIC_TERMS.map((item) => {
                const state = getTermState(item, today);
                const count = (byTerm.get(item.id) || []).length;
                return (
                  <li key={item.id} className={`is-${state}`}>
                    <button
                      type="button"
                      className={`mc-term${selectedId === item.id ? " is-selected" : ""}`}
                      aria-current={selectedId === item.id ? "true" : undefined}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <span className="mc-term-dot" aria-hidden="true">
                        {state === "past" && <Check size={9} strokeWidth={3} />}
                      </span>
                      <span className="mc-term-text">
                        <strong>{item.short}</strong>
                        <small>{formatRange(item)}</small>
                      </span>
                      {state === "current" && <em>Now</em>}
                      {item.kind === "study"
                        ? <b className="mc-term-count" aria-label={courseWord(count)}>{count}</b>
                        : <Briefcase size={14} className="mc-term-icon" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
              {unassigned.length > 0 && (
                <li className="is-other">
                  <button
                    type="button"
                    className={`mc-term${selectedId === OTHER ? " is-selected" : ""}`}
                    aria-current={selectedId === OTHER ? "true" : undefined}
                    onClick={() => setSelectedId(OTHER)}
                  >
                    <span className="mc-term-dot" aria-hidden="true" />
                    <span className="mc-term-text">
                      <strong>Other dates</strong>
                      <small>Outside the programme</small>
                    </span>
                    <b className="mc-term-count" aria-label={courseWord(unassigned.length)}>{unassigned.length}</b>
                  </button>
                </li>
              )}
            </ol>
          </nav>

          <section className="mc-panel" aria-live="polite">
            <header className="mc-panel-head">
              <div>
                <h2>{term ? term.label : "Courses outside the programme terms"}</h2>
                <p>
                  {term
                    ? `${formatRange(term)}${term.kind === "study" ? ` · ${courseWord(termCourses.length)}${verifiedCount ? ` · ${verifiedCount} verified` : ""}` : " · 16 months"}`
                    : "These courses do not fall inside any programme term."}
                </p>
              </div>
              {termCourses.length > 0 && (
                <label className="mc-search">
                  <Search size={15} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this term" />
                </label>
              )}
            </header>

            {term?.kind === "internship" && (
              <div className="mc-note">
                <Briefcase size={18} />
                <div>
                  <strong>Internship until graduation</strong>
                  <span>Year 3 is a 16-month internship, so there are no classes to register in this period.</span>
                </div>
              </div>
            )}

            {visible.length === 0 ? (
              term?.kind === "internship" && termCourses.length === 0 ? null : (
                <div className="mc-empty">
                  <BookOpen size={26} strokeWidth={1.5} />
                  <h3>{termCourses.length === 0 ? "No courses in this term yet" : "No matching courses"}</h3>
                  <p>{termCourses.length === 0 ? "Add a course here, or import an .ics calendar from the schedule page." : "Try a different search."}</p>
                  {termCourses.length === 0 && (
                    <button type="button" className="course-save-btn" onClick={addToTerm}><Plus size={17} /> Add course to this term</button>
                  )}
                </div>
              )
            ) : (
              <ul className="mc-list">
                {visible.map((course) => {
                  const changed = course.exceptions.length;
                  return (
                    <li key={course.id} className="mc-course" style={{ "--course-color": course.color }}>
                      <span className="mc-course-bar" aria-hidden="true" />
                      <div className="mc-course-main">
                        <div className="mc-course-title">
                          <strong>{course.courseCode}</strong>
                          <span>{course.courseName}</span>
                        </div>
                        <ul className="mc-sessions" aria-label="Weekly class times">
                          {sortSessions(course.sessions).map((session) => (
                            <li key={session.id}>
                              <b>{DAY_NAMES[session.dayOfWeek]}</b> {session.startTime}–{session.endTime}
                            </li>
                          ))}
                        </ul>
                        <p className="mc-course-meta">
                          {formatDay(course.termStart)} – {formatDay(course.termEnd)}
                          {course.defaultLocation ? ` · ${course.defaultLocation}` : ""}
                          {changed ? ` · ${changed} skipped/changed ${changed === 1 ? "date" : "dates"}` : ""}
                        </p>
                      </div>
                      <span className={`mc-status is-${course.verificationStatus}`}>{STATUS_LABEL[course.verificationStatus]}</span>
                      <div className="mc-actions">
                        <button
                          type="button"
                          aria-label={`Edit ${course.courseCode}`}
                          title="Edit"
                          onClick={() => navigate(`/student/schedule/courses/${course.id}/edit`, { state: { from: LIST_PATH } })}
                        >
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="is-danger" aria-label={`Delete ${course.courseCode}`} title="Delete" onClick={() => remove(course)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
