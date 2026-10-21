import React from "react";
import { useApp } from "@/app/providers/AppContext";
import { CalendarDays, Clock, MapPin, Users, ExternalLink, CalendarX } from "lucide-react";

const TH_MONTHS_FULL = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function fmtDateFull(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export default function MeetingCard() {
  const { selectedDate, studentId, getMeetingsForDate } = useApp();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dateToShow = selectedDate || todayStr;
  const meetings = getMeetingsForDate(dateToShow, studentId || null);
  const meeting = meetings[0];
  const displayDate = fmtDateFull(dateToShow);

  if (!meeting) {
    return (
      <div className="meeting-card fade-in-delay-2 empty-meeting">
        <div className="meeting-card-header">
          <span className="meeting-badge empty">
            {selectedDate ? displayDate : "วันนี้"}
          </span>
        </div>
        <div className="empty-meeting-body">
          <CalendarX size={48} strokeWidth={1.2} />
          <p className="empty-meeting-text">
            ไม่มีการนัดหมายหรืองานในวันนี้
          </p>
          <p className="empty-meeting-sub">
            กดที่วันในปฏิทินเพื่อดูรายละเอียดการนัดหมาย
          </p>
        </div>
      </div>
    );
  }

  const attendeeText =
    meeting.attendeeMode === "all"
      ? "ทั้งห้อง"
      : `เฉพาะ ${meeting.studentIds.length} คน`;

  return (
    <div className="meeting-card fade-in-delay-2">
      <div className="meeting-card-header">
        <span className="meeting-badge">Up next</span>
        <span className="meeting-type">Meeting</span>
      </div>

      <h3 className="meeting-title">{meeting.title}</h3>

      <div className="meeting-detail">
        <CalendarDays size={16} />
        <span>{displayDate}</span>
      </div>
      {meeting.time && (
        <div className="meeting-detail">
          <Clock size={16} />
          <span>{meeting.time}</span>
        </div>
      )}
      {meeting.location && (
        <div className="meeting-detail">
          <MapPin size={16} />
          <span>{meeting.location}</span>
        </div>
      )}
      <div className="meeting-detail">
        <Users size={16} />
        <span>{attendeeText}</span>
      </div>

      {meetings.length > 1 && (
        <div className="meeting-detail">
          <span className="meeting-extra-count">+ อีก {meetings.length - 1} รายการในวันนี้</span>
        </div>
      )}

      <button className="see-more-btn">
        <ExternalLink size={18} />
        See More Details
      </button>
    </div>
  );
}
