import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import {
  getCurrentUser,
  saveAuthSession,
  type AppUser,
} from "../auth/authStorage";
import { authFetch, SESSION_EXPIRED_ERROR } from "../auth/authFetch";
import "../styles/researcher-profile.css";

type UserRole = "admin" | "researcher";

type UserResponse = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  institution: string | null;
  department: string | null;
  specialization: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileFormData = {
  fullName: string;
  phone: string;
  bio: string;
};

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const CURRENT_USER_ENDPOINT = "/auth/me";
const PROFILE_UPDATE_ENDPOINT = "/users/me";
const PASSWORD_UPDATE_ENDPOINT = "/users/me/password";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  researcher: "Cercetător",
};

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.2 19.2C6 15.9 8.45 14.1 12 14.1C15.55 14.1 18 15.9 18.8 19.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="6.5"
        width="15"
        height="11"
        rx="2.3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.2 8.8L11.3 12.6C11.72 12.92 12.28 12.92 12.7 12.6L17.8 8.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 20V5.8C6.5 5.08 7.08 4.5 7.8 4.5H16.2C16.92 4.5 17.5 5.08 17.5 5.8V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4.8 20H19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 8H10.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.8 8H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 11.5H10.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.8 11.5H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.2 20V15.7H13.8V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.4L18.2 6.7V11.4C18.2 15.15 15.75 18.45 12 19.8C8.25 18.45 5.8 15.15 5.8 11.4V6.7L12 4.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.1L11.1 14L15 9.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5.5"
        y="10.2"
        width="13"
        height="9"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.4 10.2V8C8.4 5.9 9.9 4.4 12 4.4C14.1 4.4 15.6 5.9 15.6 8V10.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 14V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.5 18.5L6.2 15.1L15.1 6.2C15.95 5.35 17.32 5.35 18.17 6.2C19.02 7.05 19.02 8.42 18.17 9.27L9.25 18.2L5.5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14.1 7.2L17.1 10.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 5H16.3L18 6.7V19H6V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 5V10H14.8V5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.8 19V14.5H15.2V19" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18.7 9.2C17.8 6.7 15.4 5 12.6 5C9 5 6.1 7.9 6.1 11.5C6.1 15.1 9 18 12.6 18C15.1 18 17.3 16.6 18.4 14.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.9 5.8V9.5H15.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="6"
        width="15"
        height="13"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 4.5V7.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 4.5V7.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 9.5H19.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function getInitials(fullName?: string | null): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "AD"
  );
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeProfileForm(user: UserResponse): ProfileFormData {
  return {
    fullName: user.full_name ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
  };
}

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toAppUser(user: UserResponse): AppUser {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    is_verified: user.is_verified,
    institution: user.institution,
    department: user.department,
    specialization: user.specialization,
    phone: user.phone,
    bio: user.bio,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function getProfileCompletionDetails(user: UserResponse | null): {
  percentage: number;
  helperText: string;
} {
  if (!user) {
    return {
      percentage: 0,
      helperText: "Datele profilului sunt în curs de încărcare.",
    };
  }

  const fields = [
    { value: user.full_name, label: "numele complet" },
    { value: user.email, label: "emailul" },
    { value: user.phone, label: "telefonul" },
    { value: user.bio, label: "descrierea profilului" },
  ];

  const missingLabels = fields
    .filter((field) => !field.value?.trim())
    .map((field) => field.label);

  const completedCount = fields.length - missingLabels.length;
  const percentage = Math.round((completedCount / fields.length) * 100);

  if (missingLabels.length === 0) {
    return {
      percentage,
      helperText: "Profilul este complet. Toate informațiile principale sunt introduse.",
    };
  }

  if (missingLabels.length === 1) {
    return {
      percentage,
      helperText: `Mai lipsește ${missingLabels[0]} pentru un profil complet.`,
    };
  }

  const lastMissingLabel = missingLabels[missingLabels.length - 1];
  const otherMissingLabels = missingLabels.slice(0, -1).join(", ");

  return {
    percentage,
    helperText: `Mai lipsesc ${otherMissingLabels} și ${lastMissingLabel} pentru un profil complet.`,
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg)
        .filter(Boolean)
        .join(" ");
    }

    return "A apărut o eroare la comunicarea cu serverul.";
  } catch {
    return "A apărut o eroare la comunicarea cu serverul.";
  }
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await authFetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<T>;
}

