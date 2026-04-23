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
  onOpenStudy: (studyId: number) => void;
  onExportStudy: () => void;
  onOpenSubmission: (submissionId: number) => void;
  onUpdateSubmissionStatus: (status: ParticipantSubmissionStatus) => void;
};

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
  onOpenStudy,
  onExportStudy,
  onOpenSubmission,
  onUpdateSubmissionStatus,
}: AdminStudiesProps) {
  return (
    <div className="admin-section-grid">
      <section className="admin-panel">
        <h2>Toate studiile</h2>

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
                  <th>Cercetător</th>
                  <th>Participanți</th>
                  <th>Detalii</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((study) => (
                  <tr key={study.id}>
                    <td>{study.code}</td>
                    <td>{study.title}</td>
                    <td>{studyStatusLabels[study.status]}</td>
                    <td>{studyTypeLabels[study.study_type]}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="admin-panel">
        <div className="admin-panel__header">
          <h2>Detalii studiu</h2>

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
              <span>Participanți</span>
              <strong>{selectedStudy.participants_count}</strong>
            </div>

            <div className="admin-detail-block">
              <span>Descriere</span>
              <p>{selectedStudy.description ?? "Nu există descriere."}</p>
            </div>

            <div className="admin-detail-block">
              <span>Parametri monitorizați</span>
              <ul className="admin-tag-list">
                {selectedStudy.parameters.map((parameter) => (
                  <li key={parameter.id}>
                    {parameter.parameter_key} · {parameter.measurement_frequency}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="admin-empty">Selectează un studiu din listă.</p>
        )}
      </aside>

      {selectedStudy ? (
        <>
          <section className="admin-panel">
            <h2>Rezumat participanți</h2>

            {studyParticipantsLoading ? (
              <p className="admin-loading">Se încarcă participanții...</p>
            ) : (
              <>
                <div className="admin-simple-list admin-simple-list--grid">
                  <div>
                    <span>Total</span>
                    <strong>
                      {studyParticipantsSummary?.total_participants ?? 0}
                    </strong>
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
                      {studyParticipants.map((participant) => (
                        <tr key={participant.id}>
                          <td>{participant.participant_code}</td>
                          <td>{participant.full_name}</td>
                          <td>{participant.status}</td>
                          <td>{participant.submissions_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className="admin-panel">
            <h2>Rezumat date colectate</h2>

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

                <div className="admin-detail-block">
                  <span>Timeline colectare</span>
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
                </div>
              </>
            )}
          </section>

          <section className="admin-panel admin-panel--wide">
            <h2>Trimiteri studiu</h2>

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
                    {studySubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>{submission.id}</td>
                        <td>{submission.participant_full_name}</td>
                        <td>{submission.participant_code}</td>
                        <td>{submission.entry_method}</td>
                        <td>{submissionStatusLabels[submission.status]}</td>
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
                    ))}
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
                    <strong>{selectedSubmission.entry_method}</strong>
                  </div>
                </div>

                <div className="admin-detail-block">
                  <span>Valori transmise</span>
                  <ul className="admin-values-list">
                    {selectedSubmission.values.map((value) => (
                      <li key={value.id}>
                        <strong>{value.parameter_key}</strong>
                        <span>{value.value}</span>
                        <small>{formatDate(value.measured_at)}</small>
                      </li>
                    ))}
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
    </div>
  );
}