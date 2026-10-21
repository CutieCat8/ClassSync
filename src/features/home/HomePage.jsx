import React from "react";
import { Search, Bell, LayoutGrid } from "lucide-react";
import StatsRow from "./components/StatsRow";
import MeetingCard from "./components/MeetingCard";
import TaskList from "./components/TaskList";
import MiniCalendar from "./components/MiniCalendar";
import TeacherCard from "./components/TeacherCard";
import ConsistencyCard from "@/features/consistency/components/ConsistencyCard";

function formatToday() {
  const now = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${months[now.getMonth()]} ${now.getDate()},  ${h}.${m}`;
}

export default function HomePage() {
  return (
    <div className="main-wrapper student-dashboard">
      <main className="main-content">
        <header className="dashboard-heading">
          <span className="dash-eyebrow fade-in">Dashboard · 955110</span>
          <h1 className="page-title fade-in">My Classes</h1>
          <p className="page-date fade-in">{formatToday()}</p>
        </header>

        <StatsRow />
        <MeetingCard />
        <TaskList />
      </main>

      <aside className="right-panel">
        <div className="top-bar fade-in">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search" />
          </div>
          <button className="icon-btn" aria-label="Notifications"><Bell size={18} /></button>
          <button className="icon-btn" aria-label="Grid"><LayoutGrid size={18} /></button>
        </div>

        <div className="right-top-row">
          <MiniCalendar />
          <TeacherCard />
        </div>
        <ConsistencyCard />
      </aside>
    </div>
  );
}
