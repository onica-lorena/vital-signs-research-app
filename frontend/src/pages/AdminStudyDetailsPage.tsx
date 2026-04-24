import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import "../styles/admin-dashboard.css";
import "../styles/admin-layout.css";
import AdminLayout from "../components/layout/AdminLayout";
import {
  exportStudyAdminRequest,
  getStudyByIdAdminRequest,
  getStudyDataSummaryRequest,
  getStudyDataTimelineRequest,
  getStudyParticipantsSummaryRequest,
  getStudySubmissionByIdRequest,
  listStudyParticipantsRequest,
  listStudySubmissionsRequest,
  updateStudySubmissionRequest,
  type ParticipantListItemResponse,
  type ParticipantSubmissionStatus,
  type StudyDataSummaryResponse,
  type StudyDataTimelinePointResponse,
  type StudyDetailResponse,
  type StudySubmissionDetailResponse,
  type StudySubmissionListItemResponse,
  type StudyType,
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

const studyTypeLabels: Record<StudyType, string> = {
  observational_prospective: "Observațional prospectiv",
  observational_retrospective: "Observațional retrospectiv",
  observational_mixed: "Observațional mixt",
};

const studyStatusLabels: Record<StudyStatus, string> = {
  draft: "Ciornă",
  active: "Activ",
  in_analysis: "În analiză",
  completed: "Finalizat",
};

const submissionStatusLabels: Record<ParticipantSubmissionStatus, string> = {
  submitted: "Trimisă",
  validated: "Validată",
  rejected: "Respinsă",
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatParameterLabel(value: string) {
  switch (value) {
    case "heart_rate":
    case "heartRate":
      return "Ritm cardiac";

    case "respiratory_rate":
    case "respiratoryRate":
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

export default function AdminStudyDetailsPage() {
  const { studyId } = useParams();
  const navigate = useNavigate();

  const numericStudyId = Number(studyId);

  const [selectedStudy, setSelectedStudy] = useState<StudyDetailResponse | null>(
    null
  );
  const [studyParticipants, setStudyParticipants] = useState<
    ParticipantListItemResponse[]
  >([]);
  const [studyParticipantsSummary, setStudyParticipantsSummary] =
    useState<ParticipantSummary>(null);
  const [studySubmissions, setStudySubmissions] = useState<
    StudySubmissionListItemResponse[]
  >([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<StudySubmissionDetailResponse | null>(null);
  const [studyDataSummary, setStudyDataSummary] =
    useState<StudyDataSummaryResponse | null>(null);
  const [studyTimeline, setStudyTimeline] = useState<
    StudyDataTimelinePointResponse[]
  >([]);

  const [studyDetailLoading, setStudyDetailLoading] = useState(false);
  const [studyParticipantsLoading, setStudyParticipantsLoading] =
    useState(false);
  const [studySubmissionsLoading, setStudySubmissionsLoading] = useState(false);
  const [studyAnalyticsLoading, setStudyAnalyticsLoading] = useState(false);
  const [studyExportLoading, setStudyExportLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [activeTab, setActiveTab] = useState<
    "overview" | "participants" | "data" | "submissions"
  >("overview");

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
      ? Math.round(
          ((studyDataSummary?.validated_count ?? 0) / totalSubmissions) * 100
        )
      : 0;

  async function loadStudyDetails() {
    if (!numericStudyId || Number.isNaN(numericStudyId)) {
      setErrorMessage("ID-ul studiului nu este valid.");
      return;
    }

    setErrorMessage("");

    try {
      setStudyDetailLoading(true);
      const study = await getStudyByIdAdminRequest(numericStudyId);
      setSelectedStudy(study);
    } catch {
      setErrorMessage("Nu am putut încărca detaliile studiului.");
    } finally {
      setStudyDetailLoading(false);
    }
  }

  async function loadParticipants() {
    try {
      setStudyParticipantsLoading(true);

      const [participantsResponse, summaryResponse] = await Promise.all([
        listStudyParticipantsRequest(numericStudyId),
        getStudyParticipantsSummaryRequest(numericStudyId),
      ]);

      setStudyParticipants(participantsResponse.items ?? participantsResponse);
      setStudyParticipantsSummary(summaryResponse);
    } catch {
      setErrorMessage("Nu am putut încărca participanții studiului.");
    } finally {
      setStudyParticipantsLoading(false);
    }
  }

  async function loadSubmissions() {
    try {
      setStudySubmissionsLoading(true);

      const submissionsResponse = await listStudySubmissionsRequest(
        numericStudyId
      );

      setStudySubmissions(submissionsResponse.items ?? submissionsResponse);
    } catch {
      setErrorMessage("Nu am putut încărca trimiterile studiului.");
    } finally {
      setStudySubmissionsLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      setStudyAnalyticsLoading(true);

      const [summaryResponse, timelineResponse] = await Promise.all([
        getStudyDataSummaryRequest(numericStudyId),
        getStudyDataTimelineRequest(numericStudyId, "day"),
      ]);

      setStudyDataSummary(summaryResponse);
      setStudyTimeline(timelineResponse);
    } catch {
      setErrorMessage("Nu am putut încărca rezumatul analitic.");
    } finally {
      setStudyAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    loadStudyDetails();
    loadParticipants();
    loadSubmissions();
    loadAnalytics();
  }, [numericStudyId]);

  async function handleExportStudy() {
    try {
      setErrorMessage("");
      setStudyExportLoading(true);
  
      const { blob, filename } = await exportStudyAdminRequest(numericStudyId, "csv");
  
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
  
      link.href = url;
      link.download = filename;
  
      document.body.appendChild(link);
      link.click();
  
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Exportul studiului nu a putut fi realizat.");
    } finally {
      setStudyExportLoading(false);
    }
  }

  async function handleOpenSubmission(submissionId: number) {
    try {
      const submission = await getStudySubmissionByIdRequest(
        numericStudyId,
        submissionId
      );
      setSelectedSubmission(submission);
    } catch {
      setErrorMessage("Nu am putut încărca detaliile trimiterii.");
    }
  }

  async function handleUpdateSubmissionStatus(
    status: ParticipantSubmissionStatus
  ) {
    if (!selectedSubmission) return;

    try {
      setStatusUpdateLoading(true);

      const updatedSubmission = await updateStudySubmissionRequest(
        numericStudyId,
        selectedSubmission.id,
        {
          status,
          review_notes: selectedSubmission.review_notes ?? "",
        }
      );

      setSelectedSubmission(updatedSubmission);
      await loadSubmissions();
      await loadAnalytics();
    } catch {
      setErrorMessage("Statusul trimiterii nu a putut fi actualizat.");
    } finally {
      setStatusUpdateLoading(false);
    }
  }

  return (
    <AdminLayout
      activeItem="studies"
      title="Detalii studiu"
      subtitle="Vizualizare administrativă pentru informații generale, participanți, date colectate și trimiteri."
    >
      <div className="admin-page">
        <section className="admin-shell">
          <div className="admin-panel__header">
            <div>
              {/*<div className="admin-panel__hint">Detalii studiu</div>*/}
              <h2>{selectedStudy?.title ?? "Studiu selectat"}</h2>
            </div>
      
            <div className="admin-actions-row">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => navigate("/admin?tab=studies")}
              >
                Înapoi
              </button>
      
              {selectedStudy ? (
                <button
                  type="button"
                  className="admin-btn"
                  disabled={studyExportLoading}
                  onClick={handleExportStudy}
                >
                  {studyExportLoading ? "Se exportă..." : "Exportă"}
                </button>
              ) : null}
            </div>
          </div>
              
          {errorMessage ? (
            <div className="admin-banner admin-banner--error">{errorMessage}</div>
          ) : null}
      
          {studyDetailLoading ? (
            <p className="admin-loading">Se încarcă studiul...</p>
          ) : selectedStudy ? (
            <>
              <div className="admin-kpi-grid admin-kpi-grid--study-detail">
                <article className="admin-kpi-card admin-kpi-card--users">
                  <div className="admin-kpi-card__top">
                    <span>Total participanți</span>
                    <div className="admin-kpi-icon">👥</div>
                  </div>
                  <strong>
                    {studyParticipantsSummary?.total_participants ?? 0}
                  </strong>
                  <small>Participanți asociați studiului selectat.</small>
                </article>
                      
                <article className="admin-kpi-card admin-kpi-card--analysis">
                  <div className="admin-kpi-card__top">
                    <span>Total trimiteri</span>
                    <div className="admin-kpi-icon">📥</div>
                  </div>
                  <strong>{studyDataSummary?.total_submissions ?? 0}</strong>
                  <small>
                    Înregistrări trimise de participanți pentru acest studiu.
                  </small>
                </article>
                      
                <article className="admin-kpi-card admin-kpi-card--requests">
                  <div className="admin-kpi-card__top">
                    <span>Total valori</span>
                    <div className="admin-kpi-icon">∑</div>
                  </div>
                  <strong>{studyDataSummary?.total_values ?? 0}</strong>
                  <small>
                    Valori fiziologice colectate pentru studiul selectat.
                  </small>
                </article>
                      
                <article className="admin-kpi-card admin-kpi-card--studies">
                  <div className="admin-kpi-card__top">
                    <span>Rată validare</span>
                    <div className="admin-kpi-icon">%</div>
                  </div>
                  <strong>{validationRate}%</strong>
                  <small>
                    Raport între trimiterile validate și totalul trimiterilor.
                  </small>
                  <div className="admin-kpi-progress">
                    <div
                      className="admin-kpi-progress__bar"
                      style={{ width: `${validationRate}%` }}
                    />
                  </div>
                </article>
              </div>
                      
              <div className="admin-study-tabs">
                {[
                  ["overview", "Rezumat studiu"],
                  ["participants", "Participanți"],
                  ["data", "Date colectate"],
                  ["submissions", "Trimiteri"],
                ].map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    className={
                      activeTab === tab ? "admin-study-tab active" : "admin-study-tab"
                    }
                    onClick={() =>
                      setActiveTab(tab as "overview" | "participants" | "data" | "submissions")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            
              {activeTab === "overview" ? (
                <section className="admin-study-content-grid admin-study-content-grid--overview">
                  <article className="admin-panel">
                    <div className="admin-panel__header">
                      <div>
                        {/*<div className="admin-panel__hint">Informații generale</div>*/}
                        <h2>Identificare studiu</h2>
                      </div>
              
                      <span className="admin-status-pill">
                        {studyStatusLabels[selectedStudy.status]}
                      </span>
                    </div>
              
                    <div className="admin-detail admin-detail--overview">
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
                    </div>
                  </article>
              
                  <article className="admin-panel">
                    <div className="admin-panel__header">
                      <div>
                        {/*<div className="admin-panel__hint">Context studiu</div>*/}
                        <h2>Descriere și reguli</h2>
                      </div>
                    </div>
              
                    <div className="admin-study-text-block">
                      <span>Descriere</span>
                      <p>{selectedStudy.description ?? "Nu există descriere."}</p>
                    </div>
              
                    <div className="admin-study-text-block">
                      <span>Criterii de includere</span>
                      <p>
                        {selectedStudy.inclusion_criteria ?? "Nu există criterii definite."}
                      </p>
                    </div>
              
                    <div className="admin-study-text-block">
                      <span>Reguli de colectare</span>
                      <p>{selectedStudy.collection_rules ?? "Nu există reguli definite."}</p>
                    </div>
              
                    <div className="admin-study-text-block">
                      <span>Note administrative</span>
                      <p>
                        {selectedStudy.administrative_notes ??
                          "Nu există note administrative."}
                      </p>
                    </div>
                  </article>
                      
                  <article className="admin-panel admin-panel--wide">
                    <div className="admin-panel__header">
                      <div>
                        {/*<div className="admin-panel__hint">Parametri</div>*/}
                        <h2>Semne vitale monitorizate</h2>
                      </div>
                    </div>
                      
                    <div className="admin-study-parameter-grid admin-study-parameter-grid--columns">
                      {selectedStudy.parameters.length === 0 ? (
                        <p className="admin-empty">Nu există parametri configurați.</p>
                      ) : (
                        selectedStudy.parameters.map((parameter) => (
                          <div className="admin-study-parameter-card" key={parameter.id}>
                            <strong>{formatParameterLabel(parameter.parameter_key)}</strong>
                            <span>{formatFrequencyLabel(parameter.measurement_frequency)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                </section>
              ) : null}
              
              {activeTab === "participants" ? (
                <section className="admin-panel admin-panel--wide">
                  <div className="admin-panel__header">
                    <div>
                      {/*<div className="admin-panel__hint">Participanți</div>*/}
                      <h2>Rezumat participanți</h2>
                    </div>
                  </div>
              
                  {studyParticipantsLoading ? (
                    <p className="admin-loading">Se încarcă participanții...</p>
                  ) : (
                    <>
                      <div className="admin-simple-list admin-simple-list--grid">
                        <div><span>Total</span><strong>{studyParticipantsSummary?.total_participants ?? 0}</strong></div>
                        <div><span>Invitați</span><strong>{studyParticipantsSummary?.invited_participants ?? 0}</strong></div>
                        <div><span>Activi</span><strong>{studyParticipantsSummary?.active_participants ?? 0}</strong></div>
                        <div><span>Suspendați</span><strong>{studyParticipantsSummary?.suspended_participants ?? 0}</strong></div>
                        <div><span>Finalizați</span><strong>{studyParticipantsSummary?.completed_participants ?? 0}</strong></div>
                        <div><span>Retrăși</span><strong>{studyParticipantsSummary?.withdrawn_participants ?? 0}</strong></div>
                      </div>
                  
                      <div className="admin-chart-box admin-chart-box--study">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={participantsChartData} barCategoryGap="38%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value) => [value, "Participanți"]} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#76b65c" maxBarSize={42} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                  
                      <div className="admin-table-wrap">
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
              ) : null}
              
              {activeTab === "data" ? (
                <section className="admin-panel admin-panel--wide">
                  <div className="admin-panel__header">
                    <div>
                      {/*<div className="admin-panel__hint">Date colectate</div>*/}
                      <h2>Rezumat analitic</h2>
                    </div>
                  </div>
              
                  {studyAnalyticsLoading ? (
                    <p className="admin-loading">Se încarcă rezumatul datelor...</p>
                  ) : (
                    <>
                      <div className="admin-simple-list admin-simple-list--grid">
                        <div><span>Total trimiteri</span><strong>{studyDataSummary?.total_submissions ?? 0}</strong></div>
                        <div><span>Total valori</span><strong>{studyDataSummary?.total_values ?? 0}</strong></div>
                        <div><span>Trimise</span><strong>{studyDataSummary?.submitted_count ?? 0}</strong></div>
                        <div><span>Validate</span><strong>{studyDataSummary?.validated_count ?? 0}</strong></div>
                        <div><span>Respinse</span><strong>{studyDataSummary?.rejected_count ?? 0}</strong></div>
                        <div><span>Ultima trimitere</span><strong>{formatDate(studyDataSummary?.last_submission_at)}</strong></div>
                      </div>
                  
                      <div className="admin-study-chart-grid">
                        <div className="admin-chart-box admin-chart-box--study">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={submissionStatusData} barCategoryGap="45%">
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tickLine={false} axisLine={false} />
                              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                              <Tooltip formatter={(value) => [value, "Trimiteri"]} />
                              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#76b65c" maxBarSize={44} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                  
                        <div className="admin-chart-box admin-chart-box--study">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={studyTimeline}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="label" tickLine={false} axisLine={false} />
                              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
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
                      </div>
                  
                      <div className="admin-timeline-list">
                        {studyTimeline.length === 0 ? (
                          <p className="admin-empty">Nu există activitate de colectare.</p>
                        ) : (
                          studyTimeline.map((point) => (
                            <div key={point.label}>
                              <strong>{point.label}</strong>
                              <span>
                                {point.submissions_count} trimiteri · {point.values_count} valori
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </section>
              ) : null}
              
              {activeTab === "submissions" ? (
                <section className="admin-panel admin-panel--wide">
                  <div className="admin-panel__header">
                    <div>
                      {/*<div className="admin-panel__hint">Trimiteri studiu</div>*/}
                      <h2>Monitorizare trimiteri</h2>
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
                                    onClick={() => handleOpenSubmission(submission.id)}
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
                        <div><span>Participant</span><strong>{selectedSubmission.participant_full_name}</strong></div>
                        <div><span>Cod</span><strong>{selectedSubmission.participant_code}</strong></div>
                        <div><span>Status</span><strong>{submissionStatusLabels[selectedSubmission.status]}</strong></div>
                        <div><span>Metodă</span><strong>{formatEntryMethodLabel(selectedSubmission.entry_method)}</strong></div>
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
                              prev ? { ...prev, review_notes: event.target.value } : prev
                            )
                          }
                        />
                      </label>
                      
                      <div className="admin-actions-row">
                        <button
                          type="button"
                          className="admin-btn admin-btn--success"
                          disabled={statusUpdateLoading}
                          onClick={() => handleUpdateSubmissionStatus("validated")}
                        >
                          Marchează validată
                        </button>
                      
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          disabled={statusUpdateLoading}
                          onClick={() => handleUpdateSubmissionStatus("rejected")}
                        >
                          Marchează respinsă
                        </button>
                      
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          disabled={statusUpdateLoading}
                          onClick={() => handleUpdateSubmissionStatus("submitted")}
                        >
                          Revino la trimisă
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}              
            </>
          ) : (
            <p className="admin-empty">Studiul nu a fost găsit.</p>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}