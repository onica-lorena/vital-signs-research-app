import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { authFetch, SESSION_EXPIRED_ERROR } from "../../../../auth/authFetch";
import "../../../../styles/study-collected-data.css";

const PAGE_SIZE = 10;

type ParticipantDataEntryMethod = "manual" | "csv";
type ParticipantSubmissionStatus = "submitted" | "validated" | "rejected";
type TimelineGroupBy = "day" | "week" | "five_days" | "month";
type TimelinePreset = "last_7_days" | "last_30_days" | "last_12_months" | "custom";

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

type StudyDataTimelinePointResponse = {
  label: string;
  sessions_count: number;
  records_count: number;
  values_count: number;
};

type StudySessionStatus = "submitted" | "validated" | "rejected" | "partial";

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

type ParticipantSubmissionValueResponse = {
  id: number;
  parameter_key: "heartRate" | "respiratoryRate" | "spo2" | "temperature";
  value: number;
  measured_at: string;
};

type StudySubmissionSessionRecordResponse = {
  submission_id: number;
  status: ParticipantSubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  values: ParticipantSubmissionValueResponse[];
};

type StudySubmissionSessionDetailResponse = {
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
  participant_notes: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  measurement_context: string | null;
  records: StudySubmissionSessionRecordResponse[];
};

type CollectedDataFocusRequest = {
  participantId: number;
  participantCode: string;
  startDate: string | null;
  endDate: string | null;
};

type StudyCollectedDataTabProps = {
  studyId: number;
  focusRequest?: CollectedDataFocusRequest | null;
  onFocusRequestConsumed?: () => void;
};

const STATUS_LABELS: Record<StudySessionStatus, string> = {
  submitted: "În așteptare",
  validated: "Validat",
  rejected: "Respins",
  partial: "Parțial",
};

const METHOD_LABELS: Record<ParticipantDataEntryMethod, string> = {
  manual: "Manual",
  csv: "CSV",
};

const PARAMETER_LABELS: Record<
  ParticipantSubmissionValueResponse["parameter_key"],
  string
> = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "Saturația de oxigen",
  temperature: "Temperatură corporală",
};

const PARAMETER_UNITS: Record<
  ParticipantSubmissionValueResponse["parameter_key"],
  string
> = {
  heartRate: "bătăi/min",
  respiratoryRate: "respirații/min",
  spo2: "%",
  temperature: "°C",
};

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="6.5" rx="6.5" ry="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 6.5V17.5C5.5 19.2 8.4 20.5 12 20.5C15.6 20.5 18.5 19.2 18.5 17.5V6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 12C5.5 13.7 8.4 15 12 15C15.6 15 18.5 13.7 18.5 12" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ValuesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="5" width="15" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.8 13H10.2L11.8 9.8L13.7 15L15.4 12H17.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.4 12.3L10.8 14.7L15.9 9.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.8V12.3L15.1 14.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.8 8.8L15.2 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.2 8.8L8.8 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 7L7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 5.5H18V18.5H6V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 9H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 13H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type SummaryIconTone = "blue" | "green" | "orange" | "gray" | "red";

