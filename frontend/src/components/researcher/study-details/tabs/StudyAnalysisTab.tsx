import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { authFetch, SESSION_EXPIRED_ERROR } from "../../../../auth/authFetch";
import "../../../../styles/study-analysis.css";

const GROUP_PAGE_SIZE = 10;
const RESULTS_FETCH_LIMIT = 100;

type StudyParameterKey = "heartRate" | "respiratoryRate" | "spo2" | "temperature";
type AnalysisRiskLabel = "high_risk" | "low_risk";
type AnalysisScope = "last_24h" | "last_48h" | "last_7_days" | "custom";
type AnalysisSortBy = "created_at" | "risk_probability" | "records_used";
type SortOrder = "asc" | "desc";

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

type AnalysisModelSelection = Partial<Record<StudyParameterKey, AnalysisModelType>>;

type ParticipantSex =
  | "female"
  | "male"
  | "other"
  | "prefer_not_to_say";

type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete"
  | "unknown";

type ParticipantConditionType =
  | "cardiovascular"
  | "respiratory"
  | "metabolic"
  | "neurological"
  | "endocrine"
  | "other"
  | "none_declared"
  | "prefer_not_to_say";

type MeasurementContext =
  | "rest"
  | "during_effort"
  | "after_effort"
  | "after_meal"
  | "stress"
  | "sleep"
  | "unknown";

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
  filter_sex: ParticipantSex | null;
  filter_participant_group: string | null;
  filter_activity_level: ActivityLevel | null;
  filter_condition_type: ParticipantConditionType | null;
  filter_measurement_context: MeasurementContext | null;

  created_at: string;
};

type AnalysisResultListResponse = {
  items: AnalysisResultResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type AnalysisRunPayload = {
  participant_id?: number | null;
  scope: AnalysisScope;
  start_date?: string | null;
  end_date?: string | null;
  age_min?: number | null;
  age_max?: number | null;
  sex?: ParticipantSex | null;
  participant_group?: string | null;
  activity_level?: ActivityLevel | null;
  condition_type?: ParticipantConditionType | null;
  measurement_context?: MeasurementContext | null;
  model_selection?: AnalysisModelSelection | null;
};

type AnalysisRunResponse = {
  message: string;
  results: AnalysisResultResponse[];
};

type AnalysisAverageRiskByParameterItem = {
  parameter_key: StudyParameterKey;
  average_risk_probability: number;
  results_count: number;
};

type AnalysisTimelinePointResponse = {
  label: string;
  high_risk_count: number;
  low_risk_count: number;
  total_results: number;
};

type AnalysisSummaryResponse = {
  total_results: number;
  participants_analyzed: number;
  high_risk_results: number;
  low_risk_results: number;
  records_used: number;
  average_risk_by_parameter: AnalysisAverageRiskByParameterItem[];
  risk_distribution: {
    risk_label: AnalysisRiskLabel;
    count: number;
    percentage: number;
  }[];
  timeline: AnalysisTimelinePointResponse[];
};

type AnalysisObservedParameterSummary = {
  parameter_key: StudyParameterKey;
  count: number;
  min_value: number | null;
  max_value: number | null;
  average_value: number | null;
};

type AnalysisObservedRecordResponse = {
  measured_at: string;
  heart_rate: number | null;
  respiratory_rate: number | null;
  spo2: number | null;
  temperature: number | null;
};

type AnalysisObservedValuesResponse = {
  analysis_run_id: number;
  study_id: number;
  participant_id: number;
  participant_code: string;
  participant_full_name: string;
  analysis_start_date: string | null;
  analysis_end_date: string | null;
  analysis_scope: string;
  records_count: number;
  values_count: number;
  summaries: AnalysisObservedParameterSummary[];
  records: AnalysisObservedRecordResponse[];
};

type ParticipantStatus =
  | "invited"
  | "active"
  | "suspended"
  | "completed"
  | "withdrawn";

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
  sex: ParticipantSex | null;
  participant_group: string | null;
  activity_level: ActivityLevel | null;
};

type ParticipantListResponse = {
  items: ParticipantListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type ParticipantAnalysisGroup = {
  key: string;
  participant: AnalysisParticipantResponse | null;
  participant_id: number;
  results: AnalysisResultResponse[];
  highest_risk_result: AnalysisResultResponse;
  high_risk_count: number;
  low_risk_count: number;
  records_used: number;
};

type AnalysisRunGroup = {
  key: string;
  analysis_run_id: number | null;
  analysis_scope: string;
  analysis_start_date: string | null;
  analysis_end_date: string | null;

  filter_age_min: number | null;
  filter_age_max: number | null;
  filter_sex: ParticipantSex | null;
  filter_participant_group: string | null;
  filter_activity_level: ActivityLevel | null;
  filter_condition_type: ParticipantConditionType | null;
  filter_measurement_context: MeasurementContext | null;

  created_at: string;
  results: AnalysisResultResponse[];
  participant_groups: ParticipantAnalysisGroup[];
  highest_risk_result: AnalysisResultResponse;
  high_risk_count: number;
  low_risk_count: number;
  participants_count: number;
  records_used: number;
};

type OpenCollectedDataRequest = {
  participantId: number;
  participantCode: string;
  startDate: string | null;
  endDate: string | null;
};

type StudyAnalysisTabProps = {
  studyId: number;
  onOpenCollectedData?: (request: OpenCollectedDataRequest) => void;
};

const PARAMETER_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "Saturația de oxigen",
  temperature: "Temperatură",
};

const PARAMETER_SHORT_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm",
  respiratoryRate: "Resp.",
  spo2: "SpO₂",
  temperature: "Temp.",
};

const MODEL_LABELS: Record<AnalysisModelType, string> = {
  logistic_regression: "Logistic Regression",
  decision_tree: "Decision Tree",
  random_forest: "Random Forest",
  knn: "KNN",
  xgboost: "XGBoost",
  rnn: "RNN",
  lstm: "LSTM",
  lstm_rf: "LSTM + Random Forest",
  lstm_xgb: "LSTM + XGBoost",
};

const DEFAULT_MODEL_SELECTION: Record<StudyParameterKey, AnalysisModelType> = {
  heartRate: "random_forest",
  respiratoryRate: "lstm",
  spo2: "random_forest",
  temperature: "xgboost",
};

const ANALYSIS_MODEL_OPTIONS: Array<{
  value: AnalysisModelType;
  label: string;
  category: string;
}> = [
  { value: "logistic_regression", label: "Logistic Regression", category: "Model clasic" },
  { value: "decision_tree", label: "Decision Tree", category: "Model clasic" },
  { value: "random_forest", label: "Random Forest", category: "Model clasic" },
  { value: "knn", label: "KNN", category: "Model clasic" },
  { value: "xgboost", label: "XGBoost", category: "Model clasic" },
  { value: "rnn", label: "RNN", category: "Model secvențial" },
  { value: "lstm", label: "LSTM", category: "Model secvențial" },
  { value: "lstm_rf", label: "LSTM + Random Forest", category: "Model hibrid" },
  { value: "lstm_xgb", label: "LSTM + XGBoost", category: "Model hibrid" },
];

const RISK_LABELS: Record<AnalysisRiskLabel, string> = {
  high_risk: "Risc ridicat",
  low_risk: "Risc scăzut",
};

const SCOPE_LABELS: Record<AnalysisScope, string> = {
  last_24h: "Ultimele 24h",
  last_48h: "Ultimele 48h",
  last_7_days: "Ultimele 7 zile",
  custom: "Interval personalizat",
};

const SEX_OPTIONS: Array<{ value: ParticipantSex; label: string }> = [
  { value: "female", label: "Feminin" },
  { value: "male", label: "Masculin" },
  { value: "other", label: "Altul" },
  { value: "prefer_not_to_say", label: "Preferă să nu spună" },
];

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string }> = [
  { value: "sedentary", label: "Sedentar" },
  { value: "light", label: "Activitate ușoară" },
  { value: "moderate", label: "Activitate moderată" },
  { value: "active", label: "Activ" },
  { value: "athlete", label: "Sportiv" },
  { value: "unknown", label: "Necunoscut" },
];

const CONDITION_OPTIONS: Array<{ value: ParticipantConditionType; label: string }> = [
  { value: "cardiovascular", label: "Cardiovasculară" },
  { value: "respiratory", label: "Respiratorie" },
  { value: "metabolic", label: "Metabolică" },
  { value: "neurological", label: "Neurologică" },
  { value: "endocrine", label: "Endocrină" },
  { value: "other", label: "Altă afecțiune" },
  { value: "none_declared", label: "Nicio afecțiune declarată" },
  { value: "prefer_not_to_say", label: "Preferă să nu spună" },
];

const MEASUREMENT_CONTEXT_OPTIONS: Array<{ value: MeasurementContext; label: string }> = [
  { value: "rest", label: "Repaus" },
  { value: "during_effort", label: "În timpul efortului" },
  { value: "after_effort", label: "După efort" },
  { value: "after_meal", label: "După masă" },
  { value: "stress", label: "Stres" },
  { value: "sleep", label: "Somn" },
  { value: "unknown", label: "Necunoscut" },
];

