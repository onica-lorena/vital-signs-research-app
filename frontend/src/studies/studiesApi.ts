import { authFetch } from "../auth/authFetch";

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

export type SortBy = "created_at" | "title";
export type SortOrder = "asc" | "desc";

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
  participants_count: number;
  researcher_id: number;
  created_at: string;
  updated_at: string;
  parameters: StudyParameterResponse[];
};

export type StudyListResponse = {
  items: StudyListItemResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type StudyTypeDistributionItem = {
  study_type: StudyType;
  count: number;
};

export type StudySummaryResponse = {
  total_studies: number;
  active_studies: number;
  studies_in_analysis: number;
  completed_studies: number;
  study_type_distribution: StudyTypeDistributionItem[];
};

export type CreateStudyPayload = {
  title: string;
  start_date: string | null;
  study_type: string;
  data_entry_mode: string;
  status: string;
  description: string | null;
  parameters: {
    parameter_key: string;
    measurement_frequency: string;
  }[];
};

export type ListStudiesParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: StudyStatus | "";
  study_type?: StudyType | "";
  sort_by?: SortBy;
  sort_order?: SortOrder;
};

async function parseError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const data = await response.json().catch(() => null);
  return data?.detail ?? fallbackMessage;
}

function buildQuery(params: ListStudiesParams): string {
  const searchParams = new URLSearchParams();

  if (typeof params.page === "number") {
    searchParams.set("page", String(params.page));
  }

  if (typeof params.page_size === "number") {
    searchParams.set("page_size", String(params.page_size));
  }

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.study_type) {
    searchParams.set("study_type", params.study_type);
  }

  if (params.sort_by) {
    searchParams.set("sort_by", params.sort_by);
  }

  if (params.sort_order) {
    searchParams.set("sort_order", params.sort_order);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function createStudyRequest(payload: CreateStudyPayload) {
  const response = await authFetch("/studies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Nu s-a putut crea studiul."));
  }

  return (await response.json()) as StudyDetailResponse;
}

export async function listStudiesRequest(
  params: ListStudiesParams = {}
): Promise<StudyListResponse> {
  const response = await authFetch(`/studies${buildQuery(params)}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Nu s-au putut prelua studiile.")
    );
  }

  return (await response.json()) as StudyListResponse;
}

export async function getStudiesSummaryRequest(): Promise<StudySummaryResponse> {
  const response = await authFetch("/studies/summary", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Nu s-a putut prelua rezumatul studiilor.")
    );
  }

  return (await response.json()) as StudySummaryResponse;
}

export async function getStudyByIdRequest(
  studyId: number
): Promise<StudyDetailResponse> {
  const response = await authFetch(`/studies/${studyId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Nu s-au putut prelua detaliile studiului.")
    );
  }

  return (await response.json()) as StudyDetailResponse;
}

export async function deleteStudyRequest(studyId: number): Promise<void> {
  const response = await authFetch(`/studies/${studyId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Nu s-a putut șterge studiul.")
    );
  }
}