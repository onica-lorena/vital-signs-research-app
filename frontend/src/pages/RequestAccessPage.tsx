import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import { requestAccessRequest } from "../auth/authApi";
import "../styles/login.css";
import "../styles/reset-password.css";
import "../styles/request-access.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 7.5L12 12.5L18.5 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.1" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 18.2C7.45 15.8 9.45 14.5 12 14.5C14.55 14.5 16.55 15.8 17.5 18.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 20V6.8C6 6.36 6.36 6 6.8 6H17.2C17.64 6 18 6.36 18 6.8V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 9.2H10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.5 9.2H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 12.5H10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.5 12.5H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 20V16.8H13.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.8 4.8H10.2L11.4 7.8L9.8 9.4C10.55 11.02 11.98 12.45 13.6 13.2L15.2 11.6L18.2 12.8V15.2C18.2 15.75 17.75 16.2 17.2 16.2C10.57 16.2 5.8 11.43 5.8 4.8C5.8 4.25 6.25 3.8 6.8 3.8H7.2C7.53 3.8 7.8 4.07 7.8 4.4V4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 3L10 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M21 3L14 21L10 14L3 10L21 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type FormState = {
  fullName: string;
  email: string;
  institution: string;
  department: string;
  specialization: string;
  phone: string;
  requestReason: string;
};

export default function RequestAccessPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    email: "",
    institution: "",
    department: "",
    specialization: "",
    phone: "",
    requestReason: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await requestAccessRequest({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        institution: formData.institution.trim() || null,
        department: formData.department.trim() || null,
        specialization: formData.specialization.trim() || null,
        phone: formData.phone.trim() || null,
        request_reason: formData.requestReason.trim() || null,
      });

      setSuccessMessage(response.message);

      setFormData({
        fullName: "",
        email: "",
        institution: "",
        department: "",
        specialization: "",
        phone: "",
        requestReason: "",
      });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Nu s-a putut trimite solicitarea de acces.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page request-access-page">
      <div className="login-bg-shape login-bg-shape--left" aria-hidden="true" />
      <div className="login-bg-shape login-bg-shape--right" aria-hidden="true" />
      <div className="login-dots login-dots--left" aria-hidden="true" />
      <div className="login-dots login-dots--right" aria-hidden="true" />
      <div className="login-wave" aria-hidden="true" />

      <AppHeader
        rightContent={
          <button
            type="button"
            className="login-back-link"
            onClick={() => navigate("/autentificare")}
          >
            <BackIcon />
            <span>Înapoi la autentificare</span>
          </button>
        }
      />

      <section className="login-center">
        <div className="login-intro">
          <h1>Solicită acces</h1>
          <p>
            Completează formularul de mai jos pentru a trimite o cerere de acces
            în platforma VitalStudy. După aprobare, vei primi instrucțiuni pentru
            activarea contului.
          </p>
        </div>

        <div className="login-card request-access-card">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="fullName">Nume complet</label>
              <div className="login-input login-input--active">
                <span className="login-input-icon">
                  <UserIcon />
                </span>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Ex: Maria Popescu"
                  value={formData.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="email">Adresă de email</label>
              <div className="login-input">
                <span className="login-input-icon">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="exemplu@domeniu.ro"
                  value={formData.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="request-access-grid">
              <div className="login-field">
                <label htmlFor="institution">Instituție</label>
                <div className="login-input">
                  <span className="login-input-icon">
                    <BuildingIcon />
                  </span>
                  <input
                    id="institution"
                    type="text"
                    placeholder="Ex: Universitatea..."
                    value={formData.institution}
                    onChange={(event) => updateField("institution", event.target.value)}
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="department">Departament</label>
                <div className="login-input">
                  <span className="login-input-icon">
                    <BuildingIcon />
                  </span>
                  <input
                    id="department"
                    type="text"
                    placeholder="Ex: Informatică"
                    value={formData.department}
                    onChange={(event) => updateField("department", event.target.value)}
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="specialization">Specializare</label>
                <div className="login-input">
                  <span className="login-input-icon">
                    <BuildingIcon />
                  </span>
                  <input
                    id="specialization"
                    type="text"
                    placeholder="Ex: Calculatoare"
                    value={formData.specialization}
                    onChange={(event) => updateField("specialization", event.target.value)}
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="phone">Telefon</label>
                <div className="login-input">
                  <span className="login-input-icon">
                    <PhoneIcon />
                  </span>
                  <input
                    id="phone"
                    type="text"
                    placeholder="Ex: 07xxxxxxxx"
                    value={formData.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="requestReason">Motivul solicitării</label>
              <textarea
                id="requestReason"
                className="request-access-textarea"
                placeholder="Descrie pe scurt de ce ai nevoie de acces la platformă."
                value={formData.requestReason}
                onChange={(event) => updateField("requestReason", event.target.value)}
                rows={5}
              />
            </div>

            {errorMessage ? (
              <p className="reset-password-feedback reset-password-feedback--error">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="reset-password-feedback reset-password-feedback--success">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="login-primary-btn"
              disabled={isLoading}
            >
              <span className="login-btn-icon">
                <SendIcon />
              </span>
              <span>{isLoading ? "Se trimite..." : "Trimite solicitarea"}</span>
            </button>

            <div className="reset-password-footer-link">
              <button
                type="button"
                className="login-text-link"
                onClick={() => navigate("/autentificare")}
              >
                Ai deja cont? Mergi la autentificare
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}