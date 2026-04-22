import { Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "../pages/WelcomePage";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage";
import ResearcherPage from "../pages/ResearcherPage";
import StudiesPage from "../pages/StudiesPage";
import CreateStudyPage from "../pages/CreateStudyPage";
import ProtectedRoute from "./ProtectedRoute";
import { getCurrentUser } from "../auth/authStorage";
import ParticipantCodePage from "../pages/ParticipantCodePage";
import ParticipantChooseMethodPage from "../pages/ParticipantChooseMethodPage.tsx";
import ParticipantManualPage from "../pages/ParticipantManualPage";
import ParticipantCsvPage from "../pages/ParticipantCsvPage";
import ParticipantProtectedRoute from "./ParticipantProtectedRoute";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

function RoleRedirect() {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/autentificare" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "researcher") {
    return <Navigate to="/cercetator" replace />;
  }

  return <Navigate to="/autentificare" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/autentificare" element={<LoginPage />} />
      <Route path="/ai-uitat-parola" element={<ForgotPasswordPage />} />
      <Route path="/resetare-parola" element={<ResetPasswordPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cercetator"
        element={
          <ProtectedRoute allowedRole="researcher">
            <ResearcherPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cercetator/studii"
        element={
          <ProtectedRoute allowedRole="researcher">
            <StudiesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cercetator/studii/creare"
        element={
          <ProtectedRoute allowedRole="researcher">
            <CreateStudyPage />
          </ProtectedRoute>
        }
      />

      <Route path="/participant/cod-studiu" element={<ParticipantCodePage />} />

      <Route
        path="/participant/alegere-metoda"
        element={
          <ParticipantProtectedRoute>
            <ParticipantChooseMethodPage />
          </ParticipantProtectedRoute>
        }
      />

      <Route
        path="/participant/furnizare-date/manual"
        element={
          <ParticipantProtectedRoute>
            <ParticipantManualPage />
          </ParticipantProtectedRoute>
        }
      />

      <Route
        path="/participant/furnizare-date/csv"
        element={
          <ParticipantProtectedRoute>
            <ParticipantCsvPage />
          </ParticipantProtectedRoute>
        }
      />

      <Route path="/redirect" element={<RoleRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}