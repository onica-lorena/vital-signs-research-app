import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ResearcherStudyDetailResponse } from "../../../studies/studyDetailsApi";
import { deleteStudyRequest } from "../../../studies/studyDetailsApi";

type StudyDetailsHeaderProps = {
  study: ResearcherStudyDetailResponse;
  onEdit: () => void;
};

const STATUS_LABELS = {
  draft: "Ciornă",
  active: "Activ",
  in_analysis: "În analiză",
  completed: "Finalizat",
} as const;

const STUDY_TYPE_LABELS = {
  observational_prospective: "Observațional prospectiv",
  observational_retrospective: "Observațional retrospectiv",
  observational_mixed: "Observațional mixt",
} as const;

const DATA_ENTRY_MODE_LABELS = {
  manual: "Manual",
  csv: "CSV",
  manual_csv: "Manual + CSV",
} as const;

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStudyPeriod(
  startDate?: string | null,
  endDate?: string | null
): string {
  if (!startDate && !endDate) {
    return "—";
  }

  if (startDate && !endDate) {
    return `Din ${formatDate(startDate)} · în curs`;
  }

  if (!startDate && endDate) {
    return `Până la ${formatDate(endDate)}`;
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19h4.2L18.4 9.8a2 2 0 0 0 0-2.8L17 5.6a2 2 0 0 0-2.8 0L5 14.8V19Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.4 6.4l4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8 7l.5-2h7L16 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 7.5 8.2 19h7.6l.7-11.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function InstitutionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 20V9h12v11" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 20v-5h6v5M8.5 12h.01M12 12h.01M15.5 12h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 9l7-5 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4v3M17 4v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5.5 6.5h13A1.5 1.5 0 0 1 20 8v10.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5V8a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 10h16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function StudyDetailsHeader({ study, onEdit }: StudyDetailsHeaderProps) {
  const navigate = useNavigate();
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleteMessage(null);

    if (!study.can_delete) {
      setDeleteMessage(
        study.delete_restriction_reason ??
          "Studiul nu poate fi șters în starea curentă."
      );
      return;
    }

    const confirmed = window.confirm(
      "Sigur vrei să ștergi acest studiu? Acțiunea nu poate fi anulată."
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteStudyRequest(study.id);
      navigate("/cercetator/studii");
    } catch (error) {
      setDeleteMessage(
        error instanceof Error
          ? error.message
          : "Studiul nu a putut fi șters."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="researcher-study-details-hero">
      <div className="researcher-study-details-hero__main">
        <div className="researcher-study-details-title-row">
          <h1>{study.title}</h1>
        </div>

        <div className="researcher-study-details-badges">
          <span>Cod: {study.code}</span>
          <span>Status: {STATUS_LABELS[study.status]}</span>
          <span>Tip: {STUDY_TYPE_LABELS[study.study_type]}</span>
          <span>Mod furnizare date: {DATA_ENTRY_MODE_LABELS[study.data_entry_mode]}</span>
        </div>

        <div className="researcher-study-details-meta">
          <span>
            <UserIcon />
            Cercetător: {study.researcher?.full_name ?? "—"}
          </span>

          <span>
            <InstitutionIcon />
            Instituție: {study.institution?.trim() || "—"}
          </span>

          <span>
            <CalendarIcon />
            Perioadă: {formatStudyPeriod(study.start_date, study.end_date)}
          </span>
        </div>

        {deleteMessage ? (
          <div className="researcher-study-details-warning">
            {deleteMessage}
          </div>
        ) : null}
      </div>

      <div className="researcher-study-details-hero__actions">
        <button
          type="button"
          className="researcher-study-details-outline-btn"
          onClick={onEdit}
        >
          <EditIcon />
          <span>Editează</span>
        </button>

        <button
          type="button"
          className="researcher-study-details-danger-btn"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <DeleteIcon />
          <span>{isDeleting ? "Se șterge..." : "Șterge"}</span>
        </button>
      </div>
    </section>
  );
}