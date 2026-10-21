import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";
import lotusIcon from "@/assets/images/lotus.png";
import JournalIcon from "./JournalIcon";
import chartIcon from "@/assets/images/chart-icon.png";

const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function fmtDate(d) {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export default function ConsistencyCard() {
  const { consistency, sheetsLoading, sheetsError } = useApp();
  const navigate = useNavigate();
  const [hoverIdx, setHoverIdx] = useState(null);

  const goAnalytics = () => navigate("/student/analytics");

  if (sheetsError) {
    return (
      <div className="consistency-card fade-in-delay-3">
        <div className="consistency-header"><h3>Your Consistency</h3></div>
        <div className="consistency-empty">{sheetsError}</div>
      </div>
    );
  }

  if (!consistency || sheetsLoading) {
    return (
      <div className="consistency-card fade-in-delay-3">
        <div className="consistency-header"><h3>Your Consistency</h3></div>
        <div className="consistency-empty">กำลังโหลดข้อมูลจากฟอร์ม…</div>
      </div>
    );
  }

  // ===== Meditation line chart (last 14 days) =====
  // Reserve horizontal padding so the end-of-line badge doesn't overflow.
  const VB_W = 200;
  const VB_H = 55;
  const PAD_X = 20;
  const X_RANGE = VB_W - PAD_X * 2;
  const Y_TOP = 8;
  const Y_BOTTOM = 48;
  const Y_RANGE = Y_BOTTOM - Y_TOP;

  const series = consistency.meditation.series14;
  const maxStreak = Math.max(...series.map((s) => s.streak), 1);

  const points = series.map((s, i) => ({
    x: PAD_X + (i / Math.max(series.length - 1, 1)) * X_RANGE,
    y: Y_BOTTOM - (s.streak / maxStreak) * Y_RANGE,
    streak: s.streak,
    date: s.date,
    key: s.key,
  }));
  const linePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const currentStreak = consistency.meditation.streak;

  // ===== Journal weekly bars =====
  const week = consistency.journal.week;
  const maxCount = Math.max(...week.map((d) => d.count), 1);

  return (
    <div className="consistency-card fade-in-delay-3">
      <div className="consistency-header">
        <h3>Your Consistency</h3>
        <button
          aria-label="Chart"
          className="chart-icon-btn"
          onClick={goAnalytics}
        >
          <img src={chartIcon} alt="Chart" className="chart-icon-img" />
        </button>
      </div>

      {/* Meditation Record */}
      <div className="consistency-item">
        <div className="consistency-item-header">
          <div className="consistency-item-icon">
            <img src={lotusIcon} alt="Meditation" className="custom-icon-sm" />
          </div>
          <div className="consistency-item-title">Meditation Record</div>
          <div className="consistency-item-value">{currentStreak}</div>
        </div>
        <div className="consistency-item-subtitle">Count your tasks done</div>

        <div
          className="mini-chart-line"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
            <polyline points={linePoints} fill="none" stroke="#9ca3af" strokeWidth="1.5" />

            {/* Per-point hover hit areas (invisible, larger than visible dot) */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="6"
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoverIdx(i)}
              />
            ))}

          </svg>

          {/* HTML dot stays circular when the SVG chart stretches. */}
          {hoverIdx != null && hoverIdx !== points.length - 1 && (
            <span
              className="chart-hover-dot"
              style={{
                left: `${(points[hoverIdx].x / VB_W) * 100}%`,
                top: `${(points[hoverIdx].y / VB_H) * 100}%`,
              }}
            />
          )}

          <div
            className="chart-end-marker"
            style={{
              left: `${(last.x / VB_W) * 100}%`,
              top: `${(last.y / VB_H) * 100}%`,
            }}
            aria-label={`Current streak ${last.streak}`}
          >
            <span className="chart-end-value">{last.streak}</span>
            <span className="chart-end-ring" />
          </div>

          {/* Floating tooltip */}
          {hoverIdx != null && (
            <div
              className="chart-tooltip"
              style={{
                left: `${(points[hoverIdx].x / VB_W) * 100}%`,
                top: `${(points[hoverIdx].y / VB_H) * 100}%`,
              }}
            >
              <div className="chart-tooltip-streak">{points[hoverIdx].streak} วัน</div>
              <div className="chart-tooltip-date">{fmtDate(points[hoverIdx].date)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Journal */}
      <div className="consistency-item">
        <div className="consistency-item-header">
          <div className="consistency-item-icon">
            <JournalIcon size={16} color="#111827" />
          </div>
          <div className="consistency-item-title">Daily Journal</div>
        </div>
        <div className="consistency-item-subtitle">Track your study time and share with friends</div>
        <div className="weekly-bars">
          {week.map((day) => {
            const heightPct = (day.count / maxCount) * 100;
            const cls = day.count >= 2 ? "high" : day.count === 1 ? "mid" : "low";
            const weekday = WEEK_LABELS[day.date.getDay()];
            return (
              <div key={day.key} className="weekly-bar-wrapper">
                <div
                  className={`weekly-bar ${cls}`}
                  style={{ height: Math.max(heightPct * 0.45, 2) + "px" }}
                  title={`${day.key}: ${day.count} ครั้ง${day.holiday ? " (หยุด)" : ""}`}
                />
                <span className="weekly-bar-label">{weekday}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
