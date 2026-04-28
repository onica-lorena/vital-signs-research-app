import { useMemo } from "react";
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
  StudyType,
} from "../admin/adminApi";

type StudyStatus = StudyAdminOverviewResponse["status"];

type ParticipantSummary = {
  total_participants: number;
  invited_participants: number;
  active_participants: number;
  suspended_participants: number;
  completed_participants: number;
  withdrawn_participants: number;
} | null;

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
  onOpenStudy: (studyId: number) => void;
};

const STUDY_STATUS_COLORS: Record<StudyStatus, string> = {
  draft: "#dbeaf6",
  active: "#76b65c",
  in_analysis: "#ef9647",
  completed: "#dfe8dc",
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C4.4 7.8 7.7 5.5 12 5.5C16.3 5.5 19.6 7.8 21.5 12C19.6 16.2 16.3 18.5 12 18.5C7.7 18.5 4.4 16.2 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 15A3 3 0 1 0 12 9A3 3 0 0 0 12 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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
  activeStudiesCount,
  studiesInAnalysisCount,
  completedStudiesCount,
  draftStudiesCount,
  onOpenStudy,
}: AdminStudiesProps) {
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

  const recentStudiesChartData = useMemo(() => {
    const now = new Date();
  
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
  
      const month = date.toLocaleDateString("ro-RO", {
        month: "short",
        year: "2-digit",
      });
  
      const value = studies.filter((study) => {
        const createdAt = new Date(study.created_at);
        return (
          createdAt.getMonth() === date.getMonth() &&
          createdAt.getFullYear() === date.getFullYear()
        );
      }).length;
  
      return {
        name: month,
        value,
      };
    });
  }, [studies]);

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
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                {/*<div className="admin-panel__hint">Distribuție statusuri</div>*/}
                <h2>Starea studiilor</h2>
              </div>
            </div>
        
            {studyStatusData.length === 0 ? (
              <p className="admin-empty">Nu există studii pentru afișare.</p>
            ) : (
              <>
                <div className="admin-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studyStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={86}
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
        
                <div className="admin-legend-list">
                  {studyStatusData.map((item) => (
                    <div key={item.key} className="admin-chart-legend__item">
                      <span
                        className="admin-legend-dot"
                        style={{ backgroundColor: item.color }}
                      />
                      <strong>{item.name}</strong>
                      <b>{item.value}</b>
                    </div>
                  ))}
                </div>
              </>
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
                    radius={[10, 10, 0, 0]}
                    barSize={52}
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

          {studiesLoading ? (
            <p className="admin-loading">Se încarcă studiile...</p>
          ) : (
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
                    <th>Detalii</th>
                  </tr>
                </thead>
                <tbody>
                  {studies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="admin-table__empty">
                        Nu există studii disponibile.
                      </td>
                    </tr>
                  ) : (
                    studies.map((study) => (
                      <tr key={study.id}>
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
                        <td>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            aria-label={`Vezi detaliile studiului ${study.title}`}
                            onClick={() => onOpenStudy(study.id)}
                          >
                            <EyeIcon />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}