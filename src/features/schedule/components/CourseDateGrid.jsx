import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { eachDateInInterval, getWeekdayOfDate, isValidDateString } from "../lib/date";
import { ScheduleTimeSelect } from "./ScheduleFormControls";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_START = "09:00";
const DEFAULT_END = "10:30";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthIndex = (date) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
const pad = (value) => String(value).padStart(2, "0");

// Picks when a course meets: choose the weekdays and times, then skip single
// dates on the calendar. Only chosen weekdays get a circle; clicking a circle
// cancels that one date (stored as a "cancelled" exception), clicking again
// restores it.
export default function CourseDateGrid({ sessions, onSessionsChange, termStart, termEnd, exceptions, color, errors = {}, onChange }) {
  const hasRange = isValidDateString(termStart) && isValidDateString(termEnd) && termStart <= termEnd;
  const [cursor, setCursor] = useState(() => (isValidDateString(termStart) ? monthIndex(termStart) : 0));

  useEffect(() => {
    if (hasRange) setCursor(monthIndex(termStart));
  }, [hasRange, termStart]);

  const meetingWeekdays = useMemo(() => new Set(sessions.map((session) => session.dayOfWeek)), [sessions]);
  const exceptionByDate = useMemo(() => new Map(exceptions.map((exception) => [exception.date, exception])), [exceptions]);

  const { total, cancelled } = useMemo(() => {
    if (!hasRange) return { total: 0, cancelled: 0 };
    const days = eachDateInInterval({ start: termStart, end: termEnd }).filter((date) => meetingWeekdays.has(getWeekdayOfDate(date)));
    return {
      total: days.length,
      cancelled: days.filter((date) => exceptionByDate.get(date)?.type === "cancelled").length,
    };
  }, [hasRange, termStart, termEnd, meetingWeekdays, exceptionByDate]);

  const toggle = (date) => {
    const existing = exceptionByDate.get(date);
    if (existing?.type === "cancelled") {
      onChange(exceptions.filter((exception) => exception.id !== existing.id));
    } else if (!existing) {
      onChange([...exceptions, { id: `ex-${Date.now()}-${date}`, date, type: "cancelled", reason: "Cancelled by student" }]);
    }
  };

  const toggleWeekday = (weekday) => {
    if (meetingWeekdays.has(weekday)) {
      onSessionsChange(sessions.filter((session) => session.dayOfWeek !== weekday));
      return;
    }
    // A newly chosen day starts with the same time as the last one picked.
    const previous = sessions[sessions.length - 1];
    onSessionsChange([
      ...sessions,
      {
        id: `session-${Date.now()}-${weekday}`,
        dayOfWeek: weekday,
        startTime: previous?.startTime ?? DEFAULT_START,
        endTime: previous?.endTime ?? DEFAULT_END,
        location: "",
      },
    ]);
  };

  const updateSession = (id, field, value) => {
    onSessionsChange(sessions.map((session) => (session.id === id ? { ...session, [field]: value } : session)));
  };

  const sortedSessions = sessions
    .map((session, index) => ({ session, index }))
    .sort((a, b) => a.session.dayOfWeek - b.session.dayOfWeek || a.session.startTime.localeCompare(b.session.startTime));

  const head = (
    <header className="cf-head">
      <span className="cf-step">02</span>
      <div>
        <h2>Class schedule</h2>
        <p>Choose the days and times this course meets, then click a date to skip it for that week only.</p>
      </div>
    </header>
  );

  const first = hasRange ? monthIndex(termStart) : 0;
  const last = hasRange ? monthIndex(termEnd) : 0;
  const month = Math.min(last, Math.max(first, cursor));
  const year = Math.floor(month / 12);
  const monthNumber = month % 12;
  const leading = new Date(year, monthNumber, 1).getDay();
  const daysInMonth = new Date(year, monthNumber + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => `${year}-${pad(monthNumber + 1)}-${pad(index + 1)}`),
  ];

  return (
    <section className="course-form-section course-date-grid">
      {head}
      {!hasRange ? (
        <p className="course-exceptions-empty">Pick the term start and end dates to see the calendar.</p>
      ) : (
      <div className="cdg-card" style={{ "--course-color": color || "#4d7668" }}>
        <div className="cdg-nav">
          <strong>{MONTHS[monthNumber]} {year}</strong>
          <div>
            <button type="button" onClick={() => setCursor(month - 1)} disabled={month <= first} aria-label="Previous month"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => setCursor(month + 1)} disabled={month >= last} aria-label="Next month"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="cdg-weekdays" aria-hidden="true">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="cdg-days">
          {cells.map((date, index) => {
            if (!date) return <span key={`blank-${index}`} />;
            const day = Number(date.slice(8));
            const meets = date >= termStart && date <= termEnd && meetingWeekdays.has(getWeekdayOfDate(date));
            if (!meets) return <span key={date} className="cdg-day is-off">{day}</span>;
            const exception = exceptionByDate.get(date);
            const isCancelled = exception?.type === "cancelled";
            const isChanged = exception?.type === "replacement";
            return (
              <button
                key={date}
                type="button"
                className={`cdg-day ${isCancelled ? "is-cancelled" : isChanged ? "is-changed" : "is-on"}`}
                aria-pressed={!isCancelled}
                aria-label={`${date}${isCancelled ? ", skipped" : isChanged ? ", time changed" : ", class"}`}
                title={isChanged ? "Time changed for this date" : isCancelled ? "Skipped · click to restore" : "Click to skip this date"}
                disabled={isChanged}
                onClick={() => toggle(date)}
              >
                {day}
              </button>
            );
          })}
        </div>
        <p className="cdg-summary">{total - cancelled} class {total - cancelled === 1 ? "day" : "days"}{cancelled ? ` · ${cancelled} skipped` : ""}</p>
      </div>
      )}

      <div className="cdg-weekday-picker">
        <strong>Class days</strong>
        <div className="cdg-chips" role="group" aria-label="Class days">
          {WEEKDAYS.map((label, weekday) => (
            <button
              key={label}
              type="button"
              className={`cdg-chip${meetingWeekdays.has(weekday) ? " is-selected" : ""}`}
              style={{ "--course-color": color || "#4d7668" }}
              aria-pressed={meetingWeekdays.has(weekday)}
              onClick={() => toggleWeekday(weekday)}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.sessions && <div className="course-form-error">{errors.sessions}</div>}

        {sortedSessions.length > 0 && (
          <ul className="cdg-times">
            {sortedSessions.map(({ session, index }) => {
              const error = errors[`sessions.${index}.startTime`] || errors[`sessions.${index}.endTime`];
              return (
                <li key={session.id || index}>
                  <span className="cdg-time-day">{WEEKDAY_NAMES[session.dayOfWeek]}</span>
                  <ScheduleTimeSelect label={`${WEEKDAY_NAMES[session.dayOfWeek]} class starts`} value={session.startTime} onChange={(value) => updateSession(session.id, "startTime", value)} />
                  <span className="cdg-time-sep">to</span>
                  <ScheduleTimeSelect label={`${WEEKDAY_NAMES[session.dayOfWeek]} class ends`} value={session.endTime} onChange={(value) => updateSession(session.id, "endTime", value)} />
                  {error && <small className="cdg-time-error">{error}</small>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
