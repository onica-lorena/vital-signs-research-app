import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ParticipantLayout from "../components/layout/ParticipantLayout";
import "../styles/participant-history.css";
import {
  getParticipantContext,
  replaceParticipantContext,
  type ParticipantPortalContext,
} from "../participant/participantStorage";
import { fetchCurrentParticipantContextRequest } from "../participant/participantApi";
import { PARTICIPANT_SESSION_EXPIRED_ERROR, participantAuthFetch } from "../participant/participantAuthFetch";

const PAGE_SIZE = 8;

type ParticipantDataEntryMethod = "manual" | "csv";
type ParticipantHistoryStatus = "submitted" | "validated" | "rejected" | "partial";

type MeasurementContext =
  | "rest"
  | "during_effort"
  | "after_effort"
  | "after_meal"
  | "stress"
  | "sleep"
  | "unknown";

type ParticipantHistorySummaryResponse = {
  total_sessions: number;
  validated_sessions: number;
  pending_sessions: number;
  rejected_sessions: number;
  partial_sessions: number;
  last_submission_at: string | null;
};

type ParticipantSubmissionSessionListItemResponse = {
  id: number;
  entry_method: ParticipantDataEntryMethod;
  status_summary: ParticipantHistoryStatus;
  submitted_at: string;
  interval_start: string | null;
  interval_end: string | null;
  records_count: number;
  validated_count: number;
  pending_count: number;
  rejected_count: number;
  source_file_name: string | null;
  measurement_context: MeasurementContext | null;
};

type ParticipantSubmissionSessionListResponse = {
  items: ParticipantSubmissionSessionListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

const ENTRY_METHOD_LABELS: Record<ParticipantDataEntryMethod, string> = {
  manual: "Manual",
  csv: "CSV",
};

const STATUS_LABELS: Record<ParticipantHistoryStatus, string> = {
  submitted: "În așteptare",
  validated: "Validat",
  rejected: "Respins",
  partial: "Parțial",
};

const MEASUREMENT_CONTEXT_LABELS: Record<MeasurementContext, string> = {
  rest: "În repaus",
  during_effort: "În timpul efortului",
  after_effort: "După efort",
  after_meal: "După masă",
  stress: "Stres / emoții",
  sleep: "Somn / odihnă",
  unknown: "Necunoscut",
};

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 6.2v5.9l3.6 2.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.6 7.5A7.8 7.8 0 1 1 4.2 12"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M4.1 5.2v3.6h3.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m7 12.5 3.1 3.1L17.2 8.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8.4v4.2l2.9 1.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.2 20 18.5H4L12 4.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 16.3h.01"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3.8h6.8L18 8v12.2H7V3.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M13.8 3.8V8H18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 13h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 16h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.4 17.8 6.8 13.5 15.2 5.1a2.4 2.4 0 0 1 3.4 0l.3.3a2.4 2.4 0 0 1 0 3.4l-8.4 8.4-4.3 1.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m14 6.4 3.6 3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="10.8"
        cy="10.8"
        r="5.8"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="m15.3 15.3 3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="6.2"
        width="15"
        height="13.1"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 4.3v3.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 4.3v3.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.8 10h14.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6 9 12l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return typeof data.detail === "string" ? data.detail : fallback;
  } catch {
    return fallback;
  }
}

async function fetchParticipantHistorySummaryRequest() {
  const response = await participantAuthFetch("/participant-access/history/summary");

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Nu s-a putut încărca rezumatul istoricului.")
    );
  }

  return (await response.json()) as ParticipantHistorySummaryResponse;
}

