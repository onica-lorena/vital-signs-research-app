import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type {
  StudyAdminOverviewResponse,
  StudyMonthlyCountResponse,
  StudyType,
} from "../admin/adminApi";

type StudyStatus = StudyAdminOverviewResponse["status"];

type AdminStudiesProps = {
  studies: StudyAdminOverviewResponse[];
  studiesLoading: boolean;
  studyTypeLabels: Record<StudyType, string>;
  studyStatusLabels: Record<StudyStatus, string>;
  formatDate: (value?: string | null) => string;
  totalStudies: number;
  activeStudiesCount: number;
  studiesInAnalysisCount: number;
  completedStudiesCount: number;
  draftStudiesCount: number;
  monthlyStudies: StudyMonthlyCountResponse[];
  onOpenStudy: (studyId: number) => void;
};

const STUDY_STATUS_COLORS: Record<StudyStatus, string> = {
  draft: "#dbeaf6",
  active: "#76b65c",
  in_analysis: "#ef9647",
  completed: "#dfe8dc",
};

const STUDIES_PAGE_SIZE = 10;

function getStudyStatusPillClass(status: StudyStatus) {
  switch (status) {
    case "active":
      return "admin-status-pill admin-status-pill--success";
    case "in_analysis":
      return "admin-status-pill admin-status-pill--warning";
    case "completed":
      return "admin-status-pill admin-status-pill--neutral";
    case "draft":
    default:
      return "admin-status-pill";
  }
}

function formatEntryMethodLabel(value?: string | null) {
  switch (value) {
    case "manual":
      return "Manual";
    case "csv":
      return "CSV";
    case "manual_csv":
      return "Manual + CSV";
    default:
      return value ?? "—";
  }
}

