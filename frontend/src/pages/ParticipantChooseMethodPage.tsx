import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import "../styles/participant-portal.css";
import {
  clearParticipantSession,
  getParticipantAccessToken,
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

export default function ParticipantChooseMethodPage() {
  const navigate = useNavigate();
  const [context, setContext] = useState<ParticipantPortalContext | null>(
    getParticipantContext()
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
      const token = getParticipantAccessToken();

      if (token) {
        replaceParticipantContext(freshContext);
      }

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
            <h1>Alege metoda de furnizare a datelor</h1>
            <p>
              Studiul <strong>{context?.study.title ?? "—"}</strong> permite atât
              introducerea manuală, cât și încărcarea prin fișier CSV.
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

          <div className="participant-method-grid">
            <article className="participant-method-card">
              <h2>Introducere manuală</h2>
              <p>
                Completezi valorile direct în aplicație, pentru fiecare înregistrare.
              </p>

              <button
                type="button"
                className="participant-portal-primary-btn"
                onClick={() => void handleSelectMethod("manual")}
                disabled={selectedMethod !== null}
              >
                {selectedMethod === "manual" ? "Se salvează..." : "Alege manual"}
              </button>
            </article>

            <article className="participant-method-card">
              <h2>Import fișier CSV</h2>
              <p>
                Încarci datele în format tabelar, într-o singură sesiune de trimitere.
              </p>

              <button
                type="button"
                className="participant-portal-primary-btn"
                onClick={() => void handleSelectMethod("csv")}
                disabled={selectedMethod !== null}
              >
                {selectedMethod === "csv" ? "Se salvează..." : "Alege CSV"}
              </button>
            </article>
          </div>

          <p className="participant-portal-note">
            După alegere, metoda rămâne aceeași pe tot parcursul participării în acest studiu.
          </p>
        </section>
      </div>
    </main>
  );
}