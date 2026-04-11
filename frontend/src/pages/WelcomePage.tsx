import "../styles/welcome.css";
import AppHeader from "../components/layout/AppHeader";
import { useNavigate } from "react-router-dom";

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="12" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9 10V7.8C9 6.14 10.34 4.8 12 4.8C13.66 4.8 15 6.14 15 7.8V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserShieldIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="27" cy="19" r="7" stroke="currentColor" strokeWidth="2.8" />
      <path
        d="M14 39.5C14 32.6 19.6 27 26.5 27H27.5C34.4 27 40 32.6 40 39.5"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M44 28.5L51.5 31.4V36.8C51.5 42.2 48.1 47 43 48.8C37.9 47 34.5 42.2 34.5 36.8V31.4L42 28.5C42.64 28.25 43.36 28.25 44 28.5Z"
        fill="#65b55c"
      />
      <path
        d="M40.2 36.8L42.2 38.8L46.1 34.6"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ParticipantIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="25" cy="19" r="7" stroke="currentColor" strokeWidth="2.8" />
      <path
        d="M12 39.5C12 32.6 17.6 27 24.5 27H25.5C32.4 27 38 32.6 38 39.5"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="43.5" cy="20.5" r="5.5" stroke="currentColor" strokeWidth="2.8" />
      <path
        d="M43.5 49C49.55 45.65 53.5 41.4 53.5 35.95C53.5 32.88 51.06 30.5 48.2 30.5C46.28 30.5 44.88 31.34 43.5 33.02C42.12 31.34 40.72 30.5 38.8 30.5C35.94 30.5 33.5 32.88 33.5 35.95C33.5 41.4 37.45 45.65 43.5 49Z"
        fill="#ef9647"
      />
      <path
        d="M41.2 37.1H42.7V35.6C42.7 35.1 43.1 34.7 43.6 34.7C44.1 34.7 44.5 35.1 44.5 35.6V37.1H46C46.5 37.1 46.9 37.5 46.9 38C46.9 38.5 46.5 38.9 46 38.9H44.5V40.4C44.5 40.9 44.1 41.3 43.6 41.3C43.1 41.3 42.7 40.9 42.7 40.4V38.9H41.2C40.7 38.9 40.3 38.5 40.3 38C40.3 37.5 40.7 37.1 41.2 37.1Z"
        fill="white"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShieldFeatureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L18.5 5.5V10.2C18.5 15 15.55 19.27 12 20.5C8.45 19.27 5.5 15 5.5 10.2V5.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 11.8L11.2 13.5L14.8 9.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartFeatureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 18.5H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.5 16L10 12.5L12.8 14.8L17.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 9.5H17.5V11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InsightFeatureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  return (
    <main className="welcome-page">
      <div className="welcome-bg-shape welcome-bg-shape--left" aria-hidden="true"></div>

      <div className="welcome-bg-shape welcome-bg-shape--right" aria-hidden="true"></div>

      <div className="welcome-wave" aria-hidden="true" />

      <AppHeader />


      <section className="welcome-hero">
         {/*<div className="welcome-badge">CERCETARE • DATE • ANALIZĂ</div>*/}

        <h1 className="welcome-title">
          Sprijin pentru cercetarea medicală
          <br />
          prin <span>semne vitale</span>
        </h1>

        <p className="welcome-description">
          VitalStudy este o platformă destinată colectării, analizei și interpretării
          datelor privind semnele vitale în cadrul studiilor clinice.
        </p>

        <p className="welcome-section-label">Alege modul în care vrei să continui:</p>

        <div className="welcome-cards">
          <article className="welcome-card welcome-card--researcher">
            <div className="welcome-card__icon-wrap">
              <div className="welcome-card__icon">
                <UserShieldIcon />
              </div>
            </div>

            <h2>Cercetător</h2>

            <p>
              Gestionează studii, analizează datele colectate și generează rapoarte.
            </p>

            <button
              className="welcome-card__button welcome-card__button--primary"
              type="button"
              onClick={() => navigate("/autentificare")}
            >
              <span className="welcome-card__button-icon">
                <LoginIcon />
              </span>
              Autentificare
            </button>
          </article>

          <article className="welcome-card welcome-card--participant">
            <div className="welcome-card__icon-wrap welcome-card__icon-wrap--warm">
              <div className="welcome-card__icon">
                <ParticipantIcon />
              </div>
            </div>

            <h2>Participant la studiu</h2>

            <p>
            Introdu codul studiului pentru a trimite datele solicitate și a urmări progresul.
          </p>

          <button
            className="welcome-card__button welcome-card__button--secondary"
            type="button"
            onClick={() => navigate("/participant/cod-studiu")}
          >
            <span className="welcome-card__button-icon">
              <SearchIcon />
            </span>
            Introdu codul
          </button>
          </article>
        </div>
      </section>

      <section className="welcome-features">
        <article className="welcome-feature">
          <div className="welcome-feature__icon">
            <ShieldFeatureIcon />
          </div>
          <div>
            <h3>Date confidențiale</h3>
            <p>Datele introduse sunt gestionate în mod confidențial.</p>
          </div>
        </article>

        <article className="welcome-feature">
          <div className="welcome-feature__icon">
            <ChartFeatureIcon />
          </div>
          <div>
            <h3>Studii organizate</h3>
            <p>Gestionarea datelor și a etapelor studiului într-un singur loc.</p>
          </div>
        </article>

        <article className="welcome-feature">
          <div className="welcome-feature__icon">
            <InsightFeatureIcon />
          </div>
          <div>
            <h3>Rezultate relevante</h3>
            <p>Datele colectate sunt sintetizate în rezultate ușor de interpretat.</p>
          </div>
        </article>
      </section>
    </main>
  );
}