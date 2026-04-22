import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import { forgotPasswordRequest } from "../auth/authApi";
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

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 3L10 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M21 3L14 21L10 14L3 10L21 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await forgotPasswordRequest(email.trim());
      setSuccessMessage(response.message);
      setEmail("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Nu s-a putut trimite cererea de resetare.");
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
          <h1>Ai uitat parola?</h1>
          <p>
            Introdu adresa de email asociată contului tău pentru a continua procesul de resetare.
          </p>
        </div>

        <div className="login-card reset-password-card">
          <form className="login-form" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

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
              disabled={isLoading}
            >
              <span className="login-btn-icon">
                <SendIcon />
              </span>
              <span>
                {isLoading ? "Se trimite..." : "Trimite instrucțiunile"}
              </span>
            </button>

            <div className="reset-password-footer-link">
              <button
                type="button"
                className="login-text-link"
                onClick={() => navigate("/autentificare")}
              >
                Mergi înapoi la autentificare
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}