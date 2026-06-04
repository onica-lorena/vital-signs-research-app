import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import ResearcherLayout from "../components/layout/ResearcherLayout";

import studiesGuideImage from "../assets/guide/studies.png";
import createStudyGeneralTopImage from "../assets/guide/create-study-general-top.png";
import createStudyGeneralDetailsImage from "../assets/guide/create-study-general-details.png";
import createStudyParametersImage from "../assets/guide/create-study-parameters.png";
import createStudyReviewTopImage from "../assets/guide/create-study-review-top.png";
import createStudyReviewBottomImage from "../assets/guide/create-study-review-bottom.png";
import studyDetailsSummaryImage from "../assets/guide/study-details-summary.png";
import studyDetailsParticipantsImage from "../assets/guide/study-details-participants.png";
import participantDetailsPanelImage from "../assets/guide/participant-details-panel.png";
import studyDetailsDataOverviewImage from "../assets/guide/study-details-data-overview.png";
import studyDetailsDataListImage from "../assets/guide/study-details-data-list.png";
import dataSubmissionDetailsImage from "../assets/guide/data-submission-details.png";
import studyAnalysisRunImage from "../assets/guide/study-analysis-run.png";
import studyAnalysisAdvancedOptionsImage from "../assets/guide/study-analysis-advanced-options.png";
import studyAnalysisResultsImage from "../assets/guide/study-analysis-results.png";
import analysisReportOverviewImage from "../assets/guide/analysis-report-overview.png";
import analysisReportParticipantImage from "../assets/guide/analysis-report-participant.png";
import analysisReportObservedDataImage from "../assets/guide/analysis-report-observed-data.png";
import globalAnalysesImage from "../assets/guide/global-analyses.png";
import researcherActivityImage from "../assets/guide/researcher-activity.png";

import "../styles/researcher-guide-page.css";

type GuideHighlight = {
  label: string;
  className: string;
  showClick?: boolean;
};

type GuideCallout = {
  label: string;
  text: string;
};

