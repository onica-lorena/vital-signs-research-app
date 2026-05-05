import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ResearcherLayout from "../components/layout/ResearcherLayout";
import StudyDetailsHeader from "../components/researcher/study-details/StudyDetailsHeader";
import StudyDetailsTabs from "../components/researcher/study-details/StudyDetailsTabs";
import StudySummaryTab from "../components/researcher/study-details/tabs/StudySummaryTab";
import StudyParticipantsTab from "../components/researcher/study-details/tabs/StudyParticipantsTab";
import StudyCollectedDataTab from "../components/researcher/study-details/tabs/StudyCollectedDataTab";
import StudyAnalysisTab from "../components/researcher/study-details/tabs/StudyAnalysisTab";
import { SESSION_EXPIRED_ERROR } from "../auth/authFetch";
import {
  getResearcherStudyDataSummaryRequest,
  getResearcherStudyDataTimelineRequest,
  getResearcherStudyDetailsRequest,
  getResearcherStudyParticipantsSummaryRequest,
  updateResearcherStudyRequest,
  type UpdateResearcherStudyPayload,
  type ParticipantSummaryResponse,
} from "../studies/studyDetailsApi";
import type { ResearcherStudyDetailResponse } from "../studies/studyDetailsApi";
import "../styles/researcher-study-details-page.css";

const VALID_TABS = ["rezumat", "participanti", "date", "analize"] as const;

type StudyDetailsTab = (typeof VALID_TABS)[number];

type CollectedDataFocusRequest = {
  participantId: number;
  participantCode: string;
  startDate: string | null;
  endDate: string | null;
};

