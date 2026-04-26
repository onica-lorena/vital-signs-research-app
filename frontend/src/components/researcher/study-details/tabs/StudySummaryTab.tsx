import type { ResearcherStudyDetailResponse } from "../../../../studies/studyDetailsApi";
import type {
  ParticipantSummaryResponse,
  StudyDataSummaryResponse,
  StudyDataTimelinePointResponse,
} from "../../../../studies/studyDetailsApi";

type StudySummaryTabProps = {
  study: ResearcherStudyDetailResponse;
  participantsSummary: ParticipantSummaryResponse | null;
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

function HeartRateIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 56 C30.8 56 29.7 55.5 28.8 54.7 L14.9 41.8 C7.9 35.3 7.2 24.4 13.3 17.3 C18.8 10.9 28.3 10.3 34.1 15.3 L32 17.6 L29.9 15.3 C35.7 10.3 45.2 10.9 50.7 17.3 C56.8 24.4 56.1 35.3 49.1 41.8 L35.2 54.7 C34.3 55.5 33.2 56 32 56Z"
        fill="currentColor"
      />
      <path
        d="M10.2 32H24.2L28.5 22.5L34.2 41.5L39 26.8L43.2 32H53.8"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RespiratoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.2V7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7
           C12 8 11.6 8.7 10.9 9.4
           L10.2 10.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7
           C12 8 12.4 8.7 13.1 9.4
           L13.8 10.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10.2 9.6
           C9.5 8.9 8.5 8.5 7.6 8.8
           C6 9.3 5 11.2 5 13.7
           C5 16.2 5.8 18.4 7.1 19.3
           C7.4 19.5 7.8 19.5 8 19.2
           C8.7 18.4 9.5 17.9 10.2 17.5
           C10.8 17.2 11.1 16.6 11.1 15.9
           V10.8
           C11.1 10.3 10.8 9.9 10.2 9.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M13.8 9.6
           C14.5 8.9 15.5 8.5 16.4 8.8
           C18 9.3 19 11.2 19 13.7
           C19 16.2 18.2 18.4 16.9 19.3
           C16.6 19.5 16.2 19.5 16 19.2
           C15.3 18.4 14.5 17.9 13.8 17.5
           C13.2 17.2 12.9 16.6 12.9 15.9
           V10.8
           C12.9 10.3 13.2 9.9 13.8 9.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8.2 12.1C8.9 12.4 9.4 13 9.7 13.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.8 12.1C15.1 12.4 14.6 13 14.3 13.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.8c-2.9 4.1-5.5 6.8-5.5 10.3A5.5 5.5 0 0 0 12 19.6a5.5 5.5 0 0 0 5.5-5.5C17.5 10.6 14.9 7.9 12 3.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14.1" r="1.8" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function ThermometerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5.2a2 2 0 1 0-4 0v7.1a4.2 4.2 0 1 0 4 0V5.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 14.3V7.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="16.8" r="1.8" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

const PARAMETER_ICONS = {
  heartRate: HeartRateIcon,
  respiratoryRate: RespiratoryIcon,
  spo2: DropIcon,
  temperature: ThermometerIcon,
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
}: StudySummaryTabProps) {
  const targetParticipants = study.target_participants ?? 0;
  const currentParticipants = participantsSummary?.total_participants ?? study.participants_count;
  const participantPercent = getPercent(currentParticipants, targetParticipants);

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

            <div>
              <dt>Participanți țintă</dt>
              <dd>{targetParticipants > 0 ? targetParticipants : "—"}</dd>
            </div>

          </dl>
        </article>

        <article className="researcher-study-details-card researcher-study-parameters-card">
          <h2>Parametri monitorizați</h2>

          <div className="researcher-study-parameter-list">
            {study.parameters.map((parameter) => {
              const ParameterIcon = PARAMETER_ICONS[parameter.parameter_key];
            
              return (
                <div key={parameter.id} className="researcher-study-parameter-item">
                  <div className="researcher-study-parameter-main">
                    <span className="researcher-study-parameter-icon">
                      <ParameterIcon />
                    </span>
            
                    <div>
                      <strong>{PARAMETER_LABELS[parameter.parameter_key]}</strong>
                      <span>{PARAMETER_UNITS[parameter.parameter_key]}</span>
                    </div>
                  </div>
            
                  <small>{FREQUENCY_LABELS[parameter.measurement_frequency]}</small>
                </div>
              );
            })}
          </div>
          <div className="researcher-study-parameters-note">
            <strong>Configurare parametri</strong>
            <span>
              Fiecare înregistrare trimisă de participant trebuie să includă toți
              parametrii monitorizați în acest studiu.
            </span>
          </div>
        </article>
      </div>

      {/*<div className="researcher-study-summary-bottom-grid">
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
      </div>*/}
    </div>
  );
}