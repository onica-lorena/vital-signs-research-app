import "../styles/welcome.css";
import LogoIcon from "../components/welcome/LogoIcon";

function ResearcherIllustration() {
  return (
    <svg
      className="welcome-card-illustration"
      viewBox="0 0 220 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* umbra */}
      <ellipse cx="110" cy="90" rx="86" ry="18" fill="#E2EDE8" />

      {/* ecran laptop */}
      <rect x="66" y="24" width="88" height="58" rx="3" fill="#2A7A73" />
      <rect x="71" y="29" width="78" height="48" rx="1.5" fill="#EAF4EC" />

      {/* bază laptop */}
      <path
        d="M58 85H162C162 85 160 95 151 95H69C60 95 58 85 58 85Z"
        fill="#2A7A73"
      />
      <path
        d="M100 85H120L117 89H103L100 85Z"
        fill="#DDEAE3"
      />

      {/* eprubetă */}
      <path
        d="M103 44H117"
        stroke="#49B7AE"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M106 44V49L98 64.5C97.2 66.1 98.3 68 100.1 68H119.9C121.7 68 122.8 66.1 122 64.5L114 49V44"
        fill="#F7FBF9"
        stroke="#49B7AE"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M101.5 61.5C104.5 59.5 107 61.8 110 59.9C112.5 58.3 115 59.7 118.2 57.9C119.1 57.4 120 57.6 120.8 58.2L122 64.5C122.3 66 121.2 67 119.9 67H100.1C98.8 67 97.7 66 98 64.5L101.5 61.5Z"
        fill="#62C7BE"
      />
      <circle cx="110" cy="60.5" r="3" fill="#8DDDD4" opacity="0.55" />

      {/* bulină decorativă */}
      <circle cx="132.5" cy="53" r="6.5" fill="#A6DCCF" />
    </svg>
  );
}

function StudyCodeIllustration() {
  return (
    <svg
      className="welcome-card-illustration"
      viewBox="0 0 220 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="90" rx="86" ry="18" fill="#E2EDE8" />

      <rect x="58" y="34" width="110" height="58" rx="10" fill="#8CD3CB" />
      <rect x="67" y="43" width="92" height="40" rx="8" fill="#DDF4F0" />

      <circle cx="86" cy="63" r="12" fill="#6BB64E" />
      <path
        d="M81 63L85 67L92 58"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect x="105" y="55" width="28" height="4" rx="2" fill="#53B8AF" />
      <rect x="105" y="64" width="20" height="4" rx="2" fill="#9EDBD3" />

      <circle cx="139" cy="77" r="10" fill="#53B8AF" />
      <path
        d="M146 84L156 94"
        stroke="#53B8AF"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="139" cy="77" r="4" fill="#DDF4F0" />

      <rect x="83" y="44" width="20" height="4" rx="2" fill="#DDF4F0" opacity="0.85" />
      <rect x="109" y="44" width="36" height="4" rx="2" fill="#B9E6E0" />
    </svg>
  );
}