function SummaryIconChart({
  value,
  tone,
  icon,
}: {
  value: number;
  tone: SummaryIconTone;
  icon: React.ReactNode;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  const chartColors: Record<SummaryIconTone, string> = {
    blue: "#6f9fc7",
    green: "#76b65c",
    orange: "#ef9647",
    gray: "#9aa4a7",
    red: "#cf6b64",
  };

  const chartData = [
    {
      name: "indicator",
      value: safeValue,
      fill: chartColors[tone],
    },
  ];

  return (
    <div className={`study-collected-summary-icon-chart is-${tone}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={chartData}
          innerRadius="76%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar dataKey="value" cornerRadius={999} background />
        </RadialBarChart>
      </ResponsiveContainer>

      <span className="study-collected-summary-icon-chart__icon">
        {icon}
      </span>
    </div>
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

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function toStartOfDayIso(dateValue: string): string {
  if (!dateValue) {
    return "";
  }

  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toEndOfDayIso(dateValue: string): string {
  if (!dateValue) {
    return "";
  }

  return new Date(`${dateValue}T23:59:59`).toISOString();
}

function getTimestamp(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function doIntervalsOverlap(params: {
  sessionStart: string | null;
  sessionEnd: string | null;
  focusStart: string | null;
  focusEnd: string | null;
}): boolean {
  const sessionStart = getTimestamp(params.sessionStart);
  const sessionEnd = getTimestamp(params.sessionEnd);
  const focusStart = getTimestamp(params.focusStart);
  const focusEnd = getTimestamp(params.focusEnd);

  if (sessionStart === null || sessionEnd === null) {
    return false;
  }

  if (focusStart === null || focusEnd === null) {
    return true;
  }

  return sessionStart <= focusEnd && sessionEnd >= focusStart;
}

function getRecordValue(
  record: StudySubmissionSessionRecordResponse,
  parameterKey: ParticipantSubmissionValueResponse["parameter_key"]
): ParticipantSubmissionValueResponse | undefined {
  return record.values.find((value) => value.parameter_key === parameterKey);
}

function formatParameterValue(
  value: ParticipantSubmissionValueResponse | undefined
): string {
  if (!value) {
    return "—";
  }

  return `${new Intl.NumberFormat("ro-RO", {
    maximumFractionDigits: 1,
  }).format(value.value)} ${PARAMETER_UNITS[value.parameter_key]}`;
}

function getRecordMeasuredAt(record: StudySubmissionSessionRecordResponse): string {
  const firstValue = record.values[0];

  if (!firstValue) {
    return record.submitted_at;
  }

  return firstValue.measured_at;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return toDateInputValue(date);
}

function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);

  return toDateInputValue(date);
}

function getCustomGroupBy(startDate: string, endDate: string): TimelineGroupBy {
  if (!startDate || !endDate) {
    return "day";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays <= 14) {
    return "day";
  }

  if (diffInDays <= 60) {
    return "week";
  }

  if (diffInDays <= 120) {
    return "five_days";
  }

  return "month";
}

function formatTimelineLabel(label: string, groupBy: TimelineGroupBy): string {
  if (groupBy === "month") {
    const [year, month] = label.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);

    return new Intl.DateTimeFormat("ro-RO", {
      month: "short",
      year: "numeric",
    }).format(date);
  }

  if (groupBy === "week" || groupBy === "five_days") {
    const [start, end] = label.split("|");

    if (!start || !end) {
      return label;
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  return formatDate(label);
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "P"
  );
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

function getStatusClassName(status: StudySessionStatus): string {
  if (status === "validated") {
    return "is-validated";
  }

  if (status === "rejected") {
    return "is-rejected";
  }

  if (status === "partial") {
    return "is-partial";
  }

  return "is-submitted";
}

function getMethodClassName(method: ParticipantDataEntryMethod): string {
  return method === "manual" ? "is-manual" : "is-csv";
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

async function getStudyDataSummaryRequest(
  studyId: number
): Promise<StudyDataSummaryResponse> {
  return apiRequest<StudyDataSummaryResponse>(
    `/studies/${studyId}/submissions/summary/data`
  );
}

async function getStudyDataTimelineRequest(params: {
  studyId: number;
  groupBy: TimelineGroupBy;
  startDate: string;
  endDate: string;
}): Promise<StudyDataTimelinePointResponse[]> {
  const query = new URLSearchParams();
  query.set("group_by", params.groupBy);

  if (params.startDate) {
    query.set("start_date", params.startDate);
  }

  if (params.endDate) {
    query.set("end_date", params.endDate);
  }

  return apiRequest<StudyDataTimelinePointResponse[]>(
    `/studies/${params.studyId}/submissions/timeline/data?${query.toString()}`
  );
}

async function listStudySubmissionSessionsRequest(params: {
  studyId: number;
  page: number;
  pageSize: number;
  search: string;
  status: StudySessionStatus | "";
  entryMethod: ParticipantDataEntryMethod | "";
  startDate: string;
  endDate: string;
}): Promise<StudySubmissionSessionListResponse> {
  const query = new URLSearchParams();

  query.set("page", String(params.page));
  query.set("page_size", String(params.pageSize));

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.status) {
    query.set("status_summary", params.status);
  }

  if (params.entryMethod) {
    query.set("entry_method", params.entryMethod);
  }

  if (params.startDate) {
    query.set("start_date", toStartOfDayIso(params.startDate));
  }

  if (params.endDate) {
    query.set("end_date", toEndOfDayIso(params.endDate));
  }

  return apiRequest<StudySubmissionSessionListResponse>(
    `/studies/${params.studyId}/submissions/sessions?${query.toString()}`
  );
}

async function getStudySubmissionSessionDetailRequest(
  studyId: number,
  sessionId: number
): Promise<StudySubmissionSessionDetailResponse> {
  return apiRequest<StudySubmissionSessionDetailResponse>(
    `/studies/${studyId}/submissions/sessions/${sessionId}`
  );
}

async function updateStudySubmissionSessionStatusRequest(params: {
  studyId: number;
  sessionId: number;
  status: ParticipantSubmissionStatus;
  reviewNotes?: string | null;
}): Promise<StudySubmissionSessionDetailResponse> {
  return apiRequest<StudySubmissionSessionDetailResponse>(
    `/studies/${params.studyId}/submissions/sessions/${params.sessionId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: params.status,
        review_notes: params.reviewNotes ?? null,
      }),
    }
  );
}

