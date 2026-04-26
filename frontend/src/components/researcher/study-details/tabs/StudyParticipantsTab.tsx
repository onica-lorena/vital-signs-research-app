type StudyParticipantsTabProps = {
  studyId: number;
};

export default function StudyParticipantsTab({ studyId }: StudyParticipantsTabProps) {
  return (
    <div>
      <h2>Participanți</h2>
      <p>Tabul Participanți funcționează pentru studiul #{studyId}.</p>
    </div>
  );
}