import { authFetch } from "../auth/authFetch";
import type {
  DataEntryMode,
  MeasurementFrequency,
  StudyParameterKey,
  StudyStatus,
  StudyType,
} from "./studiesApi";

export type ParticipantSex =
  | "female"
  | "male"
  | "other"
  | "prefer_not_to_say";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete"
  | "unknown";

export type ParticipantConditionType =
  | "cardiovascular"
  | "respiratory"
  | "metabolic"
  | "neurological"
  | "endocrine"
  | "other"
  | "none_declared"
  | "prefer_not_to_say";

export type MeasurementContext =
  | "rest"
  | "during_effort"
  | "after_effort"
  | "after_meal"
  | "stress"
  | "sleep"
  | "unknown";

export type ParticipantConditionCreate = {
  condition_type: ParticipantConditionType;
  notes?: string | null;
};

export type ParticipantConditionResponse = {
  id: number;
  condition_type: ParticipantConditionType;
  notes: string | null;
};

export type AnalysisScope =
  | "last_24h"
  | "last_48h"
  | "last_7_days"
  | "custom";

export type AnalysisModelType =
  | "logistic_regression"
  | "decision_tree"
  | "random_forest"
  | "knn"
  | "xgboost"
  | "rnn"
  | "lstm"
  | "lstm_rf"
  | "lstm_xgb";

export type AnalysisModelSelection = Partial<
  Record<StudyParameterKey, AnalysisModelType>
>;

export type AnalysisRunPayload = {
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

export type AnalysisResultResponse = {
  id: number;
  study_id: number;
  participant_id: number;
  parameter_key: StudyParameterKey;
  model_type: AnalysisModelType;
  model_name: string;
  risk_probability: number;
  risk_label: string;
  records_used: number;
  window_size: number | null;
  analysis_start_date: string | null;
  analysis_end_date: string | null;
  analysis_scope: string;
  created_at: string;
};

export type AnalysisRunListItemResponse = {
  id: number;
  study_id: number;
  requested_participant_id: number | null;

  analysis_scope: string;
  analysis_start_date: string | null;
  analysis_end_date: string | null;
  model_selection: AnalysisModelSelection | null;

  filter_age_min: number | null;
  filter_age_max: number | null;
  filter_sex: string | null;
  filter_participant_group: string | null;
  filter_activity_level: string | null;
  filter_condition_type: string | null;
  filter_measurement_context: string | null;

  participants_analyzed: number;
  total_results: number;
  high_risk_results: number;
  low_risk_results: number;
  records_used: number;

  max_risk_probability: number | null;
  max_risk_parameter_key: StudyParameterKey | null;

  created_at: string;
};

export type AnalysisRunResponse = {
  message: string;
  analysis_run: AnalysisRunListItemResponse;
  results: AnalysisResultResponse[];
};

export type StudyResearcherResponse = {
  id: number;
  full_name: string;
  email: string;
  institution: string | null;
};

export type StudyParameterResponse = {
  id: number;
  parameter_key: StudyParameterKey;
  measurement_frequency: MeasurementFrequency;
};

export type ResearcherStudyDetailResponse = {
  id: number;
  title: string;
  code: string;
  description: string | null;
  study_type: StudyType;
  data_entry_mode: DataEntryMode;
  status: StudyStatus;

  start_date: string | null;
  end_date: string | null;

  institution: string | null;
  target_participants: number | null;
  collection_rules: string | null;
  inclusion_criteria: string | null;
  administrative_notes: string | null;

  participants_count: number;
  researcher_id: number;
  researcher: StudyResearcherResponse;

  created_at: string;
  updated_at: string;

  can_delete: boolean;
  delete_restriction_reason: string | null;

  parameters: StudyParameterResponse[];
};

export type UpdateResearcherStudyPayload = Partial<{
  title: string;
  start_date: string | null;
  end_date: string | null;
  study_type: StudyType;
  data_entry_mode: DataEntryMode;
  status: StudyStatus;
  description: string | null;
  institution: string | null;
  target_participants: number | null;
  collection_rules: string | null;
  inclusion_criteria: string | null;
  administrative_notes: string | null;
  parameters: {
    parameter_key: StudyParameterKey;
    measurement_frequency: MeasurementFrequency;
  }[];
}>;

export type ParticipantSummaryResponse = {
  total_participants: number;
  invited_participants: number;
  active_participants: number;
  suspended_participants: number;
  completed_participants: number;
  withdrawn_participants: number;
};

export type StudyDataSummaryResponse = {
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

export type StudyDataTimelinePointResponse = {
  label: string;
  submissions_count: number;
  sessions_count: number;
  records_count: number;
  values_count: number;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.detail ?? "A apărut o eroare la comunicarea cu serverul."
    );
  }

  return response.json() as Promise<T>;
}

export async function getResearcherStudyDetailsRequest(
  studyId: number
): Promise<ResearcherStudyDetailResponse> {
  const response = await authFetch(`/studies/${studyId}`);
  return parseJsonResponse<ResearcherStudyDetailResponse>(response);
}

export async function getResearcherStudyParticipantsSummaryRequest(
  studyId: number
): Promise<ParticipantSummaryResponse> {
  const response = await authFetch(
    `/studies/${studyId}/participants/summary`
  );

  return parseJsonResponse<ParticipantSummaryResponse>(response);
}

export async function getResearcherStudyDataSummaryRequest(
  studyId: number
): Promise<StudyDataSummaryResponse> {
  const response = await authFetch(
    `/studies/${studyId}/submissions/summary/data`
  );

  return parseJsonResponse<StudyDataSummaryResponse>(response);
}

export type TimelineGroupBy = "day" | "five_days" | "month";

export async function getResearcherStudyDataTimelineRequest(
  studyId: number,
  groupBy: TimelineGroupBy = "day",
  startDate?: string,
  endDate?: string
): Promise<StudyDataTimelinePointResponse[]> {
  const query = new URLSearchParams();

  query.set("group_by", groupBy);

  if (startDate) {
    query.set("start_date", startDate);
  }

  if (endDate) {
    query.set("end_date", endDate);
  }

  const response = await authFetch(
    `/studies/${studyId}/submissions/timeline/data?${query.toString()}`
  );

  return parseJsonResponse<StudyDataTimelinePointResponse[]>(response);
}

export async function deleteStudyRequest(studyId: number): Promise<void> {
  const response = await authFetch(`/studies/${studyId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? "Studiul nu a putut fi șters.");
  }
}

export async function updateResearcherStudyRequest(
  studyId: number,
  payload: UpdateResearcherStudyPayload
): Promise<ResearcherStudyDetailResponse> {
  const response = await authFetch(`/studies/${studyId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<ResearcherStudyDetailResponse>(response);
}

export async function runStudyAnalysisRequest(
  studyId: number,
  payload: AnalysisRunPayload
): Promise<AnalysisRunResponse> {
  const response = await authFetch(`/studies/${studyId}/analysis/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<AnalysisRunResponse>(response);
}

export async function getStudyAnalysisResultsRequest(
  studyId: number,
  participantId?: number | null
): Promise<AnalysisResultResponse[]> {
  const query = participantId ? `?participant_id=${participantId}` : "";
  const response = await authFetch(`/studies/${studyId}/analysis/results${query}`);

  return parseJsonResponse<AnalysisResultResponse[]>(response);
}