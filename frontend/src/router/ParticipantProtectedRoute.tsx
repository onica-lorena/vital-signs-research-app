import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import {
  getParticipantContext,
  isParticipantAuthenticated,
} from "../participant/participantStorage";

type ParticipantProtectedRouteProps = {
  children: ReactElement;
};

export default function ParticipantProtectedRoute({
  children,
}: ParticipantProtectedRouteProps) {
  if (!isParticipantAuthenticated()) {
    return <Navigate to="/participant/cod-studiu" replace />;
  }

  const context = getParticipantContext();

  if (!context) {
    return <Navigate to="/participant/cod-studiu" replace />;
  }

  return children;
}