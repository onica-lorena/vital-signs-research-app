import { useState, type ReactNode } from "react";
import "../../styles/participant-layout.css";
import ParticipantSidebar, {
  type ParticipantNavigationKey,
} from "./ParticipantSidebar";

type ParticipantLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  activeItem: ParticipantNavigationKey;
  participantName?: string;
  studyCode?: string;
  contentWidth?: "default" | "wide";
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function getInitials(fullName?: string): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "PT";
}

export default function ParticipantLayout({
  title,
  subtitle,
  children,
  activeItem,
  participantName,
  studyCode,
  contentWidth = "default",
}: ParticipantLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const rootClassName = [
    "participant-app",
    isMobileSidebarOpen ? "mobile-sidebar-open" : "",
    isSidebarCollapsed ? "sidebar-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");
    
  const contentClassName = [
    "participant-main__content",
    contentWidth === "wide"
      ? "participant-main__content--wide"
      : "participant-main__content--default",
  ].join(" ");

  function handleToggleBrandClick() {
    if (window.innerWidth <= 1023) {
      setIsMobileSidebarOpen(false);
      return;
    }
  
    setIsSidebarCollapsed((prev) => !prev);
  }

  return (
    <div className={rootClassName}>
      {isMobileSidebarOpen ? (
        <button
          type="button"
          className="participant-overlay"
          aria-label="Închide meniul"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}
  
      <ParticipantSidebar
        activeItem={activeItem}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleBrandClick={handleToggleBrandClick}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />
  
      <main className="participant-main">
        <div className="participant-main__shape participant-main__shape--right" />
        <div className="participant-main__shape participant-main__shape--bottom" />
        <div className="participant-main__dots" />
        <div className="participant-main__wave" />
  
        <div className={contentClassName}>
          <div className="participant-topbar">
            <div className="participant-topbar__left">
              <button
                type="button"
                className="participant-mobile-toggle"
                aria-label="Deschide meniul"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <MenuIcon />
              </button>
  
              <div>
                <h1 className="participant-topbar__title">{title}</h1>
                {subtitle ? (
                  <p className="participant-topbar__subtitle">{subtitle}</p>
                ) : null}
              </div>
            </div>
  
            <div className="participant-topbar__right">
              {studyCode ? (
                <div className="participant-topbar__study">
                  <span>Studiu</span>
                  <strong>{studyCode}</strong>
                </div>
              ) : null}
  
              <div className="participant-topbar__profile">
                <span className="participant-topbar__avatar">
                  {getInitials(participantName)}
                </span>
                <span className="participant-topbar__name">
                  {participantName ?? "Participant"}
                </span>
              </div>
            </div>
          </div>
  
          {children}
        </div>
      </main>
    </div>
  );
}