import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ResearcherLayout from "../components/layout/ResearcherLayout";
import { authFetch, SESSION_EXPIRED_ERROR } from "../auth/authFetch";
import "../styles/researcher-dashboard.css";
import "../styles/researcher-analysis.css";

const PAGE_SIZE = 10;
const API_PAGE_SIZE = 100;

type StudyParameterKey = "heartRate" | "respiratoryRate" | "spo2" | "temperature";
type AnalysisRiskLabel = "high_risk" | "low_risk";
type AnalysisScope = "last_24h" | "last_48h" | "last_7_days" | "custom";

type StudyStatus = "draft" | "active" | "in_analysis" | "completed";

type AnalysisModelType =
  | "logistic_regression"
  | "decision_tree"
  | "random_forest"
  | "knn"
  | "xgboost"
  | "rnn"
  | "lstm"
  | "lstm_rf"
  | "lstm_xgb";

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
  filter_age_min: number | null;
  filter_age_max: number | null;
  filter_sex: string | null;
  filter_participant_group: string | null;
  filter_activity_level: string | null;
  filter_condition_type: string | null;
  filter_measurement_context: string | null;
  created_at: string;
};

type AnalysisResultListResponse = {
  items: AnalysisResultResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type AnalysisRunGroup = {
  key: string;
  study: StudyListItemResponse;
  analysis_run_id: number | null;
  analysis_scope: string;
  analysis_start_date: string | null;
  analysis_end_date: string | null;
  created_at: string;
  results: AnalysisResultResponse[];
  participants_count: number;
  high_risk_count: number;
  low_risk_count: number;
  records_used: number;
  highest_risk_result: AnalysisResultResponse;
};

type StudyRiskChartItem = {
  study_label: string;
  study_title: string;
  high_risk_count: number;
  total_results: number;
};

type ParameterRiskChartItem = {
  parameter_key: StudyParameterKey;
  label: string;
  full_label: string;
  average_risk_probability: number;
  percentage_value: number;
  results_count: number;
};

const PARAMETER_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "SpO₂",
  temperature: "Temperatură",
};

const PARAMETER_SHORT_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm",
  respiratoryRate: "Resp.",
  spo2: "SpO₂",
  temperature: "Temp.",
};

const PARAMETER_COLORS: Record<StudyParameterKey, string> = {
  heartRate: "#cf6b64",
  respiratoryRate: "#6f9fc7",
  spo2: "#5fae9b",
  temperature: "#ef9647",
};

const SCOPE_LABELS: Record<AnalysisScope, string> = {
  last_24h: "Ultimele 24h",
  last_48h: "Ultimele 48h",
  last_7_days: "Ultimele 7 zile",
  custom: "Interval personalizat",
};

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18.5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.2 15.5V10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15.5V6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.8 15.5V8.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function RecordsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.2 9H15.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.2 12.4H15.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.2 15.8H12.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18.7 9.2C17.8 6.7 15.4 5 12.6 5C9 5 6.1 7.9 6.1 11.5C6.1 15.1 9 18 12.6 18C15.1 18 17.3 16.6 18.4 14.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.9 5.8V9.5H15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function formatDate(value?: string | null): string {
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
  }).format(parsed);
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

function getScopeLabel(scope: string): string {
  if (scope in SCOPE_LABELS) {
    return SCOPE_LABELS[scope as AnalysisScope];
  }

  return scope;
}

function getAnalysisIntervalLabel(run: AnalysisRunGroup): string {
  if (run.analysis_start_date && run.analysis_end_date) {
    return `${formatDate(run.analysis_start_date)} - ${formatDate(run.analysis_end_date)}`;
  }

  return getScopeLabel(run.analysis_scope);
}

function getRunKey(result: AnalysisResultResponse): string {
  if (result.analysis_run_id !== null) {
    return `run-${result.analysis_run_id}`;
  }

  return [
    result.study_id,
    result.analysis_scope,
    result.analysis_start_date ?? "no-start",
    result.analysis_end_date ?? "no-end",
    result.created_at.slice(0, 19),
  ].join("|");
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const pages = new Set<number>();

  pages.add(1);
  pages.add(totalPages);
  pages.add(currentPage - 1);
  pages.add(currentPage);
  pages.add(currentPage + 1);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
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

async function listAllAnalysisResultsForStudyRequest(
  studyId: number
): Promise<AnalysisResultResponse[]> {
  const firstQuery = new URLSearchParams();

  firstQuery.set("page", "1");
  firstQuery.set("page_size", String(API_PAGE_SIZE));
  firstQuery.set("sort_by", "created_at");
  firstQuery.set("sort_order", "desc");

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

    const response = await apiRequest<AnalysisResultListResponse>(
      `/studies/${studyId}/analysis/results?${query.toString()}`
    );

    results.push(...response.items);
  }

  return results;
}