const PARAMETER_COLORS: Record<StudyParameterKey, string> = {
  heartRate: "#cf6b64",
  respiratoryRate: "#6f9fc7",
  spo2: "#5fae9b",
  temperature: "#ef9647",
};

function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5.5C7.1 5.5 5.7 7 5.7 8.7C4.6 9.2 4 10.3 4 11.6C4 13.1 4.9 14.3 6.2 14.8C6.1 17 7.8 18.5 9.8 18.5H11V5.5H9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15 5.5C16.9 5.5 18.3 7 18.3 8.7C19.4 9.2 20 10.3 20 11.6C20 13.1 19.1 14.3 17.8 14.8C17.9 17 16.2 18.5 14.2 18.5H13V5.5H15Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.2 10H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 10H15.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.4 14H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 14H15.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 6H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 18H13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.5 5.8L18 12L8.5 18.2V5.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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
      <rect x="5" y="5" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.5V14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.2 10.5L12 14.3L15.8 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 18.5H18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoBulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.5 18H14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 21H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.2 14.6C6.9 13.5 6.1 11.9 6.1 10.1C6.1 6.8 8.7 4.3 12 4.3C15.3 4.3 17.9 6.8 17.9 10.1C17.9 11.9 17.1 13.5 15.8 14.6C15.1 15.2 14.7 15.9 14.6 16.7H9.4C9.3 15.9 8.9 15.2 8.2 14.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 12.2L10.1 15.8L17.5 8.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
    <div className={`study-analysis-summary-icon-chart is-${tone}`}>
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

      <span className="study-analysis-summary-icon-chart__icon">{icon}</span>
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

function formatProbability(value: number): string {
  return `${new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value * 100)}%`;
}

