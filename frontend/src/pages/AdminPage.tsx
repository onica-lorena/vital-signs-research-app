import AppHeader from "../components/layout/AppHeader";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getCurrentUser } from "../auth/authStorage";

export default function AdminPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    clearAuthSession();
    navigate("/autentificare");
  }

  return (
    <main style={{ padding: "24px 36px" }}>
      <AppHeader
        rightContent={
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "none",
              background: "#76b65c",
              color: "white",
              padding: "10px 16px",
              borderRadius: "999px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Deconectare
          </button>
        }
      />

      <section style={{ maxWidth: 900, margin: "48px auto 0" }}>
        <h1>Pagina administratorului</h1>
        <p>Autentificarea a funcționat corect.</p>
        <p><strong>Nume:</strong> {user?.full_name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Rol:</strong> {user?.role}</p>
      </section>
    </main>
  );
}