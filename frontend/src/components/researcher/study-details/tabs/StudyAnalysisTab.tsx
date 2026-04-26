type StudyAnalysisTabProps = {
  studyId: number;
};

export default function StudyAnalysisTab({ studyId }: StudyAnalysisTabProps) {
  return (
    <div>
      <h2>Analize</h2>
      <p>Tabul Analize funcționează pentru studiul #{studyId}.</p>
    </div>
  );
}