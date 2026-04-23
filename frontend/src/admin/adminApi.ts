import { authFetch } from "../auth/authFetch";

export type AccessRequestStatus = "pending" | "approved" | "rejected";
export type UserRole = "admin" | "researcher";

export type StudyStatus = "draft" | "active" | "in_analysis" | "completed";
export type StudyType =
  | "observational_prospective"
  | "observational_retrospective"
  | "observational_mixed";
export type DataEntryMode = "manual" | "csv" | "manual_csv";
export type StudyParameterKey =
  | "heartRate"
  | "respiratoryRate"
  | "spo2"
  | "temperature";
export type MeasurementFrequency =
  | "continuous"
  | "every_1_min"
  | "every_5_min"
  | "every_15_min"
  | "every_30_min"
  | "every_1_hour";

export type ParticipantStatus =
  | "invited"
  | "active"
  | "suspended"
  | "completed"
  | "withdrawn";

export type ParticipantDataEntryMethod = "manual" | "csv";

export type ParticipantSubmissionStatus = "submitted" | "validated" | "rejected";
export type ParticipantHistoryStatus = "submitted" | "validated" | "rejected" | "partial";

export type StudySortBy = "created_at" | "title";
export type SortOrder = "asc" | "desc";

export type AccessRequestResponse = {
  id: number;
  full_name: string;
  email: string;
  institution: string | null;
  department: string | null;
  specialization: string | null;
  phone: string | null;
  request_reason: string | null;
  status: AccessRequestStatus;
  reviewed_at: string | null;
  review_notes: string | null;
  reviewed_by_user_id: number | null;
  created_user_id: number | null;
  created_at: string;
  updated_at: string;
};

