import type { ResearcherStudyDetailResponse } from "../../../../studies/studyDetailsApi";
import type {
  ParticipantSummaryResponse,
  StudyDataSummaryResponse,
  StudyDataTimelinePointResponse,
} from "../../../../studies/studyDetailsApi";

type StudySummaryTabProps = {
  study: ResearcherStudyDetailResponse;
  participantsSummary: ParticipantSummaryResponse | null;
  dataSummary: StudyDataSummaryResponse | null;
  timeline: StudyDataTimelinePointResponse[];
};

const PARAMETER_LABELS = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "Saturația de oxigen",
  temperature: "Temperatura corporală",
} as const;

const PARAMETER_UNITS = {
  heartRate: "bătăi/min",
  respiratoryRate: "respirații/min",
  spo2: "%",
  temperature: "°C",
} as const;

const FREQUENCY_LABELS = {
  continuous: "Continuu",
  every_1_min: "La 1 minut",
  every_5_min: "La 5 minute",
  every_15_min: "La 15 minute",
  every_30_min: "La 30 minute",
  every_1_hour: "La 1 oră",
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

function getPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export default function StudySummaryTab({
  study,
  participantsSummary,
  dataSummary,
  timeline,
}: StudySummaryTabProps) {
  const targetParticipants = study.target_participants ?? 0;
  const currentParticipants = participantsSummary?.total_participants ?? study.participants_count;
  const participantPercent = getPercent(currentParticipants, targetParticipants);

  const totalSubmissions = dataSummary?.total_submissions ?? 0;
  const validated = dataSummary?.validated_count ?? 0;
  const pending = dataSummary?.submitted_count ?? 0;
  const rejected = dataSummary?.rejected_count ?? 0;

  const maxTimelineValue = Math.max(
    ...timeline.map((item) => item.values_count),
    1
  );

  return (
    <div className="researcher-study-summary-tab">
      <div className="researcher-study-summary-grid">
        <article className="researcher-study-details-card researcher-study-summary-card--info">
          <h2>Informații generale</h2>

          <dl className="researcher-study-info-list">
            <div>
              <dt>Descriere</dt>
              <dd>{study.description || "Nu a fost introdusă o descriere."}</dd>
            </div>

            <div>
              <dt>Instituție</dt>
              <dd>{study.institution || "—"}</dd>
            </div>

            <div>
              <dt>Data început</dt>
              <dd>{formatDate(study.start_date)}</dd>
            </div>

            <div>
              <dt>Data final</dt>
              <dd>{formatDate(study.end_date)}</dd>
            </div>

            <div>
              <dt>Participanți</dt>
              <dd>
                {currentParticipants}
                {targetParticipants > 0 ? ` / ${targetParticipants}` : ""}
                <span className="researcher-study-progress">
                  <span style={{ width: `${participantPercent}%` }} />
                </span>
              </dd>
            </div>

            <div>
              <dt>Criterii includere</dt>
              <dd>{study.inclusion_criteria || "—"}</dd>
            </div>

            <div>
              <dt>Reguli colectare</dt>
              <dd>{study.collection_rules || "—"}</dd>
            </div>

            <div>
              <dt>Note administrative</dt>
              <dd>{study.administrative_notes || "—"}</dd>
            </div>
          </dl>
        </article>

        <article className="researcher-study-details-card">
          <h2>Parametri monitorizați</h2>

          <div className="researcher-study-parameter-list">
            {study.parameters.map((parameter) => (
              <div key={parameter.id} className="researcher-study-parameter-item">
                <div>
                  <strong>{PARAMETER_LABELS[parameter.parameter_key]}</strong>
                  <span>{PARAMETER_UNITS[parameter.parameter_key]}</span>
                </div>

                <small>{FREQUENCY_LABELS[parameter.measurement_frequency]}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="researcher-study-details-card">
          <h2>Rezumat rapid</h2>

          <div className="researcher-study-quick-grid">
            <div className="researcher-study-quick-item">
              <strong>{currentParticipants}</strong>
              <span>Participanți</span>
            </div>

            <div className="researcher-study-quick-item">
              <strong>{dataSummary?.total_values ?? 0}</strong>
              <span>Valori colectate</span>
            </div>

            <div className="researcher-study-quick-item">
              <strong>{validated}</strong>
              <span>Validate</span>
            </div>

            <div className="researcher-study-quick-item">
              <strong>{pending}</strong>
              <span>În așteptare</span>
            </div>

            <div className="researcher-study-quick-item">
              <strong>{rejected}</strong>
              <span>Respinse</span>
            </div>
          </div>
        </article>
      </div>

      <div className="researcher-study-summary-bottom-grid">
        <article className="researcher-study-details-card">
          <div className="researcher-study-card-header">
            <h2>Evoluția colectării datelor</h2>
            <span>{timeline.length} puncte</span>
          </div>

          {timeline.length === 0 ? (
            <p className="researcher-study-empty-text">
              Nu există încă date suficiente pentru afișarea evoluției.
            </p>
          ) : (
            <div className="researcher-study-mini-chart">
              {timeline.map((item) => (
                <div key={item.label} className="researcher-study-mini-chart__item">
                  <span
                    className="researcher-study-mini-chart__bar"
                    style={{
                      height: `${Math.max(8, (item.values_count / maxTimelineValue) * 100)}%`,
                    }}
                  />
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="researcher-study-details-card">
          <h2>Activitate recentă</h2>

          <div className="researcher-study-activity-list">
            <div>
              <strong>Studiul a fost încărcat</strong>
              <span>{formatDate(study.updated_at)}</span>
            </div>

            <div>
              <strong>Total trimiteri: {totalSubmissions}</strong>
              <span>Ultima trimitere: {formatDate(dataSummary?.last_submission_at)}</span>
            </div>

            <div>
              <strong>Participanți cu date: {dataSummary?.participants_with_submissions ?? 0}</strong>
              <span>Din {currentParticipants} participanți înregistrați</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}