type GuideSection = {
  id: string;
  step: string;
  title: string;
  image: string;
  imageAlt: string;
  sectionClassName: string;
  intro: ReactNode;
  highlights: GuideHighlight[];
  callouts: GuideCallout[];
};

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M11 6L5 12L11 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClickIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M12.5 5.5V18.5L16.2 15.9L18.5 22.2L21.2 21.2L18.8 14.9H23.5L12.5 5.5Z"
        fill="currentColor"
      />
      <path
        d="M8.2 7.3L5.7 4.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 13H3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12.7 25.5V29"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const guideSections: GuideSection[] = [
  {
    id: "studii",
    step: "1",
    title: "Gestionează studiile",
    image: studiesGuideImage,
    imageAlt: "Pagina Studii din interfața cercetătorului",
    sectionClassName: "guide-section--studies",
    intro: (
      <>
        Pagina <strong>Studii</strong> este punctul de pornire pentru
        activitatea cercetătorului. De aici poți găsi rapid un studiu, poți
        verifica starea lui și îl poți deschide pentru a continua lucrul cu
        participanții, datele colectate sau analizele.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--filters" },
      { label: "2", className: "guide-highlight--table", showClick: true},
      { label: "3", className: "guide-highlight--create", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Folosește căutarea și filtrele pentru a găsi un studiu după titlu, cod, status sau tip.",
      },
      {
        label: "2",
        text: "Selectează studiul dorit pentru a deschide pagina cu detaliile acestuia.",
      },
      {
        label: "3",
        text: "Folosește butonul Creează studiu atunci când vrei să configurezi un studiu nou.",
      },
    ],
  },
  {
    id: "creare-informatii-generale",
    step: "2",
    title: "Completează informațiile generale",
    image: createStudyGeneralTopImage,
    imageAlt: "Primul pas din formularul de creare studiu",
    sectionClassName: "guide-section--create-general-top",
    intro: (
      <>
        În primul pas stabilești informațiile de bază ale studiului. Completează
        titlul, perioada, tipul studiului, modul de furnizare a datelor și
        statusul inițial, astfel încât studiul să fie definit clar înainte de
        configurarea parametrilor.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--create-stepper" },
      { label: "2", className: "guide-highlight--create-required-fields" },
      { label: "3", className: "guide-highlight--create-status-target" },
      { label: "4", className: "guide-highlight--create-side-info" },
    ],
    callouts: [
      {
        label: "1",
        text: "Urmărește pașii formularului pentru a ști în ce etapă de configurare te afli.",
      },
      {
        label: "2",
        text: "Completează câmpurile obligatorii: titlu, dată de început, tip studiu, mod de furnizare și status.",
      },
      {
        label: "3",
        text: "Adaugă statusul studiului și numărul estimat de participanți pentru o organizare mai clară.",
      },
    ],
  },
  {
    id: "creare-reguli",
    step: "3",
    title: "Definește contextul studiului",
    image: createStudyGeneralDetailsImage,
    imageAlt: "Câmpurile descriptive din formularul de creare studiu",
    sectionClassName: "guide-section--create-general-details",
    intro: (
      <>
        După datele generale, adaugă descrierea studiului, regulile de
        colectare, criteriile de includere și eventualele note administrative.
        Aceste informații ajută la clarificarea modului în care vor fi colectate
        și verificate datele.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--create-description" },
      { label: "2", className: "guide-highlight--create-rules" },
      { label: "3", className: "guide-highlight--create-criteria" },
      { label: "4", className: "guide-highlight--create-notes" },
      { label: "5", className: "guide-highlight--create-continue", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Scrie pe scurt scopul studiului și contextul în care vor fi interpretate datele.",
      },
      {
        label: "2",
        text: "Precizează cum și cât de des trebuie participanții să transmită valorile fiziologice.",
      },
      {
        label: "3",
        text: "Definește criteriile de includere pentru a delimita clar participanții eligibili.",
      },
      {
        label: "4",
        text: "Adaugă note administrative utile pentru verificarea ulterioară a datelor.",
      },
      {
        label: "5",
        text: "După completare, apasă Continuă pentru a configura parametrii monitorizați.",
      },
    ],
  },
  {
    id: "creare-parametri",
    step: "4",
    title: "Configurează parametrii monitorizați",
    image: createStudyParametersImage,
    imageAlt: "Pasul de configurare a parametrilor monitorizați",
    sectionClassName: "guide-section--create-parameters",
    intro: (
      <>
        În această etapă alegi frecvența de măsurare pentru fiecare semn vital:
        ritm cardiac, frecvență respiratorie, saturație de oxigen și temperatură
        corporală. Acești parametri vor fi utilizați ulterior pentru colectarea
        datelor și rularea analizelor.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--parameters-stepper" },
      { label: "2", className: "guide-highlight--parameters-cards" },
      { label: "3", className: "guide-highlight--parameters-frequency" },
      { label: "4", className: "guide-highlight--parameters-next", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Verifică faptul că ai ajuns în pasul Parametri al formularului.",
      },
      {
        label: "2",
        text: "Consultă cele patru carduri pentru semnele vitale monitorizate în studiu.",
      },
      {
        label: "3",
        text: "Alege frecvența de măsurare potrivită pentru fiecare parametru.",
      },
      {
        label: "4",
        text: "Selectează Continuă pentru a revizui toate informațiile înainte de creare.",
      },
    ],
  },
  {
    id: "creare-revizuire",
    step: "5",
    title: "Revizuiește studiul",
    image: createStudyReviewTopImage,
    imageAlt: "Pasul de revizuire a studiului înainte de creare",
    sectionClassName: "guide-section--create-review-top",
    intro: (
      <>
        Înainte de salvare, verifică rezumatul studiului. Această pagină îți
        permite să confirmi titlul, perioada, tipul studiului, modul de
        furnizare a datelor, descrierea, regulile și criteriile de includere.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--review-stepper" },
      { label: "2", className: "guide-highlight--review-general" },
      { label: "3", className: "guide-highlight--review-details" },
    ],
    callouts: [
      {
        label: "1",
        text: "Asigură-te că formularul a ajuns în etapa de revizuire.",
      },
      {
        label: "2",
        text: "Verifică informațiile generale: titlu, perioadă, tip studiu, status și țintă de participanți.",
      },
      {
        label: "3",
        text: "Recitește descrierea, regulile de colectare și criteriile înainte de salvare.",
      },
    ],
  },
  {
    id: "creare-finalizare",
    step: "6",
    title: "Creează studiul",
    image: createStudyReviewBottomImage,
    imageAlt: "Finalizarea formularului de creare studiu",
    sectionClassName: "guide-section--create-review-bottom",
    intro: (
      <>
        La final, verifică parametrii monitorizați și apasă
        <strong> Creează studiul</strong>. După salvare, vei putea invita
        participanți, colecta date, rula analize predictive și genera rapoarte.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--review-parameters" },
      { label: "2", className: "guide-highlight--review-create-button", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Verifică lista parametrilor monitorizați și frecvența setată pentru fiecare.",
      },
      {
        label: "2",
        text: "Selectează Creează studiul pentru a salva configurarea și a continua cu administrarea studiului.",
      },
    ],
  },
  {
    id: "detalii-rezumat",
    step: "7",
    title: "Consultă rezumatul studiului",
    image: studyDetailsSummaryImage,
    imageAlt: "Pagina de detalii a studiului, secțiunea Rezumat",
    sectionClassName: "guide-section--study-details-summary",
    intro: (
      <>
        După deschiderea unui studiu, pagina de detalii îți oferă o imagine de
        ansamblu asupra configurației acestuia. În secțiunea <strong>Rezumat</strong>{" "}
        poți verifica informațiile generale, numărul de participanți, regulile
        de colectare și parametrii monitorizați.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--details-tabs" },
      { label: "2", className: "guide-highlight--details-info" },
      { label: "3", className: "guide-highlight--details-parameters" },
      { label: "4", className: "guide-highlight--details-edit", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Folosește taburile pentru a trece rapid între rezumat, participanți, date colectate și analize.",
      },
      {
        label: "2",
        text: "Consultă informațiile generale pentru a vedea descrierea, criteriile, regulile și notele studiului.",
      },
      {
        label: "3",
        text: "Verifică parametrii monitorizați și frecvența de măsurare stabilită pentru fiecare semn vital.",
      },
      {
        label: "4",
        text: "Apasă Editează dacă vrei să modifici informațiile sau configurația studiului.",
      },
    ],
  },
  {
    id: "detalii-participanti",
    step: "8",
    title: "Administrează participanții",
    image: studyDetailsParticipantsImage,
    imageAlt: "Pagina de detalii a studiului, secțiunea Participanți",
    sectionClassName: "guide-section--study-details-participants",
    intro: (
      <>
        În secțiunea <strong>Participanți</strong> poți urmări structura
        participanților înscriși în studiu, îi poți filtra după status și poți
        adăuga participanți noi individual sau prin import.
      </>
    ),
    highlights: [
    { label: "1", className: "guide-highlight--participants-tabs" },
    { label: "2", className: "guide-highlight--participants-actions", showClick: true },
    { label: "3", className: "guide-highlight--participants-filters" },
    { label: "4", className: "guide-highlight--participants-table", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Selectează tabul Participanți pentru a gestiona persoanele înscrise în studiul curent.",
      },
      {
        label: "2",
        text: "Folosește butoanele Importă participanți sau Adaugă participant pentru înscrieri noi.",
      },
      {
        label: "3",
        text: "Caută și filtrează participanții după nume, cod, identificator, status sau ordine de afișare.",
      },
      {
      label: "4",
      text: "Consultă tabelul și apasă pe un rând pentru a deschide fereastra cu detaliile participantului.",
      },
    ],
  },
  {
    id: "detalii-participant",
    step: "9",
    title: "Consultă detaliile participantului",
    image: participantDetailsPanelImage,
    imageAlt: "Fereastra laterală cu detaliile participantului",
    sectionClassName: "guide-section--participant-details-panel",
    intro: (
      <>
        După selectarea unui rând din tabel, se deschide o fereastră laterală cu
        informațiile participantului. Aici poți verifica profilul cercetare,
        activitatea în studiu, afecțiunile declarate și notele asociate.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--participant-actions", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Folosește acțiunile de jos pentru editarea participantului sau resetarea PIN-ului.",
      },
    ],
  },
  {
    id: "detalii-date-overview",
    step: "10",
    title: "Urmărește datele colectate",
    image: studyDetailsDataOverviewImage,
    imageAlt: "Pagina de detalii a studiului, secțiunea Date colectate",
    sectionClassName: "guide-section--study-details-data-overview",
    intro: (
      <>
        În tabul <strong>Date colectate</strong> vezi o imagine de ansamblu
        asupra volumului de date transmise de participanți. Cardurile și graficul
        te ajută să urmărești stadiul validării și evoluția colectării în timp.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--data-tabs" },
      { label: "2", className: "guide-highlight--data-chart" },
      { label: "3", className: "guide-highlight--data-period" },
    ],
    callouts: [
      {
        label: "1",
        text: "Intră în tabul Date colectate pentru a analiza sesiunile transmise în cadrul studiului.",
      },
      {
        label: "2",
        text: "Urmărește graficul pentru a vedea evoluția colectării valorilor fiziologice în timp.",
      },
      {
        label: "3",
        text: "Schimbă perioada afișată pentru a analiza datele pe un interval relevant.",
      },
    ],
  },
  {
    id: "detalii-date-lista",
    step: "11",
    title: "Verifică trimiterile participanților",
    image: studyDetailsDataListImage,
    imageAlt: "Lista sesiunilor de date colectate de la participanți",
    sectionClassName: "guide-section--study-details-data-list",
    intro: (
      <>
        Lista de trimiteri îți permite să verifici sesiunile transmise de
        participanți. Poți căuta după participant, filtra după metodă sau status
        și analiza rapid numărul de înregistrări și valori trimise.
      </>
    ),
    highlights: [
    { label: "1", className: "guide-highlight--data-list-filters" },
    { label: "2", className: "guide-highlight--data-list-table", showClick: true },
    { label: "3", className: "guide-highlight--data-list-status" },
    ],
    callouts: [
      {
        label: "1",
        text: "Folosește filtrele pentru participant, metodă, status și interval de timp.",
      },
    {
    label: "2",
    text: "Consultă tabelul și apasă pe un rând pentru a deschide detaliile sesiunii transmise de participant.",
    },
      {
        label: "3",
        text: "Urmărește statusul sesiunii pentru a identifica trimiterile aflate în așteptare, validate sau respinse.",
      },
    ],
  },
  {
    id: "detalii-trimitere-date",
    step: "12",
    title: "Consultă detaliile unei trimiteri",
    image: dataSubmissionDetailsImage,
    imageAlt: "Fereastra laterală cu detaliile unei trimiteri de date",
    sectionClassName: "guide-section--data-submission-details",
    intro: (
      <>
        După selectarea unei trimiteri din tabel, se deschide o fereastră
        laterală cu detaliile sesiunii. Aici poți verifica participantul,
        intervalul datelor, numărul de înregistrări și valorile fiziologice
        transmise.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--submission-actions", showClick: true },
      { label: "2", className: "guide-highlight--submission-close" },
    ],
    callouts: [
      {
        label: "1",
        text: "Folosește butoanele de validare sau respingere pentru a actualiza statusul trimiterii.",
      },
      {
        label: "2",
        text: "Închide fereastra laterală după verificarea sesiunii.",
      },
    ],
  },
  {
    id: "analize-rulare",
    step: "13",
    title: "Rulează o analiză predictivă",
    image: studyAnalysisRunImage,
    imageAlt: "Pagina Analize din detaliile studiului",
    sectionClassName: "guide-section--study-analysis-run",
    intro: (
      <>
        În tabul <strong>Analize</strong> poți lansa o analiză predictivă pentru
        studiul curent. Selectează intervalul, participantul sau cohorta, apoi
        rulează analiza pentru a genera rezultate pe baza datelor colectate.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--analysis-tabs" },
      { label: "2", className: "guide-highlight--analysis-form" },
      { label: "3", className: "guide-highlight--analysis-models" },
      { label: "4", className: "guide-highlight--analysis-run-button", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Selectează tabul Analize din pagina de detalii a studiului.",
      },
      {
        label: "2",
        text: "Alege intervalul de analiză și participantul sau cohorta pentru care vrei să rulezi analiza.",
      },
      {
        label: "3",
        text: "Verifică modelele folosite pentru analiza predictivă și configurează-le dacă este necesar.",
      },
      {
        label: "4",
        text: "Apasă Rulează analiza pentru a genera rezultatele predictive.",
      },
    ],
  },

  {
    id: "analize-optiuni-avansate",
    step: "14",
    title: "Configurează filtrele și modelele analizei",
    image: studyAnalysisAdvancedOptionsImage,
    imageAlt: "Opțiuni extinse pentru rularea unei analize predictive",
    sectionClassName: "guide-section--study-analysis-advanced-options",
    intro: (
      <>
        Înainte de rularea analizei, poți extinde opțiunile pentru a ajusta
        criteriile de selecție și modelele predictive folosite. Astfel, analiza
        poate fi aplicată pe o cohortă mai precisă și poate folosi modelul
        potrivit pentru fiecare semn vital.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--advanced-analysis-form" },
      { label: "2", className: "guide-highlight--advanced-models" },
      { label: "3", className: "guide-highlight--advanced-cohort-filters" },
      { label: "4", className: "guide-highlight--advanced-run-button", showClick: true },
      { label: "5", className: "guide-highlight--advanced-reset-filters", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Alege intervalul de analiză, participantul sau perioada exactă pentru care vrei să rulezi analiza.",
      },
      {
        label: "2",
        text: "Configurează modelul folosit pentru fiecare semn vital: ritm cardiac, frecvență respiratorie, saturație de oxigen și temperatură.",
      },
      {
        label: "3",
        text: "Folosește filtrele de cohortă pentru a restrânge analiza după vârstă, sex, grup, nivel de activitate, afecțiune sau context de măsurare.",
      },
      {
        label: "4",
        text: "Apasă Rulează analiza după ce ai verificat intervalul, cohorta și modelele selectate.",
      },
      {
        label: "5",
        text: "Folosește Resetază filtrele de cohortă dacă vrei să revii rapid la selecția inițială.",
      },
    ],
  },
  {
    id: "analize-rezultate",
    step: "15",
    title: "Analizează rezultatele generate",
    image: studyAnalysisResultsImage,
    imageAlt: "Rezultatele analizelor predictive dintr-un studiu",
    sectionClassName: "guide-section--study-analysis-results",
    intro: (
      <>
        După rularea analizelor, poți consulta graficele și istoricul rapoartelor
        generate. Această zonă te ajută să identifici participanții sau
        parametrii care necesită atenție.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--analysis-filter", showClick: true },
      { label: "2", className: "guide-highlight--analysis-report-row", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Folosește filtrarea tabelului pentru a restrânge lista rapoartelor afișate.",
      },
      {
        label: "2",
        text: "Selectează o analiză din tabel pentru a deschide raportul predictiv asociat.",
      },
    ],
  },
  {
    id: "raport-analiza-overview",
    step: "16",
    title: "Consultă raportul analizei",
    image: analysisReportOverviewImage,
    imageAlt: "Raportul unei analize predictive",
    sectionClassName: "guide-section--analysis-report-overview",
    intro: (
      <>
        Raportul analizei predictive prezintă contextul rulării, probabilitățile
        estimate, participanții incluși și rezultatele generate. De aici poți
        interpreta nivelul de risc și poți exporta raportul în format PDF.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--report-export", showClick: true },
      { label: "2", className: "guide-highlight--report-context" },
      { label: "3", className: "guide-highlight--report-main-results" },
    ],
    callouts: [
      {
        label: "1",
        text: "Apasă Exportă raport PDF pentru a salva raportul într-un format ușor de distribuit.",
      },
      {
        label: "2",
        text: "Consultă contextul analizei: intervalul analizat, tipul intervalului și criteriile selectate.",
      },
      {
        label: "3",
        text: "Analizează graficul de risc și derulează în interiorul raportului pentru a vedea toți participanții incluși în analiză.",
      },
    ],
  },
    {
    id: "raport-analiza-participant",
    step: "17",
    title: "Interpretează semnele vitale analizate",
    image: analysisReportParticipantImage,
    imageAlt: "Detalii despre semnele vitale analizate pentru participantul selectat",
    sectionClassName: "guide-section--analysis-report-participant",
    intro: (
        <>
        În raport, fiecare participant are rezultate detaliate pentru semnele
        vitale analizate. Cardurile arată probabilitatea estimată de risc,
        modelul predictiv folosit și numărul de înregistrări pe baza cărora a fost
        calculat rezultatul.
        </>
    ),
    highlights: [
        { label: "1", className: "guide-highlight--report-vital-cards" },
    ],
    callouts: [
        {
        label: "1",
        text: "Analizează cardurile pentru fiecare semn vital. Probabilitatea indică riscul estimat, modelul arată algoritmul folosit, iar numărul de înregistrări arată volumul de date pe care s-a bazat rezultatul.",
        },
    ],
    },
  {
    id: "raport-date-observate",
    step: "18",
    title: "Verifică datele observate",
    image: analysisReportObservedDataImage,
    imageAlt: "Date observate folosite în raportul analizei",
    sectionClassName: "guide-section--analysis-report-observed-data",
    intro: (
      <>
        În partea de jos a raportului sunt afișate datele observate transmise de
        participant. Aceste valori reprezintă baza folosită pentru interpretarea
        rezultatului predictiv.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--report-observed-cards" },
      { label: "2", className: "guide-highlight--report-view-all", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Consultă valorile minime, medii și maxime pentru fiecare semn vital.",
      },
      {
        label: "2",
        text: "Apasă Vezi toate datele colectate pentru a deschide lista completă a valorilor.",
      },
    ],
  },
  {
    id: "analize-globale",
    step: "19",
    title: "Monitorizează analizele predictive globale",
    image: globalAnalysesImage,
    imageAlt: "Pagina Analize predictive din interfața cercetătorului",
    sectionClassName: "guide-section--global-analyses",
    intro: (
      <>
        Pagina <strong>Analize predictive</strong> centralizează rezultatele
        generate în toate studiile tale. O poți folosi pentru a vedea rapid
        câte analize au fost rulate, câte rezultate necesită atenție și în ce
        studii apar cele mai multe riscuri.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--global-analysis-filters" },
      { label: "2", className: "guide-highlight--global-analysis-table", showClick: true },
      { label: "3", className: "guide-highlight--global-analysis-refresh", showClick: true },
    ],
    callouts: [
      {
        label: "1",
        text: "Folosește căutarea și filtrele pentru a restrânge rezultatele după studiu sau statusul analizei.",
      },
      {
        label: "2",
        text: "Consultă istoricul analizelor globale și apasă pe un rând din tabel pentru a deschide analiza sau studiul asociat.",
      },
      {
        label: "3",
        text: "Apasă Actualizează pentru a reîncărca cele mai recente rezultate ale analizelor.",
      },
    ],
  },
  {
    id: "activitate-cercetator",
    step: "20",
    title: "Interpretează activitatea după prioritate",
    image: researcherActivityImage,
    imageAlt: "Pagina Activitate din interfața cercetătorului",
    sectionClassName: "guide-section--researcher-activity",
    intro: (
      <>
        Pagina <strong>Activitate</strong> centralizează situațiile care necesită
        atenție în studiile tale. Culorile te ajută să înțelegi rapid prioritatea:
        elementele roșii indică rezultate cu risc, cele portocalii marchează date
        aflate în așteptare, iar cele albastre sunt asociate participanților care
        trebuie urmăriți.
      </>
    ),
    highlights: [
      { label: "1", className: "guide-highlight--activity-alerts" },
      { label: "2", className: "guide-highlight--activity-validate-button", showClick: true },
    ],
    callouts: [
    {
        label: "1",
        text: "Interpretează situațiile după culoare: portocaliu indică date care trebuie validate, roșu semnalează rezultate predictive cu risc ridicat, iar albastru atrage atenția asupra participanților inactivi.",
    },
    {
        label: "2",
        text: "Apasă pe butonul „Validează datele” pentru a deschide direct sesiunea care trebuie verificată.",
    },
    ],
  },
];

