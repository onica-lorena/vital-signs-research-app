import {
  clearParticipantSession,
  getParticipantAccessToken,
  getParticipantContext,
} from "./participantStorage";

export const PARTICIPANT_SESSION_EXPIRED_ERROR = "PARTICIPANT_SESSION_EXPIRED";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function participantAuthFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getParticipantAccessToken();
  const headers = new Headers(init.headers ?? {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    const studyCode = getParticipantContext()?.study.code;

    clearParticipantSession();

    const searchParams = new URLSearchParams();
    searchParams.set("reason", "session_expired");

    if (studyCode) {
      searchParams.set("studyCode", studyCode);
    }

    window.location.assign(`/participant/cod-studiu?${searchParams.toString()}`);
    throw new Error(PARTICIPANT_SESSION_EXPIRED_ERROR);
  }

  return response;
}