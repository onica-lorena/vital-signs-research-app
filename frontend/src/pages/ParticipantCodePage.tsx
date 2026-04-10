import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import "../styles/participant-code.css";
import {
  getParticipantContext,
  isParticipantAuthenticated,
  saveParticipantSession,
} from "../participant/participantStorage";
import { participantLoginRequest } from "../participant/participantApi";
import { getParticipantNextPath } from "../participant/participantRouting";

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

function ParticipantIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.1" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 18.2C7.45 15.8 9.45 14.5 12 14.5C14.55 14.5 16.55 15.8 17.5 18.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5.2"
        y="10.2"
        width="13.6"
        height="9.2"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.6 10.2V8.1C8.6 6.15 10.05 4.7 12 4.7C13.95 4.7 15.4 6.15 15.4 8.1V10.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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

export default function ParticipantCodePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionExpired = searchParams.get("reason") === "session_expired";
  const studyCodeFromQuery = searchParams.get("studyCode")?.trim().toUpperCase() ?? "";

  const [studyCode, setStudyCode] = useState(studyCodeFromQuery);
  const [participantCode, setParticipantCode] = useState("");
  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isParticipantAuthenticated()) {
      return;
    }

    const context = getParticipantContext();

    if (context) {
      navigate(getParticipantNextPath(context), { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedStudyCode = studyCode.trim().toUpperCase();
    const normalizedParticipantCode = participantCode.trim().toUpperCase();
    const normalizedPin = pin.trim();

    if (!normalizedStudyCode || !normalizedParticipantCode || !normalizedPin) {
      setErrorMessage("Completează codul studiului, codul participantului și PIN-ul.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await participantLoginRequest({
        study_code: normalizedStudyCode,
        participant_code: normalizedParticipantCode,
        pin: normalizedPin,
      });

      saveParticipantSession(response.access_token, response.context);
      navigate(getParticipantNextPath(response.context), { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Autentificarea participantului a eșuat.");
      }
    } finally {
      setIsLoading(false);
    }
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
            Introdu codul studiului și datele tale de acces pentru a continua participarea.
          </p>
        </div>

        <article className="participant-code-card">
          {sessionExpired ? (
            <p className="participant-code-message participant-code-message--warning">
              Sesiunea participantului a expirat. Te rugăm să te autentifici din nou.
            </p>
          ) : null}

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
                  placeholder="Ex: VS-014"
                  value={studyCode}
                  onChange={(event) => {
                    setStudyCode(event.target.value.toUpperCase());
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  maxLength={20}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="participant-code-field">
              <label htmlFor="participant-code">Cod participant</label>

              <div className="participant-code-input">
                <span className="participant-code-input__icon">
                  <ParticipantIcon />
                </span>

                <input
                  id="participant-code"
                  type="text"
                  placeholder="Ex: P-001"
                  value={participantCode}
                  onChange={(event) => {
                    setParticipantCode(event.target.value.toUpperCase());
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="participant-code-field">
              <label htmlFor="participant-pin">PIN</label>

              <div className="participant-code-input">
                <span className="participant-code-input__icon">
                  <LockIcon />
                </span>

                <input
                  id="participant-pin"
                  type="password"
                  placeholder="Introdu PIN-ul"
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value);
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                />
              </div>
            </div>

            {errorMessage ? (
              <p className="participant-code-error">{errorMessage}</p>
            ) : null}

            <button
              type="submit"
              className="participant-code-submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "Se autentifică..." : "Continuă"}</span>
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