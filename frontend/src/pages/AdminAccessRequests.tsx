import { useMemo } from "react";
import type {
  AccessRequestResponse,
  AccessRequestStatus,
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
  accessRequestsLoading: boolean;
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C4.4 8.6 7.7 6.5 12 6.5C16.3 6.5 19.6 8.6 21.5 12C19.6 15.4 16.3 17.5 12 17.5C7.7 17.5 4.4 15.4 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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

function getLastSixMonthsLabels() {
  const now = new Date();
  const result: string[] = [];

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    result.push(formatMonthLabel(date));
  }

  return result;
}

export default function AdminAccessRequests({
  accessRequests,
  accessRequestsTotal,
  accessRequestsLoading,
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

    const monthLabels = getLastSixMonthsLabels();
    const monthsMap = new Map<string, number>();

    monthLabels.forEach((label) => {
      monthsMap.set(label, 0);
    });

    accessRequests.forEach((request) => {
      if (!request.created_at) {
        return;
      }

      const createdAt = new Date(request.created_at);
      if (Number.isNaN(createdAt.getTime())) {
        return;
      }

      const label = formatMonthLabel(createdAt);
      if (monthsMap.has(label)) {
        monthsMap.set(label, (monthsMap.get(label) ?? 0) + 1);
      }
    });

    const monthlyData = monthLabels.map((label) => ({
      month: label,
      cereri: monthsMap.get(label) ?? 0,
    }));

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
    approvedRequestsCount,
    pendingRequestsCount,
    rejectedRequestsCount,
  ]);

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
            <strong>{accessRequestsTotal}</strong>
            <small>Total cereri identificate pentru filtrele și căutarea curentă.</small>
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
            <small>Cereri acceptate din setul curent de rezultate afișate.</small>
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
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <div className="admin-panel__hint">Distribuție statusuri</div>
                <h2>Starea cererilor de acces</h2>
              </div>
            </div>

            {summary.pieData.length === 0 ? (
              <p className="admin-empty">
                Nu există suficiente date pentru afișarea distribuției.
              </p>
            ) : (
              <>
                <div className="admin-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={86}
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

                <div className="admin-legend-list">
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
              </>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <div className="admin-panel__hint">Evoluție recentă</div>
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
                  <Bar dataKey="cereri" radius={[8, 8, 0, 0]} fill="#76b65c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
        
      </section>

      <section className="admin-panel admin-panel--wide">
        <div className="admin-panel__header">
          <div>
            <div className="admin-panel__hint">Administrare</div>
            <h2>Gestionare cereri de acces</h2>
          </div>
        </div>

        <div className="admin-filters">
          <input
            type="text"
            placeholder="Caută după nume sau email..."
            value={accessRequestSearch}
            onChange={(event) => setAccessRequestSearch(event.target.value)}
          />

          <select
            value={accessRequestStatusFilter}
            onChange={(event) =>
              setAccessRequestStatusFilter(
                event.target.value as AccessRequestStatus | ""
              )
            }
          >
            <option value="">Toate statusurile</option>
            <option value="pending">În așteptare</option>
            <option value="approved">Aprobate</option>
            <option value="rejected">Respinse</option>
          </select>

          <button type="button" onClick={onReloadAccessRequests}>
            Aplică
          </button>
        </div>

        {accessRequestsLoading ? (
          <p className="admin-loading">Se încarcă cererile...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Detalii</th>
                </tr>
              </thead>
              <tbody>
                {accessRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table__empty">
                      Nu există cereri de acces pentru filtrele selectate.
                    </td>
                  </tr>
                ) : (
                  accessRequests.map((item) => (
                    <tr key={item.id}>
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
                      <td>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => onOpenAccessRequest(item.id)}
                          aria-label={`Vezi detalii pentru ${item.full_name}`}
                          title="Vezi detalii"
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