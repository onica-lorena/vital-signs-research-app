import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../auth/authStorage";
import type { ReactElement } from "react";

type ProtectedRouteProps = {
  allowedRole: "admin" | "researcher";
  children: ReactElement;
};

export default function ProtectedRoute({
  allowedRole,
  children,
}: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/autentificare" replace />;
  }

  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/autentificare" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/autentificare" replace />;
  }

  return children;
}