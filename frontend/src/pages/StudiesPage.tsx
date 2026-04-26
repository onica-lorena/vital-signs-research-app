import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import ResearcherLayout from "../components/layout/ResearcherLayout";
import { getCurrentUser } from "../auth/authStorage";
import { SESSION_EXPIRED_ERROR } from "../auth/authFetch";
import {
  deleteStudyRequest,
  getStudiesSummaryRequest,
  getStudyByIdRequest,
  listStudiesRequest,
  type DataEntryMode,
  type MeasurementFrequency,
  type StudyDetailResponse,
  type StudyListItemResponse,
  type StudyParameterKey,
  type StudyStatus,
  type StudySummaryResponse,
  type StudyType,
} from "../studies/studiesApi";
import "../styles/researcher-dashboard.css";
import "../styles/studies-page.css";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const PAGE_SIZE = 7;

type SortValue = "recent" | "oldest" | "title_asc" | "title_desc";

const STATUS_LABELS: Record<StudyStatus, string> = {
  draft: "Ciornă",
  active: "Activ",
  in_analysis: "În analiză",
  completed: "Finalizat",
};

const STUDY_TYPE_LABELS: Record<StudyType, string> = {
  observational_prospective: "Observațional prospectiv",
  observational_retrospective: "Observațional retrospectiv",
  observational_mixed: "Observațional mixt",
};

const DATA_ENTRY_MODE_LABELS: Record<DataEntryMode, string> = {
  manual: "Introducere manuală",
  csv: "Import fișier CSV",
  manual_csv: "Manual + CSV",
};

const PARAMETER_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "Saturația de oxigen",
  temperature: "Temperatura corporală",
};

const PARAMETER_UNITS: Record<StudyParameterKey, string> = {
  heartRate: "bătăi/min",
  respiratoryRate: "respirații/min",
  spo2: "%",
  temperature: "°C",
};

const FREQUENCY_LABELS: Record<MeasurementFrequency, string> = {
  continuous: "Continuu",
  every_1_min: "La 1 minut",
  every_5_min: "La 5 minute",
  every_15_min: "La 15 minute",
  every_30_min: "La 30 minute",
  every_1_hour: "La 1 oră",
};

const STUDY_TYPE_COLORS: Record<StudyType, string> = {
  observational_prospective: "#57b86c",
  observational_retrospective: "#f0a247",
  observational_mixed: "#b8c6c7",
};

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19.2L5.7 12.9C4.1 11.3 4.1 8.7 5.7 7.1C7.3 5.5 9.9 5.5 11.5 7.1L12 7.6L12.5 7.1C14.1 5.5 16.7 5.5 18.3 7.1C19.9 8.7 19.9 11.3 18.3 12.9L12 19.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 12H7L9.4 8.5L12 15.5L14.3 10.8H20.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThermometerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 6.5C10.5 5.12 11.62 4 13 4C14.38 4 15.5 5.12 15.5 6.5V13.2C16.4 13.9 17 15.02 17 16.3C17 18.45 15.21 20.2 13 20.2C10.79 20.2 9 18.45 9 16.3C9 15.02 9.6 13.9 10.5 13.2V6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13 10V16.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function OxygenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="6.8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8.4C10.45 8.4 9.2 9.66 9.2 11.2C9.2 12.74 10.45 14 12 14C13.55 14 14.8 12.74 14.8 11.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 6V18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M6 12H18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 17H15.5C16.05 17 16.5 16.55 16.5 16V11.2C16.5 8.75 14.72 6.7 12.35 6.28V5.8C12.35 5.14 11.81 4.6 11.15 4.6C10.49 4.6 9.95 5.14 9.95 5.8V6.28C7.58 6.7 5.8 8.75 5.8 11.2V16C5.8 16.55 6.25 17 6.8 17H8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 18.2C9.9 19.15 10.72 19.8 11.7 19.8C12.68 19.8 13.5 19.15 13.8 18.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CaretDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StudyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5.5" y="4.5" width="13" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 8.3H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 15.7H12.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.6 12C4.7 8.4 8 6.6 12 6.6C16 6.6 19.3 8.4 21.4 12C19.3 15.6 16 17.4 12 17.4C8 17.4 4.7 15.6 2.6 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.2 7V5.7C9.2 5.04 9.74 4.5 10.4 4.5H13.6C14.26 4.5 14.8 5.04 14.8 5.7V7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9.5V17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 9.5V17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 9.5V17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.8 7L7.5 18C7.57 19.05 8.44 19.87 9.5 19.87H14.5C15.56 19.87 16.43 19.05 16.5 18L17.2 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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

function CompletedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5.5" y="4.5" width="13" height="15" rx="2.1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 12.2L11.1 14.3L15.4 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 18.5H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 15.5V11.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15.5V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 15.5V12.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.9 9.5C10.1 8.35 11.05 7.5 12.25 7.5C13.6 7.5 14.6 8.45 14.6 9.7C14.6 10.75 13.95 11.35 13.15 11.9C12.45 12.38 12 12.83 12 13.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.8" r="1" fill="currentColor" />
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 7L7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function getInitials(fullName?: string | null): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const value = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return value || "VS";
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

function getStatusClassName(status: StudyStatus): string {
  if (status === "active") {
    return "is-active";
  }

  if (status === "in_analysis") {
    return "is-analysis";
  }

  if (status === "completed") {
    return "is-completed";
  }

  return "is-draft";
}

function getTypeTone(type: StudyType): string {
  if (type === "observational_prospective") {
    return "is-prospective";
  }

  if (type === "observational_retrospective") {
    return "is-retrospective";
  }

  return "is-mixed";
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

type StudyIconComponent = () => JSX.Element;

const STUDY_ICONS: StudyIconComponent[] = [
  StudyIcon,
  HeartIcon,
  PulseIcon,
  ThermometerIcon,
  OxygenIcon,
  CrossIcon,
];

function getStableIconIndex(value: string, total: number): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % total;
}

function getStudyIconComponent(study: Pick<StudyListItemResponse, "id" | "code" | "title">) {
  const seed = `${study.id}-${study.code}-${study.title}`;
  const iconIndex = getStableIconIndex(seed, STUDY_ICONS.length);
  return STUDY_ICONS[iconIndex];
}

