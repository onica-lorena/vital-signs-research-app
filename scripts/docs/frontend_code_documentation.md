# Documentație cod frontend

Acest fișier este generat automat.

## Lista fișierelor incluse

- eslint.config.js
- index.html
- package.json
- README.md
- src/App.css
- src/App.tsx
- src/components/welcome/LogoIcon.tsx
- src/index.css
- src/main.tsx
- src/pages/WelcomePage.tsx
- src/styles/welcome.css
- tsconfig.app.json
- tsconfig.json
- tsconfig.node.json
- vite.config.ts

---

## eslint.config.js

**Cale completă:** `frontend/eslint.config.js`

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
```

---

## index.html

**Cale completă:** `frontend/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## package.json

**Cale completă:** `frontend/package.json`

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@types/node": "^24.12.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.57.0",
    "vite": "^8.0.1"
  }
}
```

---

## README.md

**Cale completă:** `frontend/README.md`

```markdown
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
```

---

## src/App.css

**Cale completă:** `frontend/src/App.css`

```css
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}
```

---

## src/App.tsx

**Cale completă:** `frontend/src/App.tsx`

```tsx
import WelcomePage from "./pages/WelcomePage";

function App() {
  return <WelcomePage />;
}

export default App;
```

---

## src/components/welcome/LogoIcon.tsx

**Cale completă:** `frontend/src/components/welcome/LogoIcon.tsx`

```tsx
export default function LogoIcon() {
  return (
    <svg
      className="welcome-logo"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="42" y="8" width="36" height="104" rx="18" fill="#8BCB97" />
      <rect x="8" y="42" width="104" height="36" rx="18" fill="#8BCB97" />
      <rect x="8" y="42" width="52" height="36" rx="18" fill="#E3A15B" />
      <rect x="42" y="42" width="36" height="36" fill="#E8AE68" />
    </svg>
  );
}
```

---

## src/index.css

**Cale completă:** `frontend/src/index.css`

```css
* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  width: 100%;
  min-height: 100%;
}

body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: #f8fbfa;
  color: #143847;
}
```

---

## src/main.tsx

**Cale completă:** `frontend/src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## src/pages/WelcomePage.tsx

**Cale completă:** `frontend/src/pages/WelcomePage.tsx`

```tsx
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
```

---

## src/styles/welcome.css

**Cale completă:** `frontend/src/styles/welcome.css`

