import { NavLink } from "react-router-dom";

const TABS = [
  { key: "rezumat", label: "Rezumat" },
  { key: "participanti", label: "Participanți" },
  { key: "date", label: "Date colectate" },
  { key: "analize", label: "Analize" },
];

type StudyDetailsTabsProps = {
  studyId: number;
};

export default function StudyDetailsTabs({ studyId }: StudyDetailsTabsProps) {
  return (
    <nav className="researcher-study-details-tabs">
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={`/cercetator/studii/${studyId}/${tab.key}`}
          className={({ isActive }) =>
            `researcher-study-details-tab ${isActive ? "is-active" : ""}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}