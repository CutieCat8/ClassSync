import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useApp } from "@/app/providers/AppContext";
import { TeacherProvider } from "@/features/teacher/TeacherContext";
import Sidebar from "@/shared/layout/Sidebar";
import TeacherSidebar from "@/shared/layout/TeacherSidebar";
import LoginScreen from "@/features/auth/LoginScreen";
import SignupScreen from "@/features/auth/SignupScreen";
import HomePage from "@/features/home/HomePage";
import TasksPage from "@/features/tasks/TasksPage";
import ConsistencyPage from "@/features/consistency/ConsistencyPage";
import TeacherHomePage from "@/features/teacher/TeacherHomePage";
import TeacherAnnouncementsPage from "@/features/announcements/TeacherAnnouncementsPage";
import TeacherSchedulePage from "@/features/schedule/TeacherSchedulePage";
import StudentAnnouncementsPage from "@/features/announcements/StudentAnnouncementsPage";
import StudentSchedulePage from "@/features/schedule/StudentSchedulePage";
import StudentCourseFormPage from "@/features/schedule/StudentCourseFormPage";
import StudentCoursesPage from "@/features/schedule/StudentCoursesPage";
import TeacherRosterPage from "@/features/teacher/TeacherRosterPage";

function StudentShell() {
  const { studentId, role } = useApp();
  if (!studentId || role !== "student") return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <Outlet />
    </div>
  );
}

function TeacherShell() {
  const { role } = useApp();
  if (role !== "teacher") return <Navigate to="/login" replace />;
  return (
    <TeacherProvider>
      <div className="app-layout">
        <TeacherSidebar />
        <Outlet />
      </div>
    </TeacherProvider>
  );
}

function RoleRedirect() {
  const { role, studentId } = useApp();
  if (role === "teacher") return <Navigate to="/teacher" replace />;
  if (role === "student" && studentId) return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />

        <Route path="/student" element={<StudentShell />}>
          <Route index element={<HomePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="analytics" element={<ConsistencyPage />} />
          <Route path="announcements" element={<StudentAnnouncementsPage />} />
          <Route path="schedule" element={<StudentSchedulePage />} />
          <Route path="schedule/add-course" element={<StudentCourseFormPage />} />
          <Route path="schedule/courses" element={<StudentCoursesPage />} />
          <Route path="schedule/courses/:courseId/edit" element={<StudentCourseFormPage />} />
        </Route>

        <Route path="/teacher" element={<TeacherShell />}>
          <Route index element={<TeacherHomePage />} />
          <Route path="announcements" element={<TeacherAnnouncementsPage />} />
          <Route path="schedule" element={<TeacherSchedulePage />} />
          <Route path="roster" element={<TeacherRosterPage />} />
          <Route path="roster/:id" element={<TeacherRosterPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
