import { clearAuthSession, getAccessToken } from "./authStorage";

export const SESSION_EXPIRED_ERROR = "SESSION_EXPIRED";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function authFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(init.headers ?? {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearAuthSession();

    const currentPath = `${window.location.pathname}${window.location.search}`;
    const redirect = encodeURIComponent(currentPath || "/");

    window.location.assign(
      `/autentificare?reason=session_expired&redirect=${redirect}`
    );

    throw new Error(SESSION_EXPIRED_ERROR);
  }

  return response;
}