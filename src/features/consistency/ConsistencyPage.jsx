import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";
import { ArrowLeft, Flame, CalendarCheck, TrendingUp, ExternalLink, RefreshCw } from "lucide-react";
import lotusIcon from "@/assets/images/lotus.png";
import JournalIcon from "./components/JournalIcon";
import { dateKey } from "./consistency";

const MEDITATION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSddL9NO7l9ezPo04_iAf0h3KOgPEq1v3Q_BZJj919WcRPT3bg/viewform?embedded=true";
const JOURNAL_URL = "https://docs.google.com/forms/d/e/1FAIpQLScj8dsF4h2SWA9wkYyLXKUO1Jte-RyfLQMW1WiE-Ye04iPFzA/viewform?embedded=true";

const MEDITATION_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSddL9NO7l9ezPo04_iAf0h3KOgPEq1v3Q_BZJj919WcRPT3bg/viewform";
const JOURNAL_LINK = "https://docs.google.com/forms/d/e/1FAIpQLScj8dsF4h2SWA9wkYyLXKUO1Jte-RyfLQMW1WiE-Ye04iPFzA/viewform";

function getLast30DateKeys() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: dateKey(d),
      date: d,
      day: d.getDate(),
      weekday: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"][d.getDay()],
    });
  }
  return days;
}

