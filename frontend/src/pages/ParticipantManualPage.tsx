import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ParticipantLayout from "../components/layout/ParticipantLayout";
import "../styles/participant-manual.css";
import {
  getParticipantContext,
  replaceParticipantContext,
  type ParticipantPortalContext,
} from "../participant/participantStorage";
import {
  createParticipantSubmissionRequest,
  fetchCurrentParticipantContextRequest,
} from "../participant/participantApi";
import { getParticipantNextPath } from "../participant/participantRouting";
import { PARTICIPANT_SESSION_EXPIRED_ERROR } from "../participant/participantAuthFetch";
import type {
  MeasurementFrequency,
  StudyParameterKey,
} from "../studies/studiesApi";

const PARAMETER_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "Saturația de oxigen",
  temperature: "Temperatura corporală",
};

const PARAMETER_UNITS: Record<StudyParameterKey, string> = {
  heartRate: "bpm",
  respiratoryRate: "rpm",
  spo2: "%",
  temperature: "°C",
};

const PARAMETER_HINTS: Record<StudyParameterKey, string> = {
  heartRate: "Măsoară-ți pulsul timp de 30 de secunde și înmulțește cu 2.",
  respiratoryRate: "Numără de câte ori respiri complet într-un minut.",
  spo2: "Folosește pulsoximetrul și asigură-te că degetul este nemișcat.",
  temperature: "Folosește un termometru digital și măsoară temperatura corect.",
};

const PARAMETER_SUBTITLES: Record<StudyParameterKey, string> = {
  heartRate: "bătăi pe minut",
  respiratoryRate: "respirații pe minut",
  spo2: "procent",
  temperature: "grade Celsius",
};

const FREQUENCY_LABELS: Record<MeasurementFrequency, string> = {
  continuous: "Continuu",
  every_1_min: "La 1 minut",
  every_5_min: "La 5 minute",
  every_15_min: "La 15 minute",
  every_30_min: "La 30 minute",
  every_1_hour: "La 1 oră",
};

const VALID_RANGES: Record<StudyParameterKey, { min: number; max: number }> = {
  heartRate: { min: 30, max: 220 },
  respiratoryRate: { min: 5, max: 80 },
  spo2: { min: 50, max: 100 },
  temperature: { min: 30, max: 43 },
};

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
        d="M10.2 32H24.2L28.5 22.5L34.2 41.5L39 26.8L43.2 32H53.8"
        stroke="#ffffff"
        strokeWidth="2"
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

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19.2 5.7 12.9a4.1 4.1 0 0 1 5.8-5.8l.5.5.5-.5a4.1 4.1 0 0 1 5.8 5.8L12 19.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 12h4l1.6-3.1 2.4 6.2 2-4h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 18.2 5.4V10c0 4.7-2.8 8.9-6.2 10.1C8.6 18.9 5.8 14.7 5.8 10V5.4L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9.4 11.8 1.8 1.8 3.6-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4.5a5.4 5.4 0 0 0-3.2 9.8c.6.5.9 1.1 1 1.8h4.4c.1-.7.4-1.3 1-1.8A5.4 5.4 0 0 0 12 4.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 20h2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 12.5 3.2 3.2L17.5 8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getParameterIcon(parameterKey: StudyParameterKey) {
  if (parameterKey === "heartRate") return <HeartIcon />;
  if (parameterKey === "respiratoryRate") return <RespiratoryIcon />;
  if (parameterKey === "spo2") return <DropIcon />;
  return <ThermometerIcon />;
}

