import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResearcherSidebar from "../components/layout/ResearcherSidebar";
import "../styles/researcher-dashboard.css";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 7.5H19.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M4.5 12H19.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M4.5 16.5H19.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export default function StudiesPage() {
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  function handleSidebarBrandClick() {
    if (window.innerWidth <= 1023) {
      setIsMobileSidebarOpen(false);
      return;
    }
    setIsSidebarCollapsed((prev) => !prev);
  }

  return (
    <main
      className={`researcher-dashboard ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      } ${isMobileSidebarOpen ? "mobile-sidebar-open" : ""}`}
    >
      {isMobileSidebarOpen && (
        <button
          type="button"
          className="researcher-overlay"
          onClick={closeMobileSidebar}
        />
      )}

      <ResearcherSidebar
        activeItem="studii"
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleBrandClick={handleSidebarBrandClick}
        onCloseMobileSidebar={closeMobileSidebar}
      />

      <section className="researcher-main">
        <div className="researcher-main__content">

          <header className="researcher-topbar">
            <div className="researcher-topbar__left">
              <button
                type="button"
                className="researcher-mobile-toggle"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <MenuIcon />
              </button>

              <h1 className="researcher-topbar__title">Studii</h1>
            </div>

            <button
              type="button"
              className="researcher-create-btn"
              onClick={() => navigate("/cercetator/studii/creare")}
            >
              <PlusIcon />
              <span>Creează studiu</span>
            </button>
          </header>
          
          <div style={{ marginTop: "24px" }}>
            <div className="researcher-card">
              <h2>Lista studiilor</h2>
              <p>Aici vor apărea toate studiile tale.</p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}