import { useEffect, useMemo, useState } from "react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { authFetch, SESSION_EXPIRED_ERROR } from "../../../../auth/authFetch";
import "../../../../styles/study-participants.css";


const PAGE_SIZE = 10;

type ParticipantStatus =
  | "invited"
  | "active"
  | "suspended"
  | "completed"
  | "withdrawn";

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

type ParticipantSummaryResponse = {
  total_participants: number;
  invited_participants: number;
  active_participants: number;
  suspended_participants: number;
  completed_participants: number;
  withdrawn_participants: number;
};

type StudyDataSummaryResponse = {
  total_submissions: number;
  total_values: number;
  submitted_count: number;
  validated_count: number;
  rejected_count: number;
  participants_with_submissions: number;
  last_submission_at: string | null;
};

type ParticipantConditionResponse = {
  id: number;
  condition_type: ParticipantConditionType;
  notes: string | null;
};

type ParticipantDetailResponse = ParticipantListItemResponse & {
  study_id: number;
  notes: string | null;
  updated_at: string;
  conditions: ParticipantConditionResponse[];
};

type ParticipantCreateResponse = ParticipantDetailResponse & {
  temporary_pin: string;
};

type ParticipantPinResetResponse = {
  participant_id: number;
  participant_code: string;
  temporary_pin: string;
};

type ParticipantConditionCreatePayload = {
  condition_type: ParticipantConditionType;
  notes?: string | null;
};

type ParticipantCreatePayload = {
  full_name: string;
  participant_identifier: string | null;
  pin?: string | null;
  birth_date?: string | null;
  sex?: ParticipantSex | null;
  participant_group?: string | null;
  activity_level?: ActivityLevel | null;
  notes?: string | null;
  conditions?: ParticipantConditionCreatePayload[];
};

type ParticipantBulkCreateItemResponse = {
  participant: ParticipantDetailResponse;
  temporary_pin: string;
};

type ParticipantBulkCreateResponse = {
  created_count: number;
  items: ParticipantBulkCreateItemResponse[];
};

type ParticipantUpdatePayload = {
  full_name?: string;
  participant_identifier?: string;
  status?: ParticipantStatus;
  birth_date?: string | null;
  sex?: ParticipantSex | null;
  participant_group?: string | null;
  activity_level?: ActivityLevel | null;
  notes?: string | null;
};

type StudyParticipantsProps = {
  studyId: number;
};

type ParticipantSortBy =
  | "created_at"
  | "full_name"
  | "participant_code"
  | "submissions_count"
  | "last_login_at"
  | "last_submission_at";

type SortOrder = "asc" | "desc";

const STATUS_LABELS: Record<ParticipantStatus, string> = {
  invited: "Invitat",
  active: "Activ",
  suspended: "Suspendat",
  completed: "Finalizat",
  withdrawn: "Retras",
};

const SEX_LABELS: Record<ParticipantSex, string> = {
  female: "Feminin",
  male: "Masculin",
  other: "Altul",
  prefer_not_to_say: "Preferă să nu spună",
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentar",
  light: "Activitate ușoară",
  moderate: "Activitate moderată",
  active: "Activ",
  athlete: "Sportiv",
  unknown: "Necunoscut",
};

const CONDITION_LABELS: Record<ParticipantConditionType, string> = {
  cardiovascular: "Cardiovasculară",
  respiratory: "Respiratorie",
  metabolic: "Metabolică",
  neurological: "Neurologică",
  endocrine: "Endocrină",
  other: "Altă afecțiune",
  none_declared: "Nicio afecțiune declarată",
  prefer_not_to_say: "Preferă să nu spună",
};

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M8.4 9.1L12 5.5L15.6 9.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 15.5V18.2C5.5 19.1 6.2 19.8 7.1 19.8H16.9C17.8 19.8 18.5 19.1 18.5 18.2V15.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
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
      <path
        d="M18.7 9.2C17.8 6.7 15.4 5 12.6 5C9 5 6.1 7.9 6.1 11.5C6.1 15.1 9 18 12.6 18C15.1 18 17.3 16.6 18.4 14.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.8 19.2C6.5 16.2 8.8 14.4 12 14.4C15.2 14.4 17.5 16.2 18.2 19.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12H7.2L9.4 8L12 16L14.2 11.5H20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 5.2C9 4 9.9 3 11 3H13C14.1 3 15 4 15 5.2V6H9V5.2Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="6" width="15" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 4.5V7.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 4.5V7.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 9.5H19.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="5.5" width="3.5" height="13" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="5.5" width="3.5" height="13" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.4 12.3L10.8 14.7L15.9 9.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 6H7.8C6.8 6 6 6.8 6 7.8V16.2C6 17.2 6.8 18 7.8 18H10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 8.5L16.5 12L13 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.2 12H9.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
    <div className={`study-participants-summary-icon-chart is-${tone}`}>
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

      <span className="study-participants-summary-icon-chart__icon">
        {icon}
      </span>
    </div>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "P";
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

function calculateAge(birthDate?: string | null): string {
  if (!birthDate) {
    return "—";
  }

  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return `${age} ani`;
}