export type AccessRequestListResponse = {
  items: AccessRequestResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type UserResponse = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  institution: string | null;
  department: string | null;
  specialization: string | null;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type StudyResearcherResponse = {
  id: number;
  full_name: string;
  email: string;
};

export type StudyParameterResponse = {
  id: number;
  parameter_key: StudyParameterKey;
  measurement_frequency: MeasurementFrequency;
};

export type StudyListItemResponse = {
  id: number;
  title: string;
  code: string;
  description: string | null;
  study_type: StudyType;
  status: StudyStatus;
  participants_count: number;
  created_at: string;
};

export type StudyDetailResponse = {
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

export type StudyListResponse = {
  items: StudyListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ParticipantListItemResponse = {
  id: number;
  participant_code: string;
  full_name: string;
  participant_identifier: string;
  status: ParticipantStatus;
  submissions_count: number;
  last_login_at: string | null;
  last_submission_at: string | null;
  created_at: string;
};

export type ParticipantDetailResponse = {
  id: number;
  study_id: number;
  participant_code: string;
  full_name: string;
  participant_identifier: string;
  status: ParticipantStatus;
  submissions_count: number;
  last_login_at: string | null;
  last_submission_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ParticipantCreateResponse = ParticipantDetailResponse & {
  temporary_pin: string;
};

export type ParticipantPinResetResponse = {
  participant_id: number;
  participant_code: string;
  temporary_pin: string;
};

export type ParticipantListResponse = {
  items: ParticipantListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ParticipantSummaryResponse = {
  total_participants: number;
  invited_participants: number;
  active_participants: number;
  suspended_participants: number;
  completed_participants: number;
  withdrawn_participants: number;
};

export type ParticipantSubmissionValueResponse = {
  id: number;
  parameter_key: StudyParameterKey;
  value: number;
  measured_at: string;
};

export type StudySubmissionListItemResponse = {
  id: number;
  session_id: number;
  participant_id: number;
  participant_code: string;
  participant_full_name: string;
  entry_method: ParticipantDataEntryMethod;
  status: ParticipantSubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  values_count: number;
};

export type StudySubmissionListResponse = {
  items: StudySubmissionListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type StudySubmissionDetailResponse = {
  id: number;
  session_id: number;
  participant_id: number;
  participant_code: string;
  participant_full_name: string;
  entry_method: ParticipantDataEntryMethod;
  status: ParticipantSubmissionStatus;
  participant_notes: string | null;
  review_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  values: ParticipantSubmissionValueResponse[];
};

export type StudyDataSummaryResponse = {
  total_submissions: number;
  total_values: number;
  submitted_count: number;
  validated_count: number;
  rejected_count: number;
  participants_with_submissions: number;
  last_submission_at: string | null;
};

export type StudyDataTimelinePointResponse = {
  label: string;
  submissions_count: number;
  values_count: number;
};

export type ListAccessRequestsParams = {
  page?: number;
  page_size?: number;
  status?: AccessRequestStatus | "";
  search?: string;
};

export type ListStudiesParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: StudyStatus | "";
  study_type?: StudyType | "";
  sort_by?: StudySortBy;
  sort_order?: SortOrder;
};

export type ListParticipantsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: ParticipantStatus | "";
};

export type ListStudySubmissionsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: ParticipantSubmissionStatus | "";
  participant_id?: number | null;
};

async function parseError(response: Response, fallbackMessage: string): Promise<string> {
  const data = await response.json().catch(() => null);
  return data?.detail ?? fallbackMessage;
}

function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function extractFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(.+?)"/);
  return match?.[1] ?? fallback;
}

export async function listAccessRequestsRequest(
  params: ListAccessRequestsParams = {}
): Promise<AccessRequestListResponse> {
  const response = await authFetch(
    `/access-requests${buildQuery({
      page: params.page,
      page_size: params.page_size,
      status: params.status,
      search: params.search?.trim(),
    })}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua cererile de acces."));
  }

  return (await response.json()) as AccessRequestListResponse;
}

export async function getAccessRequestByIdRequest(accessRequestId: number): Promise<AccessRequestResponse> {
  const response = await authFetch(`/access-requests/${accessRequestId}`, { method: "GET" });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua detaliile cererii."));
  }

  return (await response.json()) as AccessRequestResponse;
}

export async function approveAccessRequestRequest(
  accessRequestId: number,
  reviewNotes: string | null
): Promise<AccessRequestResponse> {
  const response = await authFetch(`/access-requests/${accessRequestId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review_notes: reviewNotes }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut aproba cererea."));
  }

  return (await response.json()) as AccessRequestResponse;
}

export async function rejectAccessRequestRequest(
  accessRequestId: number,
  reviewNotes: string | null
): Promise<AccessRequestResponse> {
  const response = await authFetch(`/access-requests/${accessRequestId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review_notes: reviewNotes }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut respinge cererea."));
  }

  return (await response.json()) as AccessRequestResponse;
}

export async function listUsersRequest(): Promise<UserResponse[]> {
  const response = await authFetch("/users", { method: "GET" });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua utilizatorii."));
  }

  return (await response.json()) as UserResponse[];
}

export async function getUserByIdRequest(userId: number): Promise<UserResponse> {
  const response = await authFetch(`/users/${userId}`, { method: "GET" });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua detaliile utilizatorului."));
  }

  return (await response.json()) as UserResponse;
}

export async function createUserRequest(payload: {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  institution: string | null;
  department: string | null;
  specialization: string | null;
  phone: string | null;
  bio: string | null;
}): Promise<UserResponse> {
  const response = await authFetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut crea utilizatorul."));
  }

  return (await response.json()) as UserResponse;
}

export async function updateUserRequest(
  userId: number,
  payload: {
    full_name?: string | null;
    role?: UserRole | null;
    is_verified?: boolean | null;
    institution?: string | null;
    department?: string | null;
    specialization?: string | null;
    phone?: string | null;
    bio?: string | null;
  }
): Promise<UserResponse> {
  const response = await authFetch(`/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut actualiza utilizatorul."));
  }

  return (await response.json()) as UserResponse;
}

export async function updateUserStatusRequest(
  userId: number,
  isActive: boolean
): Promise<UserResponse> {
  const response = await authFetch(`/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut actualiza statusul utilizatorului."));
  }

  return (await response.json()) as UserResponse;
}

export async function resetUserPasswordRequest(
  userId: number,
  newPassword: string
): Promise<{ message: string }> {
  const response = await authFetch(`/users/${userId}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut reseta parola utilizatorului."));
  }

  return (await response.json()) as { message: string };
}

export async function listStudiesAdminRequest(
  params: ListStudiesParams = {}
): Promise<StudyListResponse> {
  const response = await authFetch(
    `/studies${buildQuery({
      page: params.page,
      page_size: params.page_size,
      search: params.search?.trim(),
      status: params.status,
      study_type: params.study_type,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    })}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua studiile."));
  }

  return (await response.json()) as StudyListResponse;
}

export async function getStudyByIdAdminRequest(studyId: number): Promise<StudyDetailResponse> {
  const response = await authFetch(`/studies/${studyId}`, { method: "GET" });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua detaliile studiului."));
  }

  return (await response.json()) as StudyDetailResponse;
}

export async function updateStudyAdminRequest(
  studyId: number,
  payload: {
    title?: string;
    start_date?: string | null;
    end_date?: string | null;
    study_type?: StudyType;
    data_entry_mode?: DataEntryMode;
    status?: StudyStatus;
    description?: string | null;
    institution?: string | null;
    target_participants?: number | null;
    collection_rules?: string | null;
    inclusion_criteria?: string | null;
    administrative_notes?: string | null;
    parameters?: {
      parameter_key: StudyParameterKey;
      measurement_frequency: MeasurementFrequency;
    }[];
  }
): Promise<StudyDetailResponse> {
  const response = await authFetch(`/studies/${studyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut actualiza studiul."));
  }

  return (await response.json()) as StudyDetailResponse;
}

export async function deleteStudyAdminRequest(studyId: number): Promise<void> {
  const response = await authFetch(`/studies/${studyId}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut șterge studiul."));
  }
}

export async function exportStudyAdminRequest(
  studyId: number
): Promise<{ blob: Blob; filename: string }> {
  const response = await authFetch(`/studies/${studyId}/export`, { method: "GET" });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut exporta studiul."));
  }

  return {
    blob: await response.blob(),
    filename: extractFilename(response, `study-${studyId}-export.json`),
  };
}

export async function listStudyParticipantsRequest(
  studyId: number,
  params: ListParticipantsParams = {}
): Promise<ParticipantListResponse> {
  const response = await authFetch(
    `/studies/${studyId}/participants${buildQuery({
      page: params.page,
      page_size: params.page_size,
      search: params.search?.trim(),
      status: params.status,
    })}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua participanții."));
  }

  return (await response.json()) as ParticipantListResponse;
}

export async function getStudyParticipantsSummaryRequest(
  studyId: number
): Promise<ParticipantSummaryResponse> {
  const response = await authFetch(`/studies/${studyId}/participants/summary`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut prelua rezumatul participanților."));
  }

  return (await response.json()) as ParticipantSummaryResponse;
}

export async function createStudyParticipantRequest(
  studyId: number,
  payload: {
    full_name: string;
    participant_identifier: string;
    notes: string | null;
    pin: string | null;
  }
): Promise<ParticipantCreateResponse> {
  const response = await authFetch(`/studies/${studyId}/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut crea participantul."));
  }

  return (await response.json()) as ParticipantCreateResponse;
}

export async function getStudyParticipantByIdRequest(
  studyId: number,
  participantId: number
): Promise<ParticipantDetailResponse> {
  const response = await authFetch(`/studies/${studyId}/participants/${participantId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua detaliile participantului."));
  }

  return (await response.json()) as ParticipantDetailResponse;
}

export async function updateStudyParticipantRequest(
  studyId: number,
  participantId: number,
  payload: {
    full_name?: string | null;
    participant_identifier?: string | null;
    status?: ParticipantStatus | null;
    notes?: string | null;
  }
): Promise<ParticipantDetailResponse> {
  const response = await authFetch(`/studies/${studyId}/participants/${participantId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut actualiza participantul."));
  }

  return (await response.json()) as ParticipantDetailResponse;
}

export async function resetStudyParticipantPinRequest(
  studyId: number,
  participantId: number
): Promise<ParticipantPinResetResponse> {
  const response = await authFetch(`/studies/${studyId}/participants/${participantId}/reset-pin`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut reseta PIN-ul participantului."));
  }

  return (await response.json()) as ParticipantPinResetResponse;
}

export async function listStudySubmissionsRequest(
  studyId: number,
  params: ListStudySubmissionsParams = {}
): Promise<StudySubmissionListResponse> {
  const response = await authFetch(
    `/studies/${studyId}/submissions${buildQuery({
      page: params.page,
      page_size: params.page_size,
      search: params.search?.trim(),
      status: params.status,
      participant_id: params.participant_id ?? undefined,
    })}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua trimiterile."));
  }

  return (await response.json()) as StudySubmissionListResponse;
}

export async function getStudySubmissionByIdRequest(
  studyId: number,
  submissionId: number
): Promise<StudySubmissionDetailResponse> {
  const response = await authFetch(`/studies/${studyId}/submissions/${submissionId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-au putut prelua detaliile trimiterii."));
  }

  return (await response.json()) as StudySubmissionDetailResponse;
}

export async function updateStudySubmissionRequest(
  studyId: number,
  submissionId: number,
  payload: {
    status: ParticipantSubmissionStatus;
    review_notes: string | null;
  }
): Promise<StudySubmissionDetailResponse> {
  const response = await authFetch(`/studies/${studyId}/submissions/${submissionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut actualiza trimiterea."));
  }

  return (await response.json()) as StudySubmissionDetailResponse;
}

export async function getStudyDataSummaryRequest(
  studyId: number
): Promise<StudyDataSummaryResponse> {
  const response = await authFetch(`/studies/${studyId}/submissions/summary/data`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut prelua rezumatul datelor."));
  }

  return (await response.json()) as StudyDataSummaryResponse;
}

export async function getStudyDataTimelineRequest(
  studyId: number,
  groupBy: "day" | "week" | "month"
): Promise<StudyDataTimelinePointResponse[]> {
  const response = await authFetch(
    `/studies/${studyId}/submissions/timeline/data${buildQuery({ group_by: groupBy })}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut prelua timeline-ul datelor."));
  }

  return (await response.json()) as StudyDataTimelinePointResponse[];
}