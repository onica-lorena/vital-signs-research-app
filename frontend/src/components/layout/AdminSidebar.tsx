import { useNavigate } from "react-router-dom";
import type { ComponentType } from "react";
import LogoIcon from "../welcome/LogoIcon";
import { clearAuthSession } from "../../auth/authStorage";

export type AdminNavigationKey =
  | "dashboard"
  | "access_requests"
  | "users"
  | "studies";

type AdminSidebarProps = {
  activeItem: AdminNavigationKey;
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

function AccessRequestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 6.5H17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M7 11.5H17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M7 16.5H13"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <rect
        x="4.5"
        y="4.5"
        width="15"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="16.5" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M4.5 18C4.5 15.51 6.51 13.5 9 13.5C11.49 13.5 13.5 15.51 13.5 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M14 18C14 16.07 15.57 14.5 17.5 14.5C19.43 14.5 21 16.07 21 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StudyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="6"
        y="4.5"
        width="12"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path d="M9 8H15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9 12H15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9 16H13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
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
  key: AdminNavigationKey;
  label: string;
  icon: ComponentType;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: DashboardIcon },
  { key: "access_requests", label: "Cereri acces", icon: AccessRequestIcon },
  { key: "users", label: "Utilizatori", icon: UsersIcon },
  { key: "studies", label: "Studii", icon: StudyIcon },
];

export default function AdminSidebar({
  activeItem,
  isSidebarCollapsed,
  onToggleBrandClick,
  onCloseMobileSidebar,
}: AdminSidebarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    clearAuthSession();
    navigate("/autentificare");
  }

  function handleNavigation(itemKey: AdminNavigationKey) {
    onCloseMobileSidebar();

    if (itemKey === "dashboard") {
      navigate("/admin");
      return;
    }

    navigate(`/admin?tab=${itemKey}`);
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__header">
        <button
          type="button"
          className="admin-sidebar__brand"
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
          <div className="admin-sidebar__brand-copy">
            <span className="admin-sidebar__brand-title">VitalStudy</span>
          </div>
        </button>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Navigație principală admin">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              className={`admin-sidebar__link ${item.key === activeItem ? "is-active" : ""}`}
              aria-current={item.key === activeItem ? "page" : undefined}
              title={item.label}
              onClick={() => handleNavigation(item.key)}
            >
              <span className="admin-sidebar__icon">
                <Icon />
              </span>
              <span className="admin-sidebar__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <hr className="admin-sidebar__divider" />

      <span className="admin-sidebar__section-title">Cont</span>

      <div className="admin-sidebar__spacer" />

      <div className="admin-sidebar__footer">
        <button
          type="button"
          className="admin-sidebar__footer-button"
          title="Logout"
          onClick={handleLogout}
        >
          <span className="admin-sidebar__icon">
            <LogoutIcon />
          </span>
          <span className="admin-sidebar__footer-text">Deconectare</span>
        </button>
      </div>
    </aside>
  );
}