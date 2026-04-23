import type {
  AccessRequestResponse,
  AccessRequestStatus,
} from "../../admin/adminApi";

type AdminAccessRequestsProps = {
  accessRequests: AccessRequestResponse[];
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
  onReloadAccessRequests: () => void;
  onOpenAccessRequest: (accessRequestId: number) => void;
  onApproveAccessRequest: () => void;
  onRejectAccessRequest: () => void;
};

export default function AdminAccessRequests({
  accessRequests,
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
  onReloadAccessRequests,
  onOpenAccessRequest,
  onApproveAccessRequest,
  onRejectAccessRequest,
}: AdminAccessRequestsProps) {
  return (
    <div className="admin-section-grid">
      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>Gestionare cereri de acces</h2>
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
                {accessRequests.map((item) => (
                  <tr key={item.id}>
                    <td>{item.full_name}</td>
                    <td>{item.email}</td>
                    <td>{accessRequestStatusLabels[item.status]}</td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-inline-link"
                        onClick={() => onOpenAccessRequest(item.id)}
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
        <h2>Detalii cerere</h2>

        {selectedAccessRequest ? (
          <div className="admin-detail">
            <div>
              <span>Nume</span>
              <strong>{selectedAccessRequest.full_name}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{selectedAccessRequest.email}</strong>
            </div>
            <div>
              <span>Instituție</span>
              <strong>{selectedAccessRequest.institution ?? "—"}</strong>
            </div>
            <div>
              <span>Departament</span>
              <strong>{selectedAccessRequest.department ?? "—"}</strong>
            </div>
            <div>
              <span>Specializare</span>
              <strong>{selectedAccessRequest.specialization ?? "—"}</strong>
            </div>
            <div>
              <span>Telefon</span>
              <strong>{selectedAccessRequest.phone ?? "—"}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>
                {accessRequestStatusLabels[selectedAccessRequest.status]}
              </strong>
            </div>

            <div className="admin-detail-block">
              <span>Motiv solicitare</span>
              <p>
                {selectedAccessRequest.request_reason ?? "Nu a fost completat."}
              </p>
            </div>

            <div className="admin-detail-block">
              <span>Notițe revizuire</span>
              <textarea
                value={accessReviewNotes}
                onChange={(event) => setAccessReviewNotes(event.target.value)}
                rows={4}
              />
            </div>

            {selectedAccessRequest.status === "pending" ? (
              <div className="admin-actions-row">
                <button
                  type="button"
                  className="admin-btn admin-btn--success"
                  disabled={accessActionLoading}
                  onClick={onApproveAccessRequest}
                >
                  Aprobă
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  disabled={accessActionLoading}
                  onClick={onRejectAccessRequest}
                >
                  Respinge
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="admin-empty">Selectează o cerere din listă.</p>
        )}
      </aside>
    </div>
  );
}