export default function ResearcherGuidePage() {
  const navigate = useNavigate();

  return (
    <ResearcherLayout
      activeItem="studii"
      title="Ghid de utilizare"
      subtitle="Găsește rapid pașii de care ai nevoie pentru a utiliza aplicația."
      contentWidth="wide"
      actions={
        <button
          type="button"
          className="researcher-guide-back-btn"
          onClick={() => navigate("/cercetator/studii")}
        >
          <ArrowLeftIcon />
          <span>Înapoi la studii</span>
        </button>
      }
    >
      <div className="researcher-guide-page">
        {guideSections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className={`guide-split-section ${section.sectionClassName}`}
          >
            <div className="guide-section-header">
              <span className="guide-step">{section.step}</span>
              <h3>{section.title}</h3>
            </div>

            <div className="guide-visual-card">
              <div className="guide-browser-frame">
                <div className="guide-browser-bar">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="guide-image-wrap">
                  <img src={section.image} alt={section.imageAlt} />

                  {section.highlights.map((highlight) => (
                    <div
                      key={`${section.id}-${highlight.label}`}
                      className={`guide-highlight ${highlight.className}`}
                    >
                      <span>{highlight.label}</span>

                      {highlight.showClick ? (
                        <span className="guide-click-marker">
                          <ClickIcon />
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="guide-text-card">
              <p>{section.intro}</p>

              <div className="guide-callout-list">
                {section.callouts.map((callout) => (
                  <div key={`${section.id}-callout-${callout.label}`}>
                    <span>{callout.label}</span>
                    <p>{callout.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </ResearcherLayout>
  );
}