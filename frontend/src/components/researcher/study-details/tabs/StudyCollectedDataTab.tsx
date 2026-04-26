type StudyCollectedDataTabProps = {
  studyId: number;
};

export default function StudyCollectedDataTab({ studyId }: StudyCollectedDataTabProps) {
  return (
    <div>
      <h2>Date colectate</h2>
      <p>Tabul Date colectate funcționează pentru studiul #{studyId}.</p>
    </div>
  );
}