function getEstimatedRecordsUsedForRun(results: AnalysisResultResponse[]): number {
  const recordsByParticipant = new Map<number, number>();

  for (const result of results) {
    const current = recordsByParticipant.get(result.participant_id) ?? 0;

    recordsByParticipant.set(
      result.participant_id,
      Math.max(current, result.records_used)
    );
  }

  return Array.from(recordsByParticipant.values()).reduce(
    (total, recordsUsed) => total + recordsUsed,
    0
  );
}

function buildAnalysisRunsForStudy(
  study: StudyListItemResponse,
  results: AnalysisResultResponse[]
): AnalysisRunGroup[] {
  const grouped = new Map<string, AnalysisResultResponse[]>();

  for (const result of results) {
    const key = getRunKey(result);
    const current = grouped.get(key) ?? [];

    current.push(result);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries()).map(([key, runResults]) => {
    const sortedResults = [...runResults].sort(
      (a, b) => b.risk_probability - a.risk_probability
    );

    const highestRiskResult = sortedResults[0];
    const participantIds = new Set(runResults.map((item) => item.participant_id));

    return {
      key: `${study.id}-${key}`,
      study,
      analysis_run_id: highestRiskResult.analysis_run_id,
      analysis_scope: highestRiskResult.analysis_scope,
      analysis_start_date: highestRiskResult.analysis_start_date,
      analysis_end_date: highestRiskResult.analysis_end_date,
      created_at: highestRiskResult.created_at,
      results: sortedResults,
      participants_count: participantIds.size,
      high_risk_count: runResults.filter((item) => item.risk_label === "high_risk").length,
      low_risk_count: runResults.filter((item) => item.risk_label === "low_risk").length,
      records_used: getEstimatedRecordsUsedForRun(runResults),
      highest_risk_result: highestRiskResult,
    };
  });
}

function StudyRiskTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: StudyRiskChartItem }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="researcher-analysis-tooltip">
      <strong>{item.study_title}</strong>
      <span>{formatNumber(item.high_risk_count)} rezultate cu risc ridicat</span>
      <small>{formatNumber(item.total_results)} rezultate totale</small>
    </div>
  );
}

function ParameterRiskTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ParameterRiskChartItem }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="researcher-analysis-tooltip">
      <strong>{item.full_label}</strong>
      <span>{formatProbability(item.average_risk_probability)} risc mediu</span>
      <small>{formatNumber(item.results_count)} rezultate</small>
    </div>
  );
}