function CustomChartTooltip({
  active,
  payload,
  label,
  groupBy,
}: {
  active?: boolean;
  payload?: Array<{
    payload: StudyDataTimelinePointResponse & { formatted_label: string };
  }>;
  label?: string;
  groupBy: TimelineGroupBy;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="study-collected-chart-tooltip">
      <strong>{label ? formatTimelineLabel(label, groupBy) : item.formatted_label}</strong>
      <span>{formatNumber(item.values_count)} valori colectate</span>
      <small>
        {formatNumber(item.sessions_count)} trimiteri · {formatNumber(item.records_count)} înregistrări
      </small>
    </div>
  );
}

export default function StudyCollectedDataTab({
  studyId,
  focusRequest,
  onFocusRequestConsumed,
}: StudyCollectedDataTabProps) {
  const [summary, setSummary] = useState<StudyDataSummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<StudyDataTimelinePointResponse[]>([]);
  const [sessions, setSessions] = useState<StudySubmissionSessionListItemResponse[]>([]);

  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [timelinePreset, setTimelinePreset] =
    useState<TimelinePreset>("last_7_days");
  const [groupBy, setGroupBy] = useState<TimelineGroupBy>("day");
  const [page, setPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudySessionStatus | "">("");
  const [methodFilter, setMethodFilter] = useState<ParticipantDataEntryMethod | "">("");

  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedSession, setSelectedSession] =
    useState<StudySubmissionSessionDetailResponse | null>(null);
  const [selectedLoadingId, setSelectedLoadingId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [timelineStartDate, setTimelineStartDate] = useState("");
  const [timelineEndDate, setTimelineEndDate] = useState("");
  
  const [tableStartDateFilter, setTableStartDateFilter] = useState("");
  const [tableEndDateFilter, setTableEndDateFilter] = useState("");
  const [pendingFocusRequest, setPendingFocusRequest] =
    useState<CollectedDataFocusRequest | null>(null);

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    setSearchInput(focusRequest.participantCode);
    setDebouncedSearch(focusRequest.participantCode);

    setTableStartDateFilter("");
    setTableEndDateFilter("");

    setStatusFilter("");
    setMethodFilter("");
    setPage(1);
    setSelectedSession(null);
    setPendingFocusRequest(focusRequest);

    onFocusRequestConsumed?.();
  }, [focusRequest, onFocusRequestConsumed]);

  useEffect(() => {
    if (timelinePreset === "custom") {
      return;
    }
  
    const today = toDateInputValue(new Date());
  
    if (timelinePreset === "last_7_days") {
      setGroupBy("day");
      setTimelineStartDate(getDateDaysAgo(6));
      setTimelineEndDate(today);
      return;
    }
  
    if (timelinePreset === "last_30_days") {
      setGroupBy("week");
      setTimelineStartDate(getDateDaysAgo(29));
      setTimelineEndDate(today);
      return;
    }
  
    if (timelinePreset === "last_12_months") {
      setGroupBy("month");
      setTimelineStartDate(getDateMonthsAgo(11));
      setTimelineEndDate(today);
    }
  }, [timelinePreset]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setIsSummaryLoading(true);
      setPageError("");

      try {
        const response = await getStudyDataSummaryRequest(studyId);

        if (cancelled) {
          return;
        }

        setSummary(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setSummary(null);
        setPageError(
          error instanceof Error
            ? error.message
            : "A apărut o eroare la încărcarea rezumatului datelor."
        );
      } finally {
        if (!cancelled) {
          setIsSummaryLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [studyId, refreshToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadTimeline() {
      setIsTimelineLoading(true);
      setPageError("");

      try {
        const response = await getStudyDataTimelineRequest({
          studyId,
          groupBy,
          startDate: timelineStartDate,
          endDate: timelineEndDate,
        });

        if (cancelled) {
          return;
        }

        setTimeline(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setTimeline([]);
        setPageError(
          error instanceof Error
            ? error.message
            : "A apărut o eroare la încărcarea evoluției datelor."
        );
      } finally {
        if (!cancelled) {
          setIsTimelineLoading(false);
        }
      }
    }

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [studyId, groupBy, timelineStartDate, timelineEndDate, refreshToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubmissions() {
      setIsListLoading(true);
      setPageError("");

      try {
        const response = await listStudySubmissionSessionsRequest({
          studyId,
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch,
          status: statusFilter,
          entryMethod: methodFilter,
          startDate: tableStartDateFilter,
          endDate: tableEndDateFilter,
        });
      
        if (cancelled) {
          return;
        }
      
        setSessions(response.items);
        setTotalSessions(response.total);
        setTotalPages(response.total_pages);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setSessions([]);
        setTotalSessions(0);
        setTotalPages(1);
        setPageError(
          error instanceof Error
            ? error.message
            : "A apărut o eroare la încărcarea trimiterilor."
        );
      } finally {
        if (!cancelled) {
          setIsListLoading(false);
        }
      }
    }

    void loadSubmissions();

    return () => {
      cancelled = true;
    };
  }, [
        studyId,
        page,
        debouncedSearch,
        statusFilter,
        methodFilter,
        tableStartDateFilter,
        tableEndDateFilter,
        refreshToken,
      ]);

  useEffect(() => {
    if (!pendingFocusRequest || isListLoading || selectedSession) {
      return;
    }

    const matchingSession = sessions.find((session) => {
      if (session.participant_id !== pendingFocusRequest.participantId) {
        return false;
      }

      return doIntervalsOverlap({
        sessionStart: session.interval_start,
        sessionEnd: session.interval_end,
        focusStart: pendingFocusRequest.startDate,
        focusEnd: pendingFocusRequest.endDate,
      });
    });

    if (!matchingSession) {
      return;
    }

    setPendingFocusRequest(null);
    void handleOpenSession(matchingSession.id);
  }, [
    pendingFocusRequest,
    isListLoading,
    selectedSession,
    sessions,
  ]);

  const chartData = useMemo(() => {
    return timeline.map((item) => ({
      ...item,
      formatted_label: formatTimelineLabel(item.label, groupBy),
    }));
  }, [timeline, groupBy]);

  const mostActivePeriod = useMemo(() => {
    if (!timeline.length) {
      return null;
    }

    return timeline.reduce((best, current) => {
      if (current.values_count > best.values_count) {
        return current;
      }

      return best;
    }, timeline[0]);
  }, [timeline]);

  const totalReviewableSessions = useMemo(() => {
    return (
      (summary?.validated_count ?? 0) +
      (summary?.submitted_count ?? 0) +
      (summary?.rejected_count ?? 0) +
      (summary?.partial_count ?? 0)
    );
  }, [summary]);
    
  const validationRate = useMemo(() => {
    if (totalReviewableSessions === 0) {
      return 0;
    }

    return ((summary?.validated_count ?? 0) / totalReviewableSessions) * 100;
  }, [summary, totalReviewableSessions]);
    
  const pendingRate = useMemo(() => {
    if (totalReviewableSessions === 0) {
      return 0;
    }

    return ((summary?.submitted_count ?? 0) / totalReviewableSessions) * 100;
  }, [summary, totalReviewableSessions]);
    
  const rejectedRate = useMemo(() => {
    if (totalReviewableSessions === 0) {
      return 0;
    }

    return ((summary?.rejected_count ?? 0) / totalReviewableSessions) * 100;
  }, [summary, totalReviewableSessions]);

  const partialRate = useMemo(() => {
    if (totalReviewableSessions === 0) {
      return 0;
    }
  
    return ((summary?.partial_count ?? 0) / totalReviewableSessions) * 100;
  }, [summary, totalReviewableSessions]);

  const selectedPeriodRecordsCount = useMemo(() => {
    return timeline.reduce((total, item) => total + item.records_count, 0);
  }, [timeline]);

  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages]
  );

  const rowStart = totalSessions === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rowEnd = Math.min(page * PAGE_SIZE, totalSessions);

  async function handleOpenSession(sessionId: number) {
    setSelectedLoadingId(sessionId);
    setPageError("");
  
    try {
      const detail = await getStudySubmissionSessionDetailRequest(studyId, sessionId);
      setSelectedSession(detail);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }
  
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca detaliile trimiterii."
      );
    } finally {
      setSelectedLoadingId(null);
    }
  }

  async function handleUpdateSessionStatus(
    sessionId: number,
    status: ParticipantSubmissionStatus
  ) {
    setActionLoadingId(sessionId);
    setPageError("");
  
    try {
      const updated = await updateStudySubmissionSessionStatusRequest({
        studyId,
        sessionId,
        status,
      });
  
      if (selectedSession?.id === sessionId) {
        setSelectedSession(updated);
      }
  
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }
  
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-a putut actualiza statusul trimiterii."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleTimelinePresetChange(value: TimelinePreset) {
    setTimelinePreset(value);
  
    if (value === "custom") {
      if (timelineStartDate && timelineEndDate) {
        setGroupBy(getCustomGroupBy(timelineStartDate, timelineEndDate));
      }
  
      return;
    }
  }

  function handleTimelineStartDateChange(value: string) {
    setTimelineStartDate(value);
    setTimelinePreset("custom");
    setGroupBy(getCustomGroupBy(value, timelineEndDate));
  }
  
  function handleTimelineEndDateChange(value: string) {
    setTimelineEndDate(value);
    setTimelinePreset("custom");
    setGroupBy(getCustomGroupBy(timelineStartDate, value));
  }

  function handleResetFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setMethodFilter("");
    setTableStartDateFilter("");
    setTableEndDateFilter("");
    setPage(1);
  }

  return (
    <section className="study-collected-data">
      {pageError ? (
        <div className="study-collected-banner study-collected-banner--error">
          {pageError}
        </div>
      ) : null}

      <div className="study-collected-summary">
        <article className="study-collected-summary-card">
          <SummaryIconChart
            value={100}
            tone="blue"
            icon={<UsersIcon />}
          />

          <div className="study-collected-summary-card__content">
            <span>Participanți</span>
            <strong>
              {isSummaryLoading
                ? "..."
                : formatNumber(summary?.participants_with_submissions)}
            </strong>
            <small>cu date trimise</small>
          </div>
        </article>

        <article className="study-collected-summary-card">
          <SummaryIconChart
            value={100}
            tone="gray"
            icon={<DatabaseIcon />}
          />

          <div className="study-collected-summary-card__content">
            <span>Total trimiteri</span>
            <strong>
              {isSummaryLoading ? "..." : formatNumber(summary?.total_submissions)}
            </strong>
            <small>sesiuni colectate</small>
          </div>
        </article>

        <article className="study-collected-summary-card">
          <SummaryIconChart
            value={validationRate}
            tone="green"
            icon={<CheckIcon />}
          />

          <div className="study-collected-summary-card__content">
            <span>Validate</span>
            <strong>
              {isSummaryLoading ? "..." : formatNumber(summary?.validated_count)}
            </strong>
            <small>{formatPercent(validationRate)} din total</small>
          </div>
        </article>

        <article className="study-collected-summary-card">
          <SummaryIconChart
            value={pendingRate}
            tone="orange"
            icon={<ClockIcon />}
          />

          <div className="study-collected-summary-card__content">
            <span>În așteptare</span>
            <strong>
              {isSummaryLoading ? "..." : formatNumber(summary?.submitted_count)}
            </strong>
            <small>{formatPercent(pendingRate)} din total</small>
          </div>
        </article>

        <article className="study-collected-summary-card">
          <SummaryIconChart
            value={rejectedRate}
            tone="red"
            icon={<RejectIcon />}
          />

          <div className="study-collected-summary-card__content">
            <span>Respinse</span>
            <strong>
              {isSummaryLoading ? "..." : formatNumber(summary?.rejected_count)}
            </strong>
            <small>{formatPercent(rejectedRate)} din total</small>
          </div>
        </article>
      </div>

      <div className="study-collected-chart-card">
        <div className="study-collected-chart-card__header">
          <div>
            <h3>Evoluția colectării datelor</h3>
            <p>
              Urmărește volumul de valori fiziologice colectate în funcție de perioada selectată.
            </p>
          </div>

          <div className="study-collected-chart-controls">
            <label className="study-collected-chart-group">
              <span>Perioadă:</span>

              <select
                value={timelinePreset}
                onChange={(event) =>
                  handleTimelinePresetChange(event.target.value as TimelinePreset)
                }
              >
                <option value="last_7_days">Ultima săptămână</option>
                <option value="last_30_days">Ultima lună</option>
                <option value="last_12_months">Ultimul an</option>
                <option value="custom">Personalizată</option>
              </select>
            </label>

            {timelinePreset === "custom" ? (
              <div className="study-collected-chart-custom-range">
                <label>
                  <span>De la</span>
                  <input
                    type="date"
                    value={timelineStartDate}
                    onChange={(event) => handleTimelineStartDateChange(event.target.value)}
                  />
                </label>

                <label>
                  <span>Până la</span>
                  <input
                    type="date"
                    value={timelineEndDate}
                    onChange={(event) => handleTimelineEndDateChange(event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setTimelinePreset("last_7_days");
                  }}
                >
                  Resetează
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="study-collected-chart-layout">
          <div className="study-collected-chart-wrap">
            {isTimelineLoading ? (
              <div className="study-collected-chart-loading">
                Se încarcă evoluția datelor...
              </div>
            ) : chartData.length === 0 ? (
              <div className="study-collected-chart-empty">
                Nu există suficiente date pentru grafic.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 14, right: 28, left: -17, bottom: 2 }}
                >
                  <defs>
                    <linearGradient id="collectedDataGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7fbe73" stopOpacity={0.34} />
                      <stop offset="70%" stopColor="#7fbe73" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#7fbe73" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#e7eee8"
                    strokeDasharray="0"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tickFormatter={(value) => formatTimelineLabel(value, groupBy)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#6f7f83", fontWeight: 700 }}
                    minTickGap={18}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#6f7f83", fontWeight: 700 }}
                    width={42}
                  />

                  <Tooltip
                    content={
                      <CustomChartTooltip groupBy={groupBy} />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="values_count"
                    stroke="#2f8f5a"
                    strokeWidth={2.4}
                    fill="url(#collectedDataGradient)"
                    dot={{
                      r: 3.2,
                      strokeWidth: 2,
                      stroke: "#2f8f5a",
                      fill: "#ffffff",
                    }}
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      stroke: "#2f8f5a",
                      fill: "#ffffff",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <aside className="study-collected-chart-insight">
            <div>
              <span>Perioada cea mai activă</span>
              <strong>
                {mostActivePeriod
                  ? formatTimelineLabel(mostActivePeriod.label, groupBy)
                  : "—"}
              </strong>
              <small>
                {mostActivePeriod
                  ? `${formatNumber(mostActivePeriod.values_count)} valori`
                  : "Nu există date"}
              </small>
            </div>

            <div>
              <span>Ultima trimitere</span>
              <strong>{formatDateTime(summary?.last_submission_at)}</strong>
            </div>

            <div>
              <span>Înregistrări în perioada selectată</span>
              <strong>{formatNumber(selectedPeriodRecordsCount)}</strong>
            </div>
          </aside>
        </div>
      </div>

      <div className="study-collected-card">
        <div className="study-collected-toolbar">
          <label className="study-collected-search">
            <span>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Caută după participant..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <label className="study-collected-filter">
            <span>Metodă</span>
            <select
              value={methodFilter}
              onChange={(event) => {
                setMethodFilter(event.target.value as ParticipantDataEntryMethod | "");
                setPage(1);
              }}
            >
              <option value="">Toate</option>
              <option value="manual">Manual</option>
              <option value="csv">CSV</option>
            </select>
          </label>

          <label className="study-collected-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StudySessionStatus | "");
                setPage(1);
              }}
            >
              <option value="">Toate</option>
              <option value="submitted">În așteptare</option>
              <option value="validated">Validate</option>
              <option value="rejected">Respinse</option>
              <option value="partial">Parțiale</option>
            </select>
          </label>

          <label className="study-collected-filter">
            <span>De la</span>
            <input
              type="date"
              value={tableStartDateFilter}
              onChange={(event) => {
                setTableStartDateFilter(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="study-collected-filter">
            <span>Până la</span>
            <input
              type="date"
              value={tableEndDateFilter}
              onChange={(event) => {
                setTableEndDateFilter(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <button
            type="button"
            className="study-collected-toolbar-icon-btn"
            onClick={handleResetFilters}
            disabled={
              isListLoading ||
              (!searchInput &&
                !statusFilter &&
                !methodFilter &&
                !tableStartDateFilter &&
                !tableEndDateFilter)
            }
            aria-label="Resetează filtrele"
            title="Resetează filtrele"
          >
            <RefreshIcon />
          </button>
        </div>

        <div className="study-collected-table-wrap">
          {isListLoading ? (
            <div className="study-collected-loading">
              Se încarcă trimiterile...
            </div>
          ) : sessions.length === 0 ? (
            <div className="study-collected-empty">
              <div className="study-collected-empty__icon">
                <EmptyIcon />
              </div>
              <h3>Nu există trimiteri pentru criteriile selectate</h3>
              <p>
                Încearcă să modifici filtrele sau verifică dacă participanții au
                trimis date în acest studiu.
              </p>
            </div>
          ) : (
            <table className="study-collected-table">
              <thead>
                <tr>
                  <th className="study-collected-col-participant">Participant</th>
                  <th className="study-collected-col-method">Metodă</th>
                  <th className="study-collected-col-status">Status sesiune</th>
                  <th className="study-collected-col-records">Înregistrări</th>
                  <th className="study-collected-col-values">Valori</th>
                  <th className="study-collected-col-interval">Interval date</th>
                  <th className="study-collected-col-submitted">Data trimiterii</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className={`study-collected-clickable-row ${
                      selectedLoadingId === session.id ? "is-loading" : ""
                    }`}
                    onClick={() => void handleOpenSession(session.id)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void handleOpenSession(session.id);
                      }
                    }}
                  >
                    <td className="study-collected-col-participant">
                      <div className="study-collected-participant-cell">
                        <span>{getInitials(session.participant_full_name)}</span>
                        <div>
                          <strong>{session.participant_full_name}</strong>
                          <small>{session.participant_code}</small>
                        </div>
                      </div>
                    </td>

                    <td className="study-collected-col-method">
                      <span
                        className={`study-collected-method ${getMethodClassName(
                          session.entry_method
                        )}`}
                      >
                        {METHOD_LABELS[session.entry_method]}
                      </span>
                    </td>

                    <td className="study-collected-col-status">
                      <span
                        className={`study-collected-status ${getStatusClassName(
                          session.status_summary
                        )}`}
                      >
                        {STATUS_LABELS[session.status_summary]}
                      </span>
                    </td>

                    <td className="study-collected-col-records">
                      {formatNumber(session.records_count)}
                    </td>

                    <td className="study-collected-col-values">
                      {formatNumber(session.values_count)}
                    </td>

                    <td className="study-collected-col-interval">
                      {session.interval_start && session.interval_end
                        ? `${formatDate(session.interval_start)} - ${formatDate(
                            session.interval_end
                          )}`
                        : "—"}
                    </td>

                    <td className="study-collected-col-submitted">
                      {formatDateTime(session.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="study-collected-footer">
          <span>
            Afișare {rowStart} - {rowEnd} din {totalSessions} trimiteri
          </span>

          <div className="study-collected-pagination">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1 || isListLoading}
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
                    disabled={isListLoading}
                  >
                    {pageNumber}
                  </button>
                </span>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || isListLoading}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {selectedSession ? (
        <div
          className="study-collected-drawer-overlay"
          onClick={() => setSelectedSession(null)}
        >
          <aside
            className="study-collected-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="study-collected-drawer__header">
              <button
                type="button"
                className="study-collected-drawer__close"
                onClick={() => setSelectedSession(null)}
                aria-label="Închide"
              >
                <CloseIcon />
              </button>

              <div className="study-collected-drawer__title">
                <span className="study-collected-drawer__eyebrow">
                  Trimitere #{selectedSession.id}
                </span>

                <h3>Date trimise de {selectedSession.participant_full_name}</h3>

                <div className="study-collected-drawer__badges">
                  <span
                    className={`study-collected-method ${getMethodClassName(
                      selectedSession.entry_method
                    )}`}
                  >
                    {METHOD_LABELS[selectedSession.entry_method]}
                  </span>

                  <span
                    className={`study-collected-status ${getStatusClassName(
                      selectedSession.status_summary
                    )}`}
                  >
                    {STATUS_LABELS[selectedSession.status_summary]}
                  </span>
                </div>
              </div>

              <div className="study-collected-drawer__top-actions">
                <button
                  type="button"
                  className="study-collected-secondary-btn"
                  onClick={() =>
                    void handleUpdateSessionStatus(selectedSession.id, "submitted")
                  }
                  disabled={actionLoadingId === selectedSession.id}
                >
                  În așteptare
                </button>

                <button
                  type="button"
                  className="study-collected-primary-btn"
                  onClick={() =>
                    void handleUpdateSessionStatus(selectedSession.id, "validated")
                  }
                  disabled={actionLoadingId === selectedSession.id}
                >
                  Validează
                </button>

                <button
                  type="button"
                  className="study-collected-danger-btn"
                  onClick={() =>
                    void handleUpdateSessionStatus(selectedSession.id, "rejected")
                  }
                  disabled={actionLoadingId === selectedSession.id}
                >
                  Respingere
                </button>
              </div>
            </div>

            <section className="study-collected-drawer-section">
              <h4>Informații trimitere</h4>

              <dl>
                <div>
                  <dt>Cod participant</dt>
                  <dd>{selectedSession.participant_code}</dd>
                </div>

                <div>
                  <dt>Data trimiterii</dt>
                  <dd>{formatDateTime(selectedSession.submitted_at)}</dd>
                </div>

                <div>
                  <dt>Data revizuirii</dt>
                  <dd>{formatDateTime(selectedSession.reviewed_at)}</dd>
                </div>

                <div>
                  <dt>Interval date</dt>
                  <dd>
                    {selectedSession.interval_start && selectedSession.interval_end
                      ? `${formatDateTime(selectedSession.interval_start)} - ${formatDateTime(
                          selectedSession.interval_end
                        )}`
                      : "—"}
                  </dd>
                </div>

                <div>
                  <dt>Înregistrări</dt>
                  <dd>{formatNumber(selectedSession.records_count)}</dd>
                </div>

                <div>
                  <dt>Valori</dt>
                  <dd>{formatNumber(selectedSession.values_count)}</dd>
                </div>
              </dl>
            </section>

            <section className="study-collected-drawer-section study-collected-values-section">
              <div className="study-collected-values-section__header">
                <div>
                  <h4>Valori fiziologice</h4>
                  <p>
                    Datele trimise de participant, grupate pe momentul măsurării.
                  </p>
                </div>

                <span>
                  {formatNumber(selectedSession.records_count)} înregistrări
                </span>
              </div>

              <div className="study-collected-values-table-wrap">
                <table className="study-collected-values-table">
                  <thead>
                    <tr>
                      <th className="study-collected-value-col-moment">Moment</th>
                      <th className="study-collected-value-col-hr">Ritm cardiac</th>
                      <th className="study-collected-value-col-rr">Frecvență respiratorie</th>
                      <th className="study-collected-value-col-spo2">SpO₂</th>
                      <th className="study-collected-value-col-temp">Temperatură</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedSession.records.map((record) => {
                      const heartRate = getRecordValue(record, "heartRate");
                      const respiratoryRate = getRecordValue(record, "respiratoryRate");
                      const spo2 = getRecordValue(record, "spo2");
                      const temperature = getRecordValue(record, "temperature");

                      return (
                        <tr key={record.submission_id}>
                          <td className="study-collected-value-col-moment">
                            <strong>{formatDateTime(getRecordMeasuredAt(record))}</strong>
                            <small>#{record.submission_id}</small>
                          </td>

                          <td className="study-collected-value-col-hr">
                            {formatParameterValue(heartRate)}
                          </td>

                          <td className="study-collected-value-col-rr">
                            {formatParameterValue(respiratoryRate)}
                          </td>

                          <td className="study-collected-value-col-spo2">
                            {formatParameterValue(spo2)}
                          </td>

                          <td className="study-collected-value-col-temp">
                            {formatParameterValue(temperature)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="study-collected-drawer-section">
              <h4>Notițe participant</h4>
              <p className="study-collected-muted">
                {selectedSession.participant_notes?.trim() ||
                  "Participantul nu a adăugat notițe pentru această trimitere."}
              </p>
            </section>

            <section className="study-collected-drawer-section">
              <h4>Note revizuire</h4>
              <p className="study-collected-muted">
                {selectedSession.review_notes?.trim() ||
                  "Nu există note de revizuire pentru această trimitere."}
              </p>
            </section>
          </aside>
        </div>
      ) : null}
    </section>
  );
}