function formatVitalValue(value: number | null | undefined, suffix: string): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${new Intl.NumberFormat("ro-RO", {
    maximumFractionDigits: 1,
  }).format(value)} ${suffix}`;
}

function getParameterUnit(parameterKey: StudyParameterKey): string {
  if (parameterKey === "heartRate") {
    return "bătăi/min";
  }

  if (parameterKey === "respiratoryRate") {
    return "respirații/min";
  }

  if (parameterKey === "spo2") {
    return "%";
  }

  return "°C";
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

function getRiskClassName(riskLabel: AnalysisRiskLabel): string {
  return riskLabel === "high_risk" ? "is-high" : "is-low";
}

function shouldRunNeedAttention(run: AnalysisRunGroup): boolean {
  return run.high_risk_count > 0;
}

function shouldParticipantNeedAttention(participantGroup: ParticipantAnalysisGroup): boolean {
  return participantGroup.high_risk_count > 0;
}

function getRunRiskClassName(run: AnalysisRunGroup): string {
  return shouldRunNeedAttention(run) ? "is-high" : "is-low";
}

function getParticipantRiskClassName(participantGroup: ParticipantAnalysisGroup): string {
  return shouldParticipantNeedAttention(participantGroup) ? "is-high" : "is-low";
}

function getParameterClassName(parameterKey: StudyParameterKey): string {
  if (parameterKey === "heartRate") {
    return "is-heart";
  }

  if (parameterKey === "respiratoryRate") {
    return "is-respiratory";
  }

  if (parameterKey === "spo2") {
    return "is-spo2";
  }

  return "is-temperature";
}

function getScopeLabel(scope: string): string {
  if (scope in SCOPE_LABELS) {
    return SCOPE_LABELS[scope as AnalysisScope];
  }

  return scope;
}

function getAnalysisIntervalLabel(
  item: Pick<AnalysisRunGroup, "analysis_start_date" | "analysis_end_date" | "analysis_scope">
): string {
  if (item.analysis_start_date && item.analysis_end_date) {
    return `${formatDate(item.analysis_start_date)} - ${formatDate(item.analysis_end_date)}`;
  }

  return getScopeLabel(item.analysis_scope);
}

function getOptionLabel<T extends string>(
  value: T | null,
  options: Array<{ value: T; label: string }>
): string | null {
  if (!value) {
    return null;
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

function getAgeFilterLabel(run: AnalysisRunGroup): string | null {
  if (run.filter_age_min !== null && run.filter_age_max !== null) {
    return `${run.filter_age_min}-${run.filter_age_max} ani`;
  }

  if (run.filter_age_min !== null) {
    return `Min. ${run.filter_age_min} ani`;
  }

  if (run.filter_age_max !== null) {
    return `Max. ${run.filter_age_max} ani`;
  }

  return null;
}

function getAnalysisCriteriaLabels(run: AnalysisRunGroup): string[] {
  const labels = [
    getOptionLabel(run.filter_activity_level, ACTIVITY_OPTIONS),
    getOptionLabel(run.filter_measurement_context, MEASUREMENT_CONTEXT_OPTIONS),
    getOptionLabel(run.filter_sex, SEX_OPTIONS),
    getAgeFilterLabel(run),
    run.filter_participant_group ? `Grup: ${run.filter_participant_group}` : null,
    getOptionLabel(run.filter_condition_type, CONDITION_OPTIONS),
  ].filter((item): item is string => Boolean(item));

  return labels.length > 0 ? labels : ["Toată cohorta"];
}

function getRunKey(result: AnalysisResultResponse): string {
  if (result.analysis_run_id !== null) {
    return `run-${result.analysis_run_id}`;
  }

  const createdSecond = result.created_at.slice(0, 19);

  return [
    result.analysis_scope,
    result.analysis_start_date ?? "no-start",
    result.analysis_end_date ?? "no-end",
    result.filter_age_min ?? "no-age-min",
    result.filter_age_max ?? "no-age-max",
    result.filter_sex ?? "no-sex",
    result.filter_participant_group ?? "no-group",
    result.filter_activity_level ?? "no-activity",
    result.filter_condition_type ?? "no-condition",
    result.filter_measurement_context ?? "no-context",
    createdSecond,
  ].join("|");
}

function buildParticipantGroups(results: AnalysisResultResponse[]): ParticipantAnalysisGroup[] {
  const map = new Map<number, AnalysisResultResponse[]>();

  for (const result of results) {
    const current = map.get(result.participant_id) ?? [];
    current.push(result);
    map.set(result.participant_id, current);
  }

  return Array.from(map.entries())
    .map(([participantId, participantResults]) => {
      const sortedResults = [...participantResults].sort(
        (a, b) => b.risk_probability - a.risk_probability
      );

      const highestRiskResult = sortedResults[0];

      return {
        key: String(participantId),
        participant: highestRiskResult.participant,
        participant_id: participantId,
        results: sortedResults,
        highest_risk_result: highestRiskResult,
        high_risk_count: participantResults.filter((item) => item.risk_label === "high_risk").length,
        low_risk_count: participantResults.filter((item) => item.risk_label === "low_risk").length,
        records_used: Math.max(...participantResults.map((item) => item.records_used)),
      };
    })
    .sort((a, b) => b.highest_risk_result.risk_probability - a.highest_risk_result.risk_probability);
}

function buildAnalysisRuns(results: AnalysisResultResponse[]): AnalysisRunGroup[] {
  const map = new Map<string, AnalysisResultResponse[]>();

  for (const result of results) {
    const key = getRunKey(result);
    const current = map.get(key) ?? [];
    current.push(result);
    map.set(key, current);
  }

  return Array.from(map.entries())
    .map(([key, runResults]) => {
      const sortedResults = [...runResults].sort(
        (a, b) => b.risk_probability - a.risk_probability
      );

      const highestRiskResult = sortedResults[0];
      const participantGroups = buildParticipantGroups(runResults);

      return {
        key,
        analysis_run_id: highestRiskResult.analysis_run_id,
        analysis_scope: highestRiskResult.analysis_scope,
        analysis_start_date: highestRiskResult.analysis_start_date,
        analysis_end_date: highestRiskResult.analysis_end_date,
        filter_age_min: highestRiskResult.filter_age_min,
        filter_age_max: highestRiskResult.filter_age_max,
        filter_sex: highestRiskResult.filter_sex,
        filter_participant_group: highestRiskResult.filter_participant_group,
        filter_activity_level: highestRiskResult.filter_activity_level,
        filter_condition_type: highestRiskResult.filter_condition_type,
        filter_measurement_context: highestRiskResult.filter_measurement_context,

        created_at: highestRiskResult.created_at,
        results: sortedResults,
        participant_groups: participantGroups,
        highest_risk_result: highestRiskResult,
        high_risk_count: runResults.filter((item) => item.risk_label === "high_risk").length,
        low_risk_count: runResults.filter((item) => item.risk_label === "low_risk").length,
        participants_count: participantGroups.length,
        records_used: participantGroups.reduce(
          (total, participantGroup) => total + participantGroup.records_used,
          0
        ),
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

async function listParticipantsForAnalysisRequest(
  studyId: number
): Promise<ParticipantListResponse> {
  const query = new URLSearchParams();
  query.set("page", "1");
  query.set("page_size", "100");
  query.set("sort_by", "participant_code");
  query.set("sort_order", "asc");

  return apiRequest<ParticipantListResponse>(
    `/studies/${studyId}/participants/?${query.toString()}`
  );
}

async function runAnalysisRequest(
  studyId: number,
  payload: AnalysisRunPayload
): Promise<AnalysisRunResponse> {
  return apiRequest<AnalysisRunResponse>(`/studies/${studyId}/analysis/run`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function getAnalysisSummaryRequest(params: {
  studyId: number;
  participantId: string;
  parameterKey: StudyParameterKey | "";
  riskLabel: AnalysisRiskLabel | "";
  modelType: AnalysisModelType | "";
  createdStartDate: string;
  createdEndDate: string;
}): Promise<AnalysisSummaryResponse> {
  const query = new URLSearchParams();

  if (params.participantId) {
    query.set("participant_id", params.participantId);
  }

  if (params.parameterKey) {
    query.set("parameter_key", params.parameterKey);
  }

  if (params.riskLabel) {
    query.set("risk_label", params.riskLabel);
  }

  if (params.modelType) {
    query.set("model_type", params.modelType);
  }

  if (params.createdStartDate) {
    query.set("created_start_date", params.createdStartDate);
  }

  if (params.createdEndDate) {
    query.set("created_end_date", params.createdEndDate);
  }

  const queryString = query.toString();

  return apiRequest<AnalysisSummaryResponse>(
    `/studies/${params.studyId}/analysis/summary${queryString ? `?${queryString}` : ""}`
  );
}

async function listAnalysisResultsPageRequest(params: {
  studyId: number;
  page: number;
  participantId: string;
  parameterKey: StudyParameterKey | "";
  riskLabel: AnalysisRiskLabel | "";
  modelType: AnalysisModelType | "";
  createdStartDate: string;
  createdEndDate: string;
  sortBy: AnalysisSortBy;
  sortOrder: SortOrder;
}): Promise<AnalysisResultListResponse> {
  const query = new URLSearchParams();

  query.set("page", String(params.page));
  query.set("page_size", String(RESULTS_FETCH_LIMIT));
  query.set("sort_by", params.sortBy);
  query.set("sort_order", params.sortOrder);

  if (params.participantId) {
    query.set("participant_id", params.participantId);
  }

  if (params.parameterKey) {
    query.set("parameter_key", params.parameterKey);
  }

  if (params.riskLabel) {
    query.set("risk_label", params.riskLabel);
  }

  if (params.modelType) {
    query.set("model_type", params.modelType);
  }

  if (params.createdStartDate) {
    query.set("created_start_date", params.createdStartDate);
  }

  if (params.createdEndDate) {
    query.set("created_end_date", params.createdEndDate);
  }

  return apiRequest<AnalysisResultListResponse>(
    `/studies/${params.studyId}/analysis/results?${query.toString()}`
  );
}

async function listAllAnalysisResultsRequest(params: {
  studyId: number;
  participantId: string;
  parameterKey: StudyParameterKey | "";
  riskLabel: AnalysisRiskLabel | "";
  modelType: AnalysisModelType | "";
  createdStartDate: string;
  createdEndDate: string;
  sortBy: AnalysisSortBy;
  sortOrder: SortOrder;
}): Promise<{ items: AnalysisResultResponse[]; total: number }> {
  const firstPage = await listAnalysisResultsPageRequest({
    ...params,
    page: 1,
  });

  const allItems = [...firstPage.items];

  for (let currentPage = 2; currentPage <= firstPage.total_pages; currentPage += 1) {
    const nextPage = await listAnalysisResultsPageRequest({
      ...params,
      page: currentPage,
    });

    allItems.push(...nextPage.items);
  }

  return {
    items: allItems,
    total: firstPage.total,
  };
}

async function getAnalysisObservedValuesRequest(params: {
  studyId: number;
  analysisRunId: number;
  participantId: number;
}): Promise<AnalysisObservedValuesResponse> {
  return apiRequest<AnalysisObservedValuesResponse>(
    `/studies/${params.studyId}/analysis/runs/${params.analysisRunId}/participants/${params.participantId}/observed-values`
  );
}

async function exportAnalysisRunReportPdfRequest(
  studyId: number,
  analysisRunId: number
): Promise<Blob> {
  const response = await authFetch(
    `/studies/${studyId}/reports/analysis-runs/${analysisRunId}/export/pdf`
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.blob();
}

function downloadBlobFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

function ParameterRiskTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      label: string;
      full_label?: string;
      average_risk_probability: number;
      results_count: number;
      percentage_value: number;
    };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="study-analysis-chart-tooltip">
      <strong>{item.full_label ?? item.label}</strong>
      <span>{formatProbability(item.average_risk_probability)} risc mediu</span>
      <small>{formatNumber(item.results_count)} rezultate</small>
    </div>
  );
}


function SelectedAnalysisTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      parameter_key: StudyParameterKey;
      label: string;
      full_label?: string;
      probability_percent: number;
      risk_probability: number;
      risk_label: AnalysisRiskLabel;
    };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="study-analysis-chart-tooltip">
      <strong>{item.full_label ?? item.label}</strong>
      <span>{formatProbability(item.risk_probability)} probabilitate</span>
      <small>{RISK_LABELS[item.risk_label]}</small>
    </div>
  );
}

function TopParticipantsRiskTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      label: string;
      risk_probability: number;
      high_risk_count: number;
    };
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="study-analysis-chart-tooltip">
      <strong>{item.label}</strong>
      <span>{formatProbability(item.risk_probability)} risc maxim</span>
      <small>
        {item.high_risk_count > 0
          ? `${formatNumber(item.high_risk_count)} rezultate cu risc ridicat`
          : "Fără risc ridicat"}
      </small>
    </div>
  );
}

export default function StudyAnalysisTab({
  studyId,
  onOpenCollectedData,
}: StudyAnalysisTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [participants, setParticipants] = useState<ParticipantListItemResponse[]>([]);
  const [summary, setSummary] = useState<AnalysisSummaryResponse | null>(null);
  const [results, setResults] = useState<AnalysisResultResponse[]>([]);

  const [isParticipantsLoading, setIsParticipantsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isResultsLoading, setIsResultsLoading] = useState(true);
  const [isRunLoading, setIsRunLoading] = useState(false);
 
  const [exportingRunId, setExportingRunId] = useState<number | null>(null);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [refreshToken, setRefreshToken] = useState(0);
  const [page, setPage] = useState(1);
  const [totalRawResults, setTotalRawResults] = useState(0);

  const [advancedRunFiltersOpen, setAdvancedRunFiltersOpen] = useState(false);
  const [tableFiltersOpen, setTableFiltersOpen] = useState(false);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [isModelSelectionOpen, setIsModelSelectionOpen] = useState(false);

  const [runForm, setRunForm] = useState({
    scope: "last_7_days" as AnalysisScope,
    participantId: "",
    startDate: "",
    endDate: "",
    ageMin: "",
    ageMax: "",
    sex: "" as ParticipantSex | "",
    participantGroup: "",
    activityLevel: "" as ActivityLevel | "",
    conditionType: "" as ParticipantConditionType | "",
    measurementContext: "" as MeasurementContext | "",
    modelSelection: DEFAULT_MODEL_SELECTION,
  });

  const hasCustomModelSelection = (
    ["heartRate", "respiratoryRate", "spo2", "temperature"] as StudyParameterKey[]
  ).some(
    (parameterKey) =>
      runForm.modelSelection[parameterKey] !== DEFAULT_MODEL_SELECTION[parameterKey]
  );

  const [filters, setFilters] = useState({
    participantId: "",
    parameterKey: "" as StudyParameterKey | "",
    riskLabel: "" as AnalysisRiskLabel | "",
    modelType: "" as AnalysisModelType | "",
    createdStartDate: "",
    createdEndDate: "",
    sortBy: "created_at" as AnalysisSortBy,
    sortOrder: "desc" as SortOrder,
  });

  const [selectedRun, setSelectedRun] = useState<AnalysisRunGroup | null>(null);
  const [selectedParticipantGroup, setSelectedParticipantGroup] =
    useState<ParticipantAnalysisGroup | null>(null);
  const [observedValues, setObservedValues] =
    useState<AnalysisObservedValuesResponse | null>(null);
  const [isObservedValuesLoading, setIsObservedValuesLoading] = useState(false);
  const [observedValuesError, setObservedValuesError] = useState("");

  const [hasOpenedRunFromUrl, setHasOpenedRunFromUrl] = useState(false);
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
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  useEffect(() => {
    let cancelled = false;

    async function loadParticipants() {
      setIsParticipantsLoading(true);

      try {
        const response = await listParticipantsForAnalysisRequest(studyId);

        if (cancelled) {
          return;
        }

        setParticipants(response.items);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setParticipants([]);
      } finally {
        if (!cancelled) {
          setIsParticipantsLoading(false);
        }
      }
    }

    void loadParticipants();

    return () => {
      cancelled = true;
    };
  }, [studyId, refreshToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setIsSummaryLoading(true);
      setPageError("");

      try {
        const response = await getAnalysisSummaryRequest({
          studyId,
          participantId: filters.participantId,
          parameterKey: filters.parameterKey,
          riskLabel: filters.riskLabel,
          modelType: filters.modelType,
          createdStartDate: filters.createdStartDate,
          createdEndDate: filters.createdEndDate,
        });

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
            : "A apărut o eroare la încărcarea sumarului analizelor."
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
  }, [
    studyId,
    filters.participantId,
    filters.parameterKey,
    filters.riskLabel,
    filters.modelType,
    filters.createdStartDate,
    filters.createdEndDate,
    refreshToken,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      setIsResultsLoading(true);
      setPageError("");

      try {
        const response = await listAllAnalysisResultsRequest({
          studyId,
          participantId: filters.participantId,
          parameterKey: filters.parameterKey,
          riskLabel: filters.riskLabel,
          modelType: filters.modelType,
          createdStartDate: filters.createdStartDate,
          createdEndDate: filters.createdEndDate,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (cancelled) {
          return;
        }

        setResults(response.items);
        setTotalRawResults(response.total);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setResults([]);
        setTotalRawResults(0);
        setPageError(
          error instanceof Error
            ? error.message
            : "A apărut o eroare la încărcarea analizelor generate."
        );
      } finally {
        if (!cancelled) {
          setIsResultsLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [
    studyId,
    filters.participantId,
    filters.parameterKey,
    filters.riskLabel,
    filters.modelType,
    filters.createdStartDate,
    filters.createdEndDate,
    filters.sortBy,
    filters.sortOrder,
    refreshToken,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadObservedValues() {
      if (
        !selectedRun ||
        !selectedParticipantGroup ||
        selectedRun.analysis_run_id === null
      ) {
        setObservedValues(null);
        setObservedValuesError("");
        return;
      }

      setIsObservedValuesLoading(true);
      setObservedValuesError("");

      try {
        const response = await getAnalysisObservedValuesRequest({
          studyId,
          analysisRunId: selectedRun.analysis_run_id,
          participantId: selectedParticipantGroup.participant_id,
        });

        if (cancelled) {
          return;
        }

        setObservedValues(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setObservedValues(null);
        setObservedValuesError(
          error instanceof Error
            ? error.message
            : "Datele observate nu au putut fi încărcate."
        );
      } finally {
        if (!cancelled) {
          setIsObservedValuesLoading(false);
        }
      }
    }

    void loadObservedValues();

    return () => {
      cancelled = true;
    };
  }, [studyId, selectedRun, selectedParticipantGroup]);

  const analysisRuns = useMemo(() => buildAnalysisRuns(results), [results]);

  useEffect(() => {
    if (hasOpenedRunFromUrl || isResultsLoading) {
      return;
    }

    const analysisRunIdParam = searchParams.get("analysisRunId");

    if (!analysisRunIdParam) {
      return;
    }

    const analysisRunId = Number(analysisRunIdParam);

    if (Number.isNaN(analysisRunId)) {
      return;
    }

    const matchingRun = analysisRuns.find(
      (run) => run.analysis_run_id === analysisRunId
    );

    if (!matchingRun) {
      return;
    }

    setSelectedRun(matchingRun);
    setSelectedParticipantGroup(matchingRun.participant_groups[0] ?? null);
    setHasOpenedRunFromUrl(true);
  }, [analysisRuns, hasOpenedRunFromUrl, isResultsLoading, searchParams]);

  const totalRuns = analysisRuns.length;
  const totalPages = Math.max(1, Math.ceil(totalRuns / GROUP_PAGE_SIZE));
  
  const paginatedRuns = useMemo(() => {
    const start = (page - 1) * GROUP_PAGE_SIZE;
    return analysisRuns.slice(start, start + GROUP_PAGE_SIZE);
  }, [analysisRuns, page]);

  const runStats = useMemo(() => {
    const highRiskRuns = analysisRuns.filter(shouldRunNeedAttention).length;
    const participantsAnalyzed = new Set(
      analysisRuns.flatMap((run) => run.participant_groups.map((item) => item.participant_id))
    ).size;
  
    const recordsUsed = analysisRuns.reduce(
      (total, run) => total + run.records_used,
      0
    );
  
    return {
      highRiskRuns,
      lowRiskRuns: Math.max(0, analysisRuns.length - highRiskRuns),
      participantsAnalyzed,
      recordsUsed,
    };
  }, [analysisRuns]);

  const highRiskRunRate = useMemo(() => {
    if (totalRuns === 0) {
    return 0;
    }
  
    return (runStats.highRiskRuns / totalRuns) * 100;
  }, [runStats.highRiskRuns, totalRuns]);
  
  const stableRunRate = useMemo(() => {
    if (totalRuns === 0) {
    return 0;
    }
  
    return (runStats.lowRiskRuns / totalRuns) * 100;
  }, [runStats.lowRiskRuns, totalRuns]);

  
  const averageRecordsPerRun = useMemo(() => {
    if (totalRuns === 0) {
      return 0;
    }
  
    return Math.round(runStats.recordsUsed / totalRuns);
  }, [runStats.recordsUsed, totalRuns]);

  const parameterRiskData = useMemo(() => {
    return (summary?.average_risk_by_parameter ?? []).map((item) => ({
      ...item,
      label: PARAMETER_SHORT_LABELS[item.parameter_key],
      full_label: PARAMETER_LABELS[item.parameter_key],
      percentage_value: item.average_risk_probability * 100,
    }));
  }, [summary]);

  const selectedRunChartData = useMemo(() => {
  if (!selectedRun) {
    return [];
  }

  const parameterMap = new Map<
    StudyParameterKey,
    {
      parameter_key: StudyParameterKey;
      total_probability: number;
      count: number;
      high_risk_count: number;
    }
  >();

  for (const result of selectedRun.results) {
    const current =
      parameterMap.get(result.parameter_key) ??
      {
        parameter_key: result.parameter_key,
        total_probability: 0,
        count: 0,
        high_risk_count: 0,
      };

    current.total_probability += result.risk_probability;
    current.count += 1;

    if (result.risk_label === "high_risk") {
      current.high_risk_count += 1;
    }

    parameterMap.set(result.parameter_key, current);
  }

  return Array.from(parameterMap.values()).map((item) => {
    const averageRisk = item.count > 0 ? item.total_probability / item.count : 0;

    return {
      parameter_key: item.parameter_key,
      label: PARAMETER_SHORT_LABELS[item.parameter_key],
      full_label: PARAMETER_LABELS[item.parameter_key],
      probability_percent: averageRisk * 100,
      risk_probability: averageRisk,
      risk_label: item.high_risk_count > 0 ? "high_risk" as AnalysisRiskLabel : "low_risk" as AnalysisRiskLabel,
      results_count: item.count,
      high_risk_count: item.high_risk_count,
    };
  });
  }, [selectedRun]);

  const selectedParticipantChartData = useMemo(() => {
    if (!selectedParticipantGroup) {
      return [];
    }
  
    return selectedParticipantGroup.results.map((result) => ({
      parameter_key: result.parameter_key,
      label: PARAMETER_SHORT_LABELS[result.parameter_key],
      full_label: PARAMETER_LABELS[result.parameter_key],
      probability_percent: result.risk_probability * 100,
      risk_probability: result.risk_probability,
      risk_label: result.risk_label,
    }));
  }, [selectedParticipantGroup]);

  const topParticipantsRiskData = useMemo(() => {
    const participantMap = new Map<
      number,
      {
        participant_id: number;
        label: string;
        risk_probability: number;
        risk_percent: number;
        high_risk_count: number;
      }
    >();
  
    for (const run of analysisRuns) {
      for (const participantGroup of run.participant_groups) {
        const current = participantMap.get(participantGroup.participant_id);
  
        const participantLabel =
          participantGroup.participant?.participant_code ??
          `P-${participantGroup.participant_id}`;
  
        const highestRisk = participantGroup.highest_risk_result.risk_probability;
  
        if (!current || highestRisk > current.risk_probability) {
          participantMap.set(participantGroup.participant_id, {
            participant_id: participantGroup.participant_id,
            label: participantLabel,
            risk_probability: highestRisk,
            risk_percent: highestRisk * 100,
            high_risk_count: participantGroup.high_risk_count,
          });
        }
      }
    }
  
    return Array.from(participantMap.values())
      .sort((a, b) => b.risk_probability - a.risk_probability)
      .slice(0, 5);
  }, [analysisRuns]);

  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages]
  );

  const rowStart = totalRuns === 0 ? 0 : (page - 1) * GROUP_PAGE_SIZE + 1;
  const rowEnd = Math.min(page * GROUP_PAGE_SIZE, totalRuns);

  const hasTableFilters =
    filters.participantId !== "" ||
    filters.parameterKey !== "" ||
    filters.riskLabel !== "" ||
    filters.modelType !== "" ||
    filters.createdStartDate !== "" ||
    filters.createdEndDate !== "" ||
    filters.sortBy !== "created_at" ||
    filters.sortOrder !== "desc";

  async function handleRunAnalysis(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsRunLoading(true);
    setPageError("");
    setSuccessMessage("");

  const payload: AnalysisRunPayload = {
    scope: runForm.scope,
    participant_id: runForm.participantId ? Number(runForm.participantId) : null,
    start_date:
      runForm.scope === "custom" && runForm.startDate
        ? new Date(`${runForm.startDate}T00:00:00`).toISOString()
        : null,
    end_date:
      runForm.scope === "custom" && runForm.endDate
        ? new Date(`${runForm.endDate}T23:59:59`).toISOString()
        : null,
    age_min: runForm.ageMin ? Number(runForm.ageMin) : null,
    age_max: runForm.ageMax ? Number(runForm.ageMax) : null,
    sex: runForm.sex || null,
    participant_group: runForm.participantGroup.trim() || null,
    activity_level: runForm.activityLevel || null,
    condition_type: runForm.conditionType || null,
    measurement_context: runForm.measurementContext || null,
    model_selection: runForm.modelSelection,
  };

    try {
      const response = await runAnalysisRequest(studyId, payload);

      setSuccessMessage(
        `${response.message} Rezultatele au fost adăugate în istoricul analizelor.`
      );

      setRefreshToken((prev) => prev + 1);
      setPage(1);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Analiza nu a putut fi rulată."
      );
    } finally {
      setIsRunLoading(false);
    }
  }

  function handleResetTableFilters() {
    setFilters({
      participantId: "",
      parameterKey: "",
      riskLabel: "",
      modelType: "",
      createdStartDate: "",
      createdEndDate: "",
      sortBy: "created_at",
      sortOrder: "desc",
    });
    setPage(1);
  }

  function handleClearRunFilters() {
    setRunForm((prev) => ({
      ...prev,
      ageMin: "",
      ageMax: "",
      sex: "",
      participantGroup: "",
      activityLevel: "",
      conditionType: "",
      measurementContext: "",
    }));
  }

  async function handleExportAnalysisRunReportPdf(run: AnalysisRunGroup) {
    if (run.analysis_run_id === null) {
      setPageError("Această analiză nu are un identificator valid pentru export.");
      return;
    }

    setExportingRunId(run.analysis_run_id);
    setPageError("");
    setSuccessMessage("");

    try {
      const pdfBlob = await exportAnalysisRunReportPdfRequest(
        studyId,
        run.analysis_run_id
      );

      downloadBlobFile(
        pdfBlob,
        `raport-vitalstudy-analiza-${run.analysis_run_id}.pdf`
      );

      setSuccessMessage("Raportul PDF pentru analiza selectată a fost exportat cu succes.");
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Raportul PDF pentru această analiză nu a putut fi exportat."
      );
    } finally {
      setExportingRunId(null);
    }
  }

  function handleOpenCollectedDataForSelectedParticipant() {
    if (!observedValues || !onOpenCollectedData) {
      return;
    }

    onOpenCollectedData({
      participantId: observedValues.participant_id,
      participantCode: observedValues.participant_code,
      startDate: observedValues.analysis_start_date,
      endDate: observedValues.analysis_end_date,
    });

    setSelectedRun(null);
    setSelectedParticipantGroup(null);
    setObservedValues(null);
    setObservedValuesError("");
  }

  function handleCloseAnalysisModal() {
    setSelectedRun(null);
    setSelectedParticipantGroup(null);
    setObservedValues(null);
    setObservedValuesError("");

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("analysisRunId");
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <section className="study-analysis">
      {pageError ? (
        <div className="study-analysis-banner study-analysis-banner--error">
          {pageError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="study-analysis-banner study-analysis-banner--success">
          {successMessage}
        </div>
      ) : null}

      <div className="study-analysis-run-card">
        <div className="study-analysis-run-card__header">
          <div>
            <h2>Rulează o analiză nouă</h2>
            <p>
              Selectează intervalul și cohorta pentru care vrei să rulezi analiza predictivă.
            </p>
          </div>
        </div>

        <form className="study-analysis-run-form" onSubmit={handleRunAnalysis}>
          <div className="study-analysis-run-form__main">
            <label>
              <span>Interval analiză</span>
              <select
                value={runForm.scope}
                onChange={(event) =>
                  setRunForm((prev) => ({
                    ...prev,
                    scope: event.target.value as AnalysisScope,
                  }))
                }
              >
                <option value="last_24h">Ultimele 24h</option>
                <option value="last_48h">Ultimele 48h</option>
                <option value="last_7_days">Ultimele 7 zile</option>
                <option value="custom">Interval personalizat</option>
              </select>
            </label>

            <label>
              <span>Participant</span>
              <select
                value={runForm.participantId}
                onChange={(event) =>
                  setRunForm((prev) => ({
                    ...prev,
                    participantId: event.target.value,
                  }))
                }
                disabled={isParticipantsLoading}
              >
                <option value="">Toți participanții</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.participant_code} · {participant.full_name}
                  </option>
                ))}
              </select>
            </label>

            {runForm.scope === "custom" ? (
              <>
                <label>
                  <span>De la</span>
                  <input
                    type="date"
                    value={runForm.startDate}
                    onChange={(event) =>
                      setRunForm((prev) => ({
                        ...prev,
                        startDate: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  <span>Până la</span>
                  <input
                    type="date"
                    value={runForm.endDate}
                    onChange={(event) =>
                      setRunForm((prev) => ({
                        ...prev,
                        endDate: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </>
            ) : null}

            <button
              type="button"
              className={`study-analysis-filter-toggle ${
                advancedRunFiltersOpen ? "is-active" : ""
              }`}
              onClick={() => setAdvancedRunFiltersOpen((prev) => !prev)}
            >
              <FilterIcon />
              Filtre cohortă
            </button>

            <button
              type="submit"
              className="study-analysis-run-btn"
              disabled={isRunLoading}
            >
              <PlayIcon />
              {isRunLoading ? "Se rulează..." : "Rulează analiza"}
            </button>
          </div>

          <div className="study-analysis-model-summary">
            <div className="study-analysis-model-summary__content">
              <strong>
                {hasCustomModelSelection
                  ? "Selecție manuală de modele"
                  : "Modelele folosite pentru analiză"}
              </strong>

              <p>
                {hasCustomModelSelection
                  ? "Ai selectat manual cel puțin un model. Rezultatele acestei analize vor reflecta selecția curentă pentru fiecare semn vital."
                  : "Aplicația folosește automat o selecție inițială de modele pentru fiecare semn vital. Poți ajusta selecția pentru a observa cum diferite modele estimează riscul pe datele acestui studiu."}
              </p>
            </div>

            <button
              type="button"
              className="study-analysis-model-toggle"
              aria-expanded={isModelSelectionOpen}
              onClick={() => setIsModelSelectionOpen((prev) => !prev)}
            >
              {isModelSelectionOpen ? "Ascunde modelele" : "Configurează modelele"}
            </button>
          </div>

          {isModelSelectionOpen ? (
            <div className="study-analysis-model-selection">
              <div className="study-analysis-model-selection__header">
                <div>
                  <h3>Configurează modelul pentru fiecare semn vital</h3>
                  <p>
                    Modelele pot reacționa diferit în funcție de structura și volumul datelor analizate.
                    Poți păstra selecția inițială sau poți alege manual un model pentru fiecare parametru.
                  </p>
                </div>

                <button
                  type="button"
                  className="study-analysis-model-reset"
                  onClick={() =>
                    setRunForm((prev) => ({
                      ...prev,
                      modelSelection: DEFAULT_MODEL_SELECTION,
                    }))
                  }
                >
                  Revino la selecția inițială
                </button>
              </div>

              <div className="study-analysis-model-grid">
                {(["heartRate", "respiratoryRate", "spo2", "temperature"] as StudyParameterKey[]).map(
                  (parameterKey) => {
                    const isDefaultModel =
                      runForm.modelSelection[parameterKey] ===
                      DEFAULT_MODEL_SELECTION[parameterKey];

                    return (
                      <label key={parameterKey} className="study-analysis-model-card">
                        <span
                          className={`study-analysis-parameter ${getParameterClassName(
                            parameterKey
                          )}`}
                        >
                          {PARAMETER_LABELS[parameterKey]}
                        </span>

                        <select
                          value={runForm.modelSelection[parameterKey]}
                          onChange={(event) =>
                            setRunForm((prev) => ({
                              ...prev,
                              modelSelection: {
                                ...prev.modelSelection,
                                [parameterKey]: event.target.value as AnalysisModelType,
                              },
                            }))
                          }
                        >
                          {ANALYSIS_MODEL_OPTIONS.map((option) => (
                            <option key={`${parameterKey}-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <small className={isDefaultModel ? "is-default" : "is-custom"}>
                          {isDefaultModel ? "Selecție inițială" : "Selectat manual"}
                        </small>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          ) : null}

          {advancedRunFiltersOpen ? (
            <div className="study-analysis-advanced-filters">
              <label>
                <span>Vârstă minimă</span>
                <input
                  type="number"
                  min={0}
                  value={runForm.ageMin}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      ageMin: event.target.value,
                    }))
                  }
                  placeholder="Ex. 18"
                />
              </label>

              <label>
                <span>Vârstă maximă</span>
                <input
                  type="number"
                  min={0}
                  value={runForm.ageMax}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      ageMax: event.target.value,
                    }))
                  }
                  placeholder="Ex. 65"
                />
              </label>

              <label>
                <span>Sex</span>
                <select
                  value={runForm.sex}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      sex: event.target.value as ParticipantSex | "",
                    }))
                  }
                >
                  <option value="">Toate</option>
                  {SEX_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Grup participant</span>
                <input
                  type="text"
                  value={runForm.participantGroup}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      participantGroup: event.target.value,
                    }))
                  }
                  placeholder="Ex. Lot A, control..."
                />
              </label>

              <label>
                <span>Nivel activitate</span>
                <select
                  value={runForm.activityLevel}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      activityLevel: event.target.value as ActivityLevel | "",
                    }))
                  }
                >
                  <option value="">Toate</option>
                  {ACTIVITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Afecțiune</span>
                <select
                  value={runForm.conditionType}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      conditionType: event.target.value as ParticipantConditionType | "",
                    }))
                  }
                >
                  <option value="">Toate</option>
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Context măsurare</span>
                <select
                  value={runForm.measurementContext}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      measurementContext: event.target.value as MeasurementContext | "",
                    }))
                  }
                >
                  <option value="">Toate</option>
                  {MEASUREMENT_CONTEXT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="study-analysis-clear-btn"
                onClick={handleClearRunFilters}
              >
                Resetează filtrele de cohortă
              </button>
            </div>
          ) : null}
        </form>
      </div>

      <div className="study-analysis-summary">
        <article className="study-analysis-summary-card">
          <SummaryIconChart value={100} tone="blue" icon={<ChartIcon />} />

          <div className="study-analysis-summary-card__content">
            <span>Analize rulate</span>
            <strong>{isResultsLoading ? "..." : formatNumber(totalRuns)}</strong>
            <small>{formatNumber(totalRawResults)} evaluări pe parametri</small>
          </div>
        </article>

        <article className="study-analysis-summary-card">
          <SummaryIconChart value={100} tone="gray" icon={<UsersIcon />} />

          <div className="study-analysis-summary-card__content">
            <span>Participanți analizați</span>
            <strong>
              {isResultsLoading ? "..." : formatNumber(runStats.participantsAnalyzed)}
            </strong>
            <small>în analizele afișate</small>
          </div>
        </article>

        <article className="study-analysis-summary-card">
          <SummaryIconChart value={highRiskRunRate} tone="red" icon={<AlertIcon />} />

          <div className="study-analysis-summary-card__content">
            <span>Necesită atenție</span>
            <strong>
              {isResultsLoading ? "..." : formatNumber(runStats.highRiskRuns)}
            </strong>
            <small>{formatPercent(highRiskRunRate)} din analize</small>
          </div>
        </article>

        <article className="study-analysis-summary-card">
          <SummaryIconChart value={stableRunRate} tone="green" icon={<BrainIcon />} />

          <div className="study-analysis-summary-card__content">
            <span>Analize stabile</span>
            <strong>
              {isResultsLoading ? "..." : formatNumber(runStats.lowRiskRuns)}
            </strong>
            <small>{formatPercent(stableRunRate)} din analize</small>
          </div>
        </article>

        <article className="study-analysis-summary-card">
          <SummaryIconChart value={100} tone="orange" icon={<RecordsIcon />} />

          <div className="study-analysis-summary-card__content">
            <span>Înregistrări analizate</span>
            <strong>{isResultsLoading ? "..." : formatNumber(runStats.recordsUsed)}</strong>
            <small>{formatNumber(averageRecordsPerRun)} înregistrări / analiză</small>
          </div>
        </article>
      </div>

      <div className="study-analysis-charts-grid">
        <article className="study-analysis-chart-card">
          <div className="study-analysis-chart-card__header">
            <div>
              <h3>Risc mediu pe parametri</h3>
              <p>
                Compară probabilitatea medie de risc pentru fiecare semn vital analizat.
              </p>
            </div>
          </div>

          <div className="study-analysis-chart-wrap">
            {isSummaryLoading ? (
              <div className="study-analysis-chart-loading">
                Se încarcă datele pentru grafic...
              </div>
            ) : parameterRiskData.length === 0 ? (
              <div className="study-analysis-chart-empty">
                Nu există rezultate suficiente pentru acest grafic.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={parameterRiskData}
                  margin={{ top: 16, right: 20, left: -14, bottom: 4 }}
                >
                  <CartesianGrid stroke="#e7eee8" vertical={false} />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#6f7f83", fontWeight: 700 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#6f7f83", fontWeight: 700 }}
                    width={42}
                    tickFormatter={(value) => `${value}%`}
                  />

                  <Tooltip content={<ParameterRiskTooltip />} />

                  <Bar
                    dataKey="percentage_value"
                    radius={[10, 10, 0, 0]}
                    fill="#76b65c"
                    maxBarSize={64}
                  >
                    {parameterRiskData.map((item) => (
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

        <article className="study-analysis-chart-card">
          <div className="study-analysis-chart-card__header">
            <div>
              <h3>Top participanți după risc maxim</h3>
              <p>
                Evidențiază participanții cu cea mai mare probabilitate de risc în analizele afișate.
              </p>
            </div>
          </div>

          <div className="study-analysis-chart-wrap">
            {isResultsLoading ? (
              <div className="study-analysis-chart-loading">
                Se încarcă participanții cu risc ridicat...
              </div>
            ) : topParticipantsRiskData.length === 0 ? (
              <div className="study-analysis-chart-empty">
                Nu există participanți analizați pentru criteriile selectate.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topParticipantsRiskData}
                  margin={{ top: 16, right: 20, left: -9, bottom: 4 }}
                >
                  <CartesianGrid stroke="#e7eee8" vertical={false} />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#6f7f83", fontWeight: 700 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#6f7f83", fontWeight: 700 }}
                    width={42}
                    tickFormatter={(value) => `${value}%`}
                  />

                  <Tooltip content={<TopParticipantsRiskTooltip />} />

                  <Bar
                    dataKey="risk_percent"
                    radius={[10, 10, 0, 0]}
                    fill="#cf6b64"
                    maxBarSize={58}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </div>

      <div className="study-analysis-results-card">
        <div className="study-analysis-results-card__top">
          <div>
            <h3>Analize și rapoarte generate</h3>
            <p>
              Selectează o analiză din istoric pentru a consulta raportul asociat acesteia,
              cu intervalul analizat, criteriile folosite, participanții incluși, rezultatele predictive
              și datele observate utilizate în procesare.
            </p>
          </div>

          <button
            type="button"
            className={`study-analysis-filter-toggle ${
              tableFiltersOpen ? "is-active" : ""
            }`}
            onClick={() => setTableFiltersOpen((prev) => !prev)}
          >
            <FilterIcon />
            Filtre tabel
          </button>
        </div>

        {tableFiltersOpen ? (
          <div className="study-analysis-table-filters">
            <label>
              <span>Participant</span>
              <select
                value={filters.participantId}
                onChange={(event) => {
                  setFilters((prev) => ({
                    ...prev,
                    participantId: event.target.value,
                  }));
                  setPage(1);
                }}
              >
                <option value="">Toți</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.participant_code} · {participant.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Parametru</span>
              <select
                value={filters.parameterKey}
                onChange={(event) => {
                  setFilters((prev) => ({
                    ...prev,
                    parameterKey: event.target.value as StudyParameterKey | "",
                  }));
                  setPage(1);
                }}
              >
                <option value="">Toți</option>
                <option value="heartRate">Ritm cardiac</option>
                <option value="respiratoryRate">Frecvență respiratorie</option>
                <option value="spo2">SpO₂</option>
                <option value="temperature">Temperatură</option>
              </select>
            </label>

            <label>
              <span>Risc</span>
              <select
                value={filters.riskLabel}
                onChange={(event) => {
                  setFilters((prev) => ({
                    ...prev,
                    riskLabel: event.target.value as AnalysisRiskLabel | "",
                  }));
                  setPage(1);
                }}
              >
                <option value="">Toate</option>
                <option value="high_risk">Risc ridicat</option>
                <option value="low_risk">Risc scăzut</option>
              </select>
            </label>

            <div className="study-analysis-date-filter">
              <span>Perioadă</span>

              <button
                type="button"
                className={`study-analysis-date-filter__trigger ${
                  dateFilterOpen ? "is-active" : ""
                }`}
                onClick={() => setDateFilterOpen((prev) => !prev)}
              >
                {filters.createdStartDate || filters.createdEndDate
                  ? `${filters.createdStartDate || "Început"} - ${
                      filters.createdEndDate || "Sfârșit"
                    }`
                  : "Alege perioada"}
              </button>

              {dateFilterOpen ? (
                <div className="study-analysis-date-filter__popover">
                  <label>
                    <span>Rulat de la</span>
                    <input
                      type="date"
                      value={filters.createdStartDate}
                      onChange={(event) => {
                        setFilters((prev) => ({
                          ...prev,
                          createdStartDate: event.target.value,
                        }));
                        setPage(1);
                      }}
                    />
                  </label>

                  <label>
                    <span>Rulat până la</span>
                    <input
                      type="date"
                      value={filters.createdEndDate}
                      onChange={(event) => {
                        setFilters((prev) => ({
                          ...prev,
                          createdEndDate: event.target.value,
                        }));
                        setPage(1);
                      }}
                    />
                  </label>

                  <div className="study-analysis-date-filter__actions">
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          createdStartDate: "",
                          createdEndDate: "",
                        }));
                        setPage(1);
                      }}
                    >
                      Șterge perioada
                    </button>

                    <button
                      type="button"
                      onClick={() => setDateFilterOpen(false)}
                    >
                      Aplică
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <label>
              <span>Sortare</span>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(event) => {
                  const value = event.target.value;

                  if (value === "created_at_desc") {
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: "created_at",
                      sortOrder: "desc",
                    }));
                  } else if (value === "created_at_asc") {
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: "created_at",
                      sortOrder: "asc",
                    }));
                  } else if (value === "risk_probability_desc") {
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: "risk_probability",
                      sortOrder: "desc",
                    }));
                  } else if (value === "risk_probability_asc") {
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: "risk_probability",
                      sortOrder: "asc",
                    }));
                  } else if (value === "records_used_desc") {
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: "records_used",
                      sortOrder: "desc",
                    }));
                  } else {
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: "records_used",
                      sortOrder: "asc",
                    }));
                  }

                  setPage(1);
                }}
              >
                <option value="created_at_desc">Cele mai recente</option>
                <option value="created_at_asc">Cele mai vechi</option>
                <option value="risk_probability_desc">Risc descrescător</option>
                <option value="risk_probability_asc">Risc crescător</option>
                <option value="records_used_desc">Cele mai multe date</option>
                <option value="records_used_asc">Cele mai puține date</option>
              </select>
            </label>

            <button
              type="button"
              className="study-analysis-clear-btn"
              onClick={handleResetTableFilters}
              disabled={!hasTableFilters}
            >
              <RefreshIcon />
              Resetează
            </button>
          </div>
        ) : null}

        <div className="study-analysis-table-wrap">
          {isResultsLoading ? (
            <div className="study-analysis-loading">
              Se încarcă istoricul analizelor...
            </div>
          ) : paginatedRuns.length === 0 ? (
            <div className="study-analysis-empty">
              <div className="study-analysis-empty__icon">
                <EmptyIcon />
              </div>
              <h3>Nu există analize pentru criteriile selectate</h3>
              <p>
                Rulează o analiză nouă sau modifică filtrele pentru a vedea
                rezultatele salvate.
              </p>
            </div>
          ) : (
            <table className="study-analysis-table">
              <thead>
                <tr>
                  <th className="study-analysis-col-created">Data rulării</th>
                  <th className="study-analysis-col-interval">Interval analizat</th>
                  <th className="study-analysis-col-criteria">Criterii analiză</th>
                  <th className="study-analysis-col-participants">Participanți</th>
                  <th className="study-analysis-col-risk">Risc maxim</th>
                  <th className="study-analysis-col-report">Raport</th>
                  <th className="study-analysis-col-records">Înregistrări</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRuns.map((run) => (
                  <tr
                    key={run.key}
                    onClick={() => {
                      setSelectedRun(run);
                      setSelectedParticipantGroup(run.participant_groups[0] ?? null);

                      if (run.analysis_run_id !== null) {
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.set("analysisRunId", String(run.analysis_run_id));
                        setSearchParams(nextParams, { replace: true });
                      }
                    }}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedRun(run);
                        setSelectedParticipantGroup(run.participant_groups[0] ?? null);
                      }
                    }}
                  >
                    <td className="study-analysis-col-created">
                      {formatDateTime(run.created_at)}
                    </td>

                    <td className="study-analysis-col-interval">
                      {getAnalysisIntervalLabel(run)}
                    </td>

                    <td className="study-analysis-col-criteria">
                      <div className="study-analysis-criteria-list">
                        {getAnalysisCriteriaLabels(run).slice(0, 3).map((label) => (
                          <span key={label} className="study-analysis-criteria-badge">
                            {label}
                          </span>
                        ))}

                        {getAnalysisCriteriaLabels(run).length > 3 ? (
                          <span className="study-analysis-criteria-more">
                            +{getAnalysisCriteriaLabels(run).length - 3}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="study-analysis-col-participants">
                      <strong>{formatNumber(run.participants_count)}</strong>
                      <small className="study-analysis-table-muted"> participanți</small>
                    </td>

                    <td className="study-analysis-table__probability study-analysis-col-risk">
                      {formatProbability(run.highest_risk_result.risk_probability)}
                    </td>

                    <td className="study-analysis-col-report">
                      <span className={`study-analysis-risk ${getRunRiskClassName(run)}`}>
                        {shouldRunNeedAttention(run) ? "Raport cu risc" : "Raport stabil"}
                      </span>
                    </td>

                    <td className="study-analysis-col-records">
                      {formatNumber(run.records_used)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="study-analysis-footer">
          <span>
            Afișare {rowStart} - {rowEnd} din {totalRuns} analize
          </span>

          <div className="study-analysis-pagination">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1 || isResultsLoading}
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
                    disabled={isResultsLoading}
                  >
                    {pageNumber}
                  </button>
                </span>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || isResultsLoading}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {selectedRun ? (
        <div
          className="study-analysis-modal-overlay"
          onClick={handleCloseAnalysisModal}
        >
          <section
            className="study-analysis-modal"
            onClick={(event) => event.stopPropagation()}
          >
          <div className="study-analysis-modal__header">
            <div>
              <span className="study-analysis-modal__eyebrow">
                Analiză rulată la {formatDateTime(selectedRun.created_at)}
              </span>

              <h3>Raport analiză predictivă</h3>

              <div className="study-analysis-modal__badges">
                <span className={`study-analysis-risk ${getRunRiskClassName(selectedRun)}`}>
                  {shouldRunNeedAttention(selectedRun) ? "Necesită atenție" : "Stabilă"}
                </span>

                <button
                  type="button"
                  className="study-analysis-modal-export-btn"
                  onClick={() => handleExportAnalysisRunReportPdf(selectedRun)}
                  disabled={
                    selectedRun.analysis_run_id === null ||
                    exportingRunId === selectedRun.analysis_run_id
                  }
                >
                  <DownloadIcon />
                  {exportingRunId === selectedRun.analysis_run_id
                    ? "Se exportă..."
                    : "Exportă raport PDF"}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="study-analysis-modal__close"
              onClick={handleCloseAnalysisModal}
              aria-label="Închide"
            >
              <CloseIcon />
            </button>
          </div>

            <div className="study-analysis-modal__content">
              <section className="study-analysis-modal-info-grid">
                <article className="study-analysis-modal-card study-analysis-modal-card--context">
                  <h4>Contextul analizei</h4>

                  <dl>
                    <div>
                      <dt>Interval analizat</dt>
                      <dd>{getAnalysisIntervalLabel(selectedRun)}</dd>
                    </div>

                    <div>
                      <dt>Tip interval</dt>
                      <dd>{getScopeLabel(selectedRun.analysis_scope)}</dd>
                    </div>

                    <div>
                      <dt>Criterii selectate</dt>
                      <dd>
                        <div>
                          {getAnalysisCriteriaLabels(selectedRun).map((label) => (
                            <span key={label}>{label}</span>
                          ))}
                        </div>
                      </dd>
                    </div>
                  </dl>
                </article>

                <article className="study-analysis-modal-card study-analysis-modal-card--probability">
                  <div className="study-analysis-probability-header">
                    <span className="study-analysis-probability-icon">
                      <InfoBulbIcon />
                    </span>

                    <div>
                      <h4>Ce reprezintă probabilitatea?</h4>
                    </div>
                  </div>

                <div className="study-analysis-probability-list">
                  <p>
                    Valoarea indică riscul estimat ca semnul vital analizat să ajungă
                    în afara intervalului normal în ora următoare.
                  </p>
                </div>
                </article>
              </section>

              <section className="study-analysis-modal-stats">
                <article className="study-analysis-modal-stat is-blue">
                  <div className="study-analysis-modal-stat__icon">
                    <UsersIcon />
                  </div>

                  <div className="study-analysis-modal-stat__content">
                    <span>Participanți</span>
                    <strong>{formatNumber(selectedRun.participants_count)}</strong>
                    <small>incluși în această analiză</small>
                  </div>
                </article>

                <article className="study-analysis-modal-stat is-green">
                  <div className="study-analysis-modal-stat__icon">
                    <ChartIcon />
                  </div>

                  <div className="study-analysis-modal-stat__content">
                    <span>Rezultate generate</span>
                    <strong>{formatNumber(selectedRun.results.length)}</strong>
                    <small>pe parametrii evaluați</small>
                  </div>
                </article>

                <article className="study-analysis-modal-stat is-red">
                  <div className="study-analysis-modal-stat__icon">
                    <AlertIcon />
                  </div>

                  <div className="study-analysis-modal-stat__content">
                    <span>Rezultate cu risc</span>
                    <strong>{formatNumber(selectedRun.high_risk_count)}</strong>
                    <small>necesită interpretare atentă</small>
                  </div>
                </article>

                <article className="study-analysis-modal-stat is-orange">
                  <div className="study-analysis-modal-stat__icon">
                    <RecordsIcon />
                  </div>

                  <div className="study-analysis-modal-stat__content">
                    <span>Înregistrări folosite</span>
                    <strong>{formatNumber(selectedRun.records_used)}</strong>
                    <small>date fiziologice procesate</small>
                  </div>
                </article>
              </section>

              <section className="study-analysis-modal-grid">
                <article className="study-analysis-modal-card">
                  <h4>Risc mediu pe parametri</h4>

                  <div className="study-analysis-modal-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedRunChartData}
                        margin={{ top: 12, right: 12, left: -8, bottom: 2 }}
                      >
                        <CartesianGrid stroke="#e7eee8" vertical={false} />

                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: "#6f7f83", fontWeight: 700 }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: "#6f7f83", fontWeight: 700 }}
                          width={38}
                          tickFormatter={(value) => `${value}%`}
                        />

                        <Tooltip content={<SelectedAnalysisTooltip />} />

                        <Bar
                          dataKey="probability_percent"
                          radius={[9, 9, 0, 0]}
                          maxBarSize={48}
                        >
                          {selectedRunChartData.map((item) => (
                            <Cell
                              key={item.parameter_key}
                              fill={PARAMETER_COLORS[item.parameter_key]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="study-analysis-modal-card">
                  <h4>Participanți incluși în analiză</h4>

                  <div className="study-analysis-run-participants">
                    {selectedRun.participant_groups.map((participantGroup) => (
                      <button
                        key={participantGroup.key}
                        type="button"
                        className={`study-analysis-run-participant ${
                          selectedParticipantGroup?.participant_id === participantGroup.participant_id
                            ? "is-selected"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedParticipantGroup(participantGroup);
                          setObservedValues(null);
                          setObservedValuesError("");
                        }}
                      >
                        <span>
                          {getInitials(participantGroup.participant?.full_name ?? "P")}
                        </span>

                        <div>
                          <strong>
                            {participantGroup.participant?.full_name ?? "Participant necunoscut"}
                          </strong>
                          <small>
                            {participantGroup.participant?.participant_code ?? "—"} ·{" "}
                            {formatProbability(participantGroup.highest_risk_result.risk_probability)}
                          </small>
                        </div>

                        <em
                          className={`study-analysis-risk ${getParticipantRiskClassName(
                            participantGroup
                          )}`}
                        >
                          {participantGroup.high_risk_count > 0 ? "Risc" : "Stabil"}
                        </em>
                      </button>
                    ))}
                  </div>
                </article>
              </section>

              {selectedParticipantGroup ? (
                <>
                  <div className="study-analysis-modal-divider">
                    <span>Detalii pentru participantul selectat</span>
                  </div>

                  <section className="study-analysis-participant-grid">
                  <article className="study-analysis-modal-card study-analysis-participant-detail-card">
                    <div className="study-analysis-participant-detail-header">
                      <div>
                        <h4>
                          Detalii participant:{" "}
                          {selectedParticipantGroup.participant?.full_name ??
                            "Participant necunoscut"}
                        </h4>

                        <p>
                          {selectedParticipantGroup.participant?.participant_code ?? "—"} · risc maxim{" "}
                          {formatProbability(
                            selectedParticipantGroup.highest_risk_result.risk_probability
                          )}
                        </p>
                      </div>

                      <span
                        className={`study-analysis-risk ${getParticipantRiskClassName(
                          selectedParticipantGroup
                        )}`}
                      >
                        {selectedParticipantGroup.high_risk_count > 0
                          ? `${selectedParticipantGroup.high_risk_count} parametri cu risc`
                          : "Fără risc ridicat"}
                      </span>
                    </div>

                    <div className="study-analysis-modal-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={selectedParticipantChartData}
                          margin={{ top: 12, right: 12, left: -8, bottom: 2 }}
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
                            width={38}
                            tickFormatter={(value) => `${value}%`}
                          />

                          <Tooltip content={<SelectedAnalysisTooltip />} />

                          <Bar
                            dataKey="probability_percent"
                            radius={[9, 9, 0, 0]}
                            maxBarSize={46}
                          >
                            {selectedParticipantChartData.map((item) => (
                              <Cell
                                key={item.parameter_key}
                                fill={PARAMETER_COLORS[item.parameter_key]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </article>

                  <article className="study-analysis-modal-card study-analysis-vitals-card">
                    <h4>Semne vitale analizate</h4>

                    <div className="study-analysis-result-list study-analysis-result-list--grid">
                      {selectedParticipantGroup.results.map((result) => (
                        <article key={result.id}>
                          <div className="study-analysis-result-list__top">
                            <span
                              className={`study-analysis-parameter ${getParameterClassName(
                                result.parameter_key
                              )}`}
                            >
                              {PARAMETER_LABELS[result.parameter_key]}
                            </span>

                            <span
                              className={`study-analysis-risk ${getRiskClassName(
                                result.risk_label
                              )}`}
                            >
                              {RISK_LABELS[result.risk_label]}
                            </span>
                          </div>

                          <dl>
                            <div>
                              <dt>Probabilitate</dt>
                              <dd>{formatProbability(result.risk_probability)}</dd>
                            </div>

                            <div>
                              <dt>Model</dt>
                              <dd>{MODEL_LABELS[result.model_type] ?? result.model_name}</dd>
                            </div>

                            <div>
                              <dt>Înregistrări</dt>
                              <dd>{formatNumber(result.records_used)}</dd>
                            </div>

                            {["rnn", "lstm", "lstm_rf", "lstm_xgb"].includes(result.model_type) &&
                            result.window_size ? (
                              <div>
                                <dt>Fereastră temporală</dt>
                                <dd>{result.window_size} înregistrări</dd>
                              </div>
                            ) : null}
                          </dl>
                        </article>
                      ))}
                    </div>
                  </article>

                  <section className="study-analysis-modal-card study-analysis-observed-card">
                    <div className="study-analysis-observed-card__header">
                      <div>
                        <h4>Date observate trimise de participant</h4>
                        <p>
                          Valorile fiziologice folosite ca bază pentru interpretarea rezultatului
                          în intervalul acestei analize.
                        </p>
                      </div>

                      {observedValues ? (
                        <span>
                          {formatNumber(observedValues.records_count)} înregistrări ·{" "}
                          {formatNumber(observedValues.values_count)} valori
                        </span>
                      ) : null}
                    </div>

                    {isObservedValuesLoading ? (
                      <div className="study-analysis-observed-state">
                        Se încarcă datele observate...
                      </div>
                    ) : observedValuesError ? (
                      <div className="study-analysis-observed-state is-error">
                        {observedValuesError}
                      </div>
                    ) : !observedValues ? (
                      <div className="study-analysis-observed-state">
                        Nu există date observate disponibile pentru acest participant.
                      </div>
                    ) : (
                      <>
                        <div className="study-analysis-observed-summary">
                          {observedValues.summaries.map((item) => (
                            <article key={item.parameter_key}>
                              <span
                                className={`study-analysis-parameter ${getParameterClassName(
                                  item.parameter_key
                                )}`}
                              >
                                {PARAMETER_LABELS[item.parameter_key]}
                              </span>

                              <dl>
                                <div>
                                  <dt>Minim</dt>
                                  <dd>
                                    {formatVitalValue(item.min_value, getParameterUnit(item.parameter_key))}
                                  </dd>
                                </div>

                                <div>
                                  <dt>Medie</dt>
                                  <dd>
                                    {formatVitalValue(
                                      item.average_value,
                                      getParameterUnit(item.parameter_key)
                                    )}
                                  </dd>
                                </div>

                                <div>
                                  <dt>Maxim</dt>
                                  <dd>
                                    {formatVitalValue(item.max_value, getParameterUnit(item.parameter_key))}
                                  </dd>
                                </div>
                              </dl>
                            </article>
                          ))}
                        </div>

                        <div className="study-analysis-observed-table-wrap">
                          <table className="study-analysis-observed-table">
                            <thead>
                              <tr>
                                <th className="study-analysis-observed-col-moment">Moment măsurare</th>
                                <th className="study-analysis-observed-col-hr">Ritm cardiac</th>
                                <th className="study-analysis-observed-col-rr">Frecvență respiratorie</th>
                                <th className="study-analysis-observed-col-spo2">SpO₂</th>
                                <th className="study-analysis-observed-col-temp">Temperatură</th>
                              </tr>
                            </thead>

                            <tbody>
                              {observedValues.records.slice(0, 3).map((record) => (
                                <tr key={record.measured_at}>
                                  <td className="study-analysis-observed-col-moment">
                                    {formatDateTime(record.measured_at)}
                                  </td>

                                  <td className="study-analysis-observed-col-hr">
                                    {formatVitalValue(record.heart_rate, "bătăi/min")}
                                  </td>

                                  <td className="study-analysis-observed-col-rr">
                                    {formatVitalValue(record.respiratory_rate, "respirații/min")}
                                  </td>

                                  <td className="study-analysis-observed-col-spo2">
                                    {formatVitalValue(record.spo2, "%")}
                                  </td>

                                  <td className="study-analysis-observed-col-temp">
                                    {formatVitalValue(record.temperature, "°C")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {observedValues.records.length > 3 ? (
                            <div className="study-analysis-observed-note">
                              <span>
                                Sunt afișate primele 3 înregistrări din{" "}
                                {formatNumber(observedValues.records.length)}.
                              </span>

                              <button
                                type="button"
                                onClick={handleOpenCollectedDataForSelectedParticipant}
                                disabled={!onOpenCollectedData}
                              >
                                Vezi toate datele colectate
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </section>
                  </section>
                </>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}