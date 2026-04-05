import { Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "../pages/WelcomePage";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage";
import ResearcherPage from "../pages/ResearcherPage";
import ProtectedRoute from "./ProtectedRoute";
import { getCurrentUser } from "../auth/authStorage";

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

      <Route path="/redirect" element={<RoleRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}