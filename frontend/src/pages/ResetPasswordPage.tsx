import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import { resetPasswordRequest } from "../auth/authApi";
import "../styles/login.css";
import "../styles/reset-password.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="2"
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
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 10V7.8C8.5 5.7 10.18 4 12.25 4C14.32 4 16 5.7 16 7.8V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C4.6 8.3 8 6.5 12 6.5C16 6.5 19.4 8.3 21.5 12C19.4 15.7 16 17.5 12 17.5C8 17.5 4.6 15.7 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.72 6.72C5.03 7.67 3.62 9.12 2.5 12C4.6 15.7 8 17.5 12 17.5C13.73 17.5 15.27 17.16 16.65 16.53"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 6.7C10.56 6.57 11.27 6.5 12 6.5C16 6.5 19.4 8.3 21.5 12C20.74 13.34 19.83 14.46 18.77 15.38"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 12.5L10 16.5L18 8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SavePasswordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="4.5"
        width="15"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 4.5H16V9.3H8V4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 14.2L11.1 16.3L15 12.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isTokenMissing = useMemo(() => !token.trim(), [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (isTokenMissing) {
      setErrorMessage("Lipsește tokenul de resetare din link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Cele două parole nu coincid.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPasswordRequest(token, newPassword);
      setSuccessMessage(response.message);
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        navigate("/autentificare", { replace: true });
      }, 1800);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Nu s-a putut reseta parola.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page reset-password-page">
      <div className="login-bg-shape login-bg-shape--left" aria-hidden="true" />
      <div className="login-bg-shape login-bg-shape--right" aria-hidden="true" />
      <div className="login-dots login-dots--left" aria-hidden="true" />
      <div className="login-dots login-dots--right" aria-hidden="true" />
      <div className="login-wave" aria-hidden="true" />

      <AppHeader
        rightContent={
          <button
            type="button"
            className="login-back-link"
            onClick={() => navigate("/autentificare")}
          >
            <BackIcon />
            <span>Înapoi la autentificare</span>
          </button>
        }
      />

      <section className="login-center">
        <div className="login-intro">
          <h1>Setează o parolă nouă</h1>
          <p>
            Alege o parolă nouă pentru contul tău. După salvare, vei putea să te
            autentifici folosind noua parolă.
          </p>
        </div>

        <div className="login-card reset-password-card">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="newPassword">Parolă nouă</label>
              <div className="login-input login-input--active">
                <span className="login-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="newPassword"
                  className="reset-password-input"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Introdu parola nouă"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showNewPassword ? "Ascunde parola" : "Afișează parola"}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="confirmPassword">Confirmă parola nouă</label>
              <div className="login-input">
                <span className="login-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="confirmPassword"
                  className="reset-password-input"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmă parola nouă"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={
                    showConfirmPassword ? "Ascunde parola" : "Afișează parola"
                  }
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {isTokenMissing ? (
              <p className="reset-password-feedback reset-password-feedback--error">
                Linkul de resetare este invalid sau incomplet.
              </p>
            ) : null}

            {errorMessage ? (
              <p className="reset-password-feedback reset-password-feedback--error">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="reset-password-feedback reset-password-feedback--success">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="login-primary-btn"
              disabled={isLoading || isTokenMissing}
            >
              <span className="login-btn-icon">
                <SavePasswordIcon />
              </span>
              <span>
                {isLoading ? "Se actualizează..." : "Resetează parola"}
              </span>
            </button>

            <div className="reset-password-checklist">
              <div>
                <span
                  className={`reset-password-check ${
                    newPassword.length >= 8 ? "is-valid" : ""
                  }`}
                >
                  <CheckIcon />
                </span>
                <span>Minimum 8 caractere</span>
              </div>

              <div>
                <span
                  className={`reset-password-check ${
                    /[A-Z]/.test(newPassword) ? "is-valid" : ""
                  }`}
                >
                  <CheckIcon />
                </span>
                <span>Cel puțin o literă mare</span>
              </div>

              <div>
                <span
                  className={`reset-password-check ${
                    /[a-z]/.test(newPassword) ? "is-valid" : ""
                  }`}
                >
                  <CheckIcon />
                </span>
                <span>Cel puțin o literă mică</span>
              </div>

              <div>
                <span
                  className={`reset-password-check ${
                    /\d/.test(newPassword) ? "is-valid" : ""
                  }`}
                >
                  <CheckIcon />
                </span>
                <span>Cel puțin o cifră</span>
              </div>

              <div>
                <span
                  className={`reset-password-check ${
                    /[^\w\s]/.test(newPassword) ? "is-valid" : ""
                  }`}
                >
                  <CheckIcon />
                </span>
                <span>Cel puțin un caracter special</span>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}