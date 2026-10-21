import React from "react";
import { useApp } from "@/app/providers/AppContext";

export default function StatsRow() {
  const { stats } = useApp();

  const items = [
    { label: "Announcements", value: stats.announcements },
    { label: "Tasks", value: stats.tasks },
    { label: "Meetings", value: stats.meetings },
  ];

  return (
    <div className="stats-row fade-in-delay-1">
      {items.map((s) => (
        <div key={s.label} className="stat-item">
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
