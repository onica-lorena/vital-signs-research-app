import { Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "../pages/WelcomePage";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage";
import AdminProfile from "../pages/AdminProfile";
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
import RequestAccessPage from "../pages/RequestAccessPage";
import AdminStudyDetailsPage from "../pages/AdminStudyDetailsPage";
import ResearcherStudyDetailsPage from "../pages/ResearcherStudyDetailsPage";
import ResearcherProfile from "../pages/ResearcherProfile";
import ParticipantHistoryPage from "../pages/ParticipantHistory";
import ResearcherAnalysis from "../pages/ResearcherAnalysis";
import ResearcherActivity from "../pages/ResearcherActivity";

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
      <Route path="/solicita-acces" element={<RequestAccessPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/profil"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/studii/:studyId"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminStudyDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cercetator"
        element={
          <ProtectedRoute allowedRole="researcher">
            <Navigate to="/cercetator/studii" replace />
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

      <Route
        path="/cercetator/studii/:studyId"
        element={
          <ProtectedRoute allowedRole="researcher">
            <Navigate to="rezumat" replace />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cercetator/studii/:studyId/:tab"
        element={
          <ProtectedRoute allowedRole="researcher">
            <ResearcherStudyDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cercetator/profil"
        element={
          <ProtectedRoute allowedRole="researcher">
            <ResearcherProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cercetator/analize"
        element={
          <ProtectedRoute allowedRole="researcher">
            <ResearcherAnalysis />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cercetator/activitate"
        element={
          <ProtectedRoute allowedRole="researcher">
            <ResearcherActivity />
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

      <Route
        path="/participant/istoric"
        element={
          <ParticipantProtectedRoute>
            <ParticipantHistoryPage />
          </ParticipantProtectedRoute>
        }
      />

      <Route path="/redirect" element={<RoleRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}