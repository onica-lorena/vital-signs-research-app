import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ParticipantLayout from "../components/layout/ParticipantLayout";
import "../styles/participant-choose-method.css";
import {
  getParticipantContext,
  replaceParticipantContext,
  type ParticipantDataEntryMethod,
  type ParticipantPortalContext,
} from "../participant/participantStorage";
import {
  fetchCurrentParticipantContextRequest,
  selectParticipantDataEntryMethodRequest,
} from "../participant/participantApi";
import { getParticipantNextPath } from "../participant/participantRouting";
import { PARTICIPANT_SESSION_EXPIRED_ERROR } from "../participant/participantAuthFetch";
import type { StudyParameterKey } from "../studies/studiesApi";

const PARAMETER_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "Saturația de oxigen",
  temperature: "Temperatura corporală",
};

function HeroHealthIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 52.3c-1 0-1.9-.4-2.6-1.1l-9.2-9.1c-5.5-5.5-5.5-14.5 0-20 5-5 13-5.5 18.6-1.3 5.6-4.2 13.6-3.7 18.6 1.3 5.5 5.5 5.5 14.5 0 20l-9.2 9.1c-.7.7-1.7 1.1-2.6 1.1Z"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path
        d="M20.8 32h8l3.3-6.3 4.6 11 3.1-6.1h4.4"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M16 46.5 20.8 33 40.7 13.1a5.4 5.4 0 0 1 7.6 0l2.6 2.6a5.4 5.4 0 0 1 0 7.6L31 43.2 16 46.5Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="m36.5 17.4 10 10"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M15.8 46.2 28 34"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M19 12.5h18l11 11V49a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4v-32.5a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M37 12.5V24h11"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="18"
        y="32.5"
        width="28"
        height="16"
        rx="5"
        fill="currentColor"
        opacity="0.95"
      />
      <text
        x="32"
        y="43.8"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="Inter, Arial, sans-serif"
      >
        CSV
      </text>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
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
        d="M12 3L18.2 5.4V10C18.2 14.7 15.4 18.9 12 20.1C8.6 18.9 5.8 14.7 5.8 10V5.4L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 11.8L11.2 13.6L14.8 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartPanelIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 56
           C30.8 56 29.7 55.5 28.8 54.7
           L14.9 41.8
           C7.9 35.3 7.2 24.4 13.3 17.3
           C18.8 10.9 28.3 10.3 34.1 15.3
           L32 17.6
           L29.9 15.3
           C35.7 10.3 45.2 10.9 50.7 17.3
           C56.8 24.4 56.1 35.3 49.1 41.8
           L35.2 54.7
           C34.3 55.5 33.2 56 32 56Z"
        fill="currentColor"
      />

      <path
        d="M11.5 32H24.2L28.5 22.5L34.2 41.5L39 26.8L43.2 32H52.5"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RespiratoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.2V7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7
           C12 8 11.6 8.7 10.9 9.4
           L10.2 10.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7
           C12 8 12.4 8.7 13.1 9.4
           L13.8 10.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10.2 9.6
           C9.5 8.9 8.5 8.5 7.6 8.8
           C6 9.3 5 11.2 5 13.7
           C5 16.2 5.8 18.4 7.1 19.3
           C7.4 19.5 7.8 19.5 8 19.2
           C8.7 18.4 9.5 17.9 10.2 17.5
           C10.8 17.2 11.1 16.6 11.1 15.9
           V10.8
           C11.1 10.3 10.8 9.9 10.2 9.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M13.8 9.6
           C14.5 8.9 15.5 8.5 16.4 8.8
           C18 9.3 19 11.2 19 13.7
           C19 16.2 18.2 18.4 16.9 19.3
           C16.6 19.5 16.2 19.5 16 19.2
           C15.3 18.4 14.5 17.9 13.8 17.5
           C13.2 17.2 12.9 16.6 12.9 15.9
           V10.8
           C12.9 10.3 13.2 9.9 13.8 9.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8.2 12.1C8.9 12.4 9.4 13 9.7 13.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.8 12.1C15.1 12.4 14.6 13 14.3 13.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.8c-2.9 4.1-5.5 6.8-5.5 10.3A5.5 5.5 0 0 0 12 19.6a5.5 5.5 0 0 0 5.5-5.5C17.5 10.6 14.9 7.9 12 3.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14.1" r="1.8" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function ThermometerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5.2a2 2 0 1 0-4 0v7.1a4.2 4.2 0 1 0 4 0V5.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.3V7.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="10" cy="16.8" r="1.8" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export default function ParticipantChooseMethodPage() {
  const navigate = useNavigate();

  const [context, setContext] = useState<ParticipantPortalContext | null>(
    getParticipantContext()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMethod, setSelectedMethod] =
    useState<ParticipantDataEntryMethod | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const freshContext = await fetchCurrentParticipantContextRequest();

        if (cancelled) {
          return;
        }

        replaceParticipantContext(freshContext);

        const nextPath = getParticipantNextPath(freshContext);

        if (nextPath !== "/participant/alegere-metoda") {
          navigate(nextPath, { replace: true });
          return;
        }

        setContext(freshContext);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (
          error instanceof Error &&
          error.message === PARTICIPANT_SESSION_EXPIRED_ERROR
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nu s-a putut încărca contextul participantului."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSelectMethod(method: ParticipantDataEntryMethod) {
    setErrorMessage("");
    setSelectedMethod(method);

    try {
      await selectParticipantDataEntryMethodRequest(method);

      const freshContext = await fetchCurrentParticipantContextRequest();
      replaceParticipantContext(freshContext);
      setContext(freshContext);

      navigate(getParticipantNextPath(freshContext), { replace: true });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === PARTICIPANT_SESSION_EXPIRED_ERROR
      ) {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nu s-a putut salva metoda selectată."
      );
      setSelectedMethod(null);
    }
  }

  const parameterLabels = useMemo(() => {
    const labels =
      context?.parameters.map(
        (parameter) => PARAMETER_LABELS[parameter.parameter_key]
      ) ?? [];

    return labels.length > 0
      ? labels.join(" • ")
      : "Ritm cardiac • Frecvență respiratorie • Saturația de oxigen • Temperatura corporală";
  }, [context]);

  const parameterCount = context?.parameters.length ?? 4;
  const participantName = context?.participant.full_name ?? "Participant";
  const studyCode = context?.study.code ?? "—";

  const parameterWord = parameterCount === 1 ? "semn vital" : "semne vitale";

  return (
    <ParticipantLayout
      activeItem="furnizare"
      title=""
      subtitle=""
      participantName={participantName}
      studyCode={studyCode}
      contentWidth="wide"
    >
      <div className="participant-method-page">
        {isLoading ? (
          <div className="participant-method-banner">
            Se încarcă informațiile studiului și ale participantului...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="participant-method-banner participant-method-banner--error">
            {errorMessage}
          </div>
        ) : null}

        <section className="participant-method-hero">

          <h2>Cum vrei să trimiți datele tale?</h2>

          <p>
            Poți introduce valorile manual sau le poți încărca dintr-un fișier
            CSV.
            <br />
            Alege varianta care ți se potrivește.
          </p>
        </section>

        <section className="participant-method-grid">
          <article
            className={`participant-method-card participant-method-card--manual${
              selectedMethod === "manual" ? " participant-method-card--busy" : ""
            }`}
          >
            <div className="participant-method-card__icon participant-method-card__icon--manual">
              <PencilIcon />
            </div>

            <span className="participant-method-card__tag participant-method-card__tag--manual">
              Manual
            </span>

            <h3>Introdu manual valorile</h3>

            <p>
              Completează acum cele {parameterCount} {parameterWord}, pas cu pas.
              Durează doar câteva minute.
            </p>

            <button
              type="button"
              className="participant-method-card__button participant-method-card__button--manual"
              onClick={() => void handleSelectMethod("manual")}
              disabled={selectedMethod !== null || isLoading}
            >
              <span>
                {selectedMethod === "manual" ? "Se salvează..." : "Continuă"}
              </span>
              <ArrowRightIcon />
            </button>
          </article>

          <article
            className={`participant-method-card participant-method-card--csv${
              selectedMethod === "csv" ? " participant-method-card--busy" : ""
            }`}
          >
            <div className="participant-method-card__icon participant-method-card__icon--csv">
              <CsvIcon />
            </div>

            <span className="participant-method-card__tag participant-method-card__tag--csv">
              Fișier CSV
            </span>

            <h3>Încarcă fișierul cu date</h3>

            <p>
              Încarcă un fișier CSV cu valorile tale. Rapid și sigur.
            </p>

            <button
              type="button"
              className="participant-method-card__button participant-method-card__button--csv"
              onClick={() => void handleSelectMethod("csv")}
              disabled={selectedMethod !== null || isLoading}
            >
              <span>
                {selectedMethod === "csv" ? "Se salvează..." : "Continuă"}
              </span>
              <ArrowRightIcon />
            </button>
          </article>
        </section>

        <div className="participant-method-security">
          <ShieldCheckIcon />
          <span>
            Datele tale sunt în siguranță. Informațiile sunt folosite doar în
            scopuri de cercetare.
          </span>
        </div>

        <section className="participant-method-study-panel">
          <div className="participant-method-study-panel__visual">
            <div className="participant-method-study-panel__bg">
              <span className="participant-method-study-panel__leaf participant-method-study-panel__leaf--1" />
              <span className="participant-method-study-panel__leaf participant-method-study-panel__leaf--2" />
              <span className="participant-method-study-panel__leaf participant-method-study-panel__leaf--3" />
              <span className="participant-method-study-panel__leaf participant-method-study-panel__leaf--4" />
              <span className="participant-method-study-panel__leaf participant-method-study-panel__leaf--5" />
              <span className="participant-method-study-panel__leaf participant-method-study-panel__leaf--6" />
            </div>
          
            <div className="participant-method-study-panel__heart">
              <HeartPanelIcon />
            </div>
          
            <div className="participant-method-study-panel__mini participant-method-study-panel__mini--resp">
              <RespiratoryIcon />
            </div>
          
            <div className="participant-method-study-panel__mini participant-method-study-panel__mini--spo2">
              <DropIcon />
            </div>
          
            <div className="participant-method-study-panel__mini participant-method-study-panel__mini--temp">
              <ThermometerIcon />
            </div>
          </div>

          <div className="participant-method-study-panel__content">
            <h3>
              Cele {parameterCount} {parameterWord} monitorizate în acest studiu
            </h3>

            <p className="participant-method-study-panel__parameters">
              {parameterLabels}
            </p>

            <p className="participant-method-study-panel__description">
              Furnizarea regulată a datelor ne ajută să înțelegem mai bine
              sănătatea și să generăm descoperiri valoroase.
            </p>
          </div>
        </section>
      </div>
    </ParticipantLayout>
  );
}