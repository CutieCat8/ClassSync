import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Clock3,
  MapPin,
  BookOpen,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useApp } from "@/app/providers/AppContext";
import { DropdownRangeDatePicker } from "@/components/ui/dropdown-range-date-picker";
import { CourseDetailDialog, MeetingDetailDialog } from "./components/StudentScheduleDialogs";
import { IcsImportDialog } from "./components/IcsImportDialog";
import MonthCalendar from "./components/MonthCalendar";
import { parseIcs } from "./lib/ics-import";
import { formatLongDate } from "./lib/date";
import { parseLegacyMeetingTime, timeToMinutes } from "./lib/meeting-time";

const DAY_START = 7;
const DAY_END = 20;
const HOUR_COLUMN_WIDTH = 74;
const ROW_LABEL_WIDTH = 205;
const MIN_DAY_EVENT_ROWS = 3;
const SCOPE_OPTIONS = [
  { value: "all", label: "All events" },
  { value: "course", label: "Courses" },
  { value: "class", label: "Class meetings" },
  { value: "private", label: "1:1 meetings" },
];
const EVENT_COLORS =["rose", "amber", "blue", "violet", "sage"];

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromISO(iso) {
  return new Date(`${iso}T00:00:00`);
}

function addDays(iso, amount) {
  const date = fromISO(iso);
  date.setDate(date.getDate() + amount);
  return toISO(date);
}

function addMonths(iso, amount) {
  const date = fromISO(iso);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return toISO(date);
}

function formatDate(iso, options) {
  return new Intl.DateTimeFormat("en-US", options).format(fromISO(iso));
}

function parseMeetingTime(value = "") {
  const parsed = parseLegacyMeetingTime(value);
  const start = parsed ? timeToMinutes(parsed.startTime) / 60 : 9;
  const end = parsed ? timeToMinutes(parsed.endTime) / 60 : Math.min(start + 1.5, DAY_END);
  return { start, end: Math.max(end, start + 0.75) };
}

function getItemTimeRange(item) {
  if (item.startTime && item.endTime) {
    return {
      start: Number(item.startTime.slice(0, 2)) + Number(item.startTime.slice(3)) / 60,
      end: Number(item.endTime.slice(0, 2)) + Number(item.endTime.slice(3)) / 60,
    };
  }
  return parseMeetingTime(item.time);
}

function eventPosition(item, dayStart = DAY_START, dayEnd = DAY_END) {
  const { start, end } = getItemTimeRange(item);
  const span = dayEnd - dayStart;
  const clampedStart = Math.max(dayStart, Math.min(start, dayEnd - 0.75));
  const clampedEnd = Math.max(clampedStart + 0.75, Math.min(end, dayEnd));
  return {
    "--event-start": `${((clampedStart - dayStart) / span) * 100}%`,
    "--event-width": `${((clampedEnd - clampedStart) / span) * 100}%`,
  };
}

function buildVisibleDays(activeDate, view, selectedRange) {
  if (selectedRange?.from) {
    const start = toISO(selectedRange.from);
    const end = toISO(selectedRange.to || selectedRange.from);
    const dates = [];
    let cursor = start;
    while (cursor <= end && dates.length < 62) {
      dates.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return dates;
  }

  if (view === "day") return [activeDate];

  if (view === "week") {
    const date = fromISO(activeDate);
    const mondayOffset = date.getDay() === 0 ? -6 : 1 - date.getDay();
    const monday = addDays(activeDate, mondayOffset);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }

  const active = fromISO(activeDate);
  const first = toISO(new Date(active.getFullYear(), active.getMonth(), 1));
  const last = toISO(new Date(active.getFullYear(), active.getMonth() + 1, 0));
  const gridStart = addDays(first, fromISO(first).getDay() === 0 ? -6 : 1 - fromISO(first).getDay());
  const gridEnd = addDays(last, fromISO(last).getDay() === 0 ? 0 : 7 - fromISO(last).getDay());
  const days = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) days.push(cursor);
  return days;
}

