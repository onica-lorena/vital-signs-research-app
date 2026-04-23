import type {
  AccessRequestResponse,
  AccessRequestStatus,
  StudyDetailResponse,
} from "../../admin/adminApi";

type AdminDashboardProps = {
  usersCount: number;
  activeUsersCount: number;
  pendingRequestsCount: number;
  accessRequestsTotal: number;
  studiesCount: number;
  activeStudiesCount: number;
  studiesInAnalysisCount: number;
  adminsCount: number;
  researchersCount: number;
  accessRequests: AccessRequestResponse[];
  studies: StudyDetailResponse[];
  accessRequestStatusLabels: Record<AccessRequestStatus, string>;
  studyStatusLabels: Record<
    StudyDetailResponse["status"],
    string
  >;
  onOpenRecentAccessRequest: (accessRequestId: number) => void;
};

export default function AdminDashboard({
  usersCount,
  activeUsersCount,
  pendingRequestsCount,
  accessRequestsTotal,
  studiesCount,
  activeStudiesCount,
  studiesInAnalysisCount,
  adminsCount,
  researchersCount,
  accessRequests,
  studies,
  accessRequestStatusLabels,
  studyStatusLabels,
  onOpenRecentAccessRequest,
}: AdminDashboardProps) {
  return (
    <div className="admin-dashboard-grid">
      <article className="admin-stat-card">
        <span>Total utilizatori</span>
        <strong>{usersCount}</strong>
        <small>{activeUsersCount} activi</small>
      </article>

      <article className="admin-stat-card">
        <span>Cereri în așteptare</span>
        <strong>{pendingRequestsCount}</strong>
        <small>{accessRequestsTotal} cereri încărcate</small>
      </article>

      <article className="admin-stat-card">
        <span>Total studii</span>
        <strong>{studiesCount}</strong>
        <small>{activeStudiesCount} active</small>
      </article>

      <article className="admin-stat-card">
        <span>Studii în analiză</span>
        <strong>{studiesInAnalysisCount}</strong>
        <small>monitorizare centrală</small>
      </article>

      <article className="admin-panel">
        <h2>Distribuție utilizatori</h2>
        <div className="admin-simple-list">
          <div>
            <span>Administratori</span>
            <strong>{adminsCount}</strong>
          </div>
          <div>
            <span>Cercetători</span>
            <strong>{researchersCount}</strong>
          </div>
        </div>
      </article>

      <article className="admin-panel">
        <h2>Cereri recente</h2>
        <div className="admin-simple-list">
          {accessRequests.slice(0, 5).map((item) => (
            <button
              key={item.id}
              type="button"
              className="admin-inline-link"
              onClick={() => onOpenRecentAccessRequest(item.id)}
            >
              <span>{item.full_name}</span>
              <strong>{accessRequestStatusLabels[item.status]}</strong>
            </button>
          ))}
        </div>
      </article>

      <article className="admin-panel admin-panel--wide">
        <h2>Studii recente</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cod</th>
                <th>Titlu</th>
                <th>Status</th>
                <th>Cercetător</th>
                <th>Participanți</th>
              </tr>
            </thead>
            <tbody>
              {studies.slice(0, 6).map((study) => (
                <tr key={study.id}>
                  <td>{study.code}</td>
                  <td>{study.title}</td>
                  <td>{studyStatusLabels[study.status]}</td>
                  <td>{study.researcher.full_name}</td>
                  <td>{study.participants_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}