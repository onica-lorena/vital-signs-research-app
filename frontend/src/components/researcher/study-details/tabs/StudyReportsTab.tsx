type StudyReportsTabProps = {
  studyId: number;
};

export default function StudyReportsTab({ studyId }: StudyReportsTabProps) {
  return (
    <div>
      <h2>Rapoarte</h2>
      <p>Tabul Rapoarte funcționează pentru studiul #{studyId}.</p>
    </div>
  );
}