export default function ConsistencyPage() {
  const { consistency, sheetsLoading, sheetsError, refreshSheets, studentId } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("meditation");

  const todayKey = dateKey(new Date());
  const last30 = useMemo(() => getLast30DateKeys(), []);

  // Build a map of journal submissions keyed by date for fast lookup
  const journalByKey = useMemo(() => {
    const m = new Map();
    if (consistency) {
      for (const d of consistency.journal.last30) m.set(d.key, d);
    }
    return m;
  }, [consistency]);

  const medDays = consistency?.meditation.submittedDays || new Set();

  const todayStatus = {
    meditation: medDays.has(todayKey),
    journal: (journalByKey.get(todayKey)?.count || 0) > 0,
  };

  // Stats
  const streak = consistency?.meditation.streak || 0;
  const journalStreak = consistency?.journal.streak || 0;

  const totalDays = useMemo(() => {
    if (!consistency) return 0;
    const set = new Set(medDays);
    for (const d of consistency.journal.last30) {
      if (d.count > 0) set.add(d.key);
    }
    return set.size;
  }, [consistency, medDays]);

  const last30Count = useMemo(() => {
    return last30.filter((d) => {
      const hasMed = medDays.has(d.key);
      const j = journalByKey.get(d.key);
      const hasJour = j && j.count > 0;
      return hasMed || hasJour;
    }).length;
  }, [last30, medDays, journalByKey]);

  const renderHeatmapCell = (d) => {
    const hasMed = medDays.has(d.key);
    const j = journalByKey.get(d.key);
    const hasJour = j && j.count > 0;
    const hasBoth = hasMed && hasJour;
    const hasOne = hasMed || hasJour;
    const isToday = d.key === todayKey;
    const isHoliday = j?.holiday;

    let cls = "heatmap-cell";
    if (hasBoth) cls += " both";
    else if (hasOne) cls += " partial";
    if (isToday) cls += " today";

    const tooltip = `${d.key}${hasMed ? " ✅ Meditation" : ""}${hasJour ? " ✅ Journal" : ""}${isHoliday ? " (หยุด)" : ""}`;

    return (
      <div key={d.key} className={cls} title={tooltip}>
        <span className="heatmap-day">{d.day}</span>
        <span className="heatmap-weekday">{d.weekday}</span>
        {hasBoth && <span className="heatmap-badge full">✓✓</span>}
        {hasOne && !hasBoth && <span className="heatmap-badge half">✓</span>}
      </div>
    );
  };

  return (
    <div className="consistency-page fade-in">
      <div className="consistency-page-header">
        <button className="back-btn" onClick={() => navigate("/student")}>
          <ArrowLeft size={20} />
          <span>กลับ</span>
        </button>
        <h1>Your Consistency</h1>
        <p className="consistency-page-sub">
          ติดตามความสม่ำเสมอจากฟอร์มจริง · รหัส {studentId}
          <button className="refresh-inline-btn" onClick={() => refreshSheets()} disabled={sheetsLoading}>
            <RefreshCw size={14} className={sheetsLoading ? "spin" : ""} />
            {sheetsLoading ? "กำลังโหลด…" : "รีเฟรช"}
          </button>
        </p>
        {sheetsError && <div className="sheet-error-banner">{sheetsError}</div>}
      </div>

      {/* Stats Cards */}
      <div className="consistency-stats-row">
        <div className="consistency-stat-card streak">
          <div className="consistency-stat-icon">
            <Flame size={22} />
          </div>
          <div>
            <div className="consistency-stat-value">{streak}</div>
            <div className="consistency-stat-label">Meditation streak (วัน)</div>
          </div>
        </div>
        <div className="consistency-stat-card total">
          <div className="consistency-stat-icon">
            <CalendarCheck size={22} />
          </div>
          <div>
            <div className="consistency-stat-value">{journalStreak}</div>
            <div className="consistency-stat-label">Journal streak (วัน)</div>
          </div>
        </div>
        <div className="consistency-stat-card rate">
          <div className="consistency-stat-icon">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="consistency-stat-value">{Math.round((last30Count / 30) * 100)}%</div>
            <div className="consistency-stat-label">ใน 30 วันล่าสุด</div>
          </div>
        </div>
      </div>

      {/* 30-Day Heatmap */}
      <div className="consistency-heatmap-card">
        <h3>ความสม่ำเสมอ 30 วันล่าสุด</h3>
        <div className="consistency-heatmap">{last30.map(renderHeatmapCell)}</div>
        <div className="heatmap-legend">
          <div className="legend-item"><span className="legend-dot empty"></span>ยังไม่ส่ง</div>
          <div className="legend-item"><span className="legend-dot partial"></span>ส่ง 1 ฟอร์ม</div>
          <div className="legend-item"><span className="legend-dot both"></span>ส่งครบ 2 ฟอร์ม</div>
        </div>
      </div>

      {/* Today Status */}
      <div className="today-status-card">
        <h3>สถานะวันนี้ <small>{todayKey}</small></h3>
        <div className="today-status-items">
          <div className={`today-status-item ${todayStatus.meditation ? "done" : ""}`}>
            <div className="today-status-icon med"><img src={lotusIcon} alt="Meditation" className="custom-icon" /></div>
            <span className="today-status-name">Meditation Record</span>
            <span className={`today-status-badge ${todayStatus.meditation ? "sent" : "pending"}`}>
              {todayStatus.meditation ? "ส่งแล้ว" : "ยังไม่ส่ง"}
            </span>
          </div>
          <div className={`today-status-item ${todayStatus.journal ? "done" : ""}`}>
            <div className="today-status-icon jour"><JournalIcon size={20} color="#fff" /></div>
            <span className="today-status-name">Daily Journal</span>
            <span className={`today-status-badge ${todayStatus.journal ? "sent" : "pending"}`}>
              {todayStatus.journal ? "ส่งแล้ว" : "ยังไม่ส่ง"}
            </span>
          </div>
        </div>
      </div>

      {/* Form Tabs */}
      <div className="form-section">
        <div className="form-tabs">
          <button
            className={`form-tab ${activeTab === "meditation" ? "active med" : ""}`}
            onClick={() => setActiveTab("meditation")}
          >
            <img src={lotusIcon} alt="Meditation" className="custom-icon-sm" />
            Meditation Record
          </button>
          <button
            className={`form-tab ${activeTab === "journal" ? "active jour" : ""}`}
            onClick={() => setActiveTab("journal")}
          >
            <JournalIcon size={16} />
            Daily Journal
          </button>
        </div>

        <div className="form-iframe-wrapper">
          <iframe
            key={activeTab}
            src={activeTab === "meditation" ? MEDITATION_URL : JOURNAL_URL}
            title={activeTab === "meditation" ? "Meditation Record Form" : "Daily Journal Form"}
            className="form-iframe"
            frameBorder="0"
          >
            Loading…
          </iframe>
        </div>

        <div className="form-actions">
          <button
            className="mark-done-btn"
            onClick={() => refreshSheets()}
            disabled={sheetsLoading}
          >
            <RefreshCw size={16} className={sheetsLoading ? "spin" : ""} />
            {sheetsLoading ? "กำลังดึงข้อมูล…" : "รีเฟรชข้อมูลหลังส่งฟอร์ม"}
          </button>
          <a
            href={activeTab === "meditation" ? MEDITATION_LINK : JOURNAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="open-external-btn"
          >
            <ExternalLink size={16} />
            เปิดใน Google Forms
          </a>
        </div>
      </div>
    </div>
  );
}
