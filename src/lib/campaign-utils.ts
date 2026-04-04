/** True while campaign is active and event end (if set) is still in the future. */
export function campaignAcceptsOrganizerContact(eventEndAt: string | null | undefined): boolean {
  if (!eventEndAt) return true
  return new Date(eventEndAt) > new Date()
}

/** True when event end time exists and is in the past (feedback window). */
export function eventHasFinished(eventEndAt: string | null | undefined): boolean {
  if (!eventEndAt) return false
  return new Date(eventEndAt) < new Date()
}
