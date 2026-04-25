import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ParticipantLayout from "../components/layout/ParticipantLayout";
import "../styles/participant-csv.css";
import {
  getParticipantContext,
  replaceParticipantContext,
  type ParticipantPortalContext,
} from "../participant/participantStorage";
import {
  createBulkParticipantSubmissionsRequest,
  fetchCurrentParticipantContextRequest,
} from "../participant/participantApi";
import { getParticipantNextPath } from "../participant/participantRouting";
import { PARTICIPANT_SESSION_EXPIRED_ERROR } from "../participant/participantAuthFetch";
import type { StudyParameterKey } from "../studies/studiesApi";

const PARAMETER_LABELS: Record<StudyParameterKey, string> = {
  heartRate: "Ritm cardiac",
  respiratoryRate: "Frecvență respiratorie",
  spo2: "Saturația de oxigen",
  temperature: "Temperatura corporală",
};

const PARAMETER_UNITS: Record<StudyParameterKey, string> = {
  heartRate: "bpm",
  respiratoryRate: "rpm",
  spo2: "%",
  temperature: "°C",
};

const CSV_COLUMN_MAP: Record<StudyParameterKey, string[]> = {
  heartRate: ["ritm_cardiac", "heart_rate", "heartrate", "puls"],
  respiratoryRate: [
    "frecventa_respiratorie",
    "respiratory_rate",
    "resp_rate",
    "respiratoryrate",
  ],
  spo2: ["saturatie_oxigen", "spo2", "saturatie", "oxygen_saturation"],
  temperature: ["temperatura", "temperature", "temp"],
};

const VALID_RANGES: Record<StudyParameterKey, { min: number; max: number }> = {
  heartRate: { min: 30, max: 220 },
  respiratoryRate: { min: 5, max: 80 },
  spo2: { min: 50, max: 100 },
  temperature: { min: 30, max: 43 },
};