function Cloud({ className }: { className: string }) {
  return (
    <div className={`welcome-cloud ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function HeartbeatLine() {
  return (
    <svg
      className="welcome-heartbeat"
      viewBox="0 0 420 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 58H120H170L182 58L188 30L199 70L212 42L223 58H420"
        stroke="#8FCFCA"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeftMedicalIcons() {
  return (
    <div className="welcome-medical-icons" aria-hidden="true">
      <div className="medical-badge medical-badge--teal">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M6 12h4l1.2-3.5L13 16l1.5-4H18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="medical-badge medical-badge--orange">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20Z"
            fill="currentColor"
          />
          <path
            d="M7.5 12h2.5l1.1-2.2 1.3 4.4 1.1-2.2h2.9"
            stroke="white"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function LeftPlant() {
  return (
    <svg
      className="plant-left"
      viewBox="0 0 360 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* bază */}
      <path
        d="M-12 166C22 154 55 145 88 148C125 152 156 173 191 182C226 191 260 188 320 205C338 208 350 214 360 222L360 230H-12V166Z"
        fill="#D8ECE9"
      />
      <path
        d="M-12 176C18 170 50 168 81 171C112 175 140 186 171 191C204 196 244 197 320 210C338 214 350 219 360 224L360 230H-12V176Z"
        fill="#9FD9D3"
        opacity="0.72"
      />
      <path
        d="M-12 180C20 176 50 174 76 176C103 178 127 184 154 187C184 190 224 192 320 214C338 218 350 222 360 226L360 230H-12V180Z"
        fill="#7ECAC3"
        opacity="0.42"
      />
      {/* tulpini */}
      <path
        d="M92 196C86 165 86 139 92 112"
        stroke="#79C9C3"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M96 196C105 161 116 129 128 92"
        stroke="#79C9C3"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M98 196C123 176 149 162 181 151"
        stroke="#79C9C3"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M102 196C96 173 95 151 99 128"
        stroke="#8BD4CE"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* frunză mică în spate */}
      <path
        d="M86 150C82 130 87 107 101 84C118 95 128 113 128 136C116 145 102 150 86 150Z"
        fill="#8ED4C9"
        opacity="0.9"
      />
      <path
        d="M101 94C107 108 110 121 109 136"
        stroke="#EDF8F5"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* frunza stânga */}
      <path
        d="M50 171C42 141 48 111 70 81C94 92 108 118 112 154C94 165 74 171 50 171Z"
        fill="#9BCB69"
      />
      <path
        d="M67 94C79 113 88 133 93 154"
        stroke="#EEF8F2"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.78"
      />
      <path
        d="M58 116C69 120 78 126 86 133"
        stroke="#EEF8F2"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.42"
      />
      <path
        d="M68 137C77 140 85 145 91 151"
        stroke="#EEF8F2"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.34"
      />

      {/* frunza verticală din centru */}
      <path
        d="M97 108C90 78 97 45 116 12C136 32 145 61 142 96C126 105 111 109 97 108Z"
        fill="#71CAC3"
      />
      <path
        d="M119 24C125 46 128 69 127 95"
        stroke="#EAF7F4"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.74"
      />
      <path
        d="M112 47C118 52 123 59 127 68"
        stroke="#EAF7F4"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.34"
      />

       {/* frunza mare dreapta */}
      <path
        d="M123 168C145 148 174 136 210 136C198 156 173 170 140 173C134 171 128 170 123 168Z"
        fill="#2F9D98"
      />
      <path
        d="M140 163C158 153 176 147 193 145"
        stroke="#DDF3EE"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.78"
      />
    </svg>
  );
}

function RightPlant() {
  return (
    <svg
      className="plant-right"
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* fundal moale */}
      <ellipse cx="132" cy="200" rx="74" ry="24" fill="#CDEEE7" />
      <ellipse cx="144" cy="210" rx="94" ry="26" fill="#9FD9D3" opacity="0.58" />

      {/* tulpină */}
      <path
        d="M128 198C126 166 127 136 132 98"
        stroke="#63BFB7"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* frunze stânga */}
      <path
        d="M125 174C106 170 87 154 73 131C95 132 113 147 125 174Z"
        fill="#65BFB5"
      />
      <path
        d="M119 166C105 160 93 149 82 136"
        stroke="#DFF5F1"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.72"
      />

      <path
        d="M123 149C105 144 91 129 81 109C100 110 115 124 123 149Z"
        fill="#A1D782"
      />
      <path
        d="M118 143C106 136 96 125 87 113"
        stroke="#EEF8E8"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.72"
      />

      <path
        d="M127 126C112 121 99 108 92 89C109 91 121 103 127 126Z"
        fill="#82CC72"
      />
      <path
        d="M122 121C112 114 104 104 97 94"
        stroke="#EEF8E8"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.72"
      />

      {/* frunze dreapta */}
      <path
        d="M133 178C153 172 173 156 188 133C166 134 147 149 133 178Z"
        fill="#7DCC73"
      />
      <path
        d="M139 170C153 162 166 151 178 138"
        stroke="#EEF8E8"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.72"
      />

      <path
        d="M135 152C153 146 168 131 179 111C160 113 146 126 135 152Z"
        fill="#5EC0B6"
      />
      <path
        d="M140 146C152 138 162 127 171 115"
        stroke="#DFF5F1"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.72"
      />

      <path
        d="M135 126C150 121 162 108 169 91C153 93 141 104 135 126Z"
        fill="#9AD68B"
      />
      <path
        d="M140 121C150 114 157 104 163 95"
        stroke="#EEF8E8"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.72"
      />

      {/* frunza de sus */}
      <path
        d="M131 101C122 86 120 64 124 41C139 51 144 71 131 101Z"
        fill="#B8E0A5"
      />
      <path
        d="M130 92C131 78 131 64 129 49"
        stroke="#EEF8E8"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.72"
      />
    </svg>
  );
}

export default function WelcomePage() {
  return (
    <main className="welcome-page">
      <section className="welcome-shell">
        <div className="welcome-left">
          <div className="welcome-brand">
            <LogoIcon />
            {/*<span className="welcome-brand-text">MedStudy</span>*/}
          </div>

          <div className="welcome-copy">
            <h1>Bine ai venit!</h1>
            <p>
              Platforma pentru studiile de
              <br />
              monitorizare a semnelor vitale.
            </p>
          </div>

          <Cloud className="cloud-left-top" />
          <Cloud className="cloud-left-middle" />
          
          <LeftPlant />
        </div>

        <div className="welcome-right">
          <Cloud className="cloud-right-top" />

          <div className="welcome-cards">
            <article className="welcome-card">
              <ResearcherIllustration />
              <h2>Sunt cercetător</h2>
              <p>
                Autentifică-te pentru
                <br />
                gestionarea studiilor.
              </p>
              <button className="welcome-btn welcome-btn--green">
                Intră în cont
              </button>
            </article>

            <article className="welcome-card">
              <StudyCodeIllustration />
              <h2>Particip la un studiu</h2>
              <p>Introdu codul pentru a continua.</p>
              <button className="welcome-btn welcome-btn--teal">
                Cod de studiu
              </button>
            </article>
          </div>
          {/*<RightPlant />*/}
        </div>
      </section>
    </main>
  );
}