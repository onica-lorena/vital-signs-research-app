import type { AppUser } from "./authStorage";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

const API_BASE_URL = "http://127.0.0.1:8000";

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
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