type ParsedCsvRow = {
  values: {
    parameter_key: StudyParameterKey;
    value: number;
    measured_at: string;
  }[];
};

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5V4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.5 9 12 4.5 16.5 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15.5v2.2A2.3 2.3 0 0 0 7.3 20h9.4A2.3 2.3 0 0 0 19 17.7v-2.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3.8h6.7L18 8.1v12.1H7V3.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M13.7 3.8v4.3H18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.8 13.2h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.8 16.2h5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.5a5.4 5.4 0 0 0-3.2 9.8c.6.5.9 1.1 1 1.8h4.4c.1-.7.4-1.3 1-1.8A5.4 5.4 0 0 0 12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 20h2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 18.2 5.4V10c0 4.7-2.8 8.9-6.2 10.1C8.6 18.9 5.8 14.7 5.8 10V5.4L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9.4 11.8 1.8 1.8 3.6-3.6"
        stroke="currentColor"
        strokeWidth="1.8"
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
        d="m7 12.5 3.2 3.2L17.5 8.5"
        stroke="currentColor"
        strokeWidth="2.2"
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
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseDateValue(dateValue?: string, timeValue?: string) {
  const date = dateValue?.trim();
  const time = timeValue?.trim();

  if (!date) {
    return new Date().toISOString();
  }

  const normalized = time ? `${date}T${time}` : date.includes("T") ? date : `${date}T00:00:00`;
  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Data "${date}${time ? ` ${time}` : ""}" nu este validă.`);
  }

  return parsedDate.toISOString();
}

function findColumnIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

export default function ParticipantCsvPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [context, setContext] = useState<ParticipantPortalContext | null>(
    getParticipantContext()
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const freshContext = await fetchCurrentParticipantContextRequest();

        if (cancelled) return;

        replaceParticipantContext(freshContext);

        const nextPath = getParticipantNextPath(freshContext);

        if (nextPath !== "/participant/furnizare-date/csv") {
          navigate(nextPath, { replace: true });
          return;
        }

        setContext(freshContext);
      } catch (error) {
        if (cancelled) return;

        if (
          error instanceof Error &&
          error.message === PARTICIPANT_SESSION_EXPIRED_ERROR
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nu s-a putut încărca pagina de încărcare CSV."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const parameters = context?.parameters ?? [];
  const participantName = context?.participant.full_name ?? "Participant";
  const firstName = participantName.split(" ")[0] || "Participant";
  const studyCode = context?.study.code ?? "—";

  const csvColumns = useMemo(() => {
    const parameterColumns = parameters.map((parameter) => ({
      key: parameter.parameter_key,
      label: PARAMETER_LABELS[parameter.parameter_key],
      unit: PARAMETER_UNITS[parameter.parameter_key],
      column: CSV_COLUMN_MAP[parameter.parameter_key][0],
    }));

    return [
      { column: "data", label: "data", unit: "YYYY-MM-DD" },
      { column: "ora", label: "ora", unit: "HH:mm" },
      ...parameterColumns,
    ];
  }, [parameters]);

  const exampleHeader = csvColumns.map((item) => item.column).join(",");
  const exampleRowOne = useMemo(() => {
    const values = parameters.map((parameter) => {
      if (parameter.parameter_key === "heartRate") return "72";
      if (parameter.parameter_key === "respiratoryRate") return "16";
      if (parameter.parameter_key === "spo2") return "98";
      return "36.6";
    });

    return ["2024-11-15", "08:30", ...values].join(",");
  }, [parameters]);

  const exampleRowTwo = useMemo(() => {
    const values = parameters.map((parameter) => {
      if (parameter.parameter_key === "heartRate") return "75";
      if (parameter.parameter_key === "respiratoryRate") return "17";
      if (parameter.parameter_key === "spo2") return "97";
      return "36.7";
    });

    return ["2024-11-15", "08:31", ...values].join(",");
  }, [parameters]);

  function resetFileState() {
    setSelectedFile(null);
    setParsedRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function parseCsvFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new Error("Te rugăm să alegi un fișier CSV valid.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Fișierul este prea mare. Dimensiunea maximă este 10 MB.");
    }

    const text = await file.text();
    const lines = text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error("Fișierul trebuie să conțină antet și cel puțin un rând de date.");
    }

    const headers = splitCsvLine(lines[0]).map(normalizeHeader);

    const dateIndex = findColumnIndex(headers, ["data", "date", "data_ora", "measured_at"]);
    const timeIndex = findColumnIndex(headers, ["ora", "time"]);

    const parameterIndexes = parameters.map((parameter) => {
      const index = findColumnIndex(headers, CSV_COLUMN_MAP[parameter.parameter_key]);

      if (index === -1) {
        throw new Error(
          `Lipsește coloana pentru ${PARAMETER_LABELS[parameter.parameter_key]}.`
        );
      }

      return {
        parameterKey: parameter.parameter_key,
        index,
      };
    });

    const rows: ParsedCsvRow[] = [];

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
      const cells = splitCsvLine(lines[lineIndex]);

      const measuredAt = parseDateValue(
        dateIndex >= 0 ? cells[dateIndex] : undefined,
        timeIndex >= 0 ? cells[timeIndex] : undefined
      );

      const values = parameterIndexes.map(({ parameterKey, index }) => {
        const rawValue = cells[index]?.replace(",", ".").trim();
        const numericValue = Number(rawValue);
        const range = VALID_RANGES[parameterKey];

        if (!rawValue || Number.isNaN(numericValue)) {
          throw new Error(
            `Rândul ${lineIndex + 1}: valoarea pentru ${PARAMETER_LABELS[parameterKey]} trebuie să fie numerică.`
          );
        }

        if (numericValue < range.min || numericValue > range.max) {
          throw new Error(
            `Rândul ${lineIndex + 1}: ${PARAMETER_LABELS[parameterKey]} trebuie să fie între ${range.min} și ${range.max}.`
          );
        }

        return {
          parameter_key: parameterKey,
          value: numericValue,
          measured_at: measuredAt,
        };
      });

      rows.push({ values });
    }

    return rows;
  }

  async function handleSelectedFile(file: File) {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const rows = await parseCsvFile(file);
      setSelectedFile(file);
      setParsedRows(rows);
    } catch (error) {
      resetFileState();
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Fișierul CSV nu a putut fi citit."
      );
    }
  }

  async function handleSubmit() {
    if (!selectedFile || parsedRows.length === 0) {
      setErrorMessage("Alege mai întâi un fișier CSV valid.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await createBulkParticipantSubmissionsRequest({
        source_file_name: selectedFile.name,
        participant_notes: null,
        submissions: parsedRows,
      });

      const freshContext = await fetchCurrentParticipantContextRequest();
      replaceParticipantContext(freshContext);
      setContext(freshContext);

      resetFileState();
      setSuccessMessage("Fișierul CSV a fost încărcat și procesat cu succes.");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === PARTICIPANT_SESSION_EXPIRED_ERROR
      ) {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Fișierul nu a putut fi încărcat."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function downloadTemplate() {
    const csvContent = [exampleHeader, exampleRowOne, exampleRowTwo].join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${studyCode.toLowerCase()}-template-date.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <ParticipantLayout
      activeItem="furnizare"
      title={`Bună, ${firstName}! 👋`}
      subtitle="Încarcă fișierul CSV cu valorile semnelor tale vitale. Datele vor fi analizate în siguranță de echipa de cercetare."
      participantName={participantName}
      studyCode={studyCode}
      contentWidth="wide"
    >
      <div className="participant-csv-page">
        {isLoading ? (
          <div className="participant-csv-banner">
            Se încarcă informațiile studiului...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="participant-csv-banner participant-csv-banner--error">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="participant-csv-banner participant-csv-banner--success">
            {successMessage}
          </div>
        ) : null}

        <section className="participant-csv-card">
          <div className="participant-csv-card__header">
            <div>
              <div className="participant-csv-title-row">
                <h2>Încarcă fișierul cu date</h2>
                <span>Format CSV</span>
              </div>
              <p>
                Fișierul trebuie să conțină câte o înregistrare pe rând și toate
                semnele vitale configurate în studiu.
              </p>
            </div>

            <button
              type="button"
              className="participant-csv-template"
              onClick={downloadTemplate}
              disabled={isLoading || parameters.length === 0}
            >
              <TipIcon />
              <span>
                <strong>Nu știi cum trebuie structurat fișierul?</strong>
                Descarcă șablonul CSV
              </span>
            </button>
          </div>

          <label
            className={`participant-csv-dropzone${
              isDragging ? " participant-csv-dropzone--dragging" : ""
            }${selectedFile ? " participant-csv-dropzone--selected" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);

              const file = event.dataTransfer.files[0];
              if (file) void handleSelectedFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleSelectedFile(file);
              }}
              disabled={isSaving || isLoading}
            />

            <div className="participant-csv-dropzone__icon">
              {selectedFile ? <FileIcon /> : <UploadIcon />}
            </div>

            <strong>
              {selectedFile
                ? selectedFile.name
                : "Trage și plasează fișierul CSV aici"}
            </strong>

            <span>sau</span>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving || isLoading}
            >
              Alege fișier
            </button>

            <small>
              Fișiere acceptate: .csv • Dimensiune maximă: 10 MB
              {parsedRows.length > 0 ? ` • ${parsedRows.length} înregistrări detectate` : ""}
            </small>
          </label>

          <div className="participant-csv-security">
            <ShieldIcon />
            <span>
              Datele tale sunt în siguranță. Informațiile din fișier sunt
              folosite doar în scopuri de cercetare.
            </span>
          </div>
        </section>

        <section className="participant-csv-info-grid">
          <article className="participant-csv-format-card">
            <div className="participant-csv-format-card__icon">
              <FileIcon />
            </div>

            <div>
              <h3>Cum trebuie să arate fișierul tău</h3>
              <p>Fișierul CSV trebuie să conțină următoarele coloane:</p>
            </div>

            <div className="participant-csv-columns">
              {csvColumns.map((item) => (
                <span key={item.column}>
                  <strong>{item.column}</strong>
                  <small>{item.unit}</small>
                </span>
              ))}
            </div>

            <div className="participant-csv-example">
              <span>Exemplu de date:</span>
              <pre>{`${exampleHeader}\n${exampleRowOne}\n${exampleRowTwo}\n...`}</pre>
            </div>
          </article>

          <article className="participant-csv-tips-card">
            <div className="participant-csv-tips-card__header">
              <div className="participant-csv-tips-card__icon">
                <TipIcon />
              </div>
              <h3>Sfaturi utile</h3>
            </div>

            <ul>
              <li>
                <CheckIcon />
                <span>Folosește formatul CSV cu separator virgulă.</span>
              </li>
              <li>
                <CheckIcon />
                <span>Asigură-te că valorile sunt numerice.</span>
              </li>
              <li>
                <CheckIcon />
                <span>Folosește punct pentru zecimale, de exemplu 36.6.</span>
              </li>
              <li>
                <CheckIcon />
                <span>Verifică să nu existe rânduri incomplete.</span>
              </li>
            </ul>
          </article>
        </section>

        <button
          type="button"
          className="participant-csv-submit"
          onClick={() => void handleSubmit()}
          disabled={isSaving || isLoading || !selectedFile || parsedRows.length === 0}
        >
          <span>{isSaving ? "Se procesează..." : "Încarcă și procesează fișierul"}</span>
          <ArrowRightIcon />
        </button>
      </div>
    </ParticipantLayout>
  );
}