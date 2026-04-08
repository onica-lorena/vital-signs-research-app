import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import "../styles/participant-code.css";

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

function ParticipantHeroIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="27" cy="20" r="7" stroke="currentColor" strokeWidth="2.6" />
      <path
        d="M14 40.8C14 33.95 19.55 28.4 26.4 28.4H27.6C34.45 28.4 40 33.95 40 40.8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M43.1 28.2L50.1 30.95V35.95C50.1 41 46.95 45.42 42.2 47.15C37.45 45.42 34.3 41 34.3 35.95V30.95L41.3 28.2C41.86 27.98 42.54 27.98 43.1 28.2Z"
        fill="#1f6a3f"
      />
      <path
        d="M39.7 35.95L41.7 37.95L45.55 34.1"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4L7.2 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M16.8 4L15 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M4.2 9.1H19.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M3.2 15.1H18.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L18.3 5.42V10.02C18.3 14.75 15.45 18.95 12 20.2C8.55 18.95 5.7 14.75 5.7 10.02V5.42L12 3Z"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
      <path
        d="M9.45 11.8L11.15 13.5L14.65 9.95"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 10V7.8C8.5 5.72 10.18 4.04 12.25 4.04C14.32 4.04 16 5.72 16 7.8V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartEaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19.1L5.8 12.9C4.15 11.25 4.15 8.65 5.8 7C7.45 5.35 10.05 5.35 11.7 7L12 7.3L12.3 7C13.95 5.35 16.55 5.35 18.2 7C19.85 8.65 19.85 11.25 18.2 12.9L12 19.1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.9 12H10.1L11.45 9.7L13.05 14.15L14.2 12H16.15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 18.5H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 16.1V11.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16.1V8.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.5 16.1V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function ParticipantCodePage() {
  const navigate = useNavigate();
  const [studyCode, setStudyCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = studyCode.trim().toUpperCase();

    if (!normalizedCode) {
      setErrorMessage("Introdu codul studiului primit de la cercetător.");
      return;
    }

    setErrorMessage("");
    console.log("Cod introdus:", normalizedCode);
  }

  return (
    <main className="participant-code-page">
      <div className="participant-bg-shape participant-bg-shape--left" aria-hidden="true" />
      <div className="participant-bg-shape participant-bg-shape--right" aria-hidden="true" />
      <div className="participant-dots participant-dots--left" aria-hidden="true" />
      <div className="participant-dots participant-dots--right" aria-hidden="true" />
      <div className="participant-wave" aria-hidden="true" />

      <AppHeader
        rightContent={
          <button
            type="button"
            className="participant-back-link"
            onClick={() => navigate("/")}
          >
            <BackIcon />
            <span>Înapoi la început</span>
          </button>
        }
      />

      <section className="participant-code-center">
        <div className="participant-code-intro">

          <h1>Bun venit la VitalStudy!</h1>

          <p>
            Introdu codul de studiu pentru a te alătura
            și a începe participarea.
          </p>
        </div>

        <article className="participant-code-card">
          <div className="participant-code-card__header">
            <h2>Introdu codul studiului</h2>
            <p>
              Codul este un identificator unic oferit de cercetătorul tău
              pentru accesul în studiu.
            </p>
          </div>

          <form className="participant-code-form" onSubmit={handleSubmit}>
            <div className="participant-code-field">
              <label htmlFor="study-code">Cod de studiu</label>

              <div className="participant-code-input">
                <span className="participant-code-input__icon">
                  <CodeIcon />
                </span>

                <input
                  id="study-code"
                  type="text"
                  placeholder="Ex: VS-104"
                  value={studyCode}
                  onChange={(event) => {
                    setStudyCode(event.target.value.toUpperCase());
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  maxLength={20}
                  autoComplete="off"
                  aria-invalid={Boolean(errorMessage)}
                />
              </div>
            </div>

            {errorMessage ? (
              <p className="participant-code-error">{errorMessage}</p>
            ) : null}

            <button type="submit" className="participant-code-submit">
              <span>Continuă</span>
              <ArrowRightIcon />
            </button>
          </form>

          <div className="participant-code-card__divider" />

          <div className="participant-code-card__footer">
            <span className="participant-code-card__footer-icon">
              <ShieldCheckIcon />
            </span>
            <span>
              Datele tale sunt în siguranță. Participarea ta este confidențială.
            </span>
          </div>
        </article>
      </section>
    </main>
  );
}