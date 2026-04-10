import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import "../styles/participant-portal.css";
import {
  clearParticipantSession,
  getParticipantContext,
  replaceParticipantContext,
  type ParticipantPortalContext,
} from "../participant/participantStorage";
import { fetchCurrentParticipantContextRequest } from "../participant/participantApi";
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

const FREQUENCY_LABELS: Record<MeasurementFrequency, string> = {
  continuous: "Continuu",
  every_1_min: "La 1 minut",
  every_5_min: "La 5 minute",
  every_15_min: "La 15 minute",
  every_30_min: "La 30 minute",
  every_1_hour: "La 1 oră",
};

export default function ParticipantCsvPage() {
  const navigate = useNavigate();
  const [context, setContext] = useState<ParticipantPortalContext | null>(
    getParticipantContext()
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

        if (nextPath !== "/participant/furnizare-date/csv") {
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
            : "Nu s-a putut încărca pagina pentru CSV."
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

  function handleLogout() {
    clearParticipantSession();
    navigate("/participant/cod-studiu", { replace: true });
  }

  return (
    <main className="participant-portal-page">
      <div className="participant-portal-shell">
        <AppHeader
          rightContent={
            <button
              type="button"
              className="participant-portal-link-btn"
              onClick={handleLogout}
            >
              Ieși din sesiune
            </button>
          }
        />

        <section className="participant-portal-card">
          <div className="participant-portal-card__header">
            <h1>Furnizare date prin CSV</h1>
            <p>
              Aceasta este pagina temporară pentru fluxul CSV.
              Mai târziu aici vei pune upload-ul și maparea către
              <strong> POST /participant-access/submissions/bulk</strong>.
            </p>
          </div>

          {isLoading ? (
            <p className="participant-portal-message">Se încarcă informațiile...</p>
          ) : null}

          {errorMessage ? (
            <p className="participant-portal-message participant-portal-message--error">
              {errorMessage}
            </p>
          ) : null}

          <div className="participant-portal-summary">
            <div>
              <span>Studiu</span>
              <strong>{context?.study.title ?? "—"}</strong>
            </div>

            <div>
              <span>Cod studiu</span>
              <strong>{context?.study.code ?? "—"}</strong>
            </div>

            <div>
              <span>Participant</span>
              <strong>{context?.participant.full_name ?? "—"}</strong>
            </div>

            <div>
              <span>Cod participant</span>
              <strong>{context?.participant.participant_code ?? "—"}</strong>
            </div>
          </div>

          <div className="participant-portal-parameters">
            <h2>Parametri configurați</h2>

            {context?.parameters.length ? (
              <div className="participant-portal-parameter-list">
                {context.parameters.map((parameter) => (
                  <article
                    key={`${parameter.parameter_key}-${parameter.measurement_frequency}`}
                    className="participant-portal-parameter-card"
                  >
                    <strong>{PARAMETER_LABELS[parameter.parameter_key]}</strong>
                    <span>
                      Frecvență: {FREQUENCY_LABELS[parameter.measurement_frequency]}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="participant-portal-note">
                Nu există parametri disponibili în contextul curent.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}