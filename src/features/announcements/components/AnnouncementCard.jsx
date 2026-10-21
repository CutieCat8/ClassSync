import React from "react";
import {
  Calendar, Clock, MapPin, Users, ExternalLink,
  Megaphone, FileText, Video, Sparkles, Info,
} from "lucide-react";

export const ANNOUNCEMENT_CATEGORIES = [
  "ประกาศ",
  "ส่งงาน",
  "ประชุม",
  "กิจกรรม",
  "อื่นๆ",
];

const CATEGORY_META = {
  ประกาศ:   { tone: "blue",   Icon: Megaphone },
  ส่งงาน:   { tone: "orange", Icon: FileText },
  ประชุม:   { tone: "purple", Icon: Video },
  กิจกรรม:  { tone: "green",  Icon: Sparkles },
  อื่นๆ:    { tone: "slate",  Icon: Info },
};

const TH_MONTHS_SHORT = [
  "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
  "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค.",
];

function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function fmtDateRange(startIso, endIso) {
  const s = parseDate(startIso);
  const e = parseDate(endIso);
  const fmt = (d) =>
    `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
  if (s && e) return `${fmt(s)} - ${fmt(e)}`;
  if (s) return fmt(s);
  if (e) return fmt(e);
  return "";
}

export function deriveStatus(a) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const s = parseDate(a.dateStart);
  const e = parseDate(a.dateEnd);
  if (s && e) {
    if (now < s) return { label: "เร็วๆ นี้", tone: "soon" };
    if (now > e) return { label: "จบแล้ว",   tone: "ended" };
    return { label: "กำลังจัด", tone: "live" };
  }
  if (s) {
    if (now < s) return { label: "เร็วๆ นี้", tone: "soon" };
    if (now.getTime() === s.getTime()) return { label: "วันนี้", tone: "live" };
    return { label: "ผ่านมาแล้ว", tone: "ended" };
  }
  // No dates — recent post stays "ใหม่" for 24h
  if (a.createdAt) {
    const created = new Date(a.createdAt);
    const hoursSince = (Date.now() - created.getTime()) / 36e5;
    if (hoursSince < 24) return { label: "ใหม่", tone: "new" };
  }
  return null;
}

export default function AnnouncementCard({
  announcement,
  onOpen,
  onDelete,
  onEdit,
  className = "",
}) {
  const a = announcement;
  const cat = CATEGORY_META[a.category] || CATEGORY_META["อื่นๆ"];
  const status = deriveStatus(a);
  const dateRange = fmtDateRange(a.dateStart, a.dateEnd);
  const Icon = cat.Icon;

  return (
    <article className={`ann-card ann-tone-${cat.tone} ${className}`}>
      <header className="ann-top">
        <span className="ann-icon" aria-hidden>
          <Icon size={17} strokeWidth={1.9} />
        </span>
        <span className="ann-eyebrow">{a.category || "ประกาศ"}</span>
        {status && <span className={`ann-pill ann-pill-${status.tone}`}>{status.label}</span>}
      </header>

      <div className="ann-body">
        <h3 className="ann-title">{a.title}</h3>
        {a.description && <p className="ann-desc">{a.description}</p>}

        <ul className="ann-meta">
          {dateRange && (
            <li>
              <Calendar size={15} />
              <span>{dateRange}</span>
            </li>
          )}
          {a.time && (
            <li>
              <Clock size={15} />
              <span>{a.time}</span>
            </li>
          )}
          {a.location && (
            <li>
              <MapPin size={15} />
              <span>{a.location}</span>
            </li>
          )}
          {a.attendees && (
            <li>
              <Users size={15} />
              <span>{a.attendees}</span>
            </li>
          )}
        </ul>
      </div>

      <footer className="ann-foot">
        <button type="button" className="ann-cta" onClick={() => onOpen && onOpen(a)}>
          <ExternalLink size={15} />
          <span>ดูรายละเอียด</span>
        </button>
        <div style={{ display: "inline-flex", alignItems: "center" }}>
          {onEdit && (
            <button
              type="button"
              className="ann-edit"
              onClick={() => onEdit(a)}
              aria-label="แก้ไขประกาศ"
            >
              แก้ไข
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="ann-delete"
              onClick={() => onDelete(a)}
              aria-label="ลบประกาศ"
            >
              ลบ
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
