import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../auth/authStorage";
import ResearcherLayout from "../components/layout/ResearcherLayout";
import "../styles/researcher-dashboard.css";
import "../styles/create-study.css";
import { createStudyRequest } from "../studies/studiesApi";
import { SESSION_EXPIRED_ERROR } from "../auth/authFetch";

type ParameterId = "heartRate" | "respiratoryRate" | "spo2" | "temperature";

type StudyFormData = {
  title: string;
  startDate: string;
  endDate: string;
  studyType: string;
  dataEntryMode: string;
  status: string;
  description: string;
  institution: string;
  targetParticipants: string;
  collectionRules: string;
  inclusionCriteria: string;
  administrativeNotes: string;
};

type ParameterSetting = {
  selected: boolean;
  frequency: string;
};

const steps = [
  "Informații generale",
  "Parametri",
  "Revizuire",
] as const;

const studyTypeOptions = [
  { value: "observational_prospective", label: "Observațional prospectiv" },
  { value: "observational_retrospective", label: "Observațional retrospectiv" },
  { value: "observational_mixed", label: "Observațional mixt" },
] as const;

const dataEntryModeOptions = [
  { value: "manual", label: "Introducere manuală" },
  { value: "csv", label: "Import fișier CSV" },
  { value: "manual_csv", label: "Manual + CSV" },
] as const;

const studyStatusOptions = [
  { value: "draft", label: "Ciornă" },
  { value: "active", label: "Activ" },
] as const;

const frequencyOptions = [
  "Continuu",
  "La 1 minut",
  "La 5 minute",
  "La 15 minute",
  "La 30 minute",
  "La 1 oră",
] as const;

const parameterDefinitions: Array<{
  id: ParameterId;
  name: string;
  description: string;
  unit: string;
}> = [
  {
    id: "heartRate",
    name: "Ritm cardiac",
    description: "Monitorizează frecvența cardiacă.",
    unit: "bătăi/min",
  },
  {
    id: "respiratoryRate",
    name: "Frecvența respiratorie",
    description: "Monitorizează ritmul respirației.",
    unit: "respirații/min",
  },
  {
    id: "spo2",
    name: "Saturația de oxigen",
    description: "Monitorizează saturația periferică de oxigen.",
    unit: "%",
  },
  {
    id: "temperature",
    name: "Temperatura corporală",
    description: "Monitorizează temperatura corporală.",
    unit: "°C",
  },
];

function getInitialParameterSettings(): Record<ParameterId, ParameterSetting> {
  return {
    heartRate: {
      selected: false,
      frequency: "La 1 minut",
    },
    respiratoryRate: {
      selected: false,
      frequency: "La 5 minute",
    },
    spo2: {
      selected: false,
      frequency: "La 1 minut",
    },
    temperature: {
      selected: false,
      frequency: "La 15 minute",
    },
  };
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 12.5L10 16.5L18 8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M12 10.4V15.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.8C8.95 4.8 6.7 7 6.7 9.92c0 1.9.86 3.13 1.95 4.27.78.81 1.28 1.49 1.44 2.18h3.82c.16-.69.66-1.37 1.44-2.18 1.09-1.14 1.95-2.37 1.95-4.27 0-2.92-2.25-5.12-5.3-5.12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.1h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.5 20h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TipCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M8 12.3l2.5 2.5 5.2-5.4"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ParametersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M5 17h14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="1.7" fill="currentColor" />
      <circle cx="15" cy="12" r="1.7" fill="currentColor" />
      <circle cx="11" cy="17" r="1.7" fill="currentColor" />
    </svg>
  );
}

function ParticipantsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 12.2a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.8 18c.45-2.35 2.3-3.7 4.2-3.7s3.75 1.35 4.2 3.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.2 10.2v5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13.6 12.8h5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DataCollectionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.8 12h3.1l1.6-3.2 2.4 7 2.2-4.5h2.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.2 12h3"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.8h6l3.2 3.2V19a1.2 1.2 0 0 1-1.2 1.2H8A1.2 1.2 0 0 1 6.8 19V6A1.2 1.2 0 0 1 8 4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 4.8V8h3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.3h4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.5 15.6h3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CollectDataIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.8h8A1.2 1.2 0 0 1 17.2 6v12.8A1.2 1.2 0 0 1 16 20H8A1.2 1.2 0 0 1 6.8 18.8V6A1.2 1.2 0 0 1 8 4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 4.8h4v2H10v-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 11.2h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.5 14.5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalysisResultsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.8h6l3.2 3.2V19A1.2 1.2 0 0 1 16 20.2H8A1.2 1.2 0 0 1 6.8 19V6A1.2 1.2 0 0 1 8 4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 4.8V8h3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 15.6v-2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 15.6v-4.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 15.6v-1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExportReportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.8h6l3.2 3.2V19A1.2 1.2 0 0 1 16 20.2H8A1.2 1.2 0 0 1 6.8 19V6A1.2 1.2 0 0 1 8 4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 4.8V8h3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 14h4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12.9 11.8 15 14l-2.1 2.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CreateStudyPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStudyCode, setCreatedStudyCode] = useState("");

  const [formData, setFormData] = useState<StudyFormData>(() => ({
    title: "",
    startDate: "",
    endDate: "",
    studyType: "",
    dataEntryMode: "",
    status: "",
    description: "",
    institution: "",
    targetParticipants: "",
    collectionRules: "",
    inclusionCriteria: "",
    administrativeNotes: "",
  }));

  const [parameterSettings, setParameterSettings] =
    useState<Record<ParameterId, ParameterSetting>>(getInitialParameterSettings);

  const selectedParameters = parameterDefinitions.filter(
    (parameter) => parameterSettings[parameter.id].selected
  );

  function updateField<K extends keyof StudyFormData>(
    field: K,
    value: StudyFormData[K]
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleParameter(id: ParameterId) {
    setParameterSettings((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        selected: !prev[id].selected,
      },
    }));
  }

  function updateParameterFrequency(id: ParameterId, value: string) {
    setParameterSettings((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        frequency: value,
      },
    }));
  }

  function validateStepOne() {
    if (
      !formData.title.trim() ||
      !formData.startDate ||
      !formData.studyType ||
      !formData.dataEntryMode ||
      !formData.status
    ) {
      return "Completează titlul, data de început, tipul studiului, modul de furnizare a datelor și statusul studiului.";
    }
  
    if (formData.endDate && formData.endDate < formData.startDate) {
      return "Data de finalizare trebuie să fie după data de început.";
    }
  
    if (
      formData.targetParticipants &&
      Number(formData.targetParticipants) < 0
    ) {
      return "Ținta de participanți nu poate fi negativă.";
    }
  
    return "";
  }

  function validateStepTwo() {
    if (selectedParameters.length === 0) {
      return "Selectează cel puțin un parametru pentru studiu.";
    }

    return "";
  }

  function handleNext() {
    const error = currentStep === 1 ? validateStepOne() : validateStepTwo();

    if (error) {
      setStepError(error);
      return;
    }

    setStepError("");
    setSuccessMessage("");
    setCurrentStep((prev) => prev + 1);
  }

  function handlePrevious() {
    setStepError("");
    setSuccessMessage("");
    setCurrentStep((prev) => prev - 1);
  }

  async function handleCreateStudy() {
    const stepOneError = validateStepOne();
    if (stepOneError) {
      setStepError(stepOneError);
      setCurrentStep(1);
      return;
    }
  
    const stepTwoError = validateStepTwo();
    if (stepTwoError) {
      setStepError(stepTwoError);
      setCurrentStep(2);
      return;
    }
  
    setStepError("");
    setSuccessMessage("");
    setIsSubmitting(true);
  
    try {
      const payload = {
        title: formData.title.trim(),
        start_date: formData.startDate ? `${formData.startDate}T00:00:00` : null,
        end_date: formData.endDate ? `${formData.endDate}T23:59:59` : null,
        study_type: formData.studyType,
        data_entry_mode: formData.dataEntryMode,
        status: formData.status,
        description: formData.description.trim() || null,
        institution: formData.institution.trim() || null,
        target_participants: formData.targetParticipants
          ? Number(formData.targetParticipants)
          : null,
        collection_rules: formData.collectionRules.trim() || null,
        inclusion_criteria: formData.inclusionCriteria.trim() || null,
        administrative_notes: formData.administrativeNotes.trim() || null,
        parameters: selectedParameters.map((parameter) => ({
          parameter_key: parameter.id,
          measurement_frequency: parameterSettings[parameter.id].frequency,
        })),
      };
  
      const createdStudy = await createStudyRequest(payload);
  
      setCreatedStudyCode(createdStudy.code ?? "");
      setSuccessMessage(
        `Studiul ${createdStudy.code ?? ""} a fost creat cu succes.`
      );
  
      setTimeout(() => {
        navigate("/cercetator/studii");
      }, 1500);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }
    
      if (error instanceof Error) {
        setStepError(error.message);
      } else {
        setStepError("A apărut o eroare la crearea studiului.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(value: string) {
    if (!value) {
      return "—";
    }

    return new Intl.DateTimeFormat("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  }

  const currentAsideContent =
    currentStep === 1
      ? {
          infoTitle: "Despre studii",
          infoIcon: <InfoCircleIcon />,
          infoText:
            "Creează studii pentru a organiza colectarea și analiza datelor fiziologice. Poți adăuga participanți și rula analize după salvare.",
          tips: [
            "Alege un titlu clar și ușor de recunoscut",
            "Selectează tipul de studiu potrivit pentru datele colectate",
            "Verifică statusul inițial înainte de continuare",
          ],
          nextVariant: "icons",
          next: [
            {
              text: "Adaugi parametrii urmăriți",
              icon: <ParametersIcon />,
            },
            {
              text: "Inviți participanții",
              icon: <ParticipantsIcon />,
            },
            {
              text: "Colectezi date",
              icon: <DataCollectionIcon />,
            },
            {
              text: "Lansezi analize și rapoarte",
              icon: <ReportsIcon />,
            },
          ],
        }
      : currentStep === 2
      ? {
          infoTitle: "Despre parametri",
          infoIcon: <InfoCircleIcon />,
          infoText:
            "Alege parametrii care se potrivesc obiectivelor studiului tău. Poți adăuga sau elimina oricând.",
          tips: [
            "Nu selecta prea mulți parametri dacă nu sunt esențiali pentru obiective.",
            "Măsurătorile continue oferă date mai detaliate.",
            "Poți modifica setările oricând după creare.",
          ],
          nextVariant: "ordered",
          next: [
            {
              text: "Configurează parametrii studiului",
            },
            {
              text: "Adaugă criteriile de includere",
            },
            {
              text: "Stabilește durata și perioada studiului",
            },
            {
              text: "Revizuiește și publică studiul",
            },
          ],
        }
        : {
            infoTitle: "Totul arată bine!",
            infoIcon: <TipCheckIcon />,
            infoText:
              "Studiul tău este gata de lansare. Verifică informațiile și apasă pe „Creează studiul” pentru a continua.",
            tips: [
              "Asigură-te că parametrii selectați răspund obiectivelor studiului.",
              "Poți adăuga sau modifica detalii și după creare.",
              "Invită participanții imediat după crearea studiului pentru a începe colectarea datelor.",
            ],
            nextVariant: "icons",
            next: [
              {
                text: "Invită participanții la studiu",
                icon: <ParticipantsIcon />,
              },
              {
                text: "Colectează date conform setărilor",
                icon: <CollectDataIcon />,
              },
              {
                text: "Lansează analize și vizualizează rezultatele",
                icon: <AnalysisResultsIcon />,
              },
              {
                text: "Generează rapoarte și exportă-le",
                icon: <ExportReportIcon />,
              },
            ],
          };
  const dataEntryModeLabel =
    dataEntryModeOptions.find((option) => option.value === formData.dataEntryMode)?.label ?? "—";
  
  const studyStatusLabel =
    studyStatusOptions.find((option) => option.value === formData.status)?.label ?? "—";

  const studyTypeLabel =
    studyTypeOptions.find((option) => option.value === formData.studyType)?.label ?? "—";

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <>
          <div className="create-study-section__header">
            <h2>Informații generale</h2>
            <p>Introdu datele esențiale pentru noul studiu.</p>
          </div>

          <div className="create-study-form-grid">
            <label className="create-study-field create-study-field--full">
              <span className="create-study-field__label">Titlu studiu *</span>
              <input
                type="text"
                placeholder="Ex: Monitorizarea semnelor vitale la pacienți cu BPOC"
                value={formData.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>
            
            <label className="create-study-field">
              <span className="create-study-field__label">Data de început *</span>
              <input
                type="date"
                value={formData.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
              />
            </label>

            <label className="create-study-field">
              <span className="create-study-field__label">Data de finalizare</span>
              <input
                type="date"
                value={formData.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
            </label>

            <label className="create-study-field">
              <span className="create-study-field__label">Tip studiu *</span>
              <select
                value={formData.studyType}
                onChange={(event) => updateField("studyType", event.target.value)}
              >
                <option value="">Selectează tipul</option>
                {studyTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            
            <label className="create-study-field">
              <span className="create-study-field__label">Mod de furnizare a datelor *</span>
              <select
                value={formData.dataEntryMode}
                onChange={(event) => updateField("dataEntryMode", event.target.value)}
              >
                <option value="">Selectează modul</option>
                {dataEntryModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            
            <label className="create-study-field">
              <span className="create-study-field__label">Status studiu *</span>
              <select
                value={formData.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                <option value="">Selectează statusul</option>
                {studyStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="create-study-field">
              <span className="create-study-field__label">Țintă participanți</span>
              <input
                type="number"
                min={0}
                placeholder="Ex: 40"
                value={formData.targetParticipants}
                onChange={(event) => updateField("targetParticipants", event.target.value)}
              />
            </label>

            <label className="create-study-field create-study-field--full">
              <span className="create-study-field__label">Instituție</span>
              <input
                type="text"
                placeholder="Ex: Universitatea de Medicină și Farmacie Victor Babeș Timișoara"
                value={formData.institution}
                onChange={(event) => updateField("institution", event.target.value)}
              />
            </label>
            
            <label className="create-study-field create-study-field--full">
              <span className="create-study-field__label">Descriere</span>
              <textarea
                maxLength={400}
                placeholder="Descrie pe scurt scopul studiului și contextul general."
                value={formData.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
              <span className="create-study-field__helper">
                {formData.description.length}/400
              </span>
            </label>

            <label className="create-study-field create-study-field--full">
              <span className="create-study-field__label">Reguli de colectare</span>
              <textarea
                maxLength={700}
                placeholder="Ex: Participanții transmit valorile fiziologice după o activitate fizică ușoară. Fiecare înregistrare trebuie să includă ritmul cardiac, frecvența respiratorie, SpO₂ și temperatura corporală."
                value={formData.collectionRules}
                onChange={(event) => updateField("collectionRules", event.target.value)}
              />
              <span className="create-study-field__helper">
                {formData.collectionRules.length}/700
              </span>
            </label>

            <label className="create-study-field create-study-field--full">
              <span className="create-study-field__label">Criterii de includere</span>
              <textarea
                maxLength={700}
                placeholder="Ex: Adulți cu vârsta între 18 și 65 de ani, fără contraindicații cunoscute pentru efort fizic ușor."
                value={formData.inclusionCriteria}
                onChange={(event) => updateField("inclusionCriteria", event.target.value)}
              />
              <span className="create-study-field__helper">
                {formData.inclusionCriteria.length}/700
              </span>
            </label>

            <label className="create-study-field create-study-field--full">
              <span className="create-study-field__label">Note administrative</span>
              <textarea
                maxLength={700}
                placeholder="Ex: Date simulate pentru testarea funcționalităților de analiză pe cohorte."
                value={formData.administrativeNotes}
                onChange={(event) => updateField("administrativeNotes", event.target.value)}
              />
              <span className="create-study-field__helper">
                {formData.administrativeNotes.length}/700
              </span>
            </label>
          </div>
        </>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <div className="create-study-section__header">
            <h2>Parametrii studiului</h2>
            <p>Selectează parametrii fiziologici care vor fi urmăriți.</p>
          </div>

          <div className="create-study-parameter-grid">
            {parameterDefinitions.map((parameter) => {
              const settings = parameterSettings[parameter.id];

              return (
                <button
                  key={parameter.id}
                  type="button"
                  className={`create-study-parameter-card ${
                    settings.selected ? "is-selected" : ""
                  }`}
                  onClick={() => toggleParameter(parameter.id)}
                  aria-pressed={settings.selected}
                >
                  <div className="create-study-parameter-card__top">
                    <div className="create-study-parameter-card__meta">
                      <h3>{parameter.name}</h3>
                      <p>{parameter.description}</p>
                    </div>

                    <span className="create-study-checkmark">
                      {settings.selected ? <CheckIcon /> : null}
                    </span>
                  </div>

                  <span className="create-study-parameter-card__unit">
                    {parameter.unit}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="create-study-config">
            <h3 className="create-study-subtitle">
              Configurare parametri selectați ({selectedParameters.length})
            </h3>

            {selectedParameters.length === 0 ? (
              <div className="create-study-empty-state">
                Selectează cel puțin un parametru pentru a vedea configurarea.
              </div>
            ) : (
              <div className="create-study-config-grid">
                {selectedParameters.map((parameter) => (
                  <article key={parameter.id} className="create-study-config-card">
                    <div className="create-study-config-card__header">
                      <div>
                        <h4>{parameter.name}</h4>
                        <span>{parameter.unit}</span>
                      </div>
                    </div>

                    <label className="create-study-field">
                      <span className="create-study-field__label">
                        Frecvență de măsurare
                      </span>
                      <select
                        value={parameterSettings[parameter.id].frequency}
                        onChange={(event) =>
                          updateParameterFrequency(parameter.id, event.target.value)
                        }
                      >
                        {frequencyOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        <div className="create-study-section__header">
          <h2>Rezumatul studiului</h2>
          <p>Verifică rapid toate informațiile înainte de creare.</p>
        </div>

        <div className="create-study-review-grid">
          <article className="create-study-review-card">
            <h3>Informații generale</h3>

            <dl className="create-study-summary-list">
              <div>
                <dt>Titlu</dt>
                <dd>{formData.title || "—"}</dd>
              </div>

              <div>
                <dt>Cod de studiu</dt>
                <dd>{createdStudyCode || "Se generează automat la salvare"}</dd>
              </div>

              <div>
                <dt>Data de început</dt>
                <dd>{formatDate(formData.startDate)}</dd>
              </div>

              <div>
                <dt>Data de finalizare</dt>
                <dd>{formatDate(formData.endDate)}</dd>
              </div>

              <div>
                <dt>Tip studiu</dt>
                <dd>{studyTypeLabel}</dd>
              </div>

              <div>
                <dt>Mod de furnizare a datelor</dt>
                <dd>{dataEntryModeLabel}</dd>
              </div>
              
              <div>
                <dt>Status studiu</dt>
                <dd>{studyStatusLabel}</dd>
              </div>

              <div>
                <dt>Responsabil</dt>
                <dd>{currentUser?.full_name ?? "Cercetător"}</dd>
              </div>

              <div>
                <dt>Instituție</dt>
                <dd>{formData.institution.trim() || "—"}</dd>
              </div>

              <div>
                <dt>Țintă participanți</dt>
                <dd>{formData.targetParticipants || "—"}</dd>
              </div>
            </dl>
          </article>

          <div className="create-study-review-details-column">
            <article className="create-study-review-card create-study-review-detail-card">
              <h3>Descriere</h3>
              <p className="create-study-review-description">
                {formData.description.trim()
                  ? formData.description
                  : "Nu a fost introdusă o descriere pentru acest studiu."}
              </p>
            </article>

            <article className="create-study-review-card create-study-review-detail-card">
              <h3>Reguli de colectare</h3>
              <p className="create-study-review-description">
                {formData.collectionRules.trim()
                  ? formData.collectionRules
                  : "Nu au fost introduse reguli de colectare."}
              </p>
            </article>

            <article className="create-study-review-card create-study-review-detail-card">
              <h3>Criterii de includere</h3>
              <p className="create-study-review-description">
                {formData.inclusionCriteria.trim()
                  ? formData.inclusionCriteria
                  : "Nu au fost introduse criterii de includere."}
              </p>
            </article>

            <article className="create-study-review-card create-study-review-detail-card">
              <h3>Note administrative</h3>
              <p className="create-study-review-description">
                {formData.administrativeNotes.trim()
                  ? formData.administrativeNotes
                  : "Nu au fost introduse note administrative."}
              </p>
            </article>
          </div>
        </div>

        <article className="create-study-review-card create-study-review-card--full">
          <h3>Parametri monitorizați ({selectedParameters.length})</h3>

          {selectedParameters.length === 0 ? (
            <p className="create-study-review-description">
              Nu ai selectat niciun parametru.
            </p>
          ) : (
            <div className="create-study-review-parameter-list">
              {selectedParameters.map((parameter) => (
                <div key={parameter.id} className="create-study-review-parameter-item">
                  <strong>{parameter.name}</strong>
                  <span>{parameter.unit}</span>
                  <small>
                    Frecvență: {parameterSettings[parameter.id].frequency}
                  </small>
                </div>
              ))}
            </div>
          )}
        </article>

        <div className="create-study-info-banner">
          După creare, poți continua ulterior cu introducerea datelor și integrarea
          logicii de analiză.
        </div>
      </>
    );
  }

  return (
    <ResearcherLayout
      activeItem="studii"
      title="Creează studiu"
      subtitle="Completează pașii de mai jos pentru a configura un studiu nou."
      contentWidth="wide"
      actions={
        <button
          type="button"
          className="create-study-back-btn"
          onClick={() => navigate("/cercetator/studii")}
        >
          <ArrowLeftIcon />
          <span>Înapoi la studii</span>
        </button>
      }
    >
      <div className="create-study-shell">
        {successMessage ? (
          <div className="create-study-success-banner">{successMessage}</div>
        ) : null}
  
        <div className="create-study-grid">
          <div className="create-study-main-column">
            <section className="create-study-stepper">
              {steps.map((stepLabel, index) => {
                const stepNumber = index + 1;
                const isDone = currentStep > stepNumber;
                const isCurrent = currentStep === stepNumber;
  
                return (
                  <div
                    key={stepLabel}
                    className={`create-study-step ${
                      isDone ? "is-done" : ""
                    } ${isCurrent ? "is-current" : ""}`}
                  >
                    <div className="create-study-step__circle">
                      {isDone ? <CheckIcon /> : stepNumber}
                    </div>
  
                    <span className="create-study-step__label">{stepLabel}</span>
  
                    {index < steps.length - 1 ? (
                      <div className="create-study-step__line" />
                    ) : null}
                  </div>
                );
              })}
            </section>
  
            <section className="create-study-card">
              {renderStepContent()}
  
              <div className="create-study-card__footer">
                {stepError ? <p className="create-study-error">{stepError}</p> : null}
  
                <div className="create-study-actions">
                  <button
                    type="button"
                    className="create-study-secondary-btn"
                    onClick={
                      currentStep === 1
                        ? () => navigate("/cercetator/studii")
                        : handlePrevious
                    }
                  >
                    {currentStep === 1 ? "Anulează" : (
                      <>
                        <ArrowLeftIcon />
                        <span>Înapoi</span>
                      </>
                    )}
                  </button>
  
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      className="create-study-primary-btn"
                      onClick={handleNext}
                    >
                      <span>Continuă</span>
                      <ArrowRightIcon />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="create-study-primary-btn"
                      onClick={handleCreateStudy}
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? "Se creează..." : "Creează studiul"}</span>
                      <CheckIcon />
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
  
          <aside className="create-study-side-column">
            <article className="create-study-side-card create-study-side-card--green">
              <div className="create-study-side-card__title-row">
                <span className="create-study-side-card__title-icon create-study-side-card__title-icon--green">
                  {currentAsideContent.infoIcon}
                </span>
                <h3>{currentAsideContent.infoTitle}</h3>
              </div>
              <p>{currentAsideContent.infoText}</p>
            </article>
          
            <article className="create-study-side-card create-study-side-card--orange">
              <div className="create-study-side-card__title-row">
                <span className="create-study-side-card__title-icon create-study-side-card__title-icon--orange">
                  <LightbulbIcon />
                </span>
                <h3>Sfaturi</h3>
              </div>
          
              <ul className="create-study-side-list create-study-side-list--icons">
                {currentAsideContent.tips.map((item) => (
                  <li key={item}>
                    <span className="create-study-side-list__icon create-study-side-list__icon--check">
                      <TipCheckIcon />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          
            <article className="create-study-side-card create-study-side-card--blue">
              <div className="create-study-side-card__title-row">
                <h3>Ce urmează?</h3>
              </div>
            
              {currentAsideContent.nextVariant === "ordered" ? (
                <ol className="create-study-side-list create-study-side-list--ordered">
                  {currentAsideContent.next.map((item) => (
                    <li key={item.text}>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ul
                  className={`create-study-side-list create-study-side-list--icons ${
                    currentStep === 3 ? "create-study-side-list--step3" : ""
                  }`}
                >
                  {currentAsideContent.next.map((item) => (
                    <li key={item.text}>
                      <span className="create-study-side-list__icon create-study-side-list__icon--neutral">
                        {"icon" in item ? item.icon : null}
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </aside>
        </div>
      </div>
    </ResearcherLayout>
  );
}