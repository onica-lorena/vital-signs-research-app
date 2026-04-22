import type { AppUser } from "./authStorage";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

type MessageResponse = {
  message: string;
};

type AccessRequestPayload = {
  full_name: string;
  email: string;
  institution?: string | null;
  department?: string | null;
  specialization?: string | null;
  phone?: string | null;
  request_reason?: string | null;
};

const API_BASE_URL = "http://127.0.0.1:8000";

export async function loginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Autentificarea a eșuat.");
  }

  return data as LoginResponse;
}

export async function fetchCurrentUser(token: string): Promise<AppUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Nu s-au putut prelua datele utilizatorului.");
  }

  return data as AppUser;
}

export async function forgotPasswordRequest(email: string): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Nu s-a putut trimite cererea de resetare.");
  }

  return data as MessageResponse;
}

export async function resetPasswordRequest(
  token: string,
  newPassword: string
): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Nu s-a putut reseta parola.");
  }

  return data as MessageResponse;
}

export async function requestAccessRequest(
  payload: AccessRequestPayload
): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/access-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Nu s-a putut trimite solicitarea de acces.");
  }

  return data as MessageResponse;
}