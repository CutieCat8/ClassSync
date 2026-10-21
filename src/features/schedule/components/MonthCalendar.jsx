import React from "react";
import { BookOpen, Clock3, MapPin, UserRound } from "lucide-react";
import { formatLongDate } from "../lib/date";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 3;
const MEETING_COLORS = ["#e11d48", "#d97706", "#2563eb", "#7c3aed", "#4d7c6f"];

function itemColor(item, index) {
  return item.kind === "course" ? item.color || "#2563eb" : MEETING_COLORS[index % MEETING_COLORS.length];
}

function itemTitle(item) {
  return item.kind === "course" ? item.courseName : item.title;
}

function itemStart(item) {
  if (item.startTime) return item.startTime;
  return (item.time || "").split(/\s*[-–]\s*/)[0].replace(/\s*น\.?$/, "");
}

function itemTimeRange(item) {
  return item.kind === "course" ? `${item.startTime} - ${item.endTime}` : item.time || "Time not specified";
}

export default function MonthCalendar({ rows, activeDate, today, onSelectDate, onOpenItem, onOpenDay }) {
  const activeMonth = activeDate.slice(0, 7);
  const selectedRow = rows.find((row) => row.date === activeDate);
  const selectedItems = selectedRow?.items || [];
  const heading = formatLongDate(activeDate);

  return (
    <div className="month-cal">
      <div className="month-cal-board">
        <div className="month-cal-weekdays" aria-hidden="true">
          {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="month-cal-grid" role="grid" aria-label="Month calendar">
          {rows.map((row) => {
            const inMonth = row.date.startsWith(activeMonth);
            const hidden = row.items.length - MAX_CHIPS;
            const classes = [
              "month-cal-cell",
              inMonth ? "" : "is-outside",
              row.date === activeDate ? "is-selected" : "",
              row.date === today ? "is-today" : "",
            ].filter(Boolean).join(" ");

            return (
              <div
                key={row.date}
                role="gridcell"
                tabIndex={0}
                aria-selected={row.date === activeDate}
                className={classes}
                onClick={() => onSelectDate(row.date)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectDate(row.date);
                  }
                }}
              >
                <div className="month-cal-cell-head">
                  <span className="month-cal-day">{Number(row.date.slice(8))}</span>
                  {row.items.length > 0 && <i className="month-cal-dot" aria-label={`${row.items.length} events`} />}
                </div>

                <div className="month-cal-chips">
                  {row.items.slice(0, MAX_CHIPS).map((item, index) => (
                    <button
                      type="button"
                      key={item.id}
                      className="month-cal-chip"
                      style={{ "--chip-color": itemColor(item, index) }}
                      title={item.kind === "course" ? `${item.courseCode} · ${item.courseName}` : item.title}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectDate(row.date);
                        onOpenItem(item);
                      }}
                    >
                      <span>{itemTitle(item)}</span>
                      <time>{itemStart(item)}</time>
                    </button>
                  ))}
                  {hidden > 0 && <span className="month-cal-more">+{hidden} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="month-cal-panel" aria-label="Selected day">
        <h3>{heading}</h3>
        {selectedItems.length === 0 ? (
          <p className="month-cal-empty"><Clock3 size={16} /> No appointments scheduled</p>
        ) : (
          <ul className="month-cal-events">
            {selectedItems.map((item, index) => (
              <li key={item.id}>
                <button type="button" style={{ "--chip-color": itemColor(item, index) }} onClick={() => onOpenItem(item)}>
                  <strong>{item.kind === "course" ? `${item.courseCode} · ${item.courseName}` : item.title}</strong>
                  <span><Clock3 size={14} /> {itemTimeRange(item)}</span>
                  {item.location && <span><MapPin size={14} /> {item.location}</span>}
                  <span>
                    {item.kind === "course"
                      ? <><BookOpen size={14} /> Course</>
                      : <><UserRound size={14} /> {item.attendeeMode === "all" ? "Class meeting" : "1:1 meeting"}</>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="month-cal-open-day" onClick={onOpenDay}>Open day view</button>
      </aside>
    </div>
  );
}