async function getCurrentUserRequest(): Promise<UserResponse> {
  return apiRequest<UserResponse>(CURRENT_USER_ENDPOINT);
}

async function updateProfileRequest(payload: {
  full_name: string;
  phone: string | null;
  bio: string | null;
}): Promise<UserResponse> {
  return apiRequest<UserResponse>(PROFILE_UPDATE_ENDPOINT, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

async function updatePasswordRequest(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(PASSWORD_UPDATE_ENDPOINT, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="researcher-profile-info-item">
      <span className="researcher-profile-info-item__icon">{icon}</span>

      <div>
        <span>{label}</span>
        <strong>{value || "—"}</strong>
      </div>
    </article>
  );
}

export default function AdminProfile() {
  const storedUser = getCurrentUser();

  const [user, setUser] = useState<UserResponse | null>(null);

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    fullName: storedUser?.full_name ?? "",
    phone: storedUser?.phone ?? "",
    bio: storedUser?.bio ?? "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!pageError && !profileSuccess && !passwordError && !passwordSuccess) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPageError("");
      setProfileSuccess("");
      setPasswordError("");
      setPasswordSuccess("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pageError, profileSuccess, passwordError, passwordSuccess]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsProfileLoading(true);
      setPageError("");

      try {
        const response = await getCurrentUserRequest();

        if (cancelled) {
          return;
        }

        setUser(response);
        setProfileForm(normalizeProfileForm(response));
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setPageError(
          error instanceof Error
            ? error.message
            : "Profilul nu a putut fi încărcat."
        );
      } finally {
        if (!cancelled) {
          setIsProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const profileCompletion = useMemo(
    () => getProfileCompletionDetails(user),
    [user]
  );

  const profileInitials = getInitials(user?.full_name);

  function updateProfileField<K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updatePasswordField<K extends keyof PasswordFormData>(
    field: K,
    value: PasswordFormData[K]
  ) {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function validateProfileForm(): string {
    if (!profileForm.fullName.trim()) {
      return "Numele complet este obligatoriu.";
    }

    if (profileForm.fullName.trim().length < 2) {
      return "Numele complet trebuie să conțină cel puțin 2 caractere.";
    }

    return "";
  }

  function validatePasswordForm(): string {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      return "Completează parola actuală, parola nouă și confirmarea parolei.";
    }

    if (passwordForm.newPassword.length < 8) {
      return "Parola nouă trebuie să aibă cel puțin 8 caractere.";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return "Parola nouă și confirmarea parolei nu coincid.";
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      return "Parola nouă trebuie să fie diferită de parola actuală.";
    }

    return "";
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateProfileForm();

    if (error) {
      setPageError(error);
      return;
    }

    setIsProfileSaving(true);
    setPageError("");
    setProfileSuccess("");

    try {
      const response = await updateProfileRequest({
        full_name: profileForm.fullName.trim(),
        phone: toNullableString(profileForm.phone),
        bio: toNullableString(profileForm.bio),
      });

      setUser(response);
      setProfileForm(normalizeProfileForm(response));

      const token = localStorage.getItem("vitalstudy_access_token");
      if (token) {
        saveAuthSession(token, toAppUser(response));
      }

      setProfileSuccess("Profilul administratorului a fost actualizat cu succes.");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Profilul nu a putut fi actualizat."
      );
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function handleSavePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validatePasswordForm();

    if (error) {
      setPasswordError(error);
      return;
    }

    setIsPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      await updatePasswordRequest({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordSuccess("Parola a fost schimbată cu succes.");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPasswordError(
        error instanceof Error
          ? error.message
          : "Parola nu a putut fi schimbată."
      );
    } finally {
      setIsPasswordSaving(false);
    }
  }

  function handleResetProfileForm() {
    if (!user) {
      return;
    }

    setProfileForm(normalizeProfileForm(user));
    setPageError("");
    setProfileSuccess("");
  }

  return (
    <AdminLayout
      activeItem="profile"
      title="Profil administrator"
      subtitle="Gestionează informațiile contului tău și datele afișate în platformă."
      contentWidth="wide"
    >
      <div className="researcher-profile-page">
        {pageError ? (
          <div className="researcher-profile-banner researcher-profile-banner--error">
            {pageError}
          </div>
        ) : null}

        {profileSuccess ? (
          <div className="researcher-profile-banner researcher-profile-banner--success">
            {profileSuccess}
          </div>
        ) : null}

        <section className="researcher-profile-hero">
          <div className="researcher-profile-hero__identity">
            <div className="researcher-profile-avatar">
              {isProfileLoading ? "..." : profileInitials}
            </div>

            <div>
              <h2>{user?.full_name ?? "Profil administrator"}</h2>

              <p>
                {user?.email ?? "Datele profilului sunt încă în curs de încărcare."}
              </p>
            </div>
          </div>

          <div className="researcher-profile-status-card">
            <div className="researcher-profile-status-card__top">
              <span>Completare profil</span>
              <strong>{profileCompletion.percentage}%</strong>
            </div>

            <div className="researcher-profile-progress">
              <span style={{ width: `${profileCompletion.percentage}%` }} />
            </div>

            <small>{profileCompletion.helperText}</small>
          </div>
        </section>

        <div className="researcher-profile-grid">
          <div className="researcher-profile-main-column">
            <section className="researcher-profile-card">
              <div className="researcher-profile-card__header">
                <div>
                  <h3>Informații personale</h3>
                  <p>
                    Aceste date sunt asociate contului tău de administrator și pot fi
                    folosite în zonele administrative ale platformei.
                  </p>
                </div>

                <span className="researcher-profile-card__icon is-green">
                  <EditIcon />
                </span>
              </div>

              <form className="researcher-profile-form" onSubmit={handleSaveProfile}>
                <div className="researcher-profile-form-grid">
                  <label className="researcher-profile-field researcher-profile-field--full">
                    <span>Nume complet *</span>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(event) =>
                        updateProfileField("fullName", event.target.value)
                      }
                      placeholder="Ex: Maria Popescu"
                      disabled={isProfileLoading || isProfileSaving}
                    />
                  </label>

                  <label className="researcher-profile-field">
                    <span>Telefon</span>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(event) =>
                        updateProfileField("phone", event.target.value)
                      }
                      placeholder="Ex: 07xx xxx xxx"
                      disabled={isProfileLoading || isProfileSaving}
                    />
                  </label>

                  <label className="researcher-profile-field researcher-profile-field--full">
                    <span>Descriere profil</span>
                    <textarea
                      value={profileForm.bio}
                      onChange={(event) =>
                        updateProfileField("bio", event.target.value)
                      }
                      placeholder="Adaugă o scurtă descriere despre rolul tău administrativ sau responsabilitățile în platformă."
                      maxLength={700}
                      disabled={isProfileLoading || isProfileSaving}
                    />
                    <small>{profileForm.bio.length}/700</small>
                  </label>
                </div>

                <div className="researcher-profile-actions">
                  <button
                    type="button"
                    className="researcher-profile-secondary-btn"
                    onClick={handleResetProfileForm}
                    disabled={isProfileLoading || isProfileSaving}
                  >
                    <RefreshIcon />
                    <span>Resetează</span>
                  </button>

                  <button
                    type="submit"
                    className="researcher-profile-primary-btn"
                    disabled={isProfileLoading || isProfileSaving}
                  >
                    <SaveIcon />
                    <span>{isProfileSaving ? "Se salvează..." : "Salvează profilul"}</span>
                  </button>
                </div>
              </form>
            </section>

            <section className="researcher-profile-card">
              <div className="researcher-profile-card__header">
                <div>
                  <h3>Securitate cont</h3>
                  <p>
                    Schimbă parola contului tău. Parola nouă trebuie să respecte
                    lungimea minimă și regulile de complexitate configurate în backend.
                  </p>
                </div>

                <span className="researcher-profile-card__icon is-orange">
                  <LockIcon />
                </span>
              </div>

              {passwordError ? (
                <div className="researcher-profile-inline-banner researcher-profile-inline-banner--error">
                  {passwordError}
                </div>
              ) : null}

              {passwordSuccess ? (
                <div className="researcher-profile-inline-banner researcher-profile-inline-banner--success">
                  {passwordSuccess}
                </div>
              ) : null}

              <form className="researcher-profile-form" onSubmit={handleSavePassword}>
                <div className="researcher-profile-form-grid">
                  <label className="researcher-profile-field researcher-profile-field--full">
                    <span>Parola actuală *</span>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        updatePasswordField("currentPassword", event.target.value)
                      }
                      placeholder="Introdu parola actuală"
                      disabled={isPasswordSaving}
                    />
                  </label>

                  <label className="researcher-profile-field">
                    <span>Parola nouă *</span>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        updatePasswordField("newPassword", event.target.value)
                      }
                      placeholder="Minimum 8 caractere"
                      disabled={isPasswordSaving}
                    />
                  </label>

                  <label className="researcher-profile-field">
                    <span>Confirmă parola nouă *</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        updatePasswordField("confirmPassword", event.target.value)
                      }
                      placeholder="Reintrodu parola nouă"
                      disabled={isPasswordSaving}
                    />
                  </label>
                </div>

                <div className="researcher-profile-actions researcher-profile-actions--end">
                  <button
                    type="submit"
                    className="researcher-profile-primary-btn"
                    disabled={isPasswordSaving}
                  >
                    <LockIcon />
                    <span>{isPasswordSaving ? "Se schimbă..." : "Schimbă parola"}</span>
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="researcher-profile-side-column">
            <section className="researcher-profile-side-card researcher-profile-side-card--green">
              <div className="researcher-profile-side-card__header">
                <span>
                  <UserIcon />
                </span>
                <h3>Detalii cont</h3>
              </div>

              <div className="researcher-profile-info-list">
                <InfoItem
                  icon={<MailIcon />}
                  label="Email"
                  value={user?.email ?? "—"}
                />

                <InfoItem
                  icon={<CalendarIcon />}
                  label="Creat la"
                  value={formatDateTime(user?.created_at)}
                />

                <InfoItem
                  icon={<RefreshIcon />}
                  label="Actualizat la"
                  value={formatDateTime(user?.updated_at)}
                />
              </div>
            </section>

            <section className="researcher-profile-side-card researcher-profile-side-card--orange">
              <div className="researcher-profile-side-card__header">
                <span>
                  <ShieldIcon />
                </span>
                <h3>Status acces</h3>
              </div>

              <div className="researcher-profile-status-list">
                <div>
                  <span>Rol</span>
                  <strong className="is-ok">
                    {user?.role ? ROLE_LABELS[user.role] : "—"}
                  </strong>
                </div>

                <div>
                  <span>Cont activ</span>
                  <strong className={user?.is_active ? "is-ok" : "is-muted"}>
                    {user?.is_active ? "Da" : "Nu"}
                  </strong>
                </div>

                <div>
                  <span>Cont verificat</span>
                  <strong className={user?.is_verified ? "is-ok" : "is-muted"}>
                    {user?.is_verified ? "Da" : "Nu"}
                  </strong>
                </div>
              </div>

              <p>
                Contul de administrator permite gestionarea cererilor de acces,
                utilizatorilor și studiilor disponibile în platformă.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}