import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";
import { ArrowLeft, Check, FileText, BookOpen, Globe } from "lucide-react";

const ICONS = { Assignment: FileText, Reading: BookOpen, Daily: Globe };
const COLORS = { Assignment: "task-blue", Reading: "task-green", Daily: "task-purple" };

export default function TasksPage() {
  const { data, toggleTodo } = useApp();
  const navigate = useNavigate();

  const doneTasks = data.todos.filter((t) => t.done);
  const pendingTasks = data.todos.filter((t) => !t.done);
  const total = data.todos.length;
  const percent = total ? Math.round((doneTasks.length / total) * 100) : 0;

  return (
    <div className="tasks-page">
      <div className="tasks-page-header">
        <button className="back-btn" onClick={() => navigate("/student")}>
          <ArrowLeft size={20} />
          <span>กลับ</span>
        </button>
        <h1>งานทั้งหมด</h1>
        <p className="tasks-page-sub">รวมงานทั้งหมดจากวิชา 955110</p>
        {total > 0 && (
          <div className="tasks-progress">
            <div className="tasks-progress-top">
              <span>เสร็จแล้ว {doneTasks.length} จาก {total} งาน</span>
              <b>{percent}%</b>
            </div>
            <div className="tasks-progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}
      </div>

      {total === 0 && <div className="tasks-empty">ยังไม่มีงานในตอนนี้</div>}

      {pendingTasks.length > 0 && (
        <div className="tasks-group">
          <h2 className="tasks-group-title">ยังไม่เสร็จ <span>{pendingTasks.length}</span></h2>
          {pendingTasks.map((task) => {
            const Icon = ICONS[task.type] || FileText;
            const colorCls = COLORS[task.type] || "task-blue";
            return (
              <div key={task.id} className="task-item-full">
                <div className={`task-icon ${colorCls}`}><Icon size={22} /></div>
                <div className="task-info">
                  <div className="task-name">{task.title}</div>
                  <div className="task-meta">
                    <span className="subject">{task.subject}</span>
                    <span>•</span>
                    <span>{task.type}</span>
                    <span>•</span>
                    <span>กำหนด {task.dueDate}</span>
                  </div>
                </div>
                <button className="done-btn" onClick={() => toggleTodo(task.id)}>
                  ทำเสร็จแล้ว
                </button>
              </div>
            );
          })}
        </div>
      )}

      {doneTasks.length > 0 && (
        <div className="tasks-group">
          <h2 className="tasks-group-title">เสร็จแล้ว <span>{doneTasks.length}</span></h2>
          {doneTasks.map((task) => {
            const Icon = ICONS[task.type] || FileText;
            return (
              <div key={task.id} className="task-item-full done">
                <div className="task-icon task-done"><Icon size={22} /></div>
                <div className="task-info">
                  <div className="task-name">{task.title}</div>
                  <div className="task-meta">
                    <span className="subject">{task.subject}</span>
                    <span>•</span>
                    <span>{task.type}</span>
                  </div>
                </div>
                <div className="done-badge"><Check size={16} /> เสร็จแล้ว</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