export default function AdminStudies({
  studies,
  studiesLoading,
  studyTypeLabels,
  studyStatusLabels,
  totalStudies,
  monthlyStudies,
  activeStudiesCount,
  studiesInAnalysisCount,
  completedStudiesCount,
  draftStudiesCount,
  onOpenStudy,
}: AdminStudiesProps) {

  const [studiesPage, setStudiesPage] = useState(1);
  const [studySearch, setStudySearch] = useState("");
  const [studyStatusFilter, setStudyStatusFilter] = useState<StudyStatus | "">("");

  const studyStatusData = useMemo(
    () =>
      [
        {
          key: "active",
          name: "Active",
          value: activeStudiesCount,
          color: STUDY_STATUS_COLORS.active,
        },
        {
          key: "in_analysis",
          name: "În analiză",
          value: studiesInAnalysisCount,
          color: STUDY_STATUS_COLORS.in_analysis,
        },
        {
          key: "completed",
          name: "Finalizate",
          value: completedStudiesCount,
          color: STUDY_STATUS_COLORS.completed,
        },
        {
          key: "draft",
          name: "Ciornă",
          value: draftStudiesCount,
          color: STUDY_STATUS_COLORS.draft,
        },
      ].filter((item) => item.value > 0),
    [activeStudiesCount, studiesInAnalysisCount, completedStudiesCount, draftStudiesCount]
  );

  const recentStudiesChartData = useMemo(
    () =>
      monthlyStudies.map((item) => {
        const [year, month] = item.month.split("-").map(Number);
        const date = new Date(year, month - 1, 1);

        return {
          name: date.toLocaleDateString("ro-RO", {
            month: "short",
            year: "2-digit",
          }),
          value: item.studies_count,
        };
      }),
    [monthlyStudies]
  );

  const filteredStudies = useMemo(() => {
    const searchTerm = studySearch.trim().toLowerCase();

    return studies.filter((study) => {
      const matchesSearch =
        !searchTerm ||
        [
          study.code,
          study.title,
          study.researcher?.full_name,
          study.researcher?.email,
          study.institution,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm));

      const matchesStatus =
        !studyStatusFilter || study.status === studyStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [studies, studySearch, studyStatusFilter]);

  const studiesTotalPages = Math.max(
    1,
    Math.ceil(filteredStudies.length / STUDIES_PAGE_SIZE)
  );

  const paginatedStudies = useMemo(() => {
    const start = (studiesPage - 1) * STUDIES_PAGE_SIZE;
    return filteredStudies.slice(start, start + STUDIES_PAGE_SIZE);
  }, [filteredStudies, studiesPage]);

  const studiesRowStart =
    filteredStudies.length === 0 ? 0 : (studiesPage - 1) * STUDIES_PAGE_SIZE + 1;

  const studiesRowEnd = Math.min(
    studiesPage * STUDIES_PAGE_SIZE,
    filteredStudies.length
  );

  useEffect(() => {
    if (studiesPage > studiesTotalPages) {
      setStudiesPage(studiesTotalPages);
    }
  }, [studiesPage, studiesTotalPages]);

  return (
    <>
      <section className="admin-studies-overview">
        <div className="admin-kpi-grid admin-kpi-grid--studies-page">
          <article className="admin-kpi-card admin-kpi-card--studies">
            <div className="admin-kpi-card__top">
              <span>Total studii</span>
              <div className="admin-kpi-icon">🧪</div>
            </div>
            <strong>{totalStudies}</strong>
            <small>Studii disponibile pentru monitorizare administrativă.</small>
          </article>

          <article className="admin-kpi-card admin-kpi-card--users">
            <div className="admin-kpi-card__top">
              <span>Studii active</span>
              <div className="admin-kpi-icon">▶</div>
            </div>
            <strong>{activeStudiesCount}</strong>
            <small>Studii aflate în desfășurare în acest moment.</small>
          </article>

          <article className="admin-kpi-card admin-kpi-card--requests">
            <div className="admin-kpi-card__top">
              <span>În analiză</span>
              <div className="admin-kpi-icon">📊</div>
            </div>
            <strong>{studiesInAnalysisCount}</strong>
            <small>Studii în etapa de analiză și verificare administrativă.</small>
          </article>

          <article className="admin-kpi-card admin-kpi-card--analysis">
            <div className="admin-kpi-card__top">
              <span>Finalizate</span>
              <div className="admin-kpi-icon">✓</div>
            </div>
            <strong>{completedStudiesCount}</strong>
            <small>Studii încheiate în cadrul platformei.</small>
          </article>
        </div>

        <div className="admin-section-grid admin-section-grid--access">
          <section className="admin-panel admin-panel--status-chart">
            <div className="admin-panel__header">
              <div>
                {/*<div className="admin-panel__hint">Distribuție statusuri</div>*/}
                <h2>Starea studiilor</h2>
              </div>
            </div>

            {studyStatusData.length === 0 ? (
              <p className="admin-empty">Nu există studii pentru afișare.</p>
            ) : (
              <div className="admin-status-chart-layout">
                <div className="admin-chart-box admin-chart-box--status">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studyStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={44}
                        outerRadius={66}
                        paddingAngle={3}
                      >
                        {studyStatusData.map((item) => (
                          <Cell key={item.key} fill={item.color} />
                        ))}
                      </Pie>

                      <Tooltip formatter={(value) => [value, "Studii"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="admin-legend-list admin-legend-list--status">
                  {studyStatusData.map((item) => (
                    <div key={item.key}>
                      <span
                        className="admin-legend-dot"
                        style={{ background: item.color }}
                      />
                      <span>{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                {/*<div className="admin-panel__hint">Evoluție recentă</div>*/}
                <h2>Studii pe ultimele 6 luni</h2>
              </div>
            </div>
        
            <div className="admin-chart-box admin-chart-box--wide">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentStudiesChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(value) => [value, "Studii"]} />
                  <Bar
                    dataKey="value"
                    fill="#76b65c"
                    radius={[8, 8, 0, 0]}
                    barSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>

      <div className="admin-section-grid admin-section-grid--users-list">
        <section className="admin-panel admin-panel--wide">
          <div className="admin-panel__header">
            <div>
              {/*<div className="admin-panel__hint">Administrare studii</div>*/}
              <h2>Toate studiile</h2>
            </div>
          </div>

          <div className="admin-filters">
            <input
              type="text"
              placeholder="Caută după cod, titlu sau cercetător..."
              value={studySearch}
              onChange={(event) => {
                setStudySearch(event.target.value);
                setStudiesPage(1);
              }}
            />

            <select
              value={studyStatusFilter}
              onChange={(event) => {
                setStudyStatusFilter(event.target.value as StudyStatus | "");
                setStudiesPage(1);
              }}
            >
              <option value="">Toate statusurile</option>
              <option value="draft">Ciornă</option>
              <option value="active">Activ</option>
              <option value="in_analysis">În analiză</option>
              <option value="completed">Finalizat</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setStudiesPage(1);
              }}
            >
              Aplică
            </button>
          </div>

          {studiesLoading ? (
            <p className="admin-loading">Se încarcă studiile...</p>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cod</th>
                      <th>Titlu</th>
                      <th>Status</th>
                      <th>Tip</th>
                      <th>Mod colectare</th>
                      <th>Cercetător</th>
                      <th>Participanți</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="admin-table__empty">
                          Nu există studii disponibile pentru filtrele selectate.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudies.map((study) => (
                        <tr
                          key={study.id}
                          className="admin-table-clickable-row"
                          onClick={() => onOpenStudy(study.id)}
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onOpenStudy(study.id);
                            }
                          }}
                        >
                          <td>{study.code}</td>
                          <td>{study.title}</td>
                          <td>
                            <span className={getStudyStatusPillClass(study.status)}>
                              {studyStatusLabels[study.status]}
                            </span>
                          </td>
                          <td>{studyTypeLabels[study.study_type]}</td>
                          <td>{formatEntryMethodLabel(study.data_entry_mode)}</td>
                          <td>{study.researcher.full_name}</td>
                          <td>{study.participants_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-table-footer">
                <span>
                  Afișare {studiesRowStart} - {studiesRowEnd} din {filteredStudies.length} studii
                </span>

                <div className="admin-pagination">
                  <button
                    type="button"
                    onClick={() => setStudiesPage((prev) => Math.max(1, prev - 1))}
                    disabled={studiesPage === 1 || studiesLoading}
                  >
                    ‹
                  </button>

                  <button type="button" className="is-active" disabled>
                    {studiesPage}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStudiesPage((prev) => Math.min(studiesTotalPages, prev + 1))
                    }
                    disabled={studiesPage === studiesTotalPages || studiesLoading}
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}