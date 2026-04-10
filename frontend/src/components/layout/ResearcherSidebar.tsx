import { useNavigate } from "react-router-dom";
import type { ComponentType } from "react";
import LogoIcon from "../welcome/LogoIcon";
import { clearAuthSession } from "../../auth/authStorage";

export type NavigationKey = "dashboard" | "studii" | "analize" | "rapoarte";

type ResearcherSidebarProps = {
  activeItem: NavigationKey;
  isSidebarCollapsed: boolean;
  onToggleBrandClick: () => void;
  onCloseMobileSidebar: () => void;
};

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 11.5L12 6L19 11.5V18C19 18.55 18.55 19 18 19H6C5.45 19 5 18.55 5 18V11.5Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 19V13.5H14.8V19"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StudyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="4.5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.9" />
      <path d="M9 8H15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9 12H15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9 16H13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4.5A7.5 7.5 0 1 0 19.5 12" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M12 4.5V12L18.5 8.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.5H13L17 8.5V18.5C17 19.05 16.55 19.5 16 19.5H8C7.45 19.5 7 19.05 7 18.5V4.5Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M13 4.5V8.5H17" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M9.5 12H14.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9.5 15H13.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M5.5 19C5.5 15.69 8.19 13 11.5 13H12.5C15.81 13 18.5 15.69 18.5 19"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 12H10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path
        d="M10 19H7C6.45 19 6 18.55 6 18V6C6 5.45 6.45 5 7 5H10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navigationItems: {
  key: NavigationKey;
  label: string;
  icon: ComponentType;
}[] = [
  { key: "dashboard", label: "Pagina principală", icon: DashboardIcon },
  { key: "studii", label: "Studii", icon: StudyIcon },
  { key: "analize", label: "Analize", icon: AnalysisIcon },
  { key: "rapoarte", label: "Rapoarte", icon: ReportIcon },
];

export default function ResearcherSidebar({
  activeItem,
  isSidebarCollapsed,
  onToggleBrandClick,
  onCloseMobileSidebar,
}: ResearcherSidebarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    clearAuthSession();
    navigate("/autentificare");
  }

  function handleNavigation(itemKey: NavigationKey) {
    onCloseMobileSidebar();
  
    if (itemKey === "dashboard") {
      navigate("/cercetator");
      return;
    }
  
    if (itemKey === "studii") {
      navigate("/cercetator/studii");
      return;
    }
  
    if (itemKey === "analize") {
      return;
    }
  
    if (itemKey === "rapoarte") {
      return;
    }
  }

  return (
    <aside className="researcher-sidebar">
      <div className="researcher-sidebar__header">
        <button
          type="button"
          className="researcher-sidebar__brand"
          aria-label={
            window.innerWidth <= 1023
              ? "Închide meniul lateral"
              : isSidebarCollapsed
              ? "Extinde meniul lateral"
              : "Comprimă meniul lateral"
          }
          onClick={onToggleBrandClick}
        >
          <LogoIcon />
          <div className="researcher-sidebar__brand-copy">
            <span className="researcher-sidebar__brand-title">VitalStudy</span>
          </div>
        </button>
      </div>

      <nav className="researcher-sidebar__nav" aria-label="Navigație principală">
      {navigationItems.map((item) => {
        const Icon = item.icon;
      
        return (
          <button
            key={item.label}
            type="button"
            className={`researcher-sidebar__link ${
              item.key === activeItem ? "is-active" : ""
            }`}
            aria-current={item.key === activeItem ? "page" : undefined}
            title={item.label}
            onClick={() => handleNavigation(item.key)}
          >
              <span className="researcher-sidebar__icon">
                <Icon />
              </span>
              <span className="researcher-sidebar__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <hr className="researcher-sidebar__divider" />

      <span className="researcher-sidebar__section-title">Cont</span>

      <div className="researcher-sidebar__spacer" />

      <div className="researcher-sidebar__footer">
        <button
          type="button"
          className="researcher-sidebar__footer-button"
          title="Profil"
          onClick={onCloseMobileSidebar}
        >
          <span className="researcher-sidebar__icon">
            <ProfileIcon />
          </span>
          <span className="researcher-sidebar__footer-text">Profil</span>
        </button>

        <button
          type="button"
          className="researcher-sidebar__footer-button"
          title="Logout"
          onClick={handleLogout}
        >
          <span className="researcher-sidebar__icon">
            <LogoutIcon />
          </span>
          <span className="researcher-sidebar__footer-text">Deconectare</span>
        </button>
      </div>
    </aside>
  );
}