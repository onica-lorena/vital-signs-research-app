import type { ParticipantPortalContext } from "./participantStorage";

export function getParticipantNextPath(
  context: ParticipantPortalContext
): string {
  if (context.study.data_entry_mode === "manual") {
    return "/participant/furnizare-date/manual";
  }

  if (context.study.data_entry_mode === "csv") {
    return "/participant/furnizare-date/csv";
  }

  if (context.participant.selected_data_entry_method === "manual") {
    return "/participant/furnizare-date/manual";
  }

  if (context.participant.selected_data_entry_method === "csv") {
    return "/participant/furnizare-date/csv";
  }

  return "/participant/alegere-metoda";
}