import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResearcherLayout from "../components/layout/ResearcherLayout";
import { authFetch, SESSION_EXPIRED_ERROR } from "../auth/authFetch";
import "../styles/researcher-dashboard.css";
import "../styles/researcher-activity.css";

const API_PAGE_SIZE = 100;
const INACTIVE_DAYS_LIMIT = 14;

type StudyStatus = "draft" | "active" | "in_analysis" | "completed";

type StudyParameterKey = "heartRate" | "respiratoryRate" | "spo2" | "temperature";
type AnalysisRiskLabel = "high_risk" | "low_risk";
type AnalysisModelType = "random_forest" | "xgboost" | "lstm";

type ParticipantStatus =
  | "invited"
  | "active"
  | "suspended"
  | "completed"
  | "withdrawn";

type ParticipantDataEntryMethod = "manual" | "csv";
type StudySessionStatus = "submitted" | "validated" | "rejected" | "partial";

type StudyListItemResponse = {
  id: number;
  title: string;
  code: string;
  description: string | null;
  study_type: string;
  status: StudyStatus;
  participants_count: number;
  created_at: string;
};

type StudyListResponse = {
  items: StudyListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type ParticipantListItemResponse = {
  id: number;
  participant_code: string;
  full_name: string;
  participant_identifier: string;
  status: ParticipantStatus;
  submissions_count: number;
  last_login_at: string | null;
  last_submission_at: string | null;
  created_at: string;
  birth_date: string | null;
  sex: string | null;
  participant_group: string | null;
  activity_level: string | null;
};

type ParticipantListResponse = {
  items: ParticipantListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type StudyDataSummaryResponse = {
  total_submissions: number;
  total_sessions: number;
  total_records: number;
  total_values: number;
  submitted_count: number;
  validated_count: number;
  rejected_count: number;
  partial_count: number;
  participants_with_submissions: number;
  last_submission_at: string | null;
};

type StudySubmissionSessionListItemResponse = {
  id: number;
  participant_id: number;
  participant_code: string;
  participant_full_name: string;
  entry_method: ParticipantDataEntryMethod;
  status_summary: StudySessionStatus;
  submitted_at: string;
  interval_start: string | null;
  interval_end: string | null;
  records_count: number;
  values_count: number;
  validated_count: number;
  pending_count: number;
  rejected_count: number;
  source_file_name: string | null;
  measurement_context: string | null;
};

type StudySubmissionSessionListResponse = {
  items: StudySubmissionSessionListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type AnalysisParticipantResponse = {
  id: number;
  participant_code: string;
  full_name: string;
};

type AnalysisResultResponse = {
  id: number;
  analysis_run_id: number | null;
  study_id: number;
  participant_id: number;
  participant: AnalysisParticipantResponse | null;
  parameter_key: StudyParameterKey;
  model_type: AnalysisModelType;
  model_name: string;
  risk_probability: number;
  risk_label: AnalysisRiskLabel;
  records_used: number;
  window_size: number | null;
  analysis_start_date: string | null;
  analysis_end_date: string | null;
  analysis_scope: string;
  created_at: string;
};

type AnalysisResultListResponse = {
  items: AnalysisResultResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type StudyMonitoringData = {
  study: StudyListItemResponse;
  dataSummary: StudyDataSummaryResponse | null;
  participants: ParticipantListItemResponse[];
  pendingSessions: StudySubmissionSessionListItemResponse[];
  highRiskResults: AnalysisResultResponse[];
};

type MonitoringIssueType =
  | "high_risk"
  | "pending_data"
  | "inactive_participant"
  | "study_without_data"
  | "low_validation";

type MonitoringIssue = {
  key: string;
  type: MonitoringIssueType;
  severity: "high" | "medium" | "low";
  study: StudyListItemResponse;
  title: string;
  description: string;
  meta: string;
  actionLabel: string;
  actionPath: string;
};

const STATUS_LABELS: Record<StudyStatus, string> = {
  draft: "Ciornă",
  active: "Activ",
  in_analysis: "În analiză",
  completed: "Finalizat",
};

const PARAMETER_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "SpO₂",
  temperature: "Temperatură",
};

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12H7.2L9.2 7.5L12 17L14.2 11H20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4L20 18H4L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16.2V16.3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.8V12.4L15.2 14.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8.3" r="2.9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.3 18.5C4.9 15.7 6.6 14.1 9 14.1C11.4 14.1 13.1 15.7 13.7 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.2 11.2C15.9 11 17.1 9.8 17.1 8.2C17.1 6.9 16.3 5.9 15.1 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.2 14.4C17.7 14.8 19.1 16.4 19.6 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StudyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="4.5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <path d="M9 8H15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9 12H15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9 16H13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.4 12.3L10.8 14.7L15.9 9.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18.7 9.2C17.8 6.7 15.4 5 12.6 5C9 5 6.1 7.9 6.1 11.5C6.1 15.1 9 18 12.6 18C15.1 18 17.3 16.6 18.4 14.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.9 5.8V9.5H15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="5.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.2 15.2L19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function formatNumber(value?: number | null): string {
  return new Intl.NumberFormat("ro-RO").format(value ?? 0);
}

function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("ro-RO", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatProbability(value: number): string {
  return `${new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value * 100)}%`;
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getDaysSince(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diff = Date.now() - date.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getRunNavigationPath(studyId: number, analysisRunId: number | null): string {
  if (analysisRunId === null) {
    return `/cercetator/studii/${studyId}/analize`;
  }

  return `/cercetator/studii/${studyId}/analize?analysisRunId=${analysisRunId}`;
}

function getValidationRate(summary: StudyDataSummaryResponse | null): number {
  if (!summary) {
    return 0;
  }

  const total =
    summary.validated_count +
    summary.submitted_count +
    summary.rejected_count +
    summary.partial_count;

  if (total === 0) {
    return 0;
  }

  return (summary.validated_count / total) * 100;
}

function getSeverityOrder(severity: MonitoringIssue["severity"]): number {
  if (severity === "high") {
    return 0;
  }

  if (severity === "medium") {
    return 1;
  }

  return 2;
}

function getIssueVisualClass(type: MonitoringIssueType): string {
  if (type === "high_risk" || type === "study_without_data") {
    return "is-red";
  }

  if (type === "pending_data" || type === "low_validation") {
    return "is-orange";
  }

  if (type === "inactive_participant") {
    return "is-blue";
  }

  return "is-blue";
}

function getIssueIcon(type: MonitoringIssueType) {
  if (type === "high_risk" || type === "study_without_data") {
    return <AlertIcon />;
  }

  if (type === "pending_data" || type === "low_validation") {
    return <ClockIcon />;
  }

  if (type === "inactive_participant") {
    return <UsersIcon />;
  }

  return <AlertIcon />;
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return "Datele trimise nu sunt valide.";
    }

    return "A apărut o eroare la comunicarea cu serverul.";
  } catch {
    return "A apărut o eroare la comunicarea cu serverul.";
  }
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await authFetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<T>;
}

async function listAllStudiesRequest(): Promise<StudyListItemResponse[]> {
  const firstQuery = new URLSearchParams();

  firstQuery.set("page", "1");
  firstQuery.set("page_size", String(API_PAGE_SIZE));
  firstQuery.set("sort_by", "created_at");
  firstQuery.set("sort_order", "desc");

  const firstPage = await apiRequest<StudyListResponse>(
    `/studies/?${firstQuery.toString()}`
  );

  const studies = [...firstPage.items];

  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const query = new URLSearchParams();

    query.set("page", String(page));
    query.set("page_size", String(API_PAGE_SIZE));
    query.set("sort_by", "created_at");
    query.set("sort_order", "desc");

    const response = await apiRequest<StudyListResponse>(
      `/studies/?${query.toString()}`
    );

    studies.push(...response.items);
  }

  return studies;
}

async function listAllParticipantsForStudyRequest(
  studyId: number
): Promise<ParticipantListItemResponse[]> {
  const firstQuery = new URLSearchParams();

  firstQuery.set("page", "1");
  firstQuery.set("page_size", String(API_PAGE_SIZE));
  firstQuery.set("sort_by", "participant_code");
  firstQuery.set("sort_order", "asc");

  const firstPage = await apiRequest<ParticipantListResponse>(
    `/studies/${studyId}/participants/?${firstQuery.toString()}`
  );

  const participants = [...firstPage.items];

  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const query = new URLSearchParams();

    query.set("page", String(page));
    query.set("page_size", String(API_PAGE_SIZE));
    query.set("sort_by", "participant_code");
    query.set("sort_order", "asc");

    const response = await apiRequest<ParticipantListResponse>(
      `/studies/${studyId}/participants/?${query.toString()}`
    );

    participants.push(...response.items);
  }

  return participants;
}

async function getStudyDataSummaryRequest(
  studyId: number
): Promise<StudyDataSummaryResponse> {
  return apiRequest<StudyDataSummaryResponse>(
    `/studies/${studyId}/submissions/summary/data`
  );
}

async function listPendingSessionsForStudyRequest(
  studyId: number
): Promise<StudySubmissionSessionListItemResponse[]> {
  const firstQuery = new URLSearchParams();

  firstQuery.set("page", "1");
  firstQuery.set("page_size", String(API_PAGE_SIZE));
  firstQuery.set("status_summary", "submitted");

  const firstPage = await apiRequest<StudySubmissionSessionListResponse>(
    `/studies/${studyId}/submissions/sessions?${firstQuery.toString()}`
  );

  const sessions = [...firstPage.items];

  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const query = new URLSearchParams();

    query.set("page", String(page));
    query.set("page_size", String(API_PAGE_SIZE));
    query.set("status_summary", "submitted");

    const response = await apiRequest<StudySubmissionSessionListResponse>(
      `/studies/${studyId}/submissions/sessions?${query.toString()}`
    );

    sessions.push(...response.items);
  }

  return sessions;
}

