import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

// What the left panel cycles through: one small drawing of each area of the app.
const SHOWCASE = [
  { key: "schedule", command: "/schedule", text: "Your classes and meetings in one calendar, so you can see what is free and what clashes." },
  { key: "announcements", command: "/announcements", text: "Announcements from your teacher, sorted by category and marked upcoming, live or finished." },
  { key: "tasks", command: "/tasks", text: "Everything you need to hand in, with your progress, and one click to mark it done." },
  { key: "analytics", command: "/analytics", text: "How consistent you have been with Meditation Record and Daily Journal over the last 30 days." },
];

function ScheduleArt() {
  const columns = [[28, 40], [52, 30], [20, 36, 20], [46, 34], [30, 44]];
  return (
    <div className="lg-art lg-art-week" aria-hidden="true">
      {columns.map((blocks, column) => (
        <div key={column}>
          {blocks.map((height, index) => <i key={index} style={{ height }} data-tone={(column + index) % 3} />)}
        </div>
      ))}
    </div>
  );
}

function AnnouncementsArt() {
  return (
    <div className="lg-art lg-art-lines" aria-hidden="true">
      {[78, 100, 62].map((width, index) => (
        <div key={index}><span className={index === 0 ? "is-live" : ""} /><i style={{ width: `${width}%` }} /></div>
      ))}
    </div>
  );
}

function TasksArt() {
  return (
    <div className="lg-art lg-art-checks" aria-hidden="true">
      {[true, false, false].map((done, index) => (
        <div key={index}><b className={done ? "is-done" : ""} /><i style={{ width: `${[70, 90, 55][index]}%` }} /></div>
      ))}
    </div>
  );
}

function AnalyticsArt() {
  const levels = [0, 2, 1, 3, 3, 0, 2, 3, 1, 3, 2, 3, 3, 1, 0, 2, 3, 3, 2, 1, 3, 3, 2, 0];
  return (
    <div className="lg-art lg-art-heat" aria-hidden="true">
      {levels.map((level, index) => <i key={index} data-level={level} />)}
    </div>
  );
}

const ART = { schedule: ScheduleArt, announcements: AnnouncementsArt, tasks: TasksArt, analytics: AnalyticsArt };
const TILE_LABEL = { schedule: "Schedule", announcements: "Announcements", tasks: "Tasks", analytics: "Analytics" };
const TILE_CLASS = { schedule: "is-tall", announcements: "", tasks: "", analytics: "is-wide" };

function Tile({ item, active }) {
  const Art = ART[item.key];
  return (
    <div className={`lg-tile ${TILE_CLASS[item.key]}${active ? " is-active" : ""}`}>
      <span className="lg-tile-label">{TILE_LABEL[item.key]}</span>
      <Art />
      <span className="lg-corner is-tl" /><span className="lg-corner is-tr" />
      <span className="lg-corner is-bl" /><span className="lg-corner is-br" />
    </div>
  );
}

export default function AuthShowcase() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % SHOWCASE.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  const active = SHOWCASE[index];
  const byKey = Object.fromEntries(SHOWCASE.map((item) => [item.key, item]));

  return (
    <aside className="lg-panel" aria-hidden="true">
      <div className="lg-brand">
        Dashboard
      </div>

      <div className="lg-tiles">
        <Tile item={byKey.schedule} active={active.key === "schedule"} />
        <Tile item={byKey.announcements} active={active.key === "announcements"} />
        <Tile item={byKey.tasks} active={active.key === "tasks"} />
        <Tile item={byKey.analytics} active={active.key === "analytics"} />
      </div>

      <div className="lg-prompt">
        <p>
          <b>{active.command}</b> {active.text}
        </p>
        <span className="lg-prompt-go"><ArrowRight size={15} /></span>
      </div>

      <p className="lg-tagline">Everything for your course, in one calm place</p>

      <div className="lg-dots">
        {SHOWCASE.map((item, dot) => (
          <button key={item.key} type="button" tabIndex={-1} className={dot === index ? "is-on" : ""} onClick={() => setIndex(dot)} />
        ))}
      </div>
    </aside>
  );
}
