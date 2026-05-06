import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/admin-dashboard.css";
import "../styles/admin-layout.css";
import AdminLayout from "../components/layout/AdminLayout";
import {
  getStudyByIdAdminRequest,
  type StudyAdminOverviewResponse,
  type StudyType,
} from "../admin/adminApi";

type StudyStatus = StudyAdminOverviewResponse["status"];

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

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatEntryMethodLabel(value?: string | null): string {
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

function getStudyStatusPillClass(status: StudyStatus): string {
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

export default function AdminStudyDetailsPage() {
  const { studyId } = useParams();
  const navigate = useNavigate();

  const numericStudyId = Number(studyId);

  const [selectedStudy, setSelectedStudy] =
    useState<StudyAdminOverviewResponse | null>(null);

  const [studyDetailLoading, setStudyDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    void loadStudyDetails();
  }, [numericStudyId]);

  return (
    <AdminLayout
      activeItem="studies"
      title="Detalii studiu"
      subtitle="Vizualizare administrativă pentru monitorizarea tehnică a studiului selectat."
    >
      <div className="admin-page">
        <section className="admin-shell">
          <div className="admin-panel__header">
            <div>
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
            </div>
          </div>

          {errorMessage ? (
            <div className="admin-banner admin-banner--error">
              {errorMessage}
            </div>
          ) : null}

          {studyDetailLoading ? (
            <p className="admin-loading">Se încarcă studiul...</p>
          ) : selectedStudy ? (
            <>
              <div className="admin-kpi-grid admin-kpi-grid--study-detail">
                <article className="admin-kpi-card admin-kpi-card--users">
                  <div className="admin-kpi-card__top">
                    <span>Participanți înscriși</span>
                    <div className="admin-kpi-icon">👥</div>
                  </div>
                  <strong>{selectedStudy.participants_count}</strong>
                  <small>
                    Număr total de participanți asociați studiului.
                  </small>
                </article>

                <article className="admin-kpi-card admin-kpi-card--analysis">
                  <div className="admin-kpi-card__top">
                    <span>Status studiu</span>
                    <div className="admin-kpi-icon">📌</div>
                  </div>
                  <strong>{studyStatusLabels[selectedStudy.status]}</strong>
                  <small>Starea administrativă curentă a studiului.</small>
                </article>

                <article className="admin-kpi-card admin-kpi-card--requests">
                  <div className="admin-kpi-card__top">
                    <span>Mod colectare</span>
                    <div className="admin-kpi-icon">⇄</div>
                  </div>
                  <strong>
                    {formatEntryMethodLabel(selectedStudy.data_entry_mode)}
                  </strong>
                  <small>Metoda configurată pentru furnizarea datelor.</small>
                </article>

                <article className="admin-kpi-card admin-kpi-card--studies">
                  <div className="admin-kpi-card__top">
                    <span>Cercetător</span>
                    <div className="admin-kpi-icon">👤</div>
                  </div>
                  <strong>{selectedStudy.researcher.full_name}</strong>
                  <small>{selectedStudy.researcher.email}</small>
                </article>
              </div>

              <section className="admin-study-detail-layout">
                <article className="admin-panel admin-study-detail-main-card">
                  <div className="admin-panel__header">
                    <div>
                      <h2>Detalii studiu</h2>
                    </div>

                    <span className={getStudyStatusPillClass(selectedStudy.status)}>
                      {studyStatusLabels[selectedStudy.status]}
                    </span>
                  </div>

                  <div className="admin-study-detail-hero">
                    <div>
                      <span>Cod studiu</span>
                      <strong>{selectedStudy.code}</strong>
                    </div>

                    <div>
                      <span>Titlu</span>
                      <strong>{selectedStudy.title}</strong>
                    </div>
                  </div>

                  <div className="admin-study-detail-grid">
                    <div>
                      <span>Tip studiu</span>
                      <strong>{studyTypeLabels[selectedStudy.study_type]}</strong>
                    </div>

                    <div>
                      <span>Mod colectare date</span>
                      <strong>{formatEntryMethodLabel(selectedStudy.data_entry_mode)}</strong>
                    </div>

                    <div>
                      <span>Status curent</span>
                      <strong>{studyStatusLabels[selectedStudy.status]}</strong>
                    </div>

                    <div>
                      <span>Participanți înscriși</span>
                      <strong>{selectedStudy.participants_count}</strong>
                    </div>
                  </div>
                </article>

                <aside className="admin-study-detail-side">
                  <article className="admin-panel">
                    <div className="admin-panel__header">
                      <div>
                        <h2>Cercetător responsabil</h2>
                      </div>
                    </div>

                    <div className="admin-study-researcher-card">
                      <div className="admin-study-researcher-avatar">
                        {selectedStudy.researcher.full_name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{selectedStudy.researcher.full_name}</strong>
                        <span>{selectedStudy.researcher.email}</span>
                      </div>
                    </div>

                    <div className="admin-study-detail-list">
                      <div>
                        <span>Instituție</span>
                        <strong>{selectedStudy.researcher.institution ?? "—"}</strong>
                      </div>
                    </div>
                  </article>

                  <article className="admin-panel">
                    <div className="admin-panel__header">
                      <div>
                        <h2>Informații administrative</h2>
                      </div>
                    </div>

                    <div className="admin-study-detail-list">
                      <div>
                        <span>ID studiu</span>
                        <strong>{selectedStudy.id}</strong>
                      </div>

                      <div>
                        <span>ID cercetător</span>
                        <strong>{selectedStudy.researcher_id}</strong>
                      </div>

                      <div>
                        <span>Creat la</span>
                        <strong>{formatDate(selectedStudy.created_at)}</strong>
                      </div>

                      <div>
                        <span>Actualizat la</span>
                        <strong>{formatDate(selectedStudy.updated_at)}</strong>
                      </div>
                    </div>
                  </article>
                </aside>
              </section>
            </>
          ) : (
            <p className="admin-empty">Studiul nu a fost găsit.</p>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}