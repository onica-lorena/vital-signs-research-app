import { participantAuthFetch } from "./participantAuthFetch";
import type {
  ParticipantDataEntryMethod,
  ParticipantPortalContext,
} from "./participantStorage";

const API_BASE_URL = "http://127.0.0.1:8000";

type ParticipantLoginResponse = {
  access_token: string;
  token_type: string;
  context: ParticipantPortalContext;
};

type ParticipantLoginPayload = {
  study_code: string;
  participant_code: string;
  pin: string;
};

type ParticipantDataEntryMethodSelectResponse = {
  selected_data_entry_method: ParticipantDataEntryMethod;
};

type ParticipantSubmissionValuePayload = {
  parameter_key: string;
  value: number;
  measured_at: string | null;
};

type ParticipantSubmissionCreatePayload = {
  participant_notes: string | null;
  values: ParticipantSubmissionValuePayload[];
};

async function parseError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const data = await response.json().catch(() => null);
  return data?.detail ?? fallbackMessage;
}

export async function participantLoginRequest(
  payload: ParticipantLoginPayload
): Promise<ParticipantLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/participant-access/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Autentificarea participantului a eșuat.")
    );
  }

  return (await response.json()) as ParticipantLoginResponse;
}

export async function fetchCurrentParticipantContextRequest(): Promise<ParticipantPortalContext> {
  const response = await participantAuthFetch("/participant-access/me", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        "Nu s-a putut prelua contextul participantului."
      )
    );
  }

  return (await response.json()) as ParticipantPortalContext;
}

export async function selectParticipantDataEntryMethodRequest(
  method: ParticipantDataEntryMethod
): Promise<ParticipantDataEntryMethodSelectResponse> {
  const response = await participantAuthFetch("/participant-access/data-entry-method", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ method }),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        "Nu s-a putut salva metoda de furnizare a datelor."
      )
    );
  }

  return (await response.json()) as ParticipantDataEntryMethodSelectResponse;
}

export async function createParticipantSubmissionRequest(
  payload: ParticipantSubmissionCreatePayload
): Promise<unknown> {
  const response = await participantAuthFetch("/participant-access/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Nu s-au putut salva datele introduse.")
    );
  }

  return await response.json();
}