function getStatusClassName(status: ParticipantStatus): string {
  if (status === "active") {
    return "is-active";
  }

  if (status === "invited") {
    return "is-invited";
  }

  if (status === "suspended") {
    return "is-suspended";
  }

  if (status === "completed") {
    return "is-completed";
  }

  return "is-withdrawn";
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

type ParticipantSortValue =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "code_asc"
  | "code_desc"
  | "submissions_desc"
  | "submissions_asc"
  | "last_submission_desc"
  | "last_submission_asc"
  | "last_login_desc"
  | "last_login_asc";

async function listParticipantsRequest(params: {
  studyId: number;
  page: number;
  pageSize: number;
  search: string;
  status: ParticipantStatus | "";
  sex: ParticipantSex | "";
  activityLevel: ActivityLevel | "";
  participantGroup: string;
  onlyWithSubmissions: boolean;
  sortBy: ParticipantSortBy;
  sortOrder: SortOrder;
}): Promise<ParticipantListResponse> {
  const query = new URLSearchParams();

  query.set("page", String(params.page));
  query.set("page_size", String(params.pageSize));

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.sex) {
    query.set("sex", params.sex);
  }

  if (params.activityLevel) {
    query.set("activity_level", params.activityLevel);
  }

  if (params.participantGroup.trim()) {
    query.set("participant_group", params.participantGroup.trim());
  }

  if (params.onlyWithSubmissions) {
    query.set("only_with_submissions", "true");
  }

  query.set("sort_by", params.sortBy);
  query.set("sort_order", params.sortOrder);

  return apiRequest<ParticipantListResponse>(
    `/studies/${params.studyId}/participants/?${query.toString()}`
  );
}

async function getParticipantsSummaryRequest(
  studyId: number
): Promise<ParticipantSummaryResponse> {
  return apiRequest<ParticipantSummaryResponse>(
    `/studies/${studyId}/participants/summary`
  );
}

async function getStudyDataSummaryRequest(
  studyId: number
): Promise<StudyDataSummaryResponse> {
  return apiRequest<StudyDataSummaryResponse>(
    `/studies/${studyId}/submissions/summary/data`
  );
}

async function getParticipantDetailRequest(
  studyId: number,
  participantId: number
): Promise<ParticipantDetailResponse> {
  return apiRequest<ParticipantDetailResponse>(
    `/studies/${studyId}/participants/${participantId}`
  );
}

