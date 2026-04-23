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
  LineChart,
  Line,
} from "recharts";
import type {
  ParticipantListItemResponse,
  ParticipantSubmissionStatus,
  StudyDataSummaryResponse,
  StudyDataTimelinePointResponse,
  StudyDetailResponse,
  StudySubmissionDetailResponse,
  StudySubmissionListItemResponse,
  StudyType,
} from "../admin/adminApi";

type StudyStatus = StudyDetailResponse["status"];

type ParticipantSummary = {
  total_participants: number;
  invited_participants: number;
  active_participants: number;
  suspended_participants: number;
  completed_participants: number;
  withdrawn_participants: number;
} | null;

type AdminStudiesProps = {
  studies: StudyDetailResponse[];
  studiesLoading: boolean;
  selectedStudy: StudyDetailResponse | null;
  studyDetailLoading: boolean;
  studyExportLoading: boolean;
  studyParticipants: ParticipantListItemResponse[];
  studyParticipantsLoading: boolean;
  studyParticipantsSummary: ParticipantSummary;
  studySubmissions: StudySubmissionListItemResponse[];
  studySubmissionsLoading: boolean;
  selectedSubmission: StudySubmissionDetailResponse | null;
  setSelectedSubmission: React.Dispatch<
    React.SetStateAction<StudySubmissionDetailResponse | null>
  >;
  studyDataSummary: StudyDataSummaryResponse | null;
  studyTimeline: StudyDataTimelinePointResponse[];
  studyAnalyticsLoading: boolean;
  studyTypeLabels: Record<StudyType, string>;
  studyStatusLabels: Record<StudyStatus, string>;
  submissionStatusLabels: Record<ParticipantSubmissionStatus, string>;
  formatDate: (value?: string | null) => string;
  totalStudies: number;
  activeStudiesCount: number;
  studiesInAnalysisCount: number;
  completedStudiesCount: number;
  draftStudiesCount: number;
  onOpenStudy: (studyId: number) => void;
  onExportStudy: () => void;
  onOpenSubmission: (submissionId: number) => void;
  onUpdateSubmissionStatus: (status: ParticipantSubmissionStatus) => void;
};

const STUDY_STATUS_COLORS: Record<StudyStatus, string> = {
  draft: "#dbeaf6",
  active: "#76b65c",
  in_analysis: "#ef9647",
  completed: "#dfe8dc",
};

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

function getSubmissionStatusClass(status: ParticipantSubmissionStatus) {
  switch (status) {
    case "validated":
      return "admin-status-pill admin-status-pill--success";
    case "rejected":
      return "admin-status-pill admin-status-pill--danger";
    case "submitted":
    default:
      return "admin-status-pill admin-status-pill--warning";
  }
}

function formatParameterLabel(value: string) {
  switch (value) {
    case "heart_rate":
      return "Ritm cardiac";
    case "respiratory_rate":
      return "Frecvență respiratorie";
    case "spo2":
      return "Saturația de oxigen";
    case "temperature":
      return "Temperatură";
    default:
      return value;
  }
}

