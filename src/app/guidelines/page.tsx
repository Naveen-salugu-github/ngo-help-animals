import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

export const metadata: Metadata = {
  title: "Community Guidelines | ImpactBridge",
  description: "Expected conduct for donors, NGOs, volunteers, and brands on ImpactBridge.",
}

export default function GuidelinesPage() {
  return (
    <LegalPageShell title="Community Guidelines">
      <p>
        ImpactBridge works when everyone, donors, NGOs, volunteers, and brands, acts with honesty and respect. These
        guidelines apply to all roles.
      </p>
      <h2 className="!mt-8 text-foreground">For NGOs</h2>
      <ul>
        <li>Represent your organization and campaigns truthfully; update supporters when plans change.</li>
        <li>Use funds and volunteer time responsibly and in line with what you publish.</li>
        <li>Respect privacy: do not misuse personal data shared through registrations or messages.</li>
      </ul>
      <h2 className="!mt-8 text-foreground">For donors and volunteers</h2>
      <ul>
        <li>Give and participate in good faith; follow event instructions and local laws.</li>
        <li>Feedback and reviews should be factual and constructive.</li>
        <li>Do not harass organizers, other volunteers, or platform staff.</li>
      </ul>
      <h2 className="!mt-8 text-foreground">For brands</h2>
      <ul>
        <li>Sponsorship disclosures should match actual commitments; coordinate with NGOs when co-branding.</li>
        <li>Do not use the platform for unrelated advertising or spam.</li>
      </ul>
      <h2 className="!mt-8 text-foreground">Enforcement</h2>
      <p>
        We may remove content, restrict accounts, or involve authorities for illegal activity, fraud, hate speech, or
        repeated harm. Serious cases may result in permanent removal.
      </p>
      <p className="!mt-6 text-xs">Last updated: {new Date().toISOString().slice(0, 10)}.</p>
    </LegalPageShell>
  )
}