async function fetchParticipantHistoryRequest(params: {
  page: number;
  pageSize: number;
  statusSummary: ParticipantHistoryStatus | "";
  search: string;
  startDate: string;
  endDate: string;
}) {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page));
  searchParams.set("page_size", String(params.pageSize));

  if (params.statusSummary) {
    searchParams.set("status_summary", params.statusSummary);
  }

  if (params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.startDate) {
    searchParams.set("start_date", params.startDate);
  }

  if (params.endDate) {
    searchParams.set("end_date", params.endDate);
  }

  const response = await participantAuthFetch(
    `/participant-access/history?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Nu s-a putut încărca istoricul trimiterilor.")
    );
  }

  return (await response.json()) as ParticipantSubmissionSessionListResponse;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "Participant";
}

function getStatusIcon(status: ParticipantHistoryStatus) {
  if (status === "validated") {
    return <CheckIcon />;
  }

  if (status === "rejected") {
    return <AlertIcon />;
  }

  if (status === "partial") {
    return <FileIcon />;
  }

  return <ClockIcon />;
}

function getMethodIcon(method: ParticipantDataEntryMethod) {
  return method === "csv" ? <FileIcon /> : <PencilIcon />;
}

export default function ParticipantHistoryPage() {
  const navigate = useNavigate();

  const [context, setContext] = useState<ParticipantPortalContext | null>(
    getParticipantContext()
  );
  const [summary, setSummary] =
    useState<ParticipantHistorySummaryResponse | null>(null);
  const [sessions, setSessions] = useState<
    ParticipantSubmissionSessionListItemResponse[]
  >([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [statusSummary, setStatusSummary] = useState<ParticipantHistoryStatus | "">(
    ""
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const freshContext = await fetchCurrentParticipantContextRequest();

        if (cancelled) {
          return;
        }

        replaceParticipantContext(freshContext);
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
            : "Nu s-a putut încărca informația participantului."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingContext(false);
        }
      }
    }

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setErrorMessage("");

      try {
        const [summaryResponse, historyResponse] = await Promise.all([
          fetchParticipantHistorySummaryRequest(),
          fetchParticipantHistoryRequest({
          page,
          pageSize: PAGE_SIZE,
          statusSummary,
          search: debouncedSearch,
          startDate,
          endDate,
          }),
        ]);

        if (cancelled) {
          return;
        }

        setSummary(summaryResponse);
        setSessions(historyResponse.items);
        setTotalPages(historyResponse.total_pages);
        setTotalItems(historyResponse.total);
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
            : "Nu s-a putut încărca istoricul trimiterilor."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [page, statusSummary, debouncedSearch, startDate, endDate]);

  const participantName = context?.participant.full_name ?? "Participant";
  const firstName = getFirstName(participantName);
  const studyCode = context?.study.code ?? "—";

  const hasActiveFilters =
    Boolean(statusSummary) ||
    Boolean(search.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate);

  const lastSubmissionText = useMemo(() => {
    if (!summary?.last_submission_at) {
      return "Nu există trimiteri încă";
    }

    return formatDateTime(summary.last_submission_at);
  }, [summary]);

  function resetFilters() {
    setStatusSummary("");
    setSearch("");
    setDebouncedSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function handleStatusChange(value: ParticipantHistoryStatus | "") {
    setStatusSummary(value);
    setPage(1);
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    setPage(1);
  }

  function handleEndDateChange(value: string) {
    setEndDate(value);
    setPage(1);
  }

  return (
    <ParticipantLayout
      activeItem="istoric"
      title={`Istoricul trimiterilor`}
      subtitle="Aici poți urmări sesiunile în care ai furnizat date, statusul lor și perioada acoperită de fiecare trimitere."
      participantName={participantName}
      studyCode={studyCode}
      contentWidth="wide"
    >
      <div className="participant-history-page">
        {isLoadingContext ? (
          <div className="participant-history-banner">
            Se încarcă informațiile participantului...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="participant-history-banner participant-history-banner--error">
            {errorMessage}
          </div>
        ) : null}

        <section className="participant-history-card">
          <div className="participant-history-card__header">
            <div>
              <h3>Sesiuni de trimitere</h3>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                className="participant-history-reset"
                onClick={resetFilters}
              >
                Resetează filtrele
              </button>
            ) : null}
          </div>

          <div className="participant-history-filters">
            <label className="participant-history-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Caută după fișier sau ID sesiune..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={statusSummary}
                onChange={(event) =>
                  handleStatusChange(
                    event.target.value as ParticipantHistoryStatus | ""
                  )
                }
              >
                <option value="">Toate</option>
                <option value="submitted">În așteptare</option>
                <option value="validated">Validat</option>
                <option value="rejected">Respins</option>
                <option value="partial">Parțial</option>
              </select>
            </label>

            <label>
              <span>De la</span>
              <div className="participant-history-date">
                <CalendarIcon />
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => handleStartDateChange(event.target.value)}
                />
              </div>
            </label>

            <label>
              <span>Până la</span>
              <div className="participant-history-date">
                <CalendarIcon />
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => handleEndDateChange(event.target.value)}
                />
              </div>
            </label>
          </div>

          {isLoadingHistory ? (
            <div className="participant-history-empty">
              Se încarcă istoricul trimiterilor...
            </div>
          ) : sessions.length === 0 ? (
            <div className="participant-history-empty">
              <div className="participant-history-empty__icon">
                <HistoryIcon />
              </div>
              <h4>Nu există sesiuni pentru criteriile selectate</h4>
              <p>
                Încearcă să modifici filtrele sau trimite primele date din
                secțiunea de furnizare.
              </p>
              {hasActiveFilters ? (
                <button type="button" onClick={resetFilters}>
                  Resetează filtrele
                </button>
              ) : null}
            </div>
          ) : (
            <div className="participant-history-list">
              {sessions.map((session) => {
                const contextLabel = session.measurement_context
                  ? MEASUREMENT_CONTEXT_LABELS[session.measurement_context]
                  : "Context nespecificat";

                const intervalText =
                  session.interval_start || session.interval_end
                    ? `${formatDate(session.interval_start)} - ${formatDate(
                        session.interval_end
                      )}`
                    : "Interval necunoscut";

                return (
                  <article
                    key={session.id}
                    className={`participant-history-session participant-history-session--${session.status_summary}`}
                  >
                    <div className="participant-history-session__main">
                      <div className="participant-history-session__icon">
                        {getMethodIcon(session.entry_method)}
                      </div>

                      <div className="participant-history-session__content">
                        <div className="participant-history-session__title-row">
                          <h4>
                            {session.entry_method === "csv"
                              ? session.source_file_name || "Fișier CSV încărcat"
                              : "Trimitere manuală"}
                          </h4>

                          <span
                            className={`participant-history-status participant-history-status--${session.status_summary}`}
                          >
                            {getStatusIcon(session.status_summary)}
                            {STATUS_LABELS[session.status_summary]}
                          </span>
                        </div>

                        <div className="participant-history-session__meta">
                          <span>
                            Metodă:{" "}
                            <strong>{ENTRY_METHOD_LABELS[session.entry_method]}</strong>
                          </span>
                          <span>
                            Trimis la:{" "}
                            <strong>{formatDateTime(session.submitted_at)}</strong>
                          </span>
                          <span>
                            Context: <strong>{contextLabel}</strong>
                          </span>
                        </div>

                        <p>
                          Perioada valorilor: <strong>{intervalText}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="participant-history-session__stats">
                      <span>
                        <strong>{session.records_count}</strong>
                        înregistrări
                      </span>
                      <span>
                        <strong>{session.validated_count}</strong>
                        validate
                      </span>
                      <span>
                        <strong>{session.pending_count}</strong>
                        în așteptare
                      </span>
                      <span>
                        <strong>{session.rejected_count}</strong>
                        respinse
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="participant-history-pagination">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page <= 1 || isLoadingHistory}
            >
              <ArrowLeftIcon />
              Anterior
            </button>

            <span>
              Pagina <strong>{page}</strong> din <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => Math.min(totalPages, currentPage + 1))
              }
              disabled={page >= totalPages || isLoadingHistory}
            >
              Următor
              <ArrowRightIcon />
            </button>
          </div>
        </section>
      </div>
    </ParticipantLayout>
  );
}