export default function ParticipantManualPage() {
  const navigate = useNavigate();

  const [context, setContext] = useState<ParticipantPortalContext | null>(
    getParticipantContext()
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [participantNotes, setParticipantNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const freshContext = await fetchCurrentParticipantContextRequest();

        if (cancelled) return;

        replaceParticipantContext(freshContext);

        const nextPath = getParticipantNextPath(freshContext);

        if (nextPath !== "/participant/furnizare-date/manual") {
          navigate(nextPath, { replace: true });
          return;
        }

        setContext(freshContext);
      } catch (error) {
        if (cancelled) return;

        if (
          error instanceof Error &&
          error.message === PARTICIPANT_SESSION_EXPIRED_ERROR
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nu s-a putut încărca pagina de furnizare manuală."
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

  const parameters = context?.parameters ?? [];

  const participantName = context?.participant.full_name ?? "Participant";
  const firstName = participantName.split(" ")[0] || "Participant";
  const studyCode = context?.study.code ?? "—";

  const measuredAt = useMemo(() => new Date().toISOString(), [successMessage]);

  function updateValue(parameterKey: StudyParameterKey, value: string) {
    setValues((prev) => ({
      ...prev,
      [parameterKey]: value.replace(",", "."),
    }));

    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  }

  function validateValues() {
    if (parameters.length === 0) {
      return "Nu există parametri configurați pentru acest studiu.";
    }

    for (const parameter of parameters) {
      const rawValue = values[parameter.parameter_key]?.trim();

      if (!rawValue) {
        return `Completează valoarea pentru ${PARAMETER_LABELS[parameter.parameter_key]}.`;
      }

      const numericValue = Number(rawValue);
      const range = VALID_RANGES[parameter.parameter_key];

      if (Number.isNaN(numericValue)) {
        return `Valoarea pentru ${PARAMETER_LABELS[parameter.parameter_key]} trebuie să fie numerică.`;
      }

      if (numericValue < range.min || numericValue > range.max) {
        return `${PARAMETER_LABELS[parameter.parameter_key]} trebuie să fie între ${range.min} și ${range.max}.`;
      }
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateValues();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await createParticipantSubmissionRequest({
        participant_notes: participantNotes.trim() || null,
        values: parameters.map((parameter) => ({
          parameter_key: parameter.parameter_key,
          value: Number(values[parameter.parameter_key]),
          measured_at: measuredAt,
        })),
      });

      const freshContext = await fetchCurrentParticipantContextRequest();
      replaceParticipantContext(freshContext);
      setContext(freshContext);

      setValues({});
      setParticipantNotes("");
      setSuccessMessage("Datele au fost salvate cu succes.");
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
          : "Nu s-au putut salva datele introduse."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ParticipantLayout
      activeItem="furnizare"
      title={`Bună, ${firstName}! 👋`}
      subtitle="Ajută-ne să înțelegem mai bine starea ta de sănătate. Completează valorile semnelor tale vitale."
      participantName={participantName}
      studyCode={studyCode}
      contentWidth="wide"
    >
      <div className="participant-manual-page">
        {isLoading ? (
          <div className="participant-manual-banner">
            Se încarcă informațiile studiului...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="participant-manual-banner participant-manual-banner--error">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="participant-manual-banner participant-manual-banner--success">
            {successMessage}
          </div>
        ) : null}

        <form className="participant-manual-card" onSubmit={handleSubmit}>
          <div className="participant-manual-card__header">
            <div>
              <h2>Furnizează datele tale</h2>
              <p>Introdu valorile măsurate în acest moment.</p>
            </div>

            <div className="participant-manual-tip">
              <TipIcon />
              <span>
                <strong>Măsoară-te într-un mediu liniștit, în repaus,</strong>
                pentru rezultate cât mai precise.
              </span>
            </div>
          </div>

          <div className="participant-manual-grid">
            {parameters.map((parameter) => (
              <article
                key={`${parameter.parameter_key}-${parameter.measurement_frequency}`}
                className="participant-manual-vital-card"
              >
                <div className="participant-manual-vital-card__icon">
                  {getParameterIcon(parameter.parameter_key)}
                </div>

                <h3>{PARAMETER_LABELS[parameter.parameter_key]}</h3>
                <span className="participant-manual-vital-card__subtitle">
                  {PARAMETER_SUBTITLES[parameter.parameter_key]}
                </span>

                <label className="participant-manual-input">
                  <span className="participant-manual-input__icon">
                    {getParameterIcon(parameter.parameter_key)}
                  </span>

                  <input
                    type="number"
                    step={parameter.parameter_key === "temperature" ? "0.1" : "1"}
                    inputMode="decimal"
                    placeholder="--"
                    value={values[parameter.parameter_key] ?? ""}
                    onChange={(event) =>
                      updateValue(parameter.parameter_key, event.target.value)
                    }
                    disabled={isSaving || isLoading}
                  />

                  <strong>{PARAMETER_UNITS[parameter.parameter_key]}</strong>
                </label>

                <p>{PARAMETER_HINTS[parameter.parameter_key]}</p>

                <small>
                  Frecvență recomandată: {FREQUENCY_LABELS[parameter.measurement_frequency]}
                </small>
              </article>
            ))}
          </div>

          <label className="participant-manual-notes">
            <span>Observații opționale</span>
            <textarea
              rows={3}
              placeholder="Ex: am măsurat după repaus, am repetat măsurarea etc."
              value={participantNotes}
              onChange={(event) => setParticipantNotes(event.target.value)}
              disabled={isSaving || isLoading}
            />
          </label>

          <button
            type="submit"
            className="participant-manual-submit"
            disabled={isSaving || isLoading}
          >
            <span>{isSaving ? "Se salvează..." : "Salvează datele"}</span>
            <CheckIcon />
          </button>

          <div className="participant-manual-security">
            <ShieldIcon />
            <span>Datele tale sunt în siguranță și confidențiale.</span>
          </div>
        </form>

        <section className="participant-manual-info-card">
          <div className="participant-manual-info-card__icon">
            <ShieldIcon />
          </div>

          <div>
            <h2>De ce sunt importante aceste date?</h2>
            <p>
              Informațiile pe care le furnizezi ne ajută să înțelegem mai bine
              evoluția stării tale de sănătate și impactul factorilor urmăriți
              în acest studiu.
            </p>
          </div>

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
        </section>
      </div>
    </ParticipantLayout>
  );
}