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
      <ellipse cx="110" cy="95" rx="82" ry="18" fill="#E5F1EC" />
      <rect x="72" y="34" width="76" height="48" rx="4" fill="#2A7A73" />
      <rect x="77" y="39" width="66" height="38" rx="2" fill="#DFF1E5" />
      <rect x="85" y="84" width="50" height="5" rx="2.5" fill="#2A7A73" />
      <rect x="68" y="89" width="84" height="10" rx="5" fill="#2A7A73" />
      <path
        d="M104 68L112 50H120L128 68H123L121 63H111L109 68H104Z"
        fill="#60C0B8"
      />
      <path d="M113 60H119L116 52L113 60Z" fill="#2A7A73" />
      <circle cx="137" cy="52" r="6" fill="#A7DCCF" />
      <line x1="110" y1="46" x2="122" y2="46" stroke="#2A7A73" strokeWidth="2" />
      <line x1="116" y1="46" x2="116" y2="39" stroke="#2A7A73" strokeWidth="2" />
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
      <ellipse cx="110" cy="95" rx="82" ry="18" fill="#E5F1EC" />
      <rect x="58" y="28" width="110" height="58" rx="10" fill="#8CD3CB" />
      <rect x="67" y="37" width="92" height="40" rx="8" fill="#DDF4F0" />
      <circle cx="86" cy="57" r="12" fill="#6BB64E" />
      <path
        d="M81 57L85 61L92 52"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="105" y="49" width="28" height="4" rx="2" fill="#53B8AF" />
      <rect x="105" y="58" width="20" height="4" rx="2" fill="#9EDBD3" />
      <circle cx="139" cy="71" r="10" fill="#53B8AF" />
      <path
        d="M146 78L156 88"
        stroke="#53B8AF"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="139" cy="71" r="4" fill="#DDF4F0" />
      <rect x="83" y="38" width="20" height="4" rx="2" fill="#DDF4F0" opacity="0.85" />
      <rect x="109" y="38" width="36" height="4" rx="2" fill="#B9E6E0" />
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
      viewBox="0 0 280 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="165" cy="190" rx="115" ry="34" fill="#BEE8E1" />
      <ellipse cx="115" cy="202" rx="120" ry="42" fill="#8BD0C7" opacity="0.65" />
      <path d="M72 200C72 156 84 114 96 72" stroke="#67BFB7" strokeWidth="4" strokeLinecap="round" />
      <path d="M95 92C77 92 58 84 46 67C67 62 89 69 95 92Z" fill="#6BC1B6" />
      <path d="M90 118C70 119 48 112 35 94C58 88 81 95 90 118Z" fill="#A3D79C" />
      <path d="M86 145C62 149 34 143 15 123C41 115 69 123 86 145Z" fill="#63B66A" />
      <path d="M78 170C50 177 22 172 2 152C30 143 59 149 78 170Z" fill="#4FA79D" />
      <path d="M109 131C124 115 146 105 170 104C161 128 137 138 109 131Z" fill="#89C866" />
      <path d="M102 170C121 149 151 136 184 139C171 170 138 181 102 170Z" fill="#7CC66A" />
      <path d="M121 196C146 169 182 157 222 162C206 195 168 208 121 196Z" fill="#4B9F97" />
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
      <ellipse cx="110" cy="194" rx="92" ry="30" fill="#CFEFE8" />
      <path d="M120 188C119 156 121 128 126 96" stroke="#66BFB8" strokeWidth="4" strokeLinecap="round" />
      <path d="M126 110C108 104 94 90 88 71C108 73 124 87 126 110Z" fill="#8BD18D" />
      <path d="M126 135C145 128 162 113 171 92C150 94 132 110 126 135Z" fill="#5BBDB3" />
      <path d="M122 153C101 148 82 131 72 108C95 111 115 129 122 153Z" fill="#A9D98C" />
      <path d="M129 170C149 165 171 148 186 124C163 124 140 142 129 170Z" fill="#7AC56E" />
      <path d="M117 184C96 180 72 163 55 137C80 139 104 157 117 184Z" fill="#64B9B0" />
      <path d="M124 78C117 64 116 48 122 34C136 43 139 60 124 78Z" fill="#B7DFA3" />
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
            <span className="welcome-brand-text">MedStudy</span>
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

          <LeftMedicalIcons />
          <HeartbeatLine />
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

          <div className="welcome-footer">
            <span>Nu ai cont?</span>
            <a href="/">Creează un cont de cercetător</a>
          </div>

          <RightPlant />
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
  --welcome-bg-left: #8fd2db;
  --welcome-panel-left: #eef6f7;
  --welcome-panel-right: #ffffff;
  --welcome-text-main: #175c63;
  --welcome-text-soft: #5c7680;
  --welcome-border: #d8ebec;
  --welcome-green: #6cb452;
  --welcome-green-hover: #5ea247;
  --welcome-teal: #79cfc8;
  --welcome-teal-hover: #67c1ba;
  --welcome-shadow: 0 20px 50px rgba(76, 130, 136, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  background: linear-gradient(90deg, var(--welcome-bg-left) 0 36.8%, #f2f4f5 36.8% 100%);
}

a {
  text-decoration: none;
}

button {
  font: inherit;
}

.welcome-page {
  min-height: 100vh;
  padding: 50px 50px 0 50px;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.welcome-shell {
  width: min(1180px, 100%);
  min-height: calc(100vh - 50px);
  display: grid;
  grid-template-columns: 37% 63%;
  border-radius: 28px 28px 0 0;
  overflow: hidden;
  box-shadow: var(--welcome-shadow);
}

.welcome-left {
  position: relative;
  background: var(--welcome-panel-left);
  padding: 30px 30px 20px 30px;
  overflow: hidden;
}

.welcome-right {
  position: relative;
  background: var(--welcome-panel-right);
  padding: 34px 28px 18px 28px;
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
  font-size: 24px;
  line-height: 1;
  font-weight: 700;
  color: #10585f;
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
  margin-top: 52px;
  max-width: 250px;
}

.welcome-copy h1 {
  margin: 0 0 14px;
  color: var(--welcome-text-main);
  font-size: 34px;
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.welcome-copy p {
  margin: 0;
  color: var(--welcome-text-soft);
  font-size: 15px;
  line-height: 1.5;
  font-weight: 500;
}

.welcome-cards {
  position: relative;
  z-index: 2;
  margin-top: 42px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 16px;
}

.welcome-card {
  width: min(260px, 100%);
  min-height: 290px;
  background: #ffffff;
  border: 1.5px solid var(--welcome-border);
  border-radius: 20px;
  padding: 16px 16px 14px;
  box-shadow: 0 8px 18px rgba(111, 158, 162, 0.08);
  text-align: center;
}

.welcome-card-illustration {
  width: 78%;
  height: 82px;
  display: block;
  margin: 0 auto 6px;
}

.welcome-card h2 {
  margin: 2px 0 8px;
  color: var(--welcome-text-main);
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.welcome-card p {
  margin: 0 auto 14px;
  max-width: 180px;
  color: var(--welcome-text-soft);
  font-size: 13px;
  line-height: 1.45;
  font-weight: 500;
}

.welcome-btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 13px;
  color: white;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
  box-shadow: 0 8px 18px rgba(102, 160, 150, 0.16);
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
  border-top: 1.5px solid #e7eeee;
  padding-top: 14px;
  text-align: center;
  color: #728891;
  font-size: 13px;
  font-weight: 500;
}

.welcome-footer a {
  margin-left: 8px;
  color: #5a9959;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Clouds */

.welcome-cloud {
  position: absolute;
  display: inline-flex;
  align-items: flex-end;
  gap: 0;
  opacity: 0.95;
}

.welcome-cloud span {
  display: block;
  background: #f8fbfb;
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
  top: 300px;
  right: 10px;
  transform: scale(0.8);
}

.cloud-left-middle {
  top: 405px;
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
  left: 26px;
  bottom: 98px;
  display: flex;
  align-items: center;
  gap: 10px;
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
  background: #166b6e;
}

.medical-badge--orange {
  background: #d7883a;
}

/* Heartbeat line */

.welcome-heartbeat {
  position: absolute;
  left: 0;
  bottom: 42px;
  width: 250px;
  height: auto;
  z-index: 1;
  opacity: 0.9;
}

.plant-left {
  position: absolute;
  left: -16px;
  bottom: -6px;
  width: 250px;
  height: auto;
  z-index: 0;
}

.plant-right {
  position: absolute;
  right: -6px;
  bottom: -4px;
  width: 120px;
  height: auto;
  z-index: 0;
}

/* Responsive */

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
    width: 240px;
  }

  .plant-right {
    width: 120px;
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