async function listHighRiskAnalysisResultsForStudyRequest(
  studyId: number
): Promise<AnalysisResultResponse[]> {
  const firstQuery = new URLSearchParams();

  firstQuery.set("page", "1");
  firstQuery.set("page_size", String(API_PAGE_SIZE));
  firstQuery.set("sort_by", "created_at");
  firstQuery.set("sort_order", "desc");
  firstQuery.set("risk_label", "high_risk");

  const firstPage = await apiRequest<AnalysisResultListResponse>(
    `/studies/${studyId}/analysis/results?${firstQuery.toString()}`
  );

  const results = [...firstPage.items];

  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const query = new URLSearchParams();

    query.set("page", String(page));
    query.set("page_size", String(API_PAGE_SIZE));
    query.set("sort_by", "created_at");
    query.set("sort_order", "desc");
    query.set("risk_label", "high_risk");

    const response = await apiRequest<AnalysisResultListResponse>(
      `/studies/${studyId}/analysis/results?${query.toString()}`
    );

    results.push(...response.items);
  }

  return results;
}

async function loadMonitoringDataForStudy(
  study: StudyListItemResponse
): Promise<StudyMonitoringData> {
  const [dataSummaryResult, participantsResult, pendingSessionsResult, highRiskResult] =
    await Promise.allSettled([
      getStudyDataSummaryRequest(study.id),
      listAllParticipantsForStudyRequest(study.id),
      listPendingSessionsForStudyRequest(study.id),
      listHighRiskAnalysisResultsForStudyRequest(study.id),
    ]);

  return {
    study,
    dataSummary:
      dataSummaryResult.status === "fulfilled" ? dataSummaryResult.value : null,
    participants:
      participantsResult.status === "fulfilled" ? participantsResult.value : [],
    pendingSessions:
      pendingSessionsResult.status === "fulfilled" ? pendingSessionsResult.value : [],
    highRiskResults:
      highRiskResult.status === "fulfilled" ? highRiskResult.value : [],
  };
}

