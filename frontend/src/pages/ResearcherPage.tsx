import { useNavigate } from "react-router-dom";
import ResearcherLayout from "../components/layout/ResearcherLayout";
import "../styles/researcher-dashboard.css";

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.5 6L15.5 12L9.5 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function CaretDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <path d="M9 5.2C9 4 9.9 3 11 3H13C14.1 3 15 4 15 5.2V6H9V5.2Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M9 10.2H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 18C4.5 15.51 6.51 13.5 9 13.5C11.49 13.5 13.5 15.51 13.5 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M15.3 18C15.5 16.46 16.7 15.2 18.2 14.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="6.5" rx="5.5" ry="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 6.5V12C6.5 13.38 8.96 14.5 12 14.5C15.04 14.5 17.5 13.38 17.5 12V6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 12V17.5C6.5 18.88 8.96 20 12 20C15.04 20 17.5 18.88 17.5 17.5V12" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.5H13L17 8.5V18.5C17 19.05 16.55 19.5 16 19.5H8C7.45 19.5 7 19.05 7 18.5V4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13 4.5V8.5H17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 12H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 15H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LaunchAnalysisIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 15L15 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 9H15V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const stats = [
  {
    label: "Studii active",
    value: "4",
    helper: "2 în desfășurare, 2 finalizate",
    icon: ClipboardIcon,
  },
  {
    label: "Participanți",
    value: "58",
    helper: "în toate studiile active",
    icon: PeopleIcon,
  },
  {
    label: "Seturi de date colectate",
    value: "1.248",
    helper: "înregistrări validate",
    icon: DatabaseIcon,
  },
];

const studies = [
  {
    name: "Studiu cardiovascular pe termen lung",
    code: "VS-104",
    status: "Activ",
    statusClass: "active",
    dotClass: "green",
    participants: 24,
  },
  {
    name: "Monitorizarea respirației în somn",
    code: "VS-097",
    status: "În analiză",
    statusClass: "analyzing",
    dotClass: "orange",
    participants: 18,
  },
  {
    name: "Variabilitatea ritmului cardiac",
    code: "VS-091",
    status: "Finalizat",
    statusClass: "finished",
    dotClass: "gray",
    participants: 16,
  },
];

const recentActivity = [
  { text: "Studiul VS-104 a fost creat", time: "Astăzi, 10:24", icon: FileTextIcon },
  { text: "Au fost încărcate 24 de înregistrări noi în VS-097", time: "Astăzi, 08:15", icon: DatabaseIcon },
  { text: "Analiza pentru studiul VS-097 a fost finalizată", time: "Ieri, 16:40", icon: LaunchAnalysisIcon },
];

const chartData = [
  { label: "Săpt. 1", value: 620 },
  { label: "Săpt. 2", value: 820 },
  { label: "Săpt. 3", value: 950 },
  { label: "Săpt. 4", value: 1080 },
  { label: "Săpt. 5", value: 1260 },
  { label: "Săpt. 6", value: 1360 },
];

const maxChartValue = 1500;

export default function ResearcherPage() {
  const navigate = useNavigate();

  return (
    <ResearcherLayout
      activeItem="dashboard"
      title="Pagina principală"
      subtitle="Privire de ansamblu asupra studiilor, datelor colectate și rezultatelor recente."
      actions={
        <button
          type="button"
          className="researcher-create-btn"
          onClick={() => navigate("/cercetator/studii/creare")}
        >
          <PlusIcon />
          <span>Creează studiu</span>
        </button>
      }
    >
      <section className="researcher-stats">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.label} className="researcher-stat-card">
              <div className="researcher-stat-card__icon">
                <Icon />
              </div>

              <div className="researcher-stat-card__content">
                <div className="researcher-stat-card__label">{item.label}</div>
                <div className="researcher-stat-card__value">{item.value}</div>
                <div className="researcher-stat-card__helper">{item.helper}</div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="researcher-dashboard-grid">
        <article className="researcher-card researcher-card--studies">
          <div className="researcher-card__header">
            <h2 className="researcher-card__title">Studiile mele</h2>

            <button type="button" className="researcher-action-link">
              <span>Vezi toate studiile</span>
              <ChevronRightIcon />
            </button>
          </div>

          <div className="researcher-table-wrap">
            <table className="researcher-table">
              <thead>
                <tr>
                  <th>Studiu</th>
                  <th>Cod</th>
                  <th>Status</th>
                  <th>Participanți</th>
                  <th>Detalii</th>
                </tr>
              </thead>

              <tbody>
                {studies.map((study) => (
                  <tr key={study.code}>
                    <td className="researcher-table__study-cell">
                      <div className="researcher-table__study">
                        <span className={`researcher-table__dot researcher-table__dot--${study.dotClass}`} />
                        <span>{study.name}</span>
                      </div>
                    </td>

                    <td>{study.code}</td>

                    <td>
                      <span className={`researcher-status researcher-status--${study.statusClass}`}>
                        {study.status}
                      </span>
                    </td>

                    <td>{study.participants}</td>

                    <td>
                      <button type="button" className="researcher-table__detail-btn" aria-label={`Detalii ${study.code}`}>
                        <ChevronRightIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="researcher-card researcher-card--activity">
          <div className="researcher-card__header">
            <h2 className="researcher-card__title">Activitate recentă</h2>
          </div>

          <div className="researcher-activity-list">
            {recentActivity.map((item) => {
              const Icon = item.icon;

              return (
                <div key={`${item.text}-${item.time}`} className="researcher-activity__item">
                  <div className="researcher-activity__icon">
                    <Icon />
                  </div>

                  <div className="researcher-activity__main">
                    <div className="researcher-activity__text">{item.text}</div>
                  </div>

                  <div className="researcher-activity__time">{item.time}</div>
                </div>
              );
            })}
          </div>

          <div className="researcher-card__footer-link">
            <button type="button" className="researcher-action-link">
              <span>Vezi toată activitatea</span>
              <ChevronRightIcon />
            </button>
          </div>
        </article>

        <article className="researcher-card researcher-card--chart">
          <div className="researcher-card__header">
            <h2 className="researcher-card__title">Evoluția colectării datelor</h2>

            <button type="button" className="researcher-filter-btn">
              <span>6 săptămâni</span>
              <CaretDownIcon />
            </button>
          </div>

          <div className="researcher-chart">
            <div className="researcher-chart__axis">
              <span className="researcher-chart__axis-label">1.500</span>
              <span className="researcher-chart__axis-label">1.200</span>
              <span className="researcher-chart__axis-label">900</span>
              <span className="researcher-chart__axis-label">600</span>
              <span className="researcher-chart__axis-label">300</span>
              <span className="researcher-chart__axis-label">0</span>
            </div>

            <div className="researcher-chart__plot">
              {chartData.map((item) => (
                <div key={item.label} className="researcher-chart__bar-group">
                  <div
                    className="researcher-chart__bar"
                    style={{ height: `${(item.value / maxChartValue) * 100}%` }}
                  />
                  <div className="researcher-chart__label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </ResearcherLayout>
  );
}