import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AccessRequestResponse,
  AccessRequestStatus,
  StudyDetailResponse,
} from "../admin/adminApi";

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
  studyStatusLabels: Record<StudyDetailResponse["status"], string>;
  onOpenRecentAccessRequest: (accessRequestId: number) => void;
};

const CHART_COLORS = {
  green: "#76b65c",
  greenSoft: "#eaf4e6",
  orange: "#ef9647",
  orangeSoft: "#fcf0e4",
  blueSoft: "#dbeaf6",
  text: "#12383d",
  muted: "#87959a",
};

function getAccessRequestStatusClass(status: AccessRequestStatus) {
  switch (status) {
    case "pending":
      return "admin-status-pill admin-status-pill--warning";
    case "approved":
      return "admin-status-pill admin-status-pill--success";
    case "rejected":
      return "admin-status-pill admin-status-pill--danger";
    default:
      return "admin-status-pill";
  }
}

function getStudyStatusClass(status: StudyDetailResponse["status"]) {
  switch (status) {
    case "active":
      return "admin-status-pill admin-status-pill--success";
    case "in_analysis":
      return "admin-status-pill admin-status-pill--warning";
    case "completed":
      return "admin-status-pill admin-status-pill--neutral";
    case "draft":
      return "admin-status-pill";
    default:
      return "admin-status-pill";
  }
}

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
  const usersChartData = [
    { name: "Administratori", value: adminsCount },
    { name: "Cercetători", value: researchersCount },
  ];

  const studiesStatusData = [
    {
      name: "Active",
      value: studies.filter((study) => study.status === "active").length,
    },
    {
      name: "În analiză",
      value: studies.filter((study) => study.status === "in_analysis").length,
    },
    {
      name: "Finalizate",
      value: studies.filter((study) => study.status === "completed").length,
    },
    {
      name: "Draft",
      value: studies.filter((study) => study.status === "draft").length,
    },
  ];

  const activeUsersRate =
    usersCount > 0 ? Math.round((activeUsersCount / usersCount) * 100) : 0;

  const pendingRequestsRate =
    accessRequestsTotal > 0
      ? Math.round((pendingRequestsCount / accessRequestsTotal) * 100)
      : 0;

  return (
    <div className="admin-dashboard-content">
      <section className="admin-kpi-grid">
        <article className="admin-kpi-card admin-kpi-card--users">
          <div className="admin-kpi-card__top">
            <span>Total utilizatori</span>
            <div className="admin-kpi-icon">👤</div>
          </div>
          <strong>{usersCount}</strong>
          <small>{activeUsersCount} activi în platformă</small>
          <div className="admin-kpi-progress">
            <div
              className="admin-kpi-progress__bar"
              style={{ width: `${activeUsersRate}%` }}
            />
          </div>
          <em>{activeUsersRate}% conturi active</em>
        </article>

        <article className="admin-kpi-card admin-kpi-card--requests">
          <div className="admin-kpi-card__top">
            <span>Cereri în așteptare</span>
            <div className="admin-kpi-icon">📩</div>
          </div>
          <strong>{pendingRequestsCount}</strong>
          <small>{accessRequestsTotal} cereri înregistrate</small>
          <div className="admin-kpi-progress">
            <div
              className="admin-kpi-progress__bar"
              style={{ width: `${pendingRequestsRate}%` }}
            />
          </div>
          <em>{pendingRequestsRate}% încă necesită acțiune</em>
        </article>

        <article className="admin-kpi-card admin-kpi-card--studies">
          <div className="admin-kpi-card__top">
            <span>Total studii</span>
            <div className="admin-kpi-icon">🧪</div>
          </div>
          <strong>{studiesCount}</strong>
          <small>{activeStudiesCount} active momentan</small>
        </article>

        <article className="admin-kpi-card admin-kpi-card--analysis">
          <div className="admin-kpi-card__top">
            <span>Studii în analiză</span>
            <div className="admin-kpi-icon">📊</div>
          </div>
          <strong>{studiesInAnalysisCount}</strong>
          <small>monitorizare centrală</small>
        </article>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel__header">
            <h2>Distribuția utilizatorilor</h2>
            <span className="admin-panel__hint"></span>
          </div>

          <div className="admin-chart-box">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={usersChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={78}
                  innerRadius={50}
                  paddingAngle={4}
                >
                  <Cell fill="#76b65c" />
                  <Cell fill="#ef9647" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-legend-list">
            <div>
              <span className="admin-legend-dot admin-legend-dot--green" />
              <span>Administratori</span>
              <strong>{adminsCount}</strong>
            </div>
            <div>
              <span className="admin-legend-dot admin-legend-dot--orange" />
              <span>Cercetători</span>
              <strong>{researchersCount}</strong>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel__header">
            <h2>Starea studiilor</h2>
            <span className="admin-panel__hint"></span>
          </div>

          <div className="admin-chart-box">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={studiesStatusData}
                margin={{ top: 8, right: 0, left: -45, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#edf1ed" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 10, fill: "#66767b" }}
                  tickMargin={8}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#66767b" }} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  <Cell fill="#76b65c" />
                  <Cell fill="#ef9647" />
                  <Cell fill="#dbeaf6" />
                  <Cell fill="#dfe8dc" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel__header">
            <h2>Rezumat rapid</h2>
            <span className="admin-panel__hint"></span>
          </div>

          <div className="admin-highlight-grid">
            <div className="admin-highlight-card">
              <span>Utilizatori activi</span>
              <strong>{activeUsersCount}</strong>
              <small>din totalul conturilor</small>
            </div>

            <div className="admin-highlight-card">
              <span>Solicitări în lucru</span>
              <strong>{pendingRequestsCount}</strong>
              <small>așteaptă validare</small>
            </div>

            <div className="admin-highlight-card">
              <span>Studii active</span>
              <strong>{activeStudiesCount}</strong>
              <small>în desfășurare</small>
            </div>

            <div className="admin-highlight-card">
              <span>Analize deschise</span>
              <strong>{studiesInAnalysisCount}</strong>
              <small>urmărire administrativă</small>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel__header">
            <h2>Cereri recente</h2>
            <span className="admin-panel__hint"></span>
          </div>

          <div className="admin-activity-list">
            {accessRequests.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                className="admin-activity-item"
                onClick={() => onOpenRecentAccessRequest(item.id)}
              >
                <div className="admin-activity-item__content">
                  <strong>{item.full_name}</strong>
                  <small>{item.email}</small>
                </div>

                <span className={getAccessRequestStatusClass(item.status)}>
                  {accessRequestStatusLabels[item.status]}
                </span>
              </button>
            ))}

            {accessRequests.length === 0 ? (
              <p className="admin-empty">Nu există cereri recente.</p>
            ) : null}
          </div>
        </article>

        <article className="admin-panel admin-panel--wide">
          <div className="admin-panel__header">
            <h2>Studii recente</h2>
            <span className="admin-panel__hint"></span>
          </div>

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
                    <td>
                      <span className={getStudyStatusClass(study.status)}>
                        {studyStatusLabels[study.status]}
                      </span>
                    </td>
                    <td>{study.researcher.full_name}</td>
                    <td>{study.participants_count}</td>
                  </tr>
                ))}

                {studies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table__empty">
                      Nu există studii disponibile.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}