function buildMonitoringIssues(items: StudyMonitoringData[]): MonitoringIssue[] {
  const issues: MonitoringIssue[] = [];

  for (const item of items) {
    const { study, dataSummary, participants, pendingSessions, highRiskResults } = item;

    if (
      study.status === "active" &&
      study.participants_count > 0 &&
      (dataSummary?.total_submissions ?? 0) === 0
    ) {
      issues.push({
        key: `study-without-data-${study.id}`,
        type: "study_without_data",
        severity: "high",
        study,
        title: "Studiu activ fără date colectate",
        description: `${study.code} are participanți înscriși, dar nu are încă nicio trimitere de date.`,
        meta: `${formatNumber(study.participants_count)} participanți înscriși`,
        actionLabel: "Vezi datele",
        actionPath: `/cercetator/studii/${study.id}/date`,
      });
    }

    if (pendingSessions.length > 0) {
      issues.push({
        key: `pending-sessions-${study.id}`,
        type: "pending_data",
        severity: pendingSessions.length >= 5 ? "high" : "medium",
        study,
        title: "Date în așteptare pentru validare",
        description: `${study.code} are sesiuni trimise de participanți care trebuie revizuite.`,
        meta: `${formatNumber(pendingSessions.length)} sesiuni în așteptare`,
        actionLabel: "Validează datele",
        actionPath: `/cercetator/studii/${study.id}/date`,
      });
    }

    const validationRate = getValidationRate(dataSummary);

    if (
      dataSummary &&
      dataSummary.total_submissions > 0 &&
      validationRate < 60 &&
      dataSummary.submitted_count + dataSummary.partial_count > 0
    ) {
      issues.push({
        key: `low-validation-${study.id}`,
        type: "low_validation",
        severity: "medium",
        study,
        title: "Rată de validare scăzută",
        description: `${study.code} are multe date care nu au fost încă validate complet.`,
        meta: `${formatPercent(validationRate)} validate`,
        actionLabel: "Revizuiește trimiterile",
        actionPath: `/cercetator/studii/${study.id}/date`,
      });
    }

    const latestHighRiskByRun = new Map<string, AnalysisResultResponse>();

    for (const result of highRiskResults) {
      const key =
        result.analysis_run_id !== null
          ? `run-${result.analysis_run_id}`
          : `result-${result.id}`;

      const current = latestHighRiskByRun.get(key);

      if (
        !current ||
        result.risk_probability > current.risk_probability
      ) {
        latestHighRiskByRun.set(key, result);
      }
    }

    for (const result of Array.from(latestHighRiskByRun.values()).slice(0, 3)) {
      const participantLabel =
        result.participant?.participant_code ??
        result.participant?.full_name ??
        `Participant #${result.participant_id}`;

      issues.push({
        key: `high-risk-${study.id}-${result.analysis_run_id ?? result.id}`,
        type: "high_risk",
        severity: "high",
        study,
        title: "Rezultat predictiv cu risc ridicat",
        description: `${participantLabel} are risc ridicat pentru ${PARAMETER_LABELS[result.parameter_key]}.`,
        meta: `${formatProbability(result.risk_probability)} probabilitate estimată`,
        actionLabel: "Deschide analiza",
        actionPath: getRunNavigationPath(study.id, result.analysis_run_id),
      });
    }

    const inactiveParticipants = participants.filter((participant) => {
      if (participant.status !== "active" && participant.status !== "invited") {
        return false;
      }

      if (participant.submissions_count === 0) {
        return true;
      }

      const daysSinceLastSubmission = getDaysSince(participant.last_submission_at);

      return (
        daysSinceLastSubmission !== null &&
        daysSinceLastSubmission >= INACTIVE_DAYS_LIMIT
      );
    });

    for (const participant of inactiveParticipants.slice(0, 3)) {
      const daysSinceLastSubmission = getDaysSince(participant.last_submission_at);

      issues.push({
        key: `inactive-participant-${study.id}-${participant.id}`,
        type: "inactive_participant",
        severity: participant.submissions_count === 0 ? "medium" : "low",
        study,
        title: "Participant fără date recente",
        description:
          participant.submissions_count === 0
            ? `${participant.participant_code} · ${participant.full_name} nu a trimis încă date în studiu.`
            : `${participant.participant_code} · ${participant.full_name} nu a mai trimis date recent.`,
        meta:
          participant.submissions_count === 0
            ? "Nicio trimitere"
            : `Ultima trimitere acum ${formatNumber(daysSinceLastSubmission)} zile`,
        actionLabel: "Vezi participanții",
        actionPath: `/cercetator/studii/${study.id}/participanti`,
      });
    }
  }

  return issues.sort((a, b) => {
    const severityDiff = getSeverityOrder(a.severity) - getSeverityOrder(b.severity);

    if (severityDiff !== 0) {
      return severityDiff;
    }

    return a.study.code.localeCompare(b.study.code);
  });
}