export default function StudentSchedulePage() {
  const { studentId, getMeetingsForStudent, getCoursesForStudent, addCourse, getCourseOccurrencesForStudent, getCourseById, removeCourse } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState("day");
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterMenuRef = useRef(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRange, setSelectedRange] = useState(undefined);
  const timelineScrollRef = useRef(null);
  const importInputRef = useRef(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    if (!selectedMeeting && !selectedCourse) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") { setSelectedMeeting(null); setSelectedCourse(null); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedMeeting, selectedCourse]);

  useEffect(() => {
    const scrollArea = timelineScrollRef.current;
    if (!scrollArea) return undefined;

    const scrollHorizontally = (event) => {
      if (!event.shiftKey) return;

      const scrollDistance = event.deltaY || event.deltaX;
      if (!scrollDistance) return;

      event.preventDefault();
      scrollArea.scrollLeft += scrollDistance;
    };

    scrollArea.addEventListener("wheel", scrollHorizontally, { passive: false });
    return () => scrollArea.removeEventListener("wheel", scrollHorizontally);
  }, [view === "month"]);

  const meetings = useMemo(
    () => getMeetingsForStudent(studentId),
    [getMeetingsForStudent, studentId]
  );

  // Every fresh load opens on today; the date is only pinned after the user picks one.
  const activeDate = selectedDate || toISO(new Date());

  const searchedMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return meetings.filter((meeting) => {
      const matchesScope = scope !== "course" && (scope === "all" || (
        scope === "private" ? meeting.attendeeMode !== "all" : meeting.attendeeMode === "all"
      ));
      const matchesSearch = !query || [meeting.title, meeting.location, meeting.description]
        .some((value) => (value || "").toLowerCase().includes(query));
      return matchesScope && matchesSearch;
    });
  }, [meetings, scope, search]);

  const visibleDays = useMemo(
    () => buildVisibleDays(activeDate, view, selectedRange),
    [activeDate, view, selectedRange]
  );

  const courseOccurrences = useMemo(() => {
    if (!visibleDays.length) return [];
    const query = search.trim().toLowerCase();
    return getCourseOccurrencesForStudent(studentId, visibleDays[0], visibleDays.at(-1)).filter((occurrence) => (
      (scope === "all" || scope === "course") && (!query || [occurrence.courseCode, occurrence.courseName, occurrence.location].some((value) => (value || "").toLowerCase().includes(query)))
    ));
  }, [getCourseOccurrencesForStudent, scope, search, studentId, visibleDays]);

  const pickerRange = useMemo(
    () => selectedRange || { from: fromISO(activeDate), to: fromISO(activeDate) },
    [activeDate, selectedRange]
  );

  const rows = useMemo(() => visibleDays.map((date) => ({
    date,
    items: [
      ...searchedMeetings.filter((meeting) => meeting.date === date).map((meeting) => ({ ...meeting, kind: "meeting" })),
      ...courseOccurrences.filter((occurrence) => occurrence.date === date).map((occurrence) => ({ ...occurrence, id: `${occurrence.courseId}-${date}-${occurrence.startTime}`, kind: "course" })),
    ].sort((a, b) => getItemTimeRange(a).start - getItemTimeRange(b).start),
  })), [courseOccurrences, searchedMeetings, visibleDays]);

  const timeline = useMemo(() => {
    const ranges = rows.flatMap((row) => row.items.map(getItemTimeRange));
    const start = Math.max(0, Math.min(DAY_START, ...ranges.map((range) => Math.floor(range.start))));
    const end = Math.min(24, Math.max(DAY_END, ...ranges.map((range) => Math.ceil(range.end))));
    return {
      start,
      end,
      segments: end - start,
      hours: Array.from({ length: end - start + 1 }, (_, index) => start + index),
    };
  }, [rows]);

  const visibleCount = rows.reduce(
    (total, row) => (view === "month" && !row.date.startsWith(activeDate.slice(0, 7)) ? total : total + row.items.length),
    0
  );

  const moveDate = (direction) => {
    setSelectedRange(undefined);
    if (view === "month") {
      setSelectedDate(addMonths(activeDate, direction));
      return;
    }
    setSelectedDate(addDays(activeDate, direction * (view === "week" ? 7 : 1)));
  };

  // Saved courses by import key, e.g. "955110 intro to data" (also by bare name).
  const existingByKey = new Map();
  getCoursesForStudent(studentId).forEach((course) => {
    [`${course.courseCode} ${course.courseName}`.trim().toLowerCase(), course.courseName.trim().toLowerCase()].forEach((key) => {
      const list = existingByKey.get(key) || [];
      if (!list.includes(course)) existingByKey.set(key, [...list, course]);
    });
  });

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportError("");
    try {
      setImportResult(parseIcs(await file.text()));
    } catch {
      setImportError("Could not read that calendar file.");
    }
  };

  const confirmImport = (courses) => {
    // Re-importing replaces the saved course of the same code/name. Teacher-verified
    // courses are never replaced; the old colour and private note are carried over.
    const replaced = new Set();
    courses.forEach((course) => {
      const matches = (existingByKey.get(course.dupKey) || []).filter(
        (old) => old.verificationStatus === "self-reported" && !replaced.has(old.id)
      );
      matches.forEach((old) => {
        replaced.add(old.id);
        removeCourse(old.id);
      });
      const keep = matches[0] ? { color: matches[0].color, privateNote: matches[0].privateNote } : {};
      addCourse({ ...course, ...keep });
    });
    setImportResult(null);
  };

  const goToToday = () => {
    setSelectedRange(undefined);
    setSelectedDate(toISO(new Date()));
  };

  const dateHeading = selectedRange?.from
    ? `${formatDate(toISO(selectedRange.from), { month: "short", day: "numeric" })} – ${formatDate(toISO(selectedRange.to || selectedRange.from), { month: "short", day: "numeric", year: "numeric" })}`
    : view === "month"
    ? formatDate(activeDate, { month: "long", year: "numeric" })
    : view === "week"
    ? `${formatDate(visibleDays[0], { month: "short", day: "numeric" })} – ${formatDate(visibleDays.at(-1), { month: "short", day: "numeric", year: "numeric" })}`
    : formatLongDate(activeDate);

  useEffect(() => {
    if (!filterOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!filterMenuRef.current?.contains(event.target)) setFilterOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterOpen]);

  return (
    <div className="main-wrapper sched-page personal-schedule-page">
      <main className="main-content">
        <header className="personal-schedule-header">
          <div className="personal-import-slot">
            {importError && <span className="personal-import-error" role="alert">{importError}</span>}
            <input ref={importInputRef} type="file" accept=".ics,text/calendar" hidden onChange={handleImportFile} />
            <button type="button" className="personal-import-btn" onClick={() => importInputRef.current?.click()}>
              <Upload size={16} /> Import .ics
            </button>
          </div>
          <div>
            <button className="back-btn" onClick={() => navigate("/student")}>
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <h1 className="page-title">My schedule</h1>
            <p className="page-date">Your personal classes, meetings and appointments.</p>
          </div>

          <div className="personal-schedule-actions">
            <label className="personal-schedule-search">
              <Search size={17} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search schedule"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
        </header>

        <section className="personal-schedule-board fade-in">
          <div className="personal-schedule-toolbar">
            <div className="personal-date-control">
              <div className="personal-date-nav">
                <button type="button" onClick={() => moveDate(-1)} aria-label="Previous period">
                  <ChevronLeft size={18} />
                </button>
                <button type="button" className="personal-today-btn" onClick={goToToday}>
                  Today
                </button>
                <button type="button" onClick={() => moveDate(1)} aria-label="Next period">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="personal-date-copy">
                <h2>{dateHeading}</h2>
                <span>{visibleCount} {visibleCount === 1 ? "event" : "events"}</span>
              </div>
            </div>

            <div className="personal-toolbar-controls">
              <div className="personal-view-switch" aria-label="Calendar view">
                {["day", "week", "month"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={view === option ? "active" : ""}
                    onClick={() => {
                      setSelectedRange(undefined);
                      setView(option);
                    }}
                  >
                    {option[0].toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>

              <div className="personal-filter-menu" ref={filterMenuRef}>
                <button
                  type="button"
                  className={`personal-filter-btn${filterOpen ? " open" : ""}`}
                  onClick={() => setFilterOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={filterOpen}
                >
                  {SCOPE_OPTIONS.find((option) => option.value === scope)?.label}
                  <ChevronDown size={15} />
                </button>
                {filterOpen && (
                  <ul className="personal-filter-list" role="listbox">
                    {SCOPE_OPTIONS.map((option) => (
                      <li key={option.value} role="option" aria-selected={scope === option.value}>
                        <button
                          type="button"
                          className={scope === option.value ? "active" : ""}
                          onClick={() => {
                            setScope(option.value);
                            setFilterOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DropdownRangeDatePicker
                value={pickerRange}
                onApply={(range) => {
                  if (!range?.from) {
                    setSelectedRange(undefined);
                    return;
                  }

                  const from = toISO(range.from);
                  const to = toISO(range.to || range.from);
                  setSelectedDate(from);
                  setSelectedRange(from === to ? undefined : range);
                  setView("day");
                }}
              />
            </div>
          </div>

          {view === "month" ? (
            <MonthCalendar
              rows={rows}
              activeDate={activeDate}
              today={toISO(new Date())}
              onSelectDate={setSelectedDate}
              onOpenItem={(item) => item.kind === "course"
                ? setSelectedCourse({ ...getCourseById(item.courseId), occurrence: item })
                : setSelectedMeeting(item)}
              onOpenDay={() => {
                setSelectedRange(undefined);
                setView("day");
              }}
            />
          ) : (
          <div
            ref={timelineScrollRef}
            className="personal-timeline-scroll"
            tabIndex={0}
            aria-label="Schedule timeline. Hold Shift and scroll to move horizontally."
          >
            <div
              className="personal-timeline"
              style={{
                "--timeline-segments": timeline.segments,
                "--timeline-min-width": `${ROW_LABEL_WIDTH + timeline.segments * HOUR_COLUMN_WIDTH}px`,
              }}
            >
              <div className="personal-time-corner">Personal calendar</div>
              <div className="personal-time-axis">
                {timeline.hours.map((hour, index) => (
                  <span
                    key={hour}
                    className={index === timeline.hours.length - 1 ? "is-last" : undefined}
                    style={{ "--hour-position": `${(index / timeline.segments) * 100}%` }}
                  >
                    {hour === 12 ? "Noon" : hour > 12 ? `${hour - 12} pm` : `${hour} am`}
                  </span>
                ))}
              </div>

              {rows.map((row) => (
                <React.Fragment key={row.date}>
                  <div className="personal-row-label">
                    <span className="personal-row-day">
                      {formatDate(row.date, { weekday: "short" })}
                    </span>
                    <strong>{formatDate(row.date, { month: "short", day: "numeric" })}</strong>
                    <span>{row.items.length ? `${row.items.length} scheduled` : "Available"}</span>
                  </div>

                  <div
                    className={`personal-row-track ${row.items.length ? "has-events" : "is-empty"}`}
                    style={{
                      "--event-rows": Math.max(
                        row.items.length,
                        visibleDays.length === 1 ? MIN_DAY_EVENT_ROWS : 1
                      ),
                    }}
                  >
                    <div className="personal-grid-lines" aria-hidden="true">
                      {timeline.hours.slice(0, -1).map((hour) => <i key={hour} />)}
                    </div>

                    {row.items.length === 0 ? (
                      <div className="personal-empty-slot">
                        <Clock3 size={16} /> No appointments scheduled
                      </div>
                    ) : row.items.map((item, index) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`personal-event ${item.kind === "course" ? "is-course" : `color-${EVENT_COLORS[index % EVENT_COLORS.length]}`}`}
                        style={{ ...eventPosition(item, timeline.start, timeline.end), "--event-row": index, ...(item.kind === "course" ? { "--course-color": item.color } : {}) }}
                        title={item.kind === "course" ? `${item.courseCode} · ${item.courseName}` : `${item.title}${item.time ? ` · ${item.time}` : ""}`}
                        aria-haspopup="dialog"
                        onClick={() => item.kind === "course" ? setSelectedCourse({ ...getCourseById(item.courseId), occurrence: item }) : setSelectedMeeting(item)}
                      >
                        <div className="personal-event-main">
                          <strong>{item.kind === "course" ? `${item.courseCode} · ${item.courseName}` : item.title}</strong>
                          <span>{item.kind === "course" ? `${item.startTime} - ${item.endTime}` : item.time}</span>
                        </div>
                        <div className="personal-event-tags">
                          {item.location && <span className="location-tag"><MapPin size={12} />{item.location}</span>}
                          <span className="type-tag">{item.kind === "course" ? <><BookOpen size={12} />Course</> : <><UserRound size={12} />{item.attendeeMode === "all" ? "Class" : "1:1"}</>}</span>
                        </div>
                        <ChevronRight className="personal-event-open" size={15} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          )}
        </section>

        <MeetingDetailDialog meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />
        {importResult && (
          <IcsImportDialog
            result={importResult}
            existingByKey={existingByKey}
            onImport={confirmImport}
            onClose={() => setImportResult(null)}
          />
        )}
        <CourseDetailDialog
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onDelete={() => {
            if (!window.confirm(`Delete ${selectedCourse.courseCode}?`)) return;
            const result = removeCourse(selectedCourse.id);
            if (result.ok) setSelectedCourse(null);
          }}
          onEdit={() => navigate(`/student/schedule/courses/${selectedCourse.id}/edit`)}
        />
      </main>
    </div>
  );
}
