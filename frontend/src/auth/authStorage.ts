const ACCESS_TOKEN_KEY = "vitalstudy_access_token";
const USER_KEY = "vitalstudy_user";

export type AppUser = {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "researcher";
  is_active: boolean;
  is_verified: boolean;
  institution?: string | null;
  department?: string | null;
  specialization?: string | null;
  phone?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at?: string;
};

export function saveAuthSession(token: string, user: AppUser): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function saveTemporaryAuthSession(token: string, user: AppUser): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ??
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function getCurrentUser(): AppUser | null {
  const rawUser =
    localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AppUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getCurrentUser();
}