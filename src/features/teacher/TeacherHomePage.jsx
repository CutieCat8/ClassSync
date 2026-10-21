import React, { useState } from "react";
import { useTeacher } from "./TeacherContext";
import StudentGrid from "./components/StudentGrid";

function StatTile({ value, label }) {
  return (
    <div className="t-stat-card">
      <div>
        <div className="t-stat-num">{value}</div>
        <div className="t-stat-lbl">{label}</div>
      </div>
    </div>
  );
}

export default function TeacherHomePage() {
  const { teacher, students, stats } = useTeacher();
  const [picked, setPicked] = useState(null);

  return (
    <div className="t-page-wrap">
      <main className="t-page">
        <header className="t-page-head fade-in">
          <span className="t-eyebrow">Overview · {teacher.course}</span>
          <h1 className="t-page-title">Teacher Overview</h1>
          <p className="t-page-meta">
            {teacher.name} · {teacher.course} · {stats.total} students
          </p>
        </header>

        <section className="t-stat-row fade-in-delay-1">
          <StatTile value={stats.total} label="Students" />
          <StatTile value={`${stats.onTimeRate}%`} label="On-time today" />
          <StatTile value={stats.pendingCount} label="Pending forms" />
          <StatTile value={stats.unreadChats} label="Unread chats" />
        </section>

        <section className="fade-in-delay-2">
          <StudentGrid students={students} onPick={setPicked} />
        </section>

        {picked && (
          <div
            className="t-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setPicked(null)}
          >
            <div className="t-modal" onClick={(e) => e.stopPropagation()}>
              <div className="t-modal-head">
                <div>
                  <h3 className="t-card-title">{picked.name}</h3>
                  <p className="t-card-sub">
                    Seat {String(picked.seat).padStart(2, "0")} · {picked.id}
                  </p>
                </div>
                <span className={`t-status-chip ${picked.status}`}>
                  {picked.status === "on-time"
                    ? "On time"
                    : picked.status === "late"
                    ? "Late"
                    : "Missing"}
                </span>
              </div>
              <div className="t-modal-body">
                <div className="t-modal-row">
                  <span>Meditation</span>
                  <strong className={picked.meditation ? "ok" : "no"}>
                    {picked.meditation ? "Submitted" : "Missing"}
                  </strong>
                </div>
                <div className="t-modal-row">
                  <span>Daily Journal</span>
                  <strong className={picked.journal ? "ok" : "no"}>
                    {picked.journal ? "Submitted" : "Missing"}
                  </strong>
                </div>
                <div className="t-modal-row">
                  <span>Assignment</span>
                  <strong className={picked.assignment ? "ok" : "no"}>
                    {picked.assignment ? "Submitted" : "Pending"}
                  </strong>
                </div>
              </div>
              <div className="t-modal-actions">
                <button type="button" className="t-btn-ghost" onClick={() => setPicked(null)}>
                  ปิด
                </button>
                <button type="button" className="t-btn-primary">
                  Nudge
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