```css
:root {
  --welcome-bg-left: #bfe2de;
  --welcome-panel-left: #edf5f3;
  --welcome-panel-right: #fffefd;

  --welcome-text-main: #0f5960;
  --welcome-text-soft: #5f7880;

  --welcome-border: #d5e7e4;

  --welcome-green: #6fb857;
  --welcome-green-hover: #63a94d;

  --welcome-teal: #79cbc8;
  --welcome-teal-hover: #6abfbc;

  --welcome-shadow: 0 20px 50px rgba(78, 129, 132, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  overflow-y: hidden;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  background: #f3f4f2;
}

a {
  text-decoration: none;
}

button {
  font: inherit;
}

.welcome-page {
  min-height: 100vh;
  padding: 3rem 3rem 0 3rem;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background:
    linear-gradient(
      180deg,
      #79c9dc 0%,
      #8fd5e4 24%,
      #a8dfeb 52%,
      #c7edf1 78%,
      #e6f6f6 100%
    ) left / 38% 100% no-repeat,
    #f3f4f2;
}

.welcome-shell {
  width: 100%;
  max-width: 1180px;
  min-height: calc(100vh - 50px);
  display: grid;
  grid-template-columns: 37% 63%;
  border-radius: 28px 28px 0 0;
  overflow: visible;
  box-shadow: var(--welcome-shadow);
  background: linear-gradient(
    90deg,
    var(--welcome-panel-left) 0 37%,
    var(--welcome-panel-right) 37% 100%
  );
}

.welcome-left {
  position: relative;
  padding: 1.875rem 1.875rem 1.25rem 1.875rem;
  overflow: visible;
}

.welcome-right {
  position: relative;
  padding: 2.125rem 1.75rem 1.125rem 1.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.welcome-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.welcome-brand-text {
  font-size: 1.5rem;
  line-height: 1;
  font-weight: 700;
  color: #0b5a61;
  letter-spacing: -0.02em;
}

.welcome-logo {
  width: 48px;
  height: 40px;
  flex-shrink: 0;
  display: block;
}

.welcome-copy {
  position: relative;
  z-index: 2;
  margin-top: 3.25rem;
  max-width: 15.625rem;
}

.welcome-copy h1 {
  margin: 0 0 0.875rem;
  color: var(--welcome-text-main);
  font-size: clamp(2rem, 2.5vw, 2.625rem);
  line-height: 1.08;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.welcome-copy p {
  margin: 0;
  color: var(--welcome-text-soft);
  font-size: 0.95rem;
  line-height: 1.5;
  font-weight: 500;
}

.welcome-cards {
  position: relative;
  z-index: 2;
  margin-top: 8rem;
  gap: 4rem;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.welcome-card {
  width: min(16.25rem, 100%);
  min-height: 18.125rem;
  padding: 1rem 1rem 0.875rem;
  background: #ffffff;
  border: 1.5px solid #d4e5e2;
  box-shadow: 0 10px 22px rgba(91, 145, 148, 0.10);
  border-radius: 20px;
  text-align: center;
}

.welcome-card-illustration {
  width: 76%;
  height: 88px;
  display: block;
  margin: 0 auto 10px;
}

.welcome-card h2 {
  margin: 0.125rem 0 0.5rem;
  color: var(--welcome-text-main);
  font-size: 1.125rem;
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.welcome-card p {
  margin: 0 auto 0.875rem;
  max-width: 11.25rem;
  color: var(--welcome-text-soft);
  font-size: 0.85rem;
  line-height: 1.45;
  font-weight: 500;
}

.welcome-btn {
  width: 100%;
  min-height: 2.625rem;
  border: none;
  border-radius: 0.8125rem;
  color: white;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
  box-shadow: 0 10px 20px rgba(89, 156, 137, 0.18);
}

.welcome-btn:hover {
  transform: translateY(-1px);
}

.welcome-btn--green {
  background: var(--welcome-green);
}

.welcome-btn--green:hover {
  background: var(--welcome-green-hover);
}

.welcome-btn--teal {
  background: var(--welcome-teal);
}

.welcome-btn--teal:hover {
  background: var(--welcome-teal-hover);
}

.welcome-footer {
  position: relative;
  z-index: 2;
  margin-top: 18px;
  padding-top: 14px;
  text-align: center;
  border-top: 1.5px solid #dde8e6;
  color: #667e86;
  font-size: 13px;
  font-weight: 500;
}

.welcome-footer a {
  margin-left: 8px;
  color: #5aa14f;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.welcome-cloud {
  position: absolute;
  display: inline-flex;
  align-items: flex-end;
  gap: 0;
  opacity: 0.95;
}

.welcome-cloud span {
  display: block;
  background: white;
}

.cloud-right-top {
  top: 42px;
  right: 58px;
  transform: scale(0.82);
}

.cloud-right-top span {
  background: #dceff3;
}

.welcome-cloud span:nth-child(1) {
  width: 34px;
  height: 22px;
  border-radius: 30px 30px 0 0;
  transform: translateX(14px);
}

.welcome-cloud span:nth-child(2) {
  width: 50px;
  height: 34px;
  border-radius: 40px 40px 0 0;
  z-index: 1;
}

.welcome-cloud span:nth-child(3) {
  width: 40px;
  height: 28px;
  border-radius: 34px 34px 0 0;
  transform: translateX(-12px);
}

.cloud-left-top {
  top: 250px;
  right: 10px;
  transform: scale(0.8);
}

.cloud-left-middle {
  top: 350px;
  left: 14px;
  transform: scale(0.95);
}

.cloud-right-top {
  top: 42px;
  right: 58px;
  transform: scale(0.82);
}

.welcome-medical-icons {
  position: absolute;
  left: 34px;
  bottom: 116px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2;
}

.medical-badge {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 18px rgba(89, 145, 139, 0.14);
}

.medical-badge svg {
  width: 24px;
  height: 24px;
  color: white;
}

.medical-badge--teal {
  background: #0f7174;
}

.medical-badge--orange {
  background: #d98a39;
}

.welcome-heartbeat {
  position: absolute;
  left: -6px;
  bottom: 46px;
  width: 285px;
  height: auto;
  z-index: 1;
  opacity: 0.95;
}

.plant-left {
  position: absolute;
  left: -78px;
  bottom: -45px;
  width: 450px;
  height: auto;
  z-index: 1;
}

.plant-right {
  position: absolute;
  right: -22px;
  bottom: -10px;
  width: 200px;
  height: auto;
  z-index: 0;
}

@media (max-width: 1200px) {
  .welcome-page {
    padding: 24px 24px 0 24px;
  }

  .welcome-shell {
    grid-template-columns: 1fr;
    min-height: auto;
    width: 100%;
  }

  .welcome-left {
    min-height: 420px;
    padding: 30px 28px 24px;
  }

  .welcome-right {
    padding: 30px 28px 24px;
  }

  .welcome-cards {
    margin-top: 36px;
    flex-wrap: wrap;
  }

  .welcome-card {
    width: min(100%, 380px);
  }
}

@media (max-width: 760px) {
  .welcome-page {
    padding: 16px 16px 0 16px;
  }

  .welcome-left,
  .welcome-right {
    padding-left: 20px;
    padding-right: 20px;
  }

  .welcome-copy {
    margin-top: 40px;
  }

  .welcome-copy h1 {
    font-size: 36px;
  }

  .welcome-copy p {
    font-size: 17px;
  }

  .welcome-card {
    width: 100%;
    min-height: auto;
  }

  .welcome-brand-text {
    font-size: 26px;
  }

  .welcome-heartbeat {
    width: 240px;
  }

  .plant-left {
    width: 255px;
    left: -26px;
  }

  .plant-right {
    width: 150px;
    right: -14px;
  }

  .welcome-medical-icons {
    left: 24px;
    bottom: 110px;
  }
}

html,
body,
#root {
  min-height: 100%;
}

body {
  overflow-x: hidden;
}

.welcome-left,
.welcome-right,
.welcome-card,
.welcome-copy,
.welcome-footer {
  min-width: 0;
}
```

---

## tsconfig.app.json

**Cale completă:** `frontend/tsconfig.app.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2023",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

---

## tsconfig.json

**Cale completă:** `frontend/tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

---

## tsconfig.node.json

**Cale completă:** `frontend/tsconfig.node.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

---

## vite.config.ts

**Cale completă:** `frontend/vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

---

