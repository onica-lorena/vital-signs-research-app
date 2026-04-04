import "../styles/login.css";
import AppHeader from "../components/layout/AppHeader";
import { useNavigate } from "react-router-dom";

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

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 7.5L12 12.5L18.5 7.5"
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

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="6"
        y="10"
        width="12"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 10V7.8C9 6.14 10.34 4.8 12 4.8C13.66 4.8 15 6.14 15 7.8V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <main className="login-page">
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
            onClick={() => navigate("/")}
            >
            <BackIcon />
            <span>Înapoi la început</span>
            </button>
        }
        />

      <section className="login-center">
        <div className="login-intro">
          <h1>Bine ai revenit!</h1>
          <p>
            Autentifică-te pentru a accesa platforma și a continua
            activitatea de cercetare.
          </p>
        </div>

        <div className="login-card">
          <form className="login-form">
            <div className="login-field">
              <label htmlFor="email">Adresă de email</label>
              <div className="login-input login-input--active">
                <span className="login-input-icon">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="exemplu@domeniu.ro"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Parolă</label>
              <div className="login-input">
                <span className="login-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="Introdu parola"
                />
                <button type="button" className="login-password-toggle" aria-label="Afișează parola">
                  <EyeIcon />
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-checkbox">
                <span className="login-checkbox-box">
                  <CheckIcon />
                </span>
                <span>Ține-mă autentificat</span>
              </label>

              <button type="button" className="login-text-link">
                Ai uitat parola?
              </button>
            </div>

            <button type="submit" className="login-primary-btn">
              <span className="login-btn-icon">
                <LoginIcon />
              </span>
              <span>Autentificare</span>
            </button>

            <div className="login-request-access">
                <p>Nu ai cont?</p>
                <button
                    type="button"
                    className="login-request-access-link"
                    onClick={() => navigate("/solicita-acces")}
                >
                    Solicită acces
                </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}