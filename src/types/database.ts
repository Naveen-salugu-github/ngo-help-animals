export type UserRole = "donor" | "ngo" | "brand" | "admin"
export type VerificationStatus = "pending" | "verified" | "rejected"
export type ProjectStatus = "draft" | "pending_review" | "active" | "funded" | "closed"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"
export type VolunteerStatus = "rsvp" | "confirmed" | "checked_in" | "cancelled"
export type MediaType = "image" | "video"
export type ImpactModeration = "pending" | "approved" | "rejected"

export type MicroDonationUnit = {
  amount: number
  label: string
}

export type Profile = {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_url: string | null
}

export type Ngo = {
  id: string
  user_id: string
  organization_name: string
  registration_number: string | null
  "80g_status": string | null
  "12a_status": string | null
  pan_number: string | null
  address: string | null
  verification_status: VerificationStatus
  description: string | null
}

export type Project = {
  id: string
  ngo_id: string
  title: string
  description: string
  location: string
  latitude: number | null
  longitude: number | null
  goal_amount: number
  funds_raised: number
  micro_donation_units: MicroDonationUnit[]
  timeline_start: string | null
  timeline_end: string | null
  status: ProjectStatus
  cover_image_url: string | null
  impact_metrics: Record<string, unknown>
  volunteer_slots: number
  volunteer_count: number
  donor_count: number
  beneficiaries_impacted: number
  volunteer_category: string | null
}

export type ImpactUpdate = {
  id: string
  project_id: string
  media_url: string
  media_type: MediaType
  caption: string
  moderation_status: ImpactModeration
  like_count: number
  share_count: number
  created_at: string
}
