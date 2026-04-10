import type {
  DataEntryMode,
  MeasurementFrequency,
  StudyParameterKey,
  StudyStatus,
} from "../studies/studiesApi";

const PARTICIPANT_ACCESS_TOKEN_KEY = "vitalstudy_participant_access_token";
const PARTICIPANT_CONTEXT_KEY = "vitalstudy_participant_context";

export type ParticipantStatus =
  | "invited"
  | "active"
  | "suspended"
  | "completed"
  | "withdrawn";

export type ParticipantDataEntryMethod = "manual" | "csv";

export type ParticipantParameterInfo = {
  parameter_key: StudyParameterKey;
  measurement_frequency: MeasurementFrequency;
};

export type ParticipantPortalContext = {
  participant: {
    id: number;
    participant_code: string;
    full_name: string;
    status: ParticipantStatus;
    submissions_count: number;
    last_login_at: string | null;
    last_submission_at: string | null;
    selected_data_entry_method: ParticipantDataEntryMethod | null;
  };
  study: {
    id: number;
    code: string;
    title: string;
    status: StudyStatus;
    data_entry_mode: DataEntryMode;
  };
  parameters: ParticipantParameterInfo[];
};

function readJson<T>(key: string): T | null {
  const rawValue = sessionStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

export function saveParticipantSession(
  token: string,
  context: ParticipantPortalContext
): void {
  sessionStorage.setItem(PARTICIPANT_ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(PARTICIPANT_CONTEXT_KEY, JSON.stringify(context));
}

export function getParticipantAccessToken(): string | null {
  return sessionStorage.getItem(PARTICIPANT_ACCESS_TOKEN_KEY);
}

export function getParticipantContext(): ParticipantPortalContext | null {
  return readJson<ParticipantPortalContext>(PARTICIPANT_CONTEXT_KEY);
}

export function replaceParticipantContext(
  context: ParticipantPortalContext
): void {
  sessionStorage.setItem(PARTICIPANT_CONTEXT_KEY, JSON.stringify(context));
}

export function clearParticipantSession(): void {
  sessionStorage.removeItem(PARTICIPANT_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(PARTICIPANT_CONTEXT_KEY);
}

export function isParticipantAuthenticated(): boolean {
  return !!getParticipantAccessToken() && !!getParticipantContext();
}