function formatFrequencyLabel(value: string) {
  switch (value) {
    case "continuous":
      return "Continuu";
    case "every_1_min":
      return "La 1 minut";
    case "every_5_min":
      return "La 5 minute";
    case "every_15_min":
      return "La 15 minute";
    case "every_30_min":
      return "La 30 minute";
    case "every_1_hour":
      return "La 1 oră";
    default:
      return value;
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
  selectedStudy,
  studyDetailLoading,
  studyExportLoading,
  studyParticipants,
  studyParticipantsLoading,
  studyParticipantsSummary,
  studySubmissions,
  studySubmissionsLoading,
  selectedSubmission,
  setSelectedSubmission,
  studyDataSummary,
  studyTimeline,
  studyAnalyticsLoading,
  studyTypeLabels,
  studyStatusLabels,
  submissionStatusLabels,
  formatDate,
  totalStudies,
  activeStudiesCount,
  studiesInAnalysisCount,
  completedStudiesCount,
  draftStudiesCount,
  onOpenStudy,
  onExportStudy,
  onOpenSubmission,
  onUpdateSubmissionStatus,
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

  const participantsChartData = useMemo(
    () => [
      {
        name: "Invitați",
        value: studyParticipantsSummary?.invited_participants ?? 0,
      },
      {
        name: "Activi",
        value: studyParticipantsSummary?.active_participants ?? 0,
      },
      {
        name: "Suspendați",
        value: studyParticipantsSummary?.suspended_participants ?? 0,
      },
      {
        name: "Finalizați",
        value: studyParticipantsSummary?.completed_participants ?? 0,
      },
      {
        name: "Retrăși",
        value: studyParticipantsSummary?.withdrawn_participants ?? 0,
      },
    ],
    [studyParticipantsSummary]
  );

  const submissionStatusData = useMemo(
    () => [
      {
        name: "Trimise",
        value: studyDataSummary?.submitted_count ?? 0,
      },
      {
        name: "Validate",
        value: studyDataSummary?.validated_count ?? 0,
      },
      {
        name: "Respinse",
        value: studyDataSummary?.rejected_count ?? 0,
      },
    ],
    [studyDataSummary]
  );

  const totalSubmissions = studyDataSummary?.total_submissions ?? 0;
  const validationRate =
    totalSubmissions > 0
      ? Math.round(((studyDataSummary?.validated_count ?? 0) / totalSubmissions) * 100)
      : 0;

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
                <div className="admin-panel__hint">Distribuție statusuri</div>
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
                        {studyStatusData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="admin-legend-list">
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
              </>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <div className="admin-panel__hint">Studii recente</div>
                <h2>Ultimele studii încărcate</h2>
              </div>
            </div>

            {studies.length === 0 ? (
              <p className="admin-empty">Nu există studii recente.</p>
            ) : (
              <div className="admin-activity-list">
                {studies.slice(0, 5).map((study) => (
                  <button
                    key={study.id}
                    type="button"
                    className="admin-activity-item"
                    onClick={() => onOpenStudy(study.id)}
                  >
                    <div className="admin-activity-item__content">
                      <strong>{study.title}</strong>
                      <small>
                        {study.code} • {study.researcher.full_name}
                      </small>
                    </div>

                    <span className={getStudyStatusPillClass(study.status)}>
                      {studyStatusLabels[study.status]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <div className="admin-section-grid">
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <div className="admin-panel__hint">Administrare studii</div>
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
                            className="admin-inline-link"
                            onClick={() => onOpenStudy(study.id)}
                          >
                            Vezi
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

        <aside className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <div className="admin-panel__hint">Detalii studiu</div>
              <h2>Studiu selectat</h2>
            </div>

            {selectedStudy ? (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={studyExportLoading}
                onClick={onExportStudy}
              >
                {studyExportLoading ? "Se exportă..." : "Exportă"}
              </button>
            ) : null}
          </div>

          {studyDetailLoading ? (
            <p className="admin-loading">Se încarcă studiul...</p>
          ) : selectedStudy ? (
            <div className="admin-detail">
              <div>
                <span>Titlu</span>
                <strong>{selectedStudy.title}</strong>
              </div>
              <div>
                <span>Cod</span>
                <strong>{selectedStudy.code}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{studyStatusLabels[selectedStudy.status]}</strong>
              </div>
              <div>
                <span>Tip</span>
                <strong>{studyTypeLabels[selectedStudy.study_type]}</strong>
              </div>
              <div>
                <span>Mod colectare</span>
                <strong>{formatEntryMethodLabel(selectedStudy.data_entry_mode)}</strong>
              </div>
              <div>
                <span>Cercetător</span>
                <strong>{selectedStudy.researcher.full_name}</strong>
              </div>
              <div>
                <span>Instituție</span>
                <strong>{selectedStudy.institution ?? "—"}</strong>
              </div>
              <div>
                <span>Data început</span>
                <strong>{formatDate(selectedStudy.start_date)}</strong>
              </div>
              <div>
                <span>Data final</span>
                <strong>{formatDate(selectedStudy.end_date)}</strong>
              </div>
              <div>
                <span>Țintă participanți</span>
                <strong>{selectedStudy.target_participants ?? "—"}</strong>
              </div>
              <div>
                <span>Participanți curenți</span>
                <strong>{selectedStudy.participants_count}</strong>
              </div>

              <div className="admin-detail-block">
                <span>Descriere</span>
                <p>{selectedStudy.description ?? "Nu există descriere."}</p>
              </div>

              <div className="admin-detail-block">
                <span>Criterii de includere</span>
                <p>
                  {selectedStudy.inclusion_criteria ?? "Nu există criterii definite."}
                </p>
              </div>

              <div className="admin-detail-block">
                <span>Reguli de colectare</span>
                <p>{selectedStudy.collection_rules ?? "Nu există reguli definite."}</p>
              </div>

              <div className="admin-detail-block">
                <span>Note administrative</span>
                <p>
                  {selectedStudy.administrative_notes ?? "Nu există note administrative."}
                </p>
              </div>

              <div className="admin-detail-block">
                <span>Parametri monitorizați</span>
                <ul className="admin-tag-list">
                  {selectedStudy.parameters.length === 0 ? (
                    <li>Nu există parametri configurați.</li>
                  ) : (
                    selectedStudy.parameters.map((parameter) => (
                      <li key={parameter.id}>
                        {formatParameterLabel(parameter.parameter_key)} ·{" "}
                        {formatFrequencyLabel(parameter.measurement_frequency)}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <p className="admin-empty">Selectează un studiu din listă.</p>
          )}
        </aside>
      </div>

      {selectedStudy ? (
        <>
          <div className="admin-kpi-grid admin-kpi-grid--study-detail">
            <article className="admin-kpi-card admin-kpi-card--users">
              <div className="admin-kpi-card__top">
                <span>Total participanți</span>
                <div className="admin-kpi-icon">👥</div>
              </div>
              <strong>{studyParticipantsSummary?.total_participants ?? 0}</strong>
              <small>Participanți asociați studiului selectat.</small>
            </article>

            <article className="admin-kpi-card admin-kpi-card--analysis">
              <div className="admin-kpi-card__top">
                <span>Total trimiteri</span>
                <div className="admin-kpi-icon">📥</div>
              </div>
              <strong>{studyDataSummary?.total_submissions ?? 0}</strong>
              <small>Înregistrări trimise de participanți pentru acest studiu.</small>
            </article>

            <article className="admin-kpi-card admin-kpi-card--requests">
              <div className="admin-kpi-card__top">
                <span>Total valori</span>
                <div className="admin-kpi-icon">∑</div>
              </div>
              <strong>{studyDataSummary?.total_values ?? 0}</strong>
              <small>Valori fiziologice colectate pentru studiul selectat.</small>
            </article>

            <article className="admin-kpi-card admin-kpi-card--studies">
              <div className="admin-kpi-card__top">
                <span>Rată validare</span>
                <div className="admin-kpi-icon">%</div>
              </div>
              <strong>{validationRate}%</strong>
              <small>Raport între trimiterile validate și totalul trimiterilor.</small>
              <div className="admin-kpi-progress">
                <div
                  className="admin-kpi-progress__bar"
                  style={{ width: `${validationRate}%` }}
                />
              </div>
            </article>
          </div>

          <div className="admin-section-grid admin-section-grid--access">
            <section className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <div className="admin-panel__hint">Participanți</div>
                  <h2>Rezumat participanți</h2>
                </div>
              </div>

              {studyParticipantsLoading ? (
                <p className="admin-loading">Se încarcă participanții...</p>
              ) : (
                <>
                  <div className="admin-simple-list admin-simple-list--grid">
                    <div>
                      <span>Total</span>
                      <strong>{studyParticipantsSummary?.total_participants ?? 0}</strong>
                    </div>
                    <div>
                      <span>Invitați</span>
                      <strong>
                        {studyParticipantsSummary?.invited_participants ?? 0}
                      </strong>
                    </div>
                    <div>
                      <span>Activi</span>
                      <strong>
                        {studyParticipantsSummary?.active_participants ?? 0}
                      </strong>
                    </div>
                    <div>
                      <span>Suspendați</span>
                      <strong>
                        {studyParticipantsSummary?.suspended_participants ?? 0}
                      </strong>
                    </div>
                    <div>
                      <span>Finalizați</span>
                      <strong>
                        {studyParticipantsSummary?.completed_participants ?? 0}
                      </strong>
                    </div>
                    <div>
                      <span>Retrăși</span>
                      <strong>
                        {studyParticipantsSummary?.withdrawn_participants ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-chart-box admin-chart-box--wide">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={participantsChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value) => [value, "Participanți"]} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#76b65c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="admin-table-wrap admin-table-wrap--small">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Cod</th>
                          <th>Nume</th>
                          <th>Status</th>
                          <th>Trimiteri</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studyParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="admin-table__empty">
                              Nu există participanți pentru acest studiu.
                            </td>
                          </tr>
                        ) : (
                          studyParticipants.map((participant) => (
                            <tr key={participant.id}>
                              <td>{participant.participant_code}</td>
                              <td>{participant.full_name}</td>
                              <td>{participant.status}</td>
                              <td>{participant.submissions_count}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <section className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <div className="admin-panel__hint">Date colectate</div>
                  <h2>Rezumat analitic</h2>
                </div>
              </div>

              {studyAnalyticsLoading ? (
                <p className="admin-loading">Se încarcă rezumatul datelor...</p>
              ) : (
                <>
                  <div className="admin-simple-list admin-simple-list--grid">
                    <div>
                      <span>Total trimiteri</span>
                      <strong>{studyDataSummary?.total_submissions ?? 0}</strong>
                    </div>
                    <div>
                      <span>Total valori</span>
                      <strong>{studyDataSummary?.total_values ?? 0}</strong>
                    </div>
                    <div>
                      <span>Trimise</span>
                      <strong>{studyDataSummary?.submitted_count ?? 0}</strong>
                    </div>
                    <div>
                      <span>Validate</span>
                      <strong>{studyDataSummary?.validated_count ?? 0}</strong>
                    </div>
                    <div>
                      <span>Respinse</span>
                      <strong>{studyDataSummary?.rejected_count ?? 0}</strong>
                    </div>
                    <div>
                      <span>Ultima trimitere</span>
                      <strong>{formatDate(studyDataSummary?.last_submission_at)}</strong>
                    </div>
                  </div>

                  <div className="admin-chart-box admin-chart-box--wide">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={submissionStatusData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value) => [value, "Trimiteri"]} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#76b65c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="admin-detail-block">
                    <span>Timeline colectare</span>

                    {studyTimeline.length === 0 ? (
                      <p>Nu există activitate de colectare pentru intervalul selectat.</p>
                    ) : (
                      <>
                        <div className="admin-chart-box admin-chart-box--wide admin-chart-box--line">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={studyTimeline}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="label" tickLine={false} axisLine={false} />
                              <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="submissions_count"
                                stroke="#76b65c"
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="admin-timeline-list">
                          {studyTimeline.map((point) => (
                            <div key={point.label}>
                              <strong>{point.label}</strong>
                              <span>
                                {point.submissions_count} trimiteri · {point.values_count} valori
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>

          <section className="admin-panel admin-panel--wide">
            <div className="admin-panel__header">
              <div>
                <div className="admin-panel__hint">Trimiteri studiu</div>
                <h2>Monitorizare submisii</h2>
              </div>
            </div>

            {studySubmissionsLoading ? (
              <p className="admin-loading">Se încarcă trimiterile...</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Participant</th>
                      <th>Cod</th>
                      <th>Metodă</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Detalii</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studySubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="admin-table__empty">
                          Nu există trimiteri pentru acest studiu.
                        </td>
                      </tr>
                    ) : (
                      studySubmissions.map((submission) => (
                        <tr key={submission.id}>
                          <td>{submission.id}</td>
                          <td>{submission.participant_full_name}</td>
                          <td>{submission.participant_code}</td>
                          <td>{formatEntryMethodLabel(submission.entry_method)}</td>
                          <td>
                            <span className={getSubmissionStatusClass(submission.status)}>
                              {submissionStatusLabels[submission.status]}
                            </span>
                          </td>
                          <td>{formatDate(submission.submitted_at)}</td>
                          <td>
                            <button
                              type="button"
                              className="admin-inline-link"
                              onClick={() => onOpenSubmission(submission.id)}
                            >
                              Vezi
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {selectedSubmission ? (
              <div className="admin-submission-box">
                <h3>Detalii trimitere #{selectedSubmission.id}</h3>

                <div className="admin-simple-list admin-simple-list--grid">
                  <div>
                    <span>Participant</span>
                    <strong>{selectedSubmission.participant_full_name}</strong>
                  </div>
                  <div>
                    <span>Cod</span>
                    <strong>{selectedSubmission.participant_code}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>
                      {submissionStatusLabels[selectedSubmission.status]}
                    </strong>
                  </div>
                  <div>
                    <span>Metodă</span>
                    <strong>{formatEntryMethodLabel(selectedSubmission.entry_method)}</strong>
                  </div>
                </div>

                <div className="admin-detail-block">
                  <span>Valori transmise</span>
                  <ul className="admin-values-list">
                    {selectedSubmission.values.length === 0 ? (
                      <li>Nu există valori asociate acestei trimiteri.</li>
                    ) : (
                      selectedSubmission.values.map((value) => (
                        <li key={value.id}>
                          <strong>{formatParameterLabel(value.parameter_key)}</strong>
                          <span>{value.value}</span>
                          <small>{formatDate(value.measured_at)}</small>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <label className="admin-form-block">
                  <span>Notițe review</span>
                  <textarea
                    rows={4}
                    value={selectedSubmission.review_notes ?? ""}
                    onChange={(event) =>
                      setSelectedSubmission((prev) =>
                        prev
                          ? { ...prev, review_notes: event.target.value }
                          : prev
                      )
                    }
                  />
                </label>

                <div className="admin-actions-row">
                  <button
                    type="button"
                    className="admin-btn admin-btn--success"
                    onClick={() => onUpdateSubmissionStatus("validated")}
                  >
                    Marchează validată
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => onUpdateSubmissionStatus("rejected")}
                  >
                    Marchează respinsă
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    onClick={() => onUpdateSubmissionStatus("submitted")}
                  >
                    Revino la trimisă
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </>
  );
}