function isValidTab(value: string | undefined): value is StudyDetailsTab {
  return VALID_TABS.includes(value as StudyDetailsTab);
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type StudyEditModalProps = {
  study: ResearcherStudyDetailResponse;
  error: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: UpdateResearcherStudyPayload) => Promise<void>;
};

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function StudyEditModal({
  study,
  error,
  isSaving,
  onClose,
  onSave,
}: StudyEditModalProps) {
  const [title, setTitle] = useState(study.title);
  const [status, setStatus] = useState(study.status);
  const [studyType, setStudyType] = useState(study.study_type);
  const [dataEntryMode, setDataEntryMode] = useState(study.data_entry_mode);
  const [startDate, setStartDate] = useState(toDateInputValue(study.start_date));
  const [endDate, setEndDate] = useState(toDateInputValue(study.end_date));
  const [institution, setInstitution] = useState(study.institution ?? "");
  const [targetParticipants, setTargetParticipants] = useState(
    study.target_participants?.toString() ?? ""
  );
  const [description, setDescription] = useState(study.description ?? "");
  const [collectionRules, setCollectionRules] = useState(study.collection_rules ?? "");
  const [inclusionCriteria, setInclusionCriteria] = useState(study.inclusion_criteria ?? "");
  const [administrativeNotes, setAdministrativeNotes] = useState(
    study.administrative_notes ?? ""
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSave({
      title,
      status,
      study_type: studyType,
      data_entry_mode: dataEntryMode,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      institution: institution.trim() || null,
      target_participants: targetParticipants
        ? Number(targetParticipants)
        : null,
      description: description.trim() || null,
      collection_rules: collectionRules.trim() || null,
      inclusion_criteria: inclusionCriteria.trim() || null,
      administrative_notes: administrativeNotes.trim() || null,
    });
  };

  return (
    <div className="researcher-study-modal-backdrop">
      <form className="researcher-study-edit-modal" onSubmit={handleSubmit}>
        <div className="researcher-study-edit-modal__header">
          <div>
            <h2>Editează studiul</h2>
            <p>Actualizează detaliile generale ale studiului.</p>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {error ? (
          <div className="researcher-study-details-banner researcher-study-details-banner--error">
            {error}
          </div>
        ) : null}

        <div className="researcher-study-edit-modal__grid">
          <label>
            Titlu
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="draft">Ciornă</option>
              <option value="active">Activ</option>
              <option value="in_analysis">În analiză</option>
              <option value="completed">Finalizat</option>
            </select>
          </label>

          <label>
            Tip studiu
            <select value={studyType} onChange={(e) => setStudyType(e.target.value as typeof studyType)}>
              <option value="observational_prospective">Observațional prospectiv</option>
              <option value="observational_retrospective">Observațional retrospectiv</option>
              <option value="observational_mixed">Observațional mixt</option>
            </select>
          </label>

          <label>
            Mod furnizare date
            <select value={dataEntryMode} onChange={(e) => setDataEntryMode(e.target.value as typeof dataEntryMode)}>
              <option value="manual">Manual</option>
              <option value="csv">CSV</option>
              <option value="manual_csv">Manual + CSV</option>
            </select>
          </label>

          <label>
            Data început
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <label>
            Data final
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>

          <label>
            Instituție studiu
            <input value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </label>

          <label>
            Țintă participanți
            <input
              type="number"
              min="0"
              value={targetParticipants}
              onChange={(e) => setTargetParticipants(e.target.value)}
            />
          </label>

          <label className="researcher-study-edit-modal__full">
            Descriere
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <label className="researcher-study-edit-modal__full">
            Reguli colectare
            <textarea value={collectionRules} onChange={(e) => setCollectionRules(e.target.value)} />
          </label>

          <label className="researcher-study-edit-modal__full">
            Criterii includere
            <textarea value={inclusionCriteria} onChange={(e) => setInclusionCriteria(e.target.value)} />
          </label>

          <label className="researcher-study-edit-modal__full">
            Note administrative
            <textarea value={administrativeNotes} onChange={(e) => setAdministrativeNotes(e.target.value)} />
          </label>
        </div>

        <div className="researcher-study-edit-modal__actions">
          <button type="button" className="researcher-study-details-outline-btn" onClick={onClose}>
            Anulează
          </button>

          <button type="submit" className="researcher-study-details-primary-btn" disabled={isSaving}>
            {isSaving ? "Se salvează..." : "Salvează modificările"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ResearcherStudyDetailsPage() {
  const { studyId, tab } = useParams();
  const navigate = useNavigate();

  const [study, setStudy] = useState<ResearcherStudyDetailResponse | null>(null);
  const [participantsSummary, setParticipantsSummary] =
    useState<ParticipantSummaryResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [isSavingStudy, setIsSavingStudy] = useState(false);

  const [collectedDataFocusRequest, setCollectedDataFocusRequest] =
    useState<CollectedDataFocusRequest | null>(null);

  const numericStudyId = Number(studyId);

  useEffect(() => {
    if (!studyId || Number.isNaN(numericStudyId)) {
      return;
    }

    let cancelled = false;

    async function loadStudyDetails() {
      setIsLoading(true);
      setPageError("");

      try {
        const [studyResponse, participantsResponse] =
          await Promise.all([
            getResearcherStudyDetailsRequest(numericStudyId),
            getResearcherStudyParticipantsSummaryRequest(numericStudyId),
          ]);

        if (cancelled) {
          return;
        }

        setStudy(studyResponse);
        setParticipantsSummary(participantsResponse);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
          return;
        }

        setPageError(
          error instanceof Error
            ? error.message
            : "Nu s-au putut încărca detaliile studiului."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadStudyDetails();

    return () => {
      cancelled = true;
    };
  }, [studyId, numericStudyId]);

  if (!studyId || Number.isNaN(numericStudyId)) {
    return <Navigate to="/cercetator/studii" replace />;
  }

  if (!isValidTab(tab)) {
    return <Navigate to={`/cercetator/studii/${studyId}/rezumat`} replace />;
  }

  return (
    <ResearcherLayout
      activeItem="studii"
      title="Detalii studiu"
      subtitle="Consultă structura, participanții, datele colectate și analizele studiului."
      contentWidth="wide"
      actions={
        <button
          type="button"
          className="create-study-back-btn"
          onClick={() => navigate("/cercetator/studii")}
        >
          <ArrowLeftIcon />
          <span>Înapoi la studii</span>
        </button>
      }
    >
      <div className="researcher-study-details-page">
        {pageError ? (
          <div className="researcher-study-details-banner researcher-study-details-banner--error">
            {pageError}
          </div>
        ) : null}

        {isLoading ? (
          <section className="researcher-study-details-card">
            Se încarcă detaliile studiului...
          </section>
        ) : study ? (
          <>
            <StudyDetailsHeader
              study={study}
              onEdit={() => {
                setEditError("");
                setIsEditModalOpen(true);
              }}
            />

            <StudyDetailsTabs studyId={numericStudyId} />

            <section className="researcher-study-details-content">
              {tab === "rezumat" ? (
                <StudySummaryTab
                  study={study}
                  participantsSummary={participantsSummary}
                />
              ) : null}

              {tab === "participanti" ? (
                <StudyParticipantsTab studyId={numericStudyId} />
              ) : null}

              {tab === "date" ? (
                <StudyCollectedDataTab
                  studyId={numericStudyId}
                  focusRequest={collectedDataFocusRequest}
                  onFocusRequestConsumed={() => setCollectedDataFocusRequest(null)}
                />
              ) : null}

              {tab === "analize" ? (
                <StudyAnalysisTab
                  studyId={numericStudyId}
                  onOpenCollectedData={(request) => {
                    setCollectedDataFocusRequest(request);
                    navigate(`/cercetator/studii/${numericStudyId}/date`);
                  }}
                />
              ) : null}
            </section>

            {isEditModalOpen ? (
              <StudyEditModal
                study={study}
                error={editError}
                isSaving={isSavingStudy}
                onClose={() => setIsEditModalOpen(false)}
                onSave={async (payload) => {
                  try {
                    setIsSavingStudy(true);
                    setEditError("");
            
                    const updatedStudy = await updateResearcherStudyRequest(
                      numericStudyId,
                      payload
                    );
            
                    setStudy(updatedStudy);
                    setIsEditModalOpen(false);
                  } catch (error) {
                    setEditError(
                      error instanceof Error
                        ? error.message
                        : "Nu s-a putut actualiza studiul."
                    );
                  } finally {
                    setIsSavingStudy(false);
                  }
                }}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </ResearcherLayout>
  );
}