export default function ResearcherAnalysis() {
  const navigate = useNavigate();

  const [studies, setStudies] = useState<StudyListItemResponse[]>([]);
  const [analysisRuns, setAnalysisRuns] = useState<AnalysisRunGroup[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    studyId: "",
    riskStatus: "",
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

    async function loadGlobalAnalysis() {
      setIsLoading(true);
      setPageError("");

      try {
        const loadedStudies = await listAllStudiesRequest();

        const resultsByStudy = await Promise.all(
          loadedStudies.map(async (study) => {
            try {
              const results = await listAllAnalysisResultsForStudyRequest(study.id);

              return buildAnalysisRunsForStudy(study, results);
            } catch {
              return [];
            }
          })
        );

        if (cancelled) {
          return;
        }

        setStudies(loadedStudies);
        setAnalysisRuns(
          resultsByStudy
            .flat()
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setStudies([]);
        setAnalysisRuns([]);
        setPageError(
          error instanceof Error
            ? error.message
            : "Analizele nu au putut fi încărcate."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadGlobalAnalysis();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const filteredRuns = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return analysisRuns.filter((run) => {
      if (filters.studyId && run.study.id !== Number(filters.studyId)) {
        return false;
      }

      if (filters.riskStatus === "high" && run.high_risk_count === 0) {
        return false;
      }

      if (filters.riskStatus === "stable" && run.high_risk_count > 0) {
        return false;
      }

      if (searchTerm) {
        const haystack = [
          run.study.title,
          run.study.code,
          run.highest_risk_result.participant?.full_name ?? "",
          run.highest_risk_result.participant?.participant_code ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [analysisRuns, filters.search, filters.studyId, filters.riskStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / PAGE_SIZE));

  const paginatedRuns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredRuns.slice(start, start + PAGE_SIZE);
  }, [filteredRuns, page]);

  const stats = useMemo(() => {
    const highRiskRuns = filteredRuns.filter((run) => run.high_risk_count > 0).length;
    const stableRuns = filteredRuns.length - highRiskRuns;
    const studyIds = new Set(filteredRuns.map((run) => run.study.id));
    const participantKeys = new Set(
      filteredRuns.flatMap((run) =>
        run.results.map((result) => `${result.study_id}-${result.participant_id}`)
      )
    );
    const recordsUsed = filteredRuns.reduce(
      (total, run) => total + run.records_used,
      0
    );

    return {
      totalRuns: filteredRuns.length,
      highRiskRuns,
      stableRuns,
      studiesWithAnalysis: studyIds.size,
      participantsAnalyzed: participantKeys.size,
      recordsUsed,
    };
  }, [filteredRuns]);

  const highRiskRate = stats.totalRuns
    ? (stats.highRiskRuns / stats.totalRuns) * 100
    : 0;

  const studyRiskChartData = useMemo(() => {
    const map = new Map<number, StudyRiskChartItem>();

    for (const run of filteredRuns) {
      const current =
        map.get(run.study.id) ??
        {
          study_label: run.study.code,
          study_title: run.study.title,
          high_risk_count: 0,
          total_results: 0,
        };

      current.high_risk_count += run.high_risk_count;
      current.total_results += run.results.length;

      map.set(run.study.id, current);
    }

    return Array.from(map.values())
      .sort((a, b) => b.high_risk_count - a.high_risk_count)
      .slice(0, 6);
  }, [filteredRuns]);

  const parameterRiskChartData = useMemo(() => {
    const map = new Map<
      StudyParameterKey,
      {
        parameter_key: StudyParameterKey;
        total_probability: number;
        count: number;
      }
    >();

    for (const run of filteredRuns) {
      for (const result of run.results) {
        const current =
          map.get(result.parameter_key) ??
          {
            parameter_key: result.parameter_key,
            total_probability: 0,
            count: 0,
          };

        current.total_probability += result.risk_probability;
        current.count += 1;

        map.set(result.parameter_key, current);
      }
    }

    return Array.from(map.values()).map((item) => {
      const averageRisk =
        item.count > 0 ? item.total_probability / item.count : 0;

      return {
        parameter_key: item.parameter_key,
        label: PARAMETER_SHORT_LABELS[item.parameter_key],
        full_label: PARAMETER_LABELS[item.parameter_key],
        average_risk_probability: averageRisk,
        percentage_value: averageRisk * 100,
        results_count: item.count,
      };
    });
  }, [filteredRuns]);

  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages]
  );

  const rowStart = filteredRuns.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rowEnd = Math.min(page * PAGE_SIZE, filteredRuns.length);

  function handleResetFilters() {
    setFilters({
      search: "",
      studyId: "",
      riskStatus: "",
    });
    setPage(1);
  }

  return (
    <ResearcherLayout
      activeItem="analize"
      title="Analize predictive"
      subtitle="Monitorizează rulările de analiză generate în toate studiile tale."
      contentWidth="wide"
      actions={
        <button
          type="button"
          className="researcher-analysis-refresh-btn"
          onClick={() => setRefreshToken((prev) => prev + 1)}
          disabled={isLoading}
        >
          <RefreshIcon />
          <span>{isLoading ? "Se actualizează..." : "Actualizează"}</span>
        </button>
      }
    >
      <div className="researcher-analysis-page">
        {pageError ? (
          <div className="researcher-analysis-banner researcher-analysis-banner--error">
            {pageError}
          </div>
        ) : null}

        <section className="researcher-analysis-summary">
          <article className="researcher-analysis-summary-card is-blue">
            <span className="researcher-analysis-summary-card__icon">
              <ChartIcon />
            </span>
            <div>
              <span>Analize rulate</span>
              <strong>{isLoading ? "..." : formatNumber(stats.totalRuns)}</strong>
              <small>în toate studiile</small>
            </div>
          </article>

          <article className="researcher-analysis-summary-card is-green">
            <span className="researcher-analysis-summary-card__icon">
              <StudyIcon />
            </span>
            <div>
              <span>Studii cu analize</span>
              <strong>{isLoading ? "..." : formatNumber(stats.studiesWithAnalysis)}</strong>
              <small>din {formatNumber(studies.length)} studii</small>
            </div>
          </article>

          <article className="researcher-analysis-summary-card is-red">
            <span className="researcher-analysis-summary-card__icon">
              <AlertIcon />
            </span>
            <div>
              <span>Analize cu risc</span>
              <strong>{isLoading ? "..." : formatNumber(stats.highRiskRuns)}</strong>
              <small>necesită atenție</small>
            </div>
          </article>

          <article className="researcher-analysis-summary-card is-gray">
            <span className="researcher-analysis-summary-card__icon">
              <UsersIcon />
            </span>
            <div>
              <span>Participanți</span>
              <strong>{isLoading ? "..." : formatNumber(stats.participantsAnalyzed)}</strong>
              <small>participanți unici</small>
            </div>
          </article>

          <article className="researcher-analysis-summary-card is-orange">
            <span className="researcher-analysis-summary-card__icon">
              <RecordsIcon />
            </span>
            <div>
              <span>Înregistrări</span>
              <strong>{isLoading ? "..." : formatNumber(stats.recordsUsed)}</strong>
              <small>total analizate</small>
            </div>
          </article>
        </section>

        <section className="researcher-analysis-filters-card">
          <div className="researcher-analysis-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Caută după studiu, cod, participant..."
              value={filters.search}
              onChange={(event) => {
                setFilters((prev) => ({
                  ...prev,
                  search: event.target.value,
                }));
                setPage(1);
              }}
            />
          </div>

          <label>
            <span>Studiu</span>
            <select
              value={filters.studyId}
              onChange={(event) => {
                setFilters((prev) => ({
                  ...prev,
                  studyId: event.target.value,
                }));
                setPage(1);
              }}
            >
              <option value="">Toate studiile</option>
              {studies.map((study) => (
                <option key={study.id} value={study.id}>
                  {study.code} · {study.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status analiză</span>
            <select
              value={filters.riskStatus}
              onChange={(event) => {
                setFilters((prev) => ({
                  ...prev,
                  riskStatus: event.target.value,
                }));
                setPage(1);
              }}
            >
              <option value="">Toate</option>
              <option value="high">Cu risc ridicat</option>
              <option value="stable">Stabile</option>
            </select>
          </label>

          <button
            type="button"
            className="researcher-analysis-secondary-btn"
            onClick={handleResetFilters}
          >
            <RefreshIcon />
            Resetează
          </button>
        </section>

        <section className="researcher-analysis-charts-grid">
          <article className="researcher-analysis-card">
            <div className="researcher-analysis-card__header">
              <div>
                <h3>Studii cu rezultate de risc</h3>
                <p>
                  Evidențiază studiile în care au apărut cele mai multe rezultate
                  marcate cu risc ridicat.
                </p>
              </div>
            </div>

            <div className="researcher-analysis-chart-wrap">
              {isLoading ? (
                <div className="researcher-analysis-chart-state">
                  Se încarcă graficul...
                </div>
              ) : studyRiskChartData.length === 0 ? (
                <div className="researcher-analysis-chart-state">
                  Nu există suficiente rezultate pentru acest grafic.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={studyRiskChartData}
                    margin={{ top: 10, right: 20, left: -10, bottom: -13 }}
                  >
                    <CartesianGrid stroke="#e7eee8" vertical={false} />
                    <XAxis
                      dataKey="study_label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#6f7f83", fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#6f7f83", fontWeight: 700 }}
                      width={36}
                    />
                    <Tooltip content={<StudyRiskTooltip />} />
                    <Bar
                      dataKey="high_risk_count"
                      fill="#cf6b64"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={58}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="researcher-analysis-card">
            <div className="researcher-analysis-card__header">
              <div>
                <h3>Risc mediu pe parametri</h3>
                <p>
                  Compară probabilitatea medie de risc pentru fiecare semn vital.
                </p>
              </div>
            </div>

            <div className="researcher-analysis-chart-wrap">
              {isLoading ? (
                <div className="researcher-analysis-chart-state">
                  Se încarcă graficul...
                </div>
              ) : parameterRiskChartData.length === 0 ? (
                <div className="researcher-analysis-chart-state">
                  Nu există suficiente rezultate pentru acest grafic.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={parameterRiskChartData}
                    margin={{ top: 10, right: 20, left: -10, bottom: -13 }}
                  >
                    <CartesianGrid stroke="#e7eee8" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#6f7f83", fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#6f7f83", fontWeight: 700 }}
                      width={42}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<ParameterRiskTooltip />} />
                    <Bar
                      dataKey="percentage_value"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={58}
                    >
                      {parameterRiskChartData.map((item) => (
                        <Cell
                          key={item.parameter_key}
                          fill={PARAMETER_COLORS[item.parameter_key]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>
        </section>

        <section className="researcher-analysis-card">
          <div className="researcher-analysis-card__header researcher-analysis-card__header--table">
            <div>
              <h3>Istoric analize globale</h3>
              <p>
                Lista centralizată a analizelor rulate în toate studiile. Pentru
                detalii complete, deschide studiul asociat.
              </p>
            </div>
          </div>

          <div className="researcher-analysis-table-wrap">
            {isLoading ? (
              <div className="researcher-analysis-empty-state">
                Se încarcă analizele...
              </div>
            ) : paginatedRuns.length === 0 ? (
              <div className="researcher-analysis-empty-state">
                Nu există analize pentru criteriile selectate.
              </div>
            ) : (
              <table className="researcher-analysis-table">
                <thead>
                  <tr>
                    <th className="researcher-analysis-col-date">Data rulării</th>
                    <th className="researcher-analysis-col-study">Studiu</th>
                    <th className="researcher-analysis-col-interval">Interval</th>
                    <th className="researcher-analysis-col-participants">Participanți</th>
                    <th className="researcher-analysis-col-risk">Risc maxim</th>
                    <th className="researcher-analysis-col-status">Status</th>
                    <th className="researcher-analysis-col-records">Înregistrări</th>
                  </tr>
                </thead>

                <tbody>
                {paginatedRuns.map((run) => (
                    <tr
                    key={run.key}
                    className="researcher-analysis-table-row"
                    tabIndex={0}
                    onClick={() => {
                    const analysisParam =
                        run.analysis_run_id !== null ? `?analysisRunId=${run.analysis_run_id}` : "";

                    navigate(`/cercetator/studii/${run.study.id}/analize${analysisParam}`);
                    }}
                    onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();

                        const analysisParam =
                        run.analysis_run_id !== null ? `?analysisRunId=${run.analysis_run_id}` : "";

                        navigate(`/cercetator/studii/${run.study.id}/analize${analysisParam}`);
                    }
                    }}
                    >
                    <td className="researcher-analysis-col-date">
                      {formatDateTime(run.created_at)}
                    </td>

                    <td className="researcher-analysis-col-study">
                      <strong>{run.study.code}</strong>
                      <small>{run.study.title}</small>
                    </td>

                    <td className="researcher-analysis-col-interval">
                      {getAnalysisIntervalLabel(run)}
                    </td>

                    <td className="researcher-analysis-col-participants">
                      {formatNumber(run.participants_count)}
                    </td>

                    <td className="researcher-analysis-table__probability researcher-analysis-col-risk">
                      {formatProbability(run.highest_risk_result.risk_probability)}
                    </td>

                    <td className="researcher-analysis-col-status">
                      <span
                        className={`researcher-analysis-status ${
                          run.high_risk_count > 0 ? "is-high" : "is-low"
                        }`}
                      >
                        {run.high_risk_count > 0 ? "Necesită atenție" : "Stabilă"}
                      </span>
                    </td>

                    <td className="researcher-analysis-col-records">
                      {formatNumber(run.records_used)}
                    </td>
                    </tr>
                ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="researcher-analysis-footer">
            <span>
              Afișare {rowStart} - {rowEnd} din {filteredRuns.length} analize
            </span>

            <div className="researcher-analysis-pagination">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
              >
                ‹
              </button>

              {visiblePages.map((pageNumber, index) => {
                const previousPage = visiblePages[index - 1];
                const shouldShowDots =
                  previousPage !== undefined && pageNumber - previousPage > 1;

                return (
                  <span key={pageNumber}>
                    {shouldShowDots ? <small>…</small> : null}

                    <button
                      type="button"
                      className={page === pageNumber ? "is-active" : ""}
                      onClick={() => setPage(pageNumber)}
                      disabled={isLoading}
                    >
                      {pageNumber}
                    </button>
                  </span>
                );
              })}

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || isLoading}
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </div>
    </ResearcherLayout>
  );
}