import { useState, type ReactNode } from "react";
import "../../styles/admin-layout.css";
import AdminSidebar, { type AdminNavigationKey } from "./AdminSidebar";

type AdminLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentWidth?: "compact" | "default" | "wide";
  activeItem: AdminNavigationKey;
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

export default function AdminLayout({
  title,
  subtitle,
  actions,
  children,
  contentWidth = "wide",
  activeItem,
}: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const rootClassName = [
    "admin-dashboard-layout",
    isSidebarCollapsed ? "sidebar-collapsed" : "",
    isMobileSidebarOpen ? "mobile-sidebar-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const contentClassName = [
    "admin-main__content",
    contentWidth === "compact"
      ? "admin-main__content--compact"
      : contentWidth === "wide"
      ? "admin-main__content--wide"
      : "admin-main__content--default",
  ].join(" ");

  return (
    <div className={rootClassName}>
      {isMobileSidebarOpen ? (
        <button
          type="button"
          className="admin-overlay"
          aria-label="Închide meniul"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}

      <AdminSidebar
        activeItem={activeItem}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleBrandClick={() => setIsSidebarCollapsed((prev) => !prev)}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <main className="admin-main">
        <div className="admin-main__shape admin-main__shape--right" />
        <div className="admin-main__shape admin-main__shape--bottom" />
        <div className="admin-main__dots" />
        <div className="admin-main__wave" />

        <div className={contentClassName}>
          <div className="admin-topbar">
            <div className="admin-topbar__left">
              <button
                type="button"
                className="admin-mobile-toggle"
                aria-label="Deschide meniul"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <MenuIcon />
              </button>

              <div>
                <h1 className="admin-topbar__title">{title}</h1>
                {subtitle ? <p className="admin-topbar__subtitle">{subtitle}</p> : null}
              </div>
            </div>

            {actions ? <div className="admin-topbar__right">{actions}</div> : null}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}