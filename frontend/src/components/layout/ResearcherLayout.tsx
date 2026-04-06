import { useState, type ReactNode } from "react";
import "../../styles/researcher-layout.css";
import ResearcherSidebar, { type NavigationKey } from "./ResearcherSidebar";

type ResearcherLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentWidth?: "compact" | "default" | "wide";
  activeItem: NavigationKey;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ResearcherLayout({
  title,
  subtitle,
  actions,
  children,
  contentWidth = "default",
  activeItem,
}: ResearcherLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const rootClassName = [
    "researcher-dashboard",
    isSidebarCollapsed ? "sidebar-collapsed" : "",
    isMobileSidebarOpen ? "mobile-sidebar-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const contentClassName = [
    "researcher-main__content",
    contentWidth === "compact"
      ? "researcher-main__content--compact"
      : contentWidth === "wide"
      ? "researcher-main__content--wide"
      : "researcher-main__content--default",
  ].join(" ");

  return (
    <div className={rootClassName}>
      {isMobileSidebarOpen ? (
        <button
          type="button"
          className="researcher-overlay"
          aria-label="Închide meniul"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}

      <ResearcherSidebar
        activeItem={activeItem}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleBrandClick={() => setIsSidebarCollapsed((prev) => !prev)}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <main className="researcher-main">
        <div className="researcher-main__shape researcher-main__shape--right" />
        <div className="researcher-main__shape researcher-main__shape--bottom" />
        <div className="researcher-main__dots" />
        <div className="researcher-main__wave" />

        <div className={contentClassName}>
          <div className="researcher-topbar">
            <div className="researcher-topbar__left">
              <button
                type="button"
                className="researcher-mobile-toggle"
                aria-label="Deschide meniul"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <MenuIcon />
              </button>

              <div>
                <h1 className="researcher-topbar__title">{title}</h1>
                {subtitle ? (
                  <p className="researcher-topbar__subtitle">{subtitle}</p>
                ) : null}
              </div>
            </div>

            {actions ? (
              <div className="researcher-topbar__right">{actions}</div>
            ) : null}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}