export default function ResearcherActivity() {
  const navigate = useNavigate();

  const [monitoringData, setMonitoringData] = useState<StudyMonitoringData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    severity: "",
    type: "",
  });

  useEffect(() => {
    if (!pageError) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPageError("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pageError]);

  useEffect(() => {
    let cancelled = false;

    async function loadMonitoring() {
      setIsLoading(true);
      setPageError("");

      try {
        const studies = await listAllStudiesRequest();

        const loadedData = await Promise.all(
          studies.map((study) => loadMonitoringDataForStudy(study))
        );

        if (cancelled) {
          return;
        }

        setMonitoringData(loadedData);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setMonitoringData([]);
        setPageError(
          error instanceof Error
            ? error.message
            : "Datele de activitate nu au putut fi încărcate."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMonitoring();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const issues = useMemo(
    () => buildMonitoringIssues(monitoringData),
    [monitoringData]
  );

  const filteredIssues = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return issues.filter((issue) => {
      if (filters.severity && issue.severity !== filters.severity) {
        return false;
      }

      if (filters.type && issue.type !== filters.type) {
        return false;
      }

      if (searchTerm) {
        const haystack = [
          issue.title,
          issue.description,
          issue.meta,
          issue.study.code,
          issue.study.title,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [filters.search, filters.severity, filters.type, issues]);

  const stats = useMemo(() => {
    const activeStudies = monitoringData.filter(
      (item) => item.study.status === "active"
    ).length;

    const totalParticipants = monitoringData.reduce(
      (total, item) => total + item.study.participants_count,
      0
    );

    const pendingSessions = monitoringData.reduce(
      (total, item) => total + item.pendingSessions.length,
      0
    );

    const highRiskResults = monitoringData.reduce(
      (total, item) => total + item.highRiskResults.length,
      0
    );

    const studiesWithoutData = monitoringData.filter(
      (item) =>
        item.study.status === "active" &&
        item.study.participants_count > 0 &&
        (item.dataSummary?.total_submissions ?? 0) === 0
    ).length;

    return {
      activeStudies,
      totalParticipants,
      pendingSessions,
      highRiskResults,
      studiesWithoutData,
      totalIssues: issues.length,
    };
  }, [issues.length, monitoringData]);

  function handleResetFilters() {
    setFilters({
      search: "",
      severity: "",
      type: "",
    });
  }

  return (
    <ResearcherLayout
      activeItem="activitate"
      title="Activitate"
      subtitle="Urmărește rapid starea studiilor, datele colectate și elementele care necesită atenție."
      contentWidth="wide"
      actions={
        <button
          type="button"
          className="researcher-monitoring-refresh-btn"
          onClick={() => setRefreshToken((prev) => prev + 1)}
          disabled={isLoading}
        >
          <RefreshIcon />
          <span>{isLoading ? "Se actualizează..." : "Actualizează"}</span>
        </button>
      }
    >
      <div className="researcher-monitoring-page">
        {pageError ? (
          <div className="researcher-monitoring-banner researcher-monitoring-banner--error">
            {pageError}
          </div>
        ) : null}

        <section className="researcher-monitoring-summary">
          <article className="researcher-monitoring-summary-card is-blue">
            <span className="researcher-monitoring-summary-card__icon">
              <StudyIcon />
            </span>

            <div>
              <span>Studii active</span>
              <strong>{isLoading ? "..." : formatNumber(stats.activeStudies)}</strong>
              <small>monitorizate în prezent</small>
            </div>
          </article>

          <article className="researcher-monitoring-summary-card is-gray">
            <span className="researcher-monitoring-summary-card__icon">
              <UsersIcon />
            </span>

            <div>
              <span>Participanți</span>
              <strong>{isLoading ? "..." : formatNumber(stats.totalParticipants)}</strong>
              <small>în studiile tale</small>
            </div>
          </article>

          <article className="researcher-monitoring-summary-card is-orange">
            <span className="researcher-monitoring-summary-card__icon">
              <ClockIcon />
            </span>

            <div>
              <span>Date în așteptare</span>
              <strong>{isLoading ? "..." : formatNumber(stats.pendingSessions)}</strong>
              <small>sesiuni de validat</small>
            </div>
          </article>

          <article className="researcher-monitoring-summary-card is-red">
            <span className="researcher-monitoring-summary-card__icon">
              <AlertIcon />
            </span>

            <div>
              <span>Rezultate cu risc</span>
              <strong>{isLoading ? "..." : formatNumber(stats.highRiskResults)}</strong>
              <small>din analize predictive</small>
            </div>
          </article>

          <article className="researcher-monitoring-summary-card is-green">
            <span className="researcher-monitoring-summary-card__icon">
              <CheckIcon />
            </span>

            <div>
              <span>Alerte active</span>
              <strong>{isLoading ? "..." : formatNumber(stats.totalIssues)}</strong>
              <small>situații de urmărit</small>
            </div>
          </article>
        </section>

        <section className="researcher-monitoring-filters-card">
          <div className="researcher-monitoring-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Caută după studiu, cod, participant sau tip alertă..."
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  search: event.target.value,
                }))
              }
            />
          </div>

          <label>
            <span>Prioritate</span>
            <select
              value={filters.severity}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  severity: event.target.value,
                }))
              }
            >
              <option value="">Toate</option>
              <option value="high">Ridicată</option>
              <option value="medium">Medie</option>
              <option value="low">Scăzută</option>
            </select>
          </label>

          <label>
            <span>Tip situație</span>
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  type: event.target.value,
                }))
              }
            >
              <option value="">Toate</option>
              <option value="high_risk">Risc predictiv</option>
              <option value="pending_data">Date de validat</option>
              <option value="inactive_participant">Participant inactiv</option>
              <option value="study_without_data">Studiu fără date</option>
              <option value="low_validation">Validare scăzută</option>
            </select>
          </label>

          <button
            type="button"
            className="researcher-monitoring-secondary-btn"
            onClick={handleResetFilters}
          >
            <RefreshIcon />
            Resetează
          </button>
        </section>

        <section className="researcher-monitoring-grid">
          <article className="researcher-monitoring-card researcher-monitoring-card--main">
            <div className="researcher-monitoring-card__header">
              <div>
                <h3>Situații care necesită atenție</h3>
                <p>
                  Lista combină informațiile recente despre participanți, trimiteri
                  și rezultate predictive, ca să vezi rapid ce zone ale studiilor necesită atenție.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="researcher-monitoring-empty-state">
                Se încarcă monitorizarea...
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="researcher-monitoring-empty-state">
                Nu există situații pentru criteriile selectate.
              </div>
            ) : (
              <div className="researcher-monitoring-issue-list">
                {filteredIssues.map((issue) => (
                  <article
                    key={issue.key}
                    className={`researcher-monitoring-issue ${getIssueVisualClass(issue.type)}`}
                  >
                    <div className="researcher-monitoring-issue__icon">
                      {getIssueIcon(issue.type)}
                    </div>

                    <div className="researcher-monitoring-issue__content">
                      <div className="researcher-monitoring-issue__top">
                        <div>
                          <strong>{issue.title}</strong>
                          <span>
                            {issue.study.code} · {issue.study.title}
                          </span>
                        </div>

                        <em>{issue.meta}</em>
                      </div>

                      <p>{issue.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(issue.actionPath)}
                    >
                      {issue.actionLabel}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </article>

          <aside className="researcher-monitoring-side">
            <article className="researcher-monitoring-card researcher-monitoring-card--guide">
              <div className="researcher-monitoring-card__header">
                <div>
                  <h3>Ghid rapid</h3>
                  <p>Pași recomandați pentru interpretarea activității curente.</p>
                </div>
              </div>

              <div className="researcher-monitoring-guide-list">
                <article className="researcher-monitoring-guide-item is-red">
                  <span className="researcher-monitoring-guide-item__icon">
                    <AlertIcon />
                  </span>

                  <div>
                    <strong>Verifică mai întâi alertele ridicate</strong>
                    <p>
                      Rezultatele predictive cu risc ridicat și studiile active fără date
                      ar trebui analizate înaintea celorlalte situații.
                    </p>
                  </div>
                </article>

                <article className="researcher-monitoring-guide-item is-orange">
                  <span className="researcher-monitoring-guide-item__icon">
                    <ClockIcon />
                  </span>

                  <div>
                    <strong>Revizuiește datele în așteptare</strong>
                    <p>
                      Datele nevalidate pot influența calitatea analizelor, așa că este bine
                      să fie verificate înainte de o nouă rulare predictivă.
                    </p>
                  </div>
                </article>

                <article className="researcher-monitoring-guide-item is-blue">
                  <span className="researcher-monitoring-guide-item__icon">
                    <UsersIcon />
                  </span>

                  <div>
                    <strong>Urmărește participanții inactivi</strong>
                    <p>
                      Participanții fără trimiteri recente pot reduce consistența datelor,
                      mai ales în studiile care depind de colectare periodică.
                    </p>
                  </div>
                </article>
              </div>
            </article>
                        <article className="researcher-monitoring-card">
              <div className="researcher-monitoring-card__header">
                <div>
                  <h3>Studii urmărite</h3>
                  <p>Rezumat rapid al studiilor incluse în această pagină.</p>
                </div>
              </div>

              {isLoading ? (
                <div className="researcher-monitoring-compact-state">
                  Se încarcă studiile...
                </div>
              ) : monitoringData.length === 0 ? (
                <div className="researcher-monitoring-compact-state">
                  Nu există studii disponibile.
                </div>
              ) : (
                <div className="researcher-monitoring-study-list">
                  {monitoringData.slice(0, 8).map((item) => {
                    const validationRate = getValidationRate(item.dataSummary);

                    return (
                      <button
                        key={item.study.id}
                        type="button"
                        onClick={() =>
                          navigate(`/cercetator/studii/${item.study.id}/rezumat`)
                        }
                      >
                        <span>
                          <strong>{item.study.code}</strong>
                          <small>{STATUS_LABELS[item.study.status]}</small>
                        </span>

                        <em>
                          {formatNumber(item.study.participants_count)} participanți
                        </em>

                        <small>
                          {formatPercent(validationRate)} date validate
                        </small>
                      </button>
                    );
                  })}
                </div>
              )}
            </article>

          </aside>
        </section>
      </div>
    </ResearcherLayout>
  );
}