export default function StudiesPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [studies, setStudies] = useState<StudyListItemResponse[]>([]);
  const [summary, setSummary] = useState<StudySummaryResponse | null>(null);

  const [isListLoading, setIsListLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  const [pageError, setPageError] = useState("");
  const [page, setPage] = useState(1);
  const [totalStudies, setTotalStudies] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudyStatus | "">("");
  const [studyTypeFilter, setStudyTypeFilter] = useState<StudyType | "">("");
  const [sortValue, setSortValue] = useState<SortValue>("recent");

  const [selectedStudy, setSelectedStudy] = useState<StudyDetailResponse | null>(null);
  const [studyToDelete, setStudyToDelete] = useState<StudyListItemResponse | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const sortConfig = useMemo(() => {
    switch (sortValue) {
      case "oldest":
        return { sort_by: "created_at" as const, sort_order: "asc" as const };
      case "title_asc":
        return { sort_by: "title" as const, sort_order: "asc" as const };
      case "title_desc":
        return { sort_by: "title" as const, sort_order: "desc" as const };
      case "recent":
      default:
        return { sort_by: "created_at" as const, sort_order: "desc" as const };
    }
  }, [sortValue]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudies() {
      setIsListLoading(true);

      try {
        const response = await listStudiesRequest({
          page,
          page_size: PAGE_SIZE,
          search: debouncedSearch,
          status: statusFilter,
          study_type: studyTypeFilter,
          sort_by: sortConfig.sort_by,
          sort_order: sortConfig.sort_order,
        });

        if (cancelled) {
          return;
        }

        setStudies(response.items);
        setTotalStudies(response.total);
        setTotalPages(response.total_pages);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setStudies([]);
        setTotalStudies(0);
        setTotalPages(1);
        setPageError(
          error instanceof Error
            ? error.message
            : "A apărut o eroare la încărcarea studiilor."
        );
      } finally {
        if (!cancelled) {
          setIsListLoading(false);
        }
      }
    }

    void loadStudies();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    debouncedSearch,
    statusFilter,
    studyTypeFilter,
    sortConfig.sort_by,
    sortConfig.sort_order,
    refreshToken,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setIsSummaryLoading(true);

      try {
        const response = await getStudiesSummaryRequest();

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
            : "A apărut o eroare la încărcarea rezumatului."
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
  }, [refreshToken]);

  async function handleOpenDetails(studyId: number) {
    setDetailLoadingId(studyId);
    setPageError("");

    try {
      const detail = await getStudyByIdRequest(studyId);
      setSelectedStudy(detail);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut prelua detaliile studiului."
      );
    } finally {
      setDetailLoadingId(null);
    }
  }

  function handleDeleteStudy(study: StudyListItemResponse) {
    setStudyToDelete(study);
  }
  
  function handleCloseDeleteModal() {
    if (deleteLoadingId !== null) {
      return;
    }
  
    setStudyToDelete(null);
  }
  
  async function confirmDeleteStudy() {
    if (!studyToDelete) {
      return;
    }
  
    const study = studyToDelete;
  
    setDeleteLoadingId(study.id);
    setPageError("");
  
    try {
      await deleteStudyRequest(study.id);
  
      if (selectedStudy?.id === study.id) {
        setSelectedStudy(null);
      }
  
      if (studies.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }
  
      setStudyToDelete(null);
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }
  
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-a putut șterge studiul."
      );
    } finally {
      setDeleteLoadingId(null);
    }
  }

  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages]);

  const rowStart = totalStudies === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rowEnd = Math.min(page * PAGE_SIZE, totalStudies);

  const distributionItems = useMemo(() => {
    const order: StudyType[] = [
      "observational_prospective",
      "observational_retrospective",
      "observational_mixed",
    ];

    const total = summary?.study_type_distribution.reduce(
      (accumulator, item) => accumulator + item.count,
      0
    ) ?? 0;

    return order.map((studyType) => {
      const current = summary?.study_type_distribution.find(
        (item) => item.study_type === studyType
      );

      const count = current?.count ?? 0;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      return {
        studyType,
        label: STUDY_TYPE_LABELS[studyType],
        count,
        percentage,
        color: STUDY_TYPE_COLORS[studyType],
      };
    });
  }, [summary]);

  const chartDistributionItems = useMemo(
    () =>
      distributionItems.filter((item) => item.count > 0),
    [distributionItems]
  );

  return (
    <ResearcherLayout
      activeItem="studii"
      title="Studii"
      subtitle="Gestionează toate studiile tale de cercetare dintr-un singur loc."
      contentWidth="wide"
      actions={
        <div className="studies-top-actions">
          <button
            type="button"
            className="researcher-create-btn"
            onClick={() => navigate("/cercetator/studii/creare")}
          >
            <PlusIcon />
            <span>Creează studiu</span>
          </button>
        </div>
      }
    >
      <div className="studies-page">
        {pageError ? (
          <div className="studies-banner studies-banner--error">{pageError}</div>
        ) : null}

        <div className="studies-filters-layout">
          <section className="studies-filters-card">
            <div className="studies-filter-block">
              <span className="studies-filter-label">Căutare</span>

              <div className="studies-search-field">
                <span className="studies-search-field__icon">
                  <SearchIcon />
                </span>

                <input
                  type="text"
                  placeholder="Caută după titlu sau cod..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
            </div>

            <label className="studies-filter-block">
              <span className="studies-filter-label">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StudyStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Toate</option>
                <option value="draft">Ciornă</option>
                <option value="active">Activ</option>
                <option value="in_analysis">În analiză</option>
                <option value="completed">Finalizat</option>
              </select>
            </label>
              
            <label className="studies-filter-block">
              <span className="studies-filter-label">Tip studiu</span>
              <select
                value={studyTypeFilter}
                onChange={(event) => {
                  setStudyTypeFilter(event.target.value as StudyType | "");
                  setPage(1);
                }}
              >
                <option value="">Toate</option>
                <option value="observational_prospective">Observațional prospectiv</option>
                <option value="observational_retrospective">Observațional retrospectiv</option>
                <option value="observational_mixed">Observațional mixt</option>
              </select>
            </label>
          </section>
              
          <section className="studies-sort-card">
            <label className="studies-filter-block">
              <span className="studies-filter-label">Sortează după</span>
              <select
                value={sortValue}
                onChange={(event) => {
                  setSortValue(event.target.value as SortValue);
                  setPage(1);
                }}
              >
                <option value="recent">Cele mai recente</option>
                <option value="oldest">Cele mai vechi</option>
                <option value="title_asc">Titlu A-Z</option>
                <option value="title_desc">Titlu Z-A</option>
              </select>
            </label>
          </section>
        </div>

        <div className="studies-content-grid">
          <section className="studies-main-card">
            <div className="studies-table-wrap">
              {isListLoading ? (
                <div className="studies-loading-state">
                  Se încarcă studiile...
                </div>
              ) : studies.length === 0 ? (
                <div className="studies-empty-state">
                  <div className="studies-empty-state__icon">
                    <StudyIcon />
                  </div>
                  <h3>Nu există studii pentru criteriile selectate</h3>
                  <p>
                    Încearcă să modifici filtrele sau creează un studiu nou.
                  </p>
                </div>
              ) : (
                <table className="studies-table">
                  <thead>
                    <tr>
                      <th>Studiu</th>
                      <th>Cod</th>
                      <th>Status</th>
                      <th>Participanți</th>
                      <th>Data creării</th>
                      <th>Acțiuni</th>
                    </tr>
                  </thead>

                  <tbody>
                    {studies.map((study) => {
                      const StudyVisualIcon = getStudyIconComponent(study);
                    
                      return (
                        <tr key={study.id}>
                          <td className="studies-table__study-cell">
                            <div className="studies-study-row">
                              <span
                                className={`studies-study-row__icon ${getTypeTone(
                                  study.study_type
                                )}`}
                              >
                                <StudyVisualIcon />
                              </span>
                              
                              <div className="studies-study-row__content">
                                <strong>{study.title}</strong>
                              </div>
                            </div>
                          </td>
                              
                          <td className="studies-table__code">{study.code}</td>
                              
                          <td>
                            <span
                              className={`studies-status-badge ${getStatusClassName(
                                study.status
                              )}`}
                            >
                              {STATUS_LABELS[study.status]}
                            </span>
                          </td>
                            
                          <td>{study.participants_count}</td>
                            
                          <td>{formatDate(study.created_at)}</td>
                            
                          <td className="studies-table__actions">
                            <button
                              type="button"
                              className="studies-icon-btn"
                              aria-label={`Vezi detalii pentru ${study.code}`}
                              onClick={() => navigate(`/cercetator/studii/${study.id}`)}
                              disabled={
                                detailLoadingId === study.id ||
                                deleteLoadingId === study.id
                              }
                            >
                              <EyeIcon />
                            </button>
                            
                            <button
                              type="button"
                              className="studies-icon-btn studies-icon-btn--danger"
                              aria-label={`Șterge studiul ${study.code}`}
                              onClick={() => void handleDeleteStudy(study)}
                              disabled={
                                detailLoadingId === study.id ||
                                deleteLoadingId === study.id
                              }
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="studies-table-footer">
              <span className="studies-table-footer__count">
                {rowStart}-{rowEnd} din {totalStudies} studii
              </span>

              <div className="studies-pagination">
                <button
                  type="button"
                  className="studies-pagination__btn"
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
                    <span key={pageNumber} className="studies-pagination__group">
                      {shouldShowDots ? (
                        <span className="studies-pagination__dots">…</span>
                      ) : null}

                      <button
                        type="button"
                        className={`studies-pagination__page ${
                          page === pageNumber ? "is-active" : ""
                        }`}
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
                  className="studies-pagination__btn"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages || isListLoading}
                >
                  ›
                </button>
              </div>
            </div>
          </section>

          <aside className="studies-side-column">
            <section className="studies-side-card studies-side-card--soft-green">
              <div className="studies-side-card__header">
                <h2>Rezumat</h2>
              </div>

              {isSummaryLoading ? (
                <div className="studies-side-loading">Se încarcă rezumatul...</div>
              ) : (
                <div className="studies-summary-grid">
                  <article className="studies-summary-item">
                    <span className="studies-summary-item__icon is-neutral">
                      <ClipboardIcon />
                    </span>
                    <div>
                      <strong>{summary?.total_studies ?? 0}</strong>
                      <span>Total studii</span>
                    </div>
                  </article>

                  <article className="studies-summary-item">
                    <span className="studies-summary-item__icon is-green">
                      <ActivityIcon />
                    </span>
                    <div>
                      <strong>{summary?.active_studies ?? 0}</strong>
                      <span>Studii active</span>
                    </div>
                  </article>

                  <article className="studies-summary-item">
                    <span className="studies-summary-item__icon is-gray">
                      <CompletedIcon />
                    </span>
                    <div>
                      <strong>{summary?.completed_studies ?? 0}</strong>
                      <span>Studii finalizate</span>
                    </div>
                  </article>

                  <article className="studies-summary-item">
                    <span className="studies-summary-item__icon is-orange">
                      <AnalysisIcon />
                    </span>
                    <div>
                      <strong>{summary?.studies_in_analysis ?? 0}</strong>
                      <span>În analiză</span>
                    </div>
                  </article>
                </div>
              )}
            </section>

            <section className="studies-side-card">
              <div className="studies-side-card__header">
                <h2>Tipuri de studii</h2>
              </div>

              {isSummaryLoading ? (
                <div className="studies-side-loading">Se încarcă distribuția...</div>
              ) : (
                <>
                  <div className="studies-distribution">
                    {chartDistributionItems.length === 0 ? (
                      <div className="studies-distribution__empty-chart" />
                    ) : (
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Tooltip
                            formatter={(value, _name, props) => [
                              `${value} studii`,
                              props.payload.label,
                            ]}
                          />
                  
                          <Pie
                            data={chartDistributionItems}
                            dataKey="count"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={60}
                            paddingAngle={2}
                            cornerRadius={2}
                            stroke="none"
                            strokeWidth={0}
                          >
                            {chartDistributionItems.map((item) => (
                              <Cell key={item.studyType} fill={item.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="studies-distribution__legend">
                    {distributionItems.map((item) => (
                      <div key={item.studyType} className="studies-distribution__legend-item">
                        <div className="studies-distribution__legend-left">
                          <span
                            className="studies-distribution__legend-dot"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.label}</span>
                        </div>

                        <strong>{item.percentage}%</strong>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </aside>
        </div>

        {selectedStudy ? (
          <div
            className="studies-modal-overlay"
            onClick={() => setSelectedStudy(null)}
          >
            <div
              className="studies-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="studies-modal__header">
                <div>
                  <span className="studies-modal__eyebrow">{selectedStudy.code}</span>
                  <h2>{selectedStudy.title}</h2>
                  <p>
                    Vizualizare rapidă a informațiilor disponibile pentru studiul selectat.
                  </p>
                </div>

                <button
                  type="button"
                  className="studies-modal__close"
                  onClick={() => setSelectedStudy(null)}
                  aria-label="Închide"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="studies-modal__grid">
                <section className="studies-modal__card">
                  <h3>Detalii generale</h3>

                  <dl className="studies-modal__details">
                    <div>
                      <dt>Tip studiu</dt>
                      <dd>{STUDY_TYPE_LABELS[selectedStudy.study_type]}</dd>
                    </div>

                    <div>
                      <dt>Status</dt>
                      <dd>{STATUS_LABELS[selectedStudy.status]}</dd>
                    </div>

                    <div>
                      <dt>Mod introducere date</dt>
                      <dd>{DATA_ENTRY_MODE_LABELS[selectedStudy.data_entry_mode]}</dd>
                    </div>

                    <div>
                      <dt>Participanți</dt>
                      <dd>{selectedStudy.participants_count}</dd>
                    </div>

                    <div>
                      <dt>Data de început</dt>
                      <dd>{formatDate(selectedStudy.start_date)}</dd>
                    </div>

                    <div>
                      <dt>Data creării</dt>
                      <dd>{formatDate(selectedStudy.created_at)}</dd>
                    </div>

                    <div>
                      <dt>Ultima actualizare</dt>
                      <dd>{formatDate(selectedStudy.updated_at)}</dd>
                    </div>

                    <div>
                      <dt>ID cercetător</dt>
                      <dd>{selectedStudy.researcher_id}</dd>
                    </div>
                  </dl>
                </section>

                <section className="studies-modal__card">
                  <h3>Parametri monitorizați</h3>

                  {selectedStudy.parameters.length === 0 ? (
                    <p className="studies-modal__empty">
                      Nu există parametri configurați pentru acest studiu.
                    </p>
                  ) : (
                    <div className="studies-modal__parameters">
                      {selectedStudy.parameters.map((parameter) => (
                        <article
                          key={parameter.id}
                          className="studies-modal__parameter-card"
                        >
                          <strong>{PARAMETER_LABELS[parameter.parameter_key]}</strong>
                          <span>{PARAMETER_UNITS[parameter.parameter_key]}</span>
                          <small>
                            Frecvență: {FREQUENCY_LABELS[parameter.measurement_frequency]}
                          </small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <section className="studies-modal__card studies-modal__card--full">
                <h3>Descriere</h3>

                <p className="studies-modal__description">
                  {selectedStudy.description?.trim()
                    ? selectedStudy.description
                    : "Nu a fost introdusă o descriere pentru acest studiu."}
                </p>
              </section>
            </div>
          </div>
        ) : null}
        {studyToDelete ? (
          <div
            className="studies-confirm-overlay"
            onClick={handleCloseDeleteModal}
          >
            <div
              className="studies-confirm-modal"
              onClick={(event) => event.stopPropagation()}
            >

              <h3>Ștergi acest studiu?</h3>

              <p>
                Studiul <strong>{studyToDelete.code}</strong> — {studyToDelete.title} va fi
                eliminat din listă. Această acțiune nu poate fi anulată.
              </p>

              <div className="studies-confirm-actions">
                <button
                  type="button"
                  className="studies-confirm-btn studies-confirm-btn--secondary"
                  onClick={handleCloseDeleteModal}
                  disabled={deleteLoadingId === studyToDelete.id}
                >
                  Anulează
                </button>

                <button
                  type="button"
                  className="studies-confirm-btn studies-confirm-btn--danger"
                  onClick={() => void confirmDeleteStudy()}
                  disabled={deleteLoadingId === studyToDelete.id}
                >
                  {deleteLoadingId === studyToDelete.id
                    ? "Se șterge..."
                    : "Șterge studiul"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ResearcherLayout>
  );
}