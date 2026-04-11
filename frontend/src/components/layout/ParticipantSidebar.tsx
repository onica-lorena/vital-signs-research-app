import { type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import LogoIcon from "../welcome/LogoIcon";
import "../../styles/participant-sidebar.css";
import {
  clearParticipantSession,
  getParticipantContext,
} from "../../participant/participantStorage";
import { getParticipantNextPath } from "../../participant/participantRouting";

export type ParticipantNavigationKey = "furnizare" | "istoric";

type ParticipantSidebarProps = {
  activeItem: ParticipantNavigationKey;
  isSidebarCollapsed: boolean;
  onToggleBrandClick: () => void;
  onCloseMobileSidebar: () => void;
};

function DataIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.3 18.2H15.9C18.18 18.2 20 16.45 20 14.22C20 12.28 18.61 10.67 16.74 10.28C16.2 8.01 14.25 6.4 11.9 6.4C9.12 6.4 6.87 8.65 6.87 11.43V11.68C5.2 12.04 4 13.42 4 15.09C4 16.84 5.36 18.2 7.3 18.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.65V10.65"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.95 12.75L12 10.65L14.05 12.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.8V12L14.95 13.95"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.9 9.4C9.9 8.15 10.88 7.25 12.15 7.25C13.4 7.25 14.3 8.04 14.3 9.15C14.3 10.05 13.78 10.55 13.05 11.02C12.35 11.47 12 11.82 12 12.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16.25" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12H18.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M13.2 6.8L18.4 12L13.2 17.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.1 7L19 12L14.1 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 12H9.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M10 19H6.9C6.4 19 6 18.6 6 18.1V5.9C6 5.4 6.4 5 6.9 5H10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navigationItems: Array<{
  key: ParticipantNavigationKey;
  label: string;
  icon: ComponentType;
}> = [
  { key: "furnizare", label: "Furnizează date", icon: DataIcon },
  { key: "istoric", label: "Istoric", icon: HistoryIcon },
];

export default function ParticipantSidebar({
  activeItem,
  isSidebarCollapsed,
  onToggleBrandClick,
  onCloseMobileSidebar,
}: ParticipantSidebarProps) {
  const navigate = useNavigate();

  const isMobileViewport =
    typeof window !== "undefined" && window.innerWidth <= 1023;

  function handleNavigation(itemKey: ParticipantNavigationKey) {
    onCloseMobileSidebar();

    if (itemKey === "furnizare") {
      const context = getParticipantContext();

      navigate(
        context ? getParticipantNextPath(context) : "/participant/cod-studiu"
      );
      return;
    }

    if (itemKey === "istoric") {
      navigate("/participant/istoric");
    }
  }

  function handleLogout() {
    clearParticipantSession();
    onCloseMobileSidebar();
    navigate("/participant/cod-studiu", { replace: true });
  }

  return (
    <aside className="participant-sidebar">
      <div className="participant-sidebar__bg participant-sidebar__bg--top" />
      <div className="participant-sidebar__bg participant-sidebar__bg--middle" />
      <div className="participant-sidebar__bg participant-sidebar__bg--bottom" />
      <div className="participant-sidebar__dots" />

      <div className="participant-sidebar__content">
        <div className="participant-sidebar__header">
          <button
            type="button"
            className="participant-sidebar__brand"
            aria-label={
              isMobileViewport
                ? "Închide meniul lateral"
                : isSidebarCollapsed
                ? "Extinde meniul lateral"
                : "Comprimă meniul lateral"
            }
            onClick={onToggleBrandClick}
          >
            <span className="participant-sidebar__brand-icon">
              <LogoIcon />
            </span>

            <span className="participant-sidebar__brand-copy">
              <span className="participant-sidebar__brand-title">VitalStudy</span>
            </span>
          </button>
        </div>

        <nav
          className="participant-sidebar__nav"
          aria-label="Navigație participant"
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeItem;

            return (
              <button
                key={item.key}
                type="button"
                className={`participant-sidebar__link ${
                  isActive ? "is-active" : ""
                }`}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
                onClick={() => handleNavigation(item.key)}
              >
                <span className="participant-sidebar__icon">
                  <Icon />
                </span>
                <span className="participant-sidebar__label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="participant-sidebar__spacer" />

        <div className="participant-sidebar__footer">
          <button
            type="button"
            className="participant-sidebar__logout"
            title="Deconectare"
            onClick={handleLogout}
          >
            <span className="participant-sidebar__icon participant-sidebar__icon--logout">
              <LogoutIcon />
            </span>
            <span className="participant-sidebar__logout-text">
              Deconectare
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}