async function createParticipantRequest(
  studyId: number,
  payload: ParticipantCreatePayload
): Promise<ParticipantCreateResponse> {
  return apiRequest<ParticipantCreateResponse>(
    `/studies/${studyId}/participants/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

async function uploadParticipantsCsvRequest(
  studyId: number,
  file: File
): Promise<ParticipantBulkCreateResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await authFetch(
    `/studies/${studyId}/participants/bulk-upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<ParticipantBulkCreateResponse>;
}

async function updateParticipantRequest(
  studyId: number,
  participantId: number,
  payload: ParticipantUpdatePayload
): Promise<ParticipantDetailResponse> {
  return apiRequest<ParticipantDetailResponse>(
    `/studies/${studyId}/participants/${participantId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

async function resetParticipantPinRequest(
  studyId: number,
  participantId: number
): Promise<ParticipantPinResetResponse> {
  return apiRequest<ParticipantPinResetResponse>(
    `/studies/${studyId}/participants/${participantId}/reset-pin`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

export default function StudyParticipants({ studyId }: StudyParticipantsProps) {
  const [participants, setParticipants] = useState<ParticipantListItemResponse[]>([]);
  const [summary, setSummary] = useState<ParticipantSummaryResponse | null>(null);
  const [dataSummary, setDataSummary] = useState<StudyDataSummaryResponse | null>(null);

  const [isListLoading, setIsListLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [page, setPage] = useState(1);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | "">("");

  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [sexFilter, setSexFilter] = useState<ParticipantSex | "">("");
  const [activityFilter, setActivityFilter] = useState<ActivityLevel | "">("");
  const [groupFilter, setGroupFilter] = useState("");
  const [onlyWithSubmissions, setOnlyWithSubmissions] = useState(false);
  const [sortValue, setSortValue] = useState<ParticipantSortValue>("created_desc");
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantDetailResponse | null>(null);
  const [selectedLoadingId, setSelectedLoadingId] = useState<number | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createdPin, setCreatedPin] = useState<ParticipantCreateResponse | null>(null);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkCreatedItems, setBulkCreatedItems] = useState<ParticipantBulkCreateItemResponse[]>([]);
  
  const [editMode, setEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [resetPinLoading, setResetPinLoading] = useState(false);
  const [newTemporaryPin, setNewTemporaryPin] = useState("");

  const [refreshToken, setRefreshToken] = useState(0);

  const [createForm, setCreateForm] = useState({
    full_name: "",
    participant_identifier: "",
    pin: "",
    birth_date: "",
    sex: "" as ParticipantSex | "",
    participant_group: "",
    activity_level: "" as ActivityLevel | "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    participant_identifier: "",
    status: "invited" as ParticipantStatus,
    birth_date: "",
    sex: "" as ParticipantSex | "",
    participant_group: "",
    activity_level: "" as ActivityLevel | "",
    notes: "",
  });

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

    async function loadParticipants() {
      setIsListLoading(true);
      setPageError("");
      const resolvedSort = resolveParticipantSort(sortValue);

      try {
        const response = await listParticipantsRequest({
        studyId,
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
        sex: sexFilter,
        activityLevel: activityFilter,
        participantGroup: groupFilter,
        onlyWithSubmissions,
        sortBy: resolvedSort.sortBy,
        sortOrder: resolvedSort.sortOrder,
        });

        if (cancelled) {
          return;
        }

        setParticipants(response.items);
        setTotalParticipants(response.total);
        setTotalPages(response.total_pages);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setParticipants([]);
        setTotalParticipants(0);
        setTotalPages(1);
        setPageError(
          error instanceof Error
            ? error.message
            : "A apărut o eroare la încărcarea participanților."
        );
      } finally {
        if (!cancelled) {
          setIsListLoading(false);
        }
      }
    }

    void loadParticipants();

    return () => {
      cancelled = true;
    };
  }, [
    studyId,
    page,
    debouncedSearch,
    statusFilter,
    sexFilter,
    activityFilter,
    groupFilter,
    onlyWithSubmissions,
    sortValue,
    refreshToken,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setIsSummaryLoading(true);

      try {
        const [participantsSummary, studyDataSummary] = await Promise.all([
          getParticipantsSummaryRequest(studyId),
          getStudyDataSummaryRequest(studyId),
        ]);

        if (cancelled) {
          return;
        }

        setSummary(participantsSummary);
        setDataSummary(studyDataSummary);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setSummary(null);
        setDataSummary(null);
        setPageError(
          error instanceof Error
            ? error.message
            : "A apărut o eroare la încărcarea rezumatului participanților."
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

  const getParticipantStatusPercentage = (count?: number): number => {
    const total = summary?.total_participants ?? 0;
  
    if (total === 0) {
      return 0;
    }
  
    return Math.round(((count ?? 0) / total) * 100);
  };

  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages]
  );

  function resolveParticipantSort(value: ParticipantSortValue): {
    sortBy: ParticipantSortBy;
    sortOrder: SortOrder;
  } {
    if (value === "created_asc") {
      return { sortBy: "created_at", sortOrder: "asc" };
    }
  
    if (value === "name_asc") {
      return { sortBy: "full_name", sortOrder: "asc" };
    }
  
    if (value === "name_desc") {
      return { sortBy: "full_name", sortOrder: "desc" };
    }
  
    if (value === "code_asc") {
      return { sortBy: "participant_code", sortOrder: "asc" };
    }
  
    if (value === "code_desc") {
      return { sortBy: "participant_code", sortOrder: "desc" };
    }
  
    if (value === "submissions_desc") {
      return { sortBy: "submissions_count", sortOrder: "desc" };
    }
  
    if (value === "submissions_asc") {
      return { sortBy: "submissions_count", sortOrder: "asc" };
    }
  
    if (value === "last_submission_desc") {
      return { sortBy: "last_submission_at", sortOrder: "desc" };
    }
  
    if (value === "last_submission_asc") {
      return { sortBy: "last_submission_at", sortOrder: "asc" };
    }
  
    if (value === "last_login_desc") {
      return { sortBy: "last_login_at", sortOrder: "desc" };
    }
  
    if (value === "last_login_asc") {
      return { sortBy: "last_login_at", sortOrder: "asc" };
    }
  
    return { sortBy: "created_at", sortOrder: "desc" };
  }
  
  const rowStart = totalParticipants === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rowEnd = Math.min(page * PAGE_SIZE, totalParticipants);

  const hasActiveTableFilters =
    searchInput.trim() !== "" ||
    debouncedSearch.trim() !== "" ||
    statusFilter !== "" ||
    sexFilter !== "" ||
    activityFilter !== "" ||
    groupFilter.trim() !== "" ||
    onlyWithSubmissions ||
    sortValue !== "created_desc";

  function resetCreateForm() {
    setCreateForm({
      full_name: "",
      participant_identifier: "",
      pin: "",
      birth_date: "",
      sex: "",
      participant_group: "",
      activity_level: "",
      notes: "",
    });
    setCreatedPin(null);
  }

  function openCreateModal() {
    resetCreateForm();
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (createLoading) {
      return;
    }

    setIsCreateModalOpen(false);
    resetCreateForm();
  }

  function openBulkModal() {
    setBulkFile(null);
    setBulkCreatedItems([]);
    setIsBulkModalOpen(true);
  }
  
  function closeBulkModal() {
    if (bulkLoading) {
      return;
    }
  
    setIsBulkModalOpen(false);
    setBulkFile(null);
    setBulkCreatedItems([]);
  }

  async function handleOpenParticipant(participantId: number) {
    setSelectedLoadingId(participantId);
    setPageError("");
    setEditMode(false);
    setNewTemporaryPin("");

    try {
      const detail = await getParticipantDetailRequest(studyId, participantId);
      setSelectedParticipant(detail);

      setEditForm({
        full_name: detail.full_name,
        participant_identifier: detail.participant_identifier,
        status: detail.status,
        birth_date: detail.birth_date ?? "",
        sex: detail.sex ?? "",
        participant_group: detail.participant_group ?? "",
        activity_level: detail.activity_level ?? "",
        notes: detail.notes ?? "",
      });
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca detaliile participantului."
      );
    } finally {
      setSelectedLoadingId(null);
    }
  }

  async function handleCreateParticipant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreateLoading(true);
    setPageError("");

    const payload: ParticipantCreatePayload = {
    full_name: createForm.full_name.trim(),
    participant_identifier: createForm.participant_identifier.trim() || null,
    pin: createForm.pin.trim() || null,
    birth_date: createForm.birth_date || null,
    sex: createForm.sex || null,
    participant_group: createForm.participant_group.trim() || null,
    activity_level: createForm.activity_level || null,
    notes: createForm.notes.trim() || null,
    conditions: [],
    };

    try {
      const created = await createParticipantRequest(studyId, payload);
      setCreatedPin(created);
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-a putut adăuga participantul."
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleUploadParticipantsCsv(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!bulkFile) {
    setPageError("Alege un fișier CSV înainte de import.");
    return;
  }

  setBulkLoading(true);
  setPageError("");
  setBulkCreatedItems([]);

  try {
    const response = await uploadParticipantsCsvRequest(studyId, bulkFile);

    setBulkCreatedItems(response.items);
    setRefreshToken((prev) => prev + 1);
    setPage(1);
  } catch (error) {
    if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
      return;
    }

    setPageError(
      error instanceof Error
        ? error.message
        : "Nu s-au putut importa participanții din CSV."
    );
  } finally {
    setBulkLoading(false);
  }
  }

  async function handleUpdateParticipant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedParticipant) {
      return;
    }

    setEditLoading(true);
    setPageError("");

    const payload: ParticipantUpdatePayload = {
      full_name: editForm.full_name,
      participant_identifier: editForm.participant_identifier,
      status: editForm.status,
      birth_date: editForm.birth_date || null,
      sex: editForm.sex || null,
      participant_group: editForm.participant_group.trim() || null,
      activity_level: editForm.activity_level || null,
      notes: editForm.notes.trim() || null,
    };

    try {
      const updated = await updateParticipantRequest(
        studyId,
        selectedParticipant.id,
        payload
      );

      setSelectedParticipant(updated);
      setEditMode(false);
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut actualiza datele participantului."
      );
    } finally {
      setEditLoading(false);
    }
  }

  async function handleResetPin() {
    if (!selectedParticipant) {
      return;
    }

    const confirmed = window.confirm(
      `Resetezi PIN-ul pentru participantul ${selectedParticipant.participant_code}?`
    );

    if (!confirmed) {
      return;
    }

    setResetPinLoading(true);
    setNewTemporaryPin("");

    try {
      const response = await resetParticipantPinRequest(
        studyId,
        selectedParticipant.id
      );

      setNewTemporaryPin(response.temporary_pin);
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-a putut reseta PIN-ul participantului."
      );
    } finally {
      setResetPinLoading(false);
    }
  }

  function clearAdvancedFilters() {
    setSexFilter("");
    setActivityFilter("");
    setGroupFilter("");
    setOnlyWithSubmissions(false);
    setPage(1);
  }

  function handleResetTableFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setSexFilter("");
    setActivityFilter("");
    setGroupFilter("");
    setOnlyWithSubmissions(false);
    setSortValue("created_desc");
    setPage(1);
  }

  return (
    <section className="study-participants">
      {pageError ? (
        <div className="study-participants-banner study-participants-banner--error">
          {pageError}
        </div>
      ) : null}

    <div className="study-participants-summary">
      <article className="study-participants-summary-card">
        <SummaryIconChart
        value={getParticipantStatusPercentage(summary?.invited_participants)}
        tone="blue"
        icon={<CalendarIcon />}
        />

        <div className="study-participants-summary-card__content">
        <span>Invitați</span>
        <strong>
            {isSummaryLoading ? "..." : summary?.invited_participants ?? 0}
        </strong>
        <small>
            {isSummaryLoading
            ? "..."
            : `${getParticipantStatusPercentage(summary?.invited_participants)}% din total`}
        </small>
        </div>
      </article>
  
      <article className="study-participants-summary-card">
          <SummaryIconChart
          value={getParticipantStatusPercentage(summary?.active_participants)}
          tone="green"
          icon={<ActivityIcon />}
          />
  
          <div className="study-participants-summary-card__content">
          <span>Activi</span>
          <strong>
              {isSummaryLoading ? "..." : summary?.active_participants ?? 0}
          </strong>
          <small>
              {isSummaryLoading
              ? "..."
              : `${getParticipantStatusPercentage(summary?.active_participants)}% din total`}
          </small>
          </div>
      </article>
  
      <article className="study-participants-summary-card">
          <SummaryIconChart
          value={getParticipantStatusPercentage(summary?.suspended_participants)}
          tone="orange"
          icon={<PauseIcon />}
          />
  
          <div className="study-participants-summary-card__content">
          <span>Suspendați</span>
          <strong>
              {isSummaryLoading ? "..." : summary?.suspended_participants ?? 0}
          </strong>
          <small>
              {isSummaryLoading
              ? "..."
              : `${getParticipantStatusPercentage(summary?.suspended_participants)}% din total`}
          </small>
          </div>
      </article>
  
      <article className="study-participants-summary-card">
          <SummaryIconChart
          value={getParticipantStatusPercentage(summary?.completed_participants)}
          tone="gray"
          icon={<CheckIcon />}
          />
  
          <div className="study-participants-summary-card__content">
          <span>Finalizați</span>
          <strong>
              {isSummaryLoading ? "..." : summary?.completed_participants ?? 0}
          </strong>
          <small>
              {isSummaryLoading
              ? "..."
              : `${getParticipantStatusPercentage(summary?.completed_participants)}% din total`}
          </small>
          </div>
      </article>
  
      <article className="study-participants-summary-card">
          <SummaryIconChart
          value={getParticipantStatusPercentage(summary?.withdrawn_participants)}
          tone="red"
          icon={<ExitIcon />}
          />
  
          <div className="study-participants-summary-card__content">
          <span>Retrași</span>
          <strong>
              {isSummaryLoading ? "..." : summary?.withdrawn_participants ?? 0}
          </strong>
          <small>
              {isSummaryLoading
              ? "..."
              : `${getParticipantStatusPercentage(summary?.withdrawn_participants)}% din total`}
          </small>
          </div>
      </article>
    </div>
   
    <div className="study-participants-card">
      <div className="study-participants-card__top">
        <div>
      <h2>Participanți în studiu</h2>
      <p>Gestionează participanții înscriși în acest studiu.</p>
        </div>

        <div className="study-participants-card__actions">
        <button
            type="button"
            className="study-participants-import-btn"
            onClick={openBulkModal}
        >
            <UploadIcon />
            Importă participanți
        </button>

        <button
            type="button"
            className="study-participants-add-btn"
            onClick={openCreateModal}
        >
            <PlusIcon />
            Adaugă participant
        </button>
        </div>
      </div>

      <div className="study-participants-toolbar">
        <label className="study-participants-search">
          <span>
            <SearchIcon />
          </span>

          <input
            type="text"
            placeholder="Caută după nume, cod sau identificator..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <label className="study-participants-filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as ParticipantStatus | "");
              setPage(1);
            }}
          >
            <option value="">Toate</option>
            <option value="invited">Invitat</option>
            <option value="active">Activ</option>
            <option value="suspended">Suspendat</option>
            <option value="completed">Finalizat</option>
            <option value="withdrawn">Retras</option>
          </select>
        </label>

        <label className="study-participants-filter">
        <span>Sortare</span>
        <select
            value={sortValue}
            onChange={(event) => {
            setSortValue(event.target.value as ParticipantSortValue);
            setPage(1);
            }}
        >
            <option value="created_desc">Cei mai noi</option>
            <option value="created_asc">Cei mai vechi</option>
            <option value="name_asc">Nume A-Z</option>
            <option value="name_desc">Nume Z-A</option>
            <option value="code_asc">Cod crescător</option>
            <option value="code_desc">Cod descrescător</option>
            <option value="submissions_desc">Cele mai multe trimiteri</option>
            <option value="submissions_asc">Cele mai puține trimiteri</option>
            <option value="last_submission_desc">Ultima trimitere recentă</option>
            <option value="last_submission_asc">Ultima trimitere veche</option>
            <option value="last_login_desc">Ultima autentificare recentă</option>
            <option value="last_login_asc">Ultima autentificare veche</option>
        </select>
        </label>

        <div className="study-participants-toolbar__actions">
          <button
            type="button"
            className={`study-participants-toolbar-btn ${
              advancedFiltersOpen ? "is-active" : ""
            }`}
            onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
          >
            <FilterIcon />
            Filtrează
          </button>

          <button
            type="button"
            className="study-participants-toolbar-icon-btn"
            onClick={handleResetTableFilters}
            disabled={isListLoading || isSummaryLoading || !hasActiveTableFilters}
            aria-label="Resetează filtrele"
            title="Resetează filtrele"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {advancedFiltersOpen ? (
        <div className="study-participants-advanced-filters">
          <label>
            <span>Sex</span>
            <select
              value={sexFilter}
              onChange={(event) => {
                setSexFilter(event.target.value as ParticipantSex | "");
                setPage(1);
              }}
            >
              <option value="">Toate</option>
              <option value="female">Feminin</option>
              <option value="male">Masculin</option>
              <option value="other">Altul</option>
              <option value="prefer_not_to_say">Preferă să nu spună</option>
            </select>
          </label>

          <label>
            <span>Nivel activitate</span>
            <select
              value={activityFilter}
              onChange={(event) => {
                setActivityFilter(event.target.value as ActivityLevel | "");
                setPage(1);
              }}
            >
              <option value="">Toate</option>
              <option value="sedentary">Sedentar</option>
              <option value="light">Activitate ușoară</option>
              <option value="moderate">Activitate moderată</option>
              <option value="active">Activ</option>
              <option value="athlete">Sportiv</option>
              <option value="unknown">Necunoscut</option>
            </select>
          </label>

          <label>
            <span>Grup participant</span>
            <input
              type="text"
              placeholder="Ex. Lot A, control..."
              value={groupFilter}
              onChange={(event) => {
                setGroupFilter(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="study-participants-check-filter">
            <input
              type="checkbox"
              checked={onlyWithSubmissions}
              onChange={(event) => {
                setOnlyWithSubmissions(event.target.checked);
                setPage(1);
              }}
            />
            <span>Doar participanți cu trimiteri</span>
          </label>

          <button
            type="button"
            className="study-participants-clear-btn"
            onClick={clearAdvancedFilters}
          >
            Resetează filtrele
          </button>
        </div>
      ) : null}

        <div className="study-participants-table-wrap">
          {isListLoading ? (
            <div className="study-participants-loading">
              Se încarcă participanții...
            </div>
          ) : participants.length === 0 ? (
            <div className="study-participants-empty">
              <div className="study-participants-empty__icon">
                <UserIcon />
              </div>
              <h3>Nu există participanți pentru criteriile selectate</h3>
              <p>
                Încearcă să modifici filtrele sau adaugă un participant nou în studiu.
              </p>
            </div>
          ) : (
            <table className="study-participants-table">
              <thead>
                <tr>
                  <th>Cod participant</th>
                  <th>Nume</th>
                  <th>Status</th>
                  <th>Grup</th>
                  <th>Nr. trimiteri</th>
                  <th>Ultima autentificare</th>
                  <th>Ultima trimitere</th>
                </tr>
              </thead>

              <tbody>
                {participants.map((participant) => (
                  <tr
                    key={participant.id}
                    className={
                      selectedLoadingId === participant.id ? "is-loading" : ""
                    }
                    onClick={() => void handleOpenParticipant(participant.id)}
                  >
                    <td className="study-participants-table__code">
                      {participant.participant_code}
                    </td>

                    <td>
                      <div className="study-participants-name-cell">
                        <strong>{participant.full_name}</strong>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`study-participants-status ${getStatusClassName(
                          participant.status
                        )}`}
                      >
                        {STATUS_LABELS[participant.status]}
                      </span>
                    </td>

                    <td>{participant.participant_group || "—"}</td>

                    <td>{participant.submissions_count}</td>

                    <td>{formatDateTime(participant.last_login_at)}</td>

                    <td>{formatDateTime(participant.last_submission_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="study-participants-footer">
          <span>
            Afișare {rowStart} - {rowEnd} din {totalParticipants} participanți
          </span>

          <div className="study-participants-pagination">
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

      {selectedParticipant ? (
        <div
          className="study-participants-drawer-overlay"
          onClick={() => setSelectedParticipant(null)}
        >
          <aside
            className="study-participants-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="study-participants-drawer__header">
              <div className="study-participants-drawer__identity">
                <span className="study-participants-drawer__avatar">
                  {getInitials(selectedParticipant.full_name)}
                </span>

                <div>
                  <span className="study-participants-drawer__eyebrow">
                    {selectedParticipant.participant_code}
                  </span>
                  <h3>{selectedParticipant.full_name}</h3>
                  <span
                    className={`study-participants-status ${getStatusClassName(
                      selectedParticipant.status
                    )}`}
                  >
                    {STATUS_LABELS[selectedParticipant.status]}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="study-participants-drawer__close"
                onClick={() => setSelectedParticipant(null)}
                aria-label="Închide"
              >
                <CloseIcon />
              </button>
            </div>

            {newTemporaryPin ? (
              <div className="study-participants-pin-card">
                <span>PIN generat</span>
                <strong>{newTemporaryPin}</strong>
                <p>
                  Copiază PIN-ul acum. Din motive de securitate, acesta nu va mai
                  fi afișat ulterior.
                </p>
              </div>
            ) : null}

            {editMode ? (
              <form
                className="study-participants-edit-form"
                onSubmit={(event) => void handleUpdateParticipant(event)}
              >
                <div className="study-participants-form-grid">
                  <label>
                    <span>Nume complet</span>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          full_name: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>Status</span>
                    <select
                      value={editForm.status}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          status: event.target.value as ParticipantStatus,
                        }))
                      }
                    >
                      <option value="invited">Invitat</option>
                      <option value="active">Activ</option>
                      <option value="suspended">Suspendat</option>
                      <option value="completed">Finalizat</option>
                      <option value="withdrawn">Retras</option>
                    </select>
                  </label>

                  <label>
                    <span>Data nașterii</span>
                    <input
                      type="date"
                      value={editForm.birth_date}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          birth_date: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Sex</span>
                    <select
                      value={editForm.sex}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          sex: event.target.value as ParticipantSex | "",
                        }))
                      }
                    >
                      <option value="">Nespecificat</option>
                      <option value="female">Feminin</option>
                      <option value="male">Masculin</option>
                      <option value="other">Altul</option>
                      <option value="prefer_not_to_say">Preferă să nu spună</option>
                    </select>
                  </label>

                  <label>
                    <span>Nivel activitate</span>
                    <select
                      value={editForm.activity_level}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          activity_level: event.target.value as ActivityLevel | "",
                        }))
                      }
                    >
                      <option value="">Nespecificat</option>
                      <option value="sedentary">Sedentar</option>
                      <option value="light">Activitate ușoară</option>
                      <option value="moderate">Activitate moderată</option>
                      <option value="active">Activ</option>
                      <option value="athlete">Sportiv</option>
                      <option value="unknown">Necunoscut</option>
                    </select>
                  </label>

                  <label className="study-participants-form-grid__full">
                    <span>Grup participant</span>
                    <input
                      type="text"
                      value={editForm.participant_group}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          participant_group: event.target.value,
                        }))
                      }
                      placeholder="Ex. Lot A, control, post-efort..."
                    />
                  </label>

                  <label className="study-participants-form-grid__full">
                    <span>Note</span>
                    <textarea
                      value={editForm.notes}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          notes: event.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </label>
                </div>

                <div className="study-participants-drawer__actions">
                  <button
                    type="button"
                    className="study-participants-secondary-btn"
                    onClick={() => setEditMode(false)}
                    disabled={editLoading}
                  >
                    Anulează
                  </button>

                  <button
                    type="submit"
                    className="study-participants-primary-btn"
                    disabled={editLoading}
                  >
                    {editLoading ? "Se salvează..." : "Salvează modificările"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <section className="study-participants-drawer-section">
                  <h4>Profil cercetare</h4>

                  <dl>
                    <div>
                      <dt>Sex</dt>
                      <dd>
                        {selectedParticipant.sex
                          ? SEX_LABELS[selectedParticipant.sex]
                          : "Nespecificat"}
                      </dd>
                    </div>

                    <div>
                      <dt>Vârstă</dt>
                      <dd>{calculateAge(selectedParticipant.birth_date)}</dd>
                    </div>

                    <div>
                      <dt>Data nașterii</dt>
                      <dd>{formatDate(selectedParticipant.birth_date)}</dd>
                    </div>

                    <div>
                      <dt>Grup participant</dt>
                      <dd>{selectedParticipant.participant_group || "Nespecificat"}</dd>
                    </div>

                    <div>
                      <dt>Nivel activitate</dt>
                      <dd>
                        {selectedParticipant.activity_level
                          ? ACTIVITY_LABELS[selectedParticipant.activity_level]
                          : "Nespecificat"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="study-participants-drawer-section">
                  <h4>Activitate în studiu</h4>

                  <dl>
                    <div>
                      <dt>Număr trimiteri</dt>
                      <dd>{selectedParticipant.submissions_count}</dd>
                    </div>

                    <div>
                      <dt>Ultima autentificare</dt>
                      <dd>{formatDateTime(selectedParticipant.last_login_at)}</dd>
                    </div>

                    <div>
                      <dt>Ultima trimitere</dt>
                      <dd>{formatDateTime(selectedParticipant.last_submission_at)}</dd>
                    </div>

                    <div>
                      <dt>Creat la</dt>
                      <dd>{formatDateTime(selectedParticipant.created_at)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="study-participants-drawer-section">
                  <h4>Afecțiuni declarate</h4>

                  {selectedParticipant.conditions?.length ? (
                    <div className="study-participants-conditions">
                      {selectedParticipant.conditions.map((condition) => (
                        <article key={condition.id}>
                          <strong>{CONDITION_LABELS[condition.condition_type]}</strong>
                          {condition.notes ? <span>{condition.notes}</span> : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="study-participants-muted">
                      Nu există afecțiuni declarate pentru acest participant.
                    </p>
                  )}
                </section>

                <section className="study-participants-drawer-section">
                  <h4>Note</h4>
                  <p className="study-participants-muted">
                    {selectedParticipant.notes?.trim()
                      ? selectedParticipant.notes
                      : "Nu au fost adăugate note pentru acest participant."}
                  </p>
                </section>

                <div className="study-participants-drawer__actions">
                  <button
                    type="button"
                    className="study-participants-secondary-btn"
                    onClick={() => setEditMode(true)}
                  >
                    Editează participant
                  </button>

                  <button
                    type="button"
                    className="study-participants-warning-btn"
                    onClick={() => void handleResetPin()}
                    disabled={resetPinLoading}
                  >
                    {resetPinLoading ? "Se resetează..." : "Resetează PIN"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}

      {isBulkModalOpen ? (
  <div className="study-participants-modal-overlay" onClick={closeBulkModal}>
    <div
      className="study-participants-modal study-participants-modal--bulk"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="study-participants-modal__header">
        <div>
          <h3>Importă mai mulți participanți</h3>
          <p>
            Încarcă un fișier CSV cu participanții care trebuie adăugați în studiu.
            PIN-ul poate fi lăsat gol și se va genera automat.
          </p>
        </div>

        <button
          type="button"
          onClick={closeBulkModal}
          aria-label="Închide"
        >
          <CloseIcon />
        </button>
      </div>

      {bulkCreatedItems.length > 0 ? (
        <div className="study-participants-created">
          <h4>{bulkCreatedItems.length} participanți creați cu succes</h4>

          <div className="study-participants-bulk-created-list">
            {bulkCreatedItems.map((item) => (
              <article key={item.participant.id}>
                <strong>
                  {item.participant.participant_code} · {item.participant.full_name}
                </strong>
                <span>
                  PIN: <b>{item.temporary_pin}</b>
                </span>
              </article>
            ))}
          </div>

          <small>
            Copiază codurile și PIN-urile acum. Din motive de securitate,
            PIN-urile nu vor mai fi afișate ulterior.
          </small>

          <button
            type="button"
            className="study-participants-primary-btn"
            onClick={closeBulkModal}
          >
            Am copiat datele
          </button>
        </div>
      ) : (
        <form onSubmit={(event) => void handleUploadParticipantsCsv(event)}>
          <label className="study-participants-csv-upload">
            <span>Fișier CSV</span>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setBulkFile(selectedFile);
              }}
            />

            <small>
              Fișierul trebuie să conțină cel puțin coloana{" "}
              <strong>full_name</strong>. Coloanele recomandate sunt:
              participant_identifier, pin, birth_date, sex, participant_group,
              activity_level, notes, condition_type și condition_notes.
            </small>
          </label>

          {bulkFile ? (
            <div className="study-participants-selected-file">
              <strong>{bulkFile.name}</strong>
              <span>{Math.round(bulkFile.size / 1024)} KB</span>
            </div>
          ) : null}

          <div className="study-participants-bulk-help">
            Exemplu antet CSV:
            <code>
              full_name,participant_identifier,pin,birth_date,sex,participant_group,activity_level,notes,condition_type,condition_notes
            </code>
          </div>

          <div className="study-participants-modal__actions">
            <button
              type="button"
              className="study-participants-secondary-btn"
              onClick={closeBulkModal}
              disabled={bulkLoading}
            >
              Anulează
            </button>

            <button
              type="submit"
              className="study-participants-primary-btn"
              disabled={bulkLoading || !bulkFile}
            >
              {bulkLoading ? "Se importă..." : "Importă participanții"}
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="study-participants-modal-overlay" onClick={closeCreateModal}>
          <div
            className="study-participants-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="study-participants-modal__header">
              <div>
                <h3>Adaugă participant</h3>
                <p>
                  Creează un profil de participant și generează datele de acces pentru studiu.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                aria-label="Închide"
              >
                <CloseIcon />
              </button>
            </div>

            {createdPin ? (
              <div className="study-participants-created">
                <h4>Participant creat cu succes</h4>
                <p>
                  Cod participant: <strong>{createdPin.participant_code}</strong>
                </p>
                <p>
                  PIN: <strong>{createdPin.temporary_pin}</strong>
                </p>
                <small>
                  Copiază PIN-ul înainte de a închide fereastra. Acesta nu va mai
                  fi afișat ulterior.
                </small>

                <button
                  type="button"
                  className="study-participants-primary-btn"
                  onClick={closeCreateModal}
                >
                  Am copiat datele
                </button>
              </div>
            ) : (
              <form onSubmit={(event) => void handleCreateParticipant(event)}>
                <div className="study-participants-form-grid">
                  <label>
                    <span>Nume complet</span>
                    <input
                      type="text"
                      value={createForm.full_name}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          full_name: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>PIN opțional</span>
                    <input
                      type="text"
                      value={createForm.pin}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          pin: event.target.value,
                        }))
                      }
                      placeholder="Se generează automat dacă este gol"
                    />
                  </label>

                  <label>
                    <span>Data nașterii</span>
                    <input
                      type="date"
                      value={createForm.birth_date}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          birth_date: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Sex</span>
                    <select
                      value={createForm.sex}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          sex: event.target.value as ParticipantSex | "",
                        }))
                      }
                    >
                      <option value="">Nespecificat</option>
                      <option value="female">Feminin</option>
                      <option value="male">Masculin</option>
                      <option value="other">Altul</option>
                      <option value="prefer_not_to_say">Preferă să nu spună</option>
                    </select>
                  </label>

                  <label>
                    <span>Nivel activitate</span>
                    <select
                      value={createForm.activity_level}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          activity_level: event.target.value as ActivityLevel | "",
                        }))
                      }
                    >
                      <option value="">Nespecificat</option>
                      <option value="sedentary">Sedentar</option>
                      <option value="light">Activitate ușoară</option>
                      <option value="moderate">Activitate moderată</option>
                      <option value="active">Activ</option>
                      <option value="athlete">Sportiv</option>
                      <option value="unknown">Necunoscut</option>
                    </select>
                  </label>

                  <label>
                    <span>Grup participant</span>
                    <input
                      type="text"
                      value={createForm.participant_group}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          participant_group: event.target.value,
                        }))
                      }
                      placeholder="Ex. Lot A, control, post-efort..."
                    />
                  </label>

                  <label className="study-participants-form-grid__full">
                    <span>Note</span>
                    <textarea
                      rows={3}
                      value={createForm.notes}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="study-participants-modal__actions">
                  <button
                    type="button"
                    className="study-participants-secondary-btn"
                    onClick={closeCreateModal}
                    disabled={createLoading}
                  >
                    Anulează
                  </button>

                  <button
                    type="submit"
                    className="study-participants-primary-btn"
                    disabled={createLoading}
                  >
                    {createLoading ? "Se adaugă..." : "Adaugă participant"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}