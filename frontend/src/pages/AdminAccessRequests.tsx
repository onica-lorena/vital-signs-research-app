import { useMemo } from "react";
import type {
  AccessRequestResponse,
  AccessRequestStatus,
  AccessRequestMonthlyCountResponse,
} from "../admin/adminApi";
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

type AdminAccessRequestsProps = {
  accessRequests: AccessRequestResponse[];
  accessRequestsTotal: number;
  accessRequestsGlobalTotal: number;
  accessRequestsMonthlyData: AccessRequestMonthlyCountResponse[];
  accessRequestsLoading: boolean;
  accessRequestsPage: number;
  setAccessRequestsPage: React.Dispatch<React.SetStateAction<number>>;
  accessRequestsPageSize: number;
  accessRequestStatusFilter: AccessRequestStatus | "";
  setAccessRequestStatusFilter: React.Dispatch<
    React.SetStateAction<AccessRequestStatus | "">
  >;
  accessRequestSearch: string;
  setAccessRequestSearch: React.Dispatch<React.SetStateAction<string>>;
  selectedAccessRequest: AccessRequestResponse | null;
  accessReviewNotes: string;
  setAccessReviewNotes: React.Dispatch<React.SetStateAction<string>>;
  accessActionLoading: boolean;
  accessRequestStatusLabels: Record<AccessRequestStatus, string>;
  formatDate: (value?: string | null) => string;
  pendingRequestsCount: number;
  approvedRequestsCount: number;
  rejectedRequestsCount: number;
  onReloadAccessRequests: () => void;
  onOpenAccessRequest: (accessRequestId: number) => void;
  onApproveAccessRequest: () => void;
  onRejectAccessRequest: () => void;
  onCloseAccessRequest: () => void;
};

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.75 6.75C4.75 5.64543 5.64543 4.75 6.75 4.75H17.25C18.3546 4.75 19.25 5.64543 19.25 6.75V14.25C19.25 15.3546 18.3546 16.25 17.25 16.25H10.5L6.25 19.25V16.25H6.75C5.64543 16.25 4.75 15.3546 4.75 14.25V6.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 9.25H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 12.25H13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15.5 19.25V17.75C15.5 16.2312 14.2688 15 12.75 15H7.75C6.23122 15 5 16.2312 5 17.75V19.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="10.25"
        cy="9.25"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16.5 8.5C17.8807 8.5 19 9.61929 19 11C19 12.3807 17.8807 13.5 16.5 13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 12.2L10.8 14.5L15.7 9.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STATUS_COLORS: Record<AccessRequestStatus, string> = {
  pending: "#ef9647",
  approved: "#76b65c",
  rejected: "#d9534f",
};

const STATUS_ORDER: AccessRequestStatus[] = ["pending", "approved", "rejected"];

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("ro-RO", {
    month: "short",
    year: "2-digit",
  });
}

export default function AdminAccessRequests({
  accessRequests,
  accessRequestsTotal,
  accessRequestsGlobalTotal,
  accessRequestsMonthlyData,
  accessRequestsLoading,
  accessRequestsPage,
  setAccessRequestsPage,
  accessRequestsPageSize,
  accessRequestStatusFilter,
  setAccessRequestStatusFilter,
  accessRequestSearch,
  setAccessRequestSearch,
  selectedAccessRequest,
  accessReviewNotes,
  setAccessReviewNotes,
  accessActionLoading,
  accessRequestStatusLabels,
  formatDate,
  pendingRequestsCount,
  approvedRequestsCount,
  rejectedRequestsCount,
  onReloadAccessRequests,
  onOpenAccessRequest,
  onApproveAccessRequest,
  onRejectAccessRequest,
  onCloseAccessRequest,
}: AdminAccessRequestsProps) {
  const summary = useMemo(() => {
    const reviewed = approvedRequestsCount + rejectedRequestsCount;
    const approvalRate =
      reviewed > 0 ? Math.round((approvedRequestsCount / reviewed) * 100) : 0;

    const pieData = STATUS_ORDER.map((status) => ({
      key: status,
      name: accessRequestStatusLabels[status],
      value:
        status === "pending"
          ? pendingRequestsCount
          : status === "approved"
            ? approvedRequestsCount
            : rejectedRequestsCount,
      color: STATUS_COLORS[status],
    })).filter((item) => item.value > 0);

    const monthsMap = new Map<string, number>();

    const monthlyData = accessRequestsMonthlyData.map((item) => {
    const [year, month] = item.month.split("-").map(Number);
    const date = new Date(year, month - 1, 1);

    return {
      month: formatMonthLabel(date),
      cereri: item.requests_count,
    };
  });

    const latestRequests = [...accessRequests]
      .sort((left, right) => {
        const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 5);

    return {
      reviewed,
      approvalRate,
      pieData,
      monthlyData,
      latestRequests,
    };
  }, [
    accessRequestStatusLabels,
    accessRequests,
    accessRequestsMonthlyData,
    approvedRequestsCount,
    pendingRequestsCount,
    rejectedRequestsCount,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(accessRequestsTotal / accessRequestsPageSize)
  );
  
  const rowStart =
    accessRequestsTotal === 0
      ? 0
      : (accessRequestsPage - 1) * accessRequestsPageSize + 1;
  
  const rowEnd = Math.min(
    accessRequestsPage * accessRequestsPageSize,
    accessRequestsTotal
  );

  return (
    <>
      <section className="admin-access-overview">
        <div className="admin-kpi-grid admin-kpi-grid--access">
          <article className="admin-kpi-card admin-kpi-card--requests">
            <div className="admin-kpi-card__top">
              <span>Total cereri</span>
              <div className="admin-kpi-icon">
                <UsersIcon />
              </div>
            </div>
            <strong>{accessRequestsGlobalTotal}</strong>
            <small>Numărul total al solicitărilor de acces.</small>
          </article>

          <article className="admin-kpi-card admin-kpi-card--analysis">
            <div className="admin-kpi-card__top">
              <span>În așteptare</span>
              <div className="admin-kpi-icon">
                <ReviewIcon />
              </div>
            </div>
            <strong>{pendingRequestsCount}</strong>
            <small>Cereri care necesită încă analiză din partea administratorului.</small>
          </article>

          <article className="admin-kpi-card admin-kpi-card--users">
            <div className="admin-kpi-card__top">
              <span>Aprobate</span>
              <div className="admin-kpi-icon">
                <SuccessIcon />
              </div>
            </div>
            <strong>{approvedRequestsCount}</strong>
            <small>Cereri acceptate din totalul cererilor existente.</small>
          </article>

          <article className="admin-kpi-card admin-kpi-card--studies">
            <div className="admin-kpi-card__top">
              <span>Rată aprobare</span>
              <div className="admin-kpi-icon">%</div>
            </div>
            <strong>{summary.approvalRate}%</strong>
            <small>Calculată raportat doar la cererile deja revizuite.</small>
            <div className="admin-kpi-progress">
              <div
                className="admin-kpi-progress__bar"
                style={{ width: `${summary.approvalRate}%` }}
              />
            </div>
          </article>
        </div>

        <div className="admin-section-grid admin-section-grid--access">
        <section className="admin-panel admin-panel--status-chart">
          <div className="admin-panel__header">
            <div>
              <h2>Starea cererilor de acces</h2>
            </div>
          </div>

            {summary.pieData.length === 0 ? (
              <p className="admin-empty">
                Nu există suficiente date pentru afișarea distribuției.
              </p>
            ) : (
              <div className="admin-status-chart-layout">
                <div className="admin-chart-box admin-chart-box--status">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={44}
                        outerRadius={66}
                        paddingAngle={3}
                      >
                        {summary.pieData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="admin-legend-list admin-legend-list--status">
                  {summary.pieData.map((item) => (
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
                <h2>Cereri pe ultimele 6 luni</h2>
              </div>
            </div>

            <div className="admin-chart-box admin-chart-box--wide">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [value, "Cereri"]} />
                  <Bar dataKey="cereri" fill="#76b65c" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>

      <section className="admin-panel admin-panel--wide">
        <div className="admin-panel__header">
          <div>
            {/*<div className="admin-panel__hint">Administrare</div>*/}
            <h2>Gestionare cereri de acces</h2>
          </div>
        </div>

        <div className="admin-filters">
          <input
            type="text"
            placeholder="Caută după nume sau email..."
            value={accessRequestSearch}
            onChange={(event) => {
              setAccessRequestSearch(event.target.value);
              setAccessRequestsPage(1);
            }}
          />

          <select
            value={accessRequestStatusFilter}
            onChange={(event) => {
              setAccessRequestStatusFilter(
                event.target.value as AccessRequestStatus | ""
              );
              setAccessRequestsPage(1);
            }}
          >
            <option value="">Toate statusurile</option>
            <option value="pending">În așteptare</option>
            <option value="approved">Aprobate</option>
            <option value="rejected">Respinse</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setAccessRequestsPage(1);
              onReloadAccessRequests();
            }}
          >
            Aplică
          </button>
        </div>

        {accessRequestsLoading ? (
          <p className="admin-loading">Se încarcă cererile...</p>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nume</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>

                <tbody>
                  {accessRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-table__empty">
                        Nu există cereri de acces pentru filtrele selectate.
                      </td>
                    </tr>
                  ) : (
                    accessRequests.map((item) => (
                      <tr
                        key={item.id}
                        className="admin-table-clickable-row"
                        onClick={() => onOpenAccessRequest(item.id)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onOpenAccessRequest(item.id);
                          }
                        }}
                      >
                        <td>{item.full_name}</td>

                        <td>{item.email}</td>

                        <td>
                          <span
                            className={[
                              "admin-status-pill",
                              item.status === "approved"
                                ? "admin-status-pill--success"
                                : item.status === "rejected"
                                  ? "admin-status-pill--danger"
                                  : "admin-status-pill--warning",
                            ].join(" ")}
                          >
                            {accessRequestStatusLabels[item.status]}
                          </span>
                        </td>

                        <td>{formatDate(item.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-table-footer">
              <span>
                Afișare {rowStart} - {rowEnd} din {accessRequestsTotal} cereri
              </span>

              <div className="admin-pagination">
                <button
                  type="button"
                  onClick={() => setAccessRequestsPage((prev) => Math.max(1, prev - 1))}
                  disabled={accessRequestsPage === 1 || accessRequestsLoading}
                >
                  ‹
                </button>

                <button type="button" className="is-active" disabled>
                  {accessRequestsPage}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAccessRequestsPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={accessRequestsPage === totalPages || accessRequestsLoading}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedAccessRequest ? (
        <div className="admin-modal-backdrop" onClick={onCloseAccessRequest}>
          <div
            className="admin-modal admin-modal--access"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal__header">
              <div>
                <div className="admin-panel__hint">Cerere selectată</div>
                <h2>Detalii cerere</h2>
              </div>

              <button
                type="button"
                className="admin-modal__close"
                onClick={onCloseAccessRequest}
                aria-label="Închide fereastra"
              >
                ×
              </button>
            </div>

            <div className="admin-detail admin-detail--cards">
              <div className="admin-detail-card">
                <span>Nume</span>
                <strong>{selectedAccessRequest.full_name}</strong>
              </div>

              <div className="admin-detail-card">
                <span>Email</span>
                <strong>{selectedAccessRequest.email}</strong>
              </div>

              <div className="admin-detail-card">
                <span>Instituție</span>
                <strong>{selectedAccessRequest.institution ?? "—"}</strong>
              </div>

              <div className="admin-detail-card">
                <span>Departament</span>
                <strong>{selectedAccessRequest.department ?? "—"}</strong>
              </div>

              <div className="admin-detail-card">
                <span>Specializare</span>
                <strong>{selectedAccessRequest.specialization ?? "—"}</strong>
              </div>

              <div className="admin-detail-card">
                <span>Telefon</span>
                <strong>{selectedAccessRequest.phone ?? "—"}</strong>
              </div>

              <div className="admin-detail-card">
                <span>Status</span>
                <strong>
                  {accessRequestStatusLabels[selectedAccessRequest.status]}
                </strong>
              </div>

              <div className="admin-detail-card">
                <span>Data solicitării</span>
                <strong>{formatDate(selectedAccessRequest.created_at)}</strong>
              </div>
            </div>

            <div className="admin-detail-block admin-detail-block--surface">
              <span>Motiv solicitare</span>
              <p>
                {selectedAccessRequest.request_reason ?? "Nu a fost completat."}
              </p>
            </div>

            <div className="admin-detail-block admin-detail-block--surface">
              <span>Notițe revizuire</span>
              <textarea
                value={accessReviewNotes}
                onChange={(event) => setAccessReviewNotes(event.target.value)}
                rows={4}
                placeholder="Adaugă observații pentru aprobare sau respingere..."
              />
            </div>

            {selectedAccessRequest.status === "pending" ? (
              <div className="admin-actions-row admin-actions-row--modal">
                <button
                  type="button"
                  className="admin-btn admin-btn--success"
                  disabled={accessActionLoading}
                  onClick={onApproveAccessRequest}
                >
                  {accessActionLoading ? "Se procesează..." : "Aprobă cererea"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  disabled={accessActionLoading}
                  onClick={onRejectAccessRequest}
                >
                  {accessActionLoading ? "Se procesează..." : "Respinge cererea"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}