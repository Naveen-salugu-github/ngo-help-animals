import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

export const metadata: Metadata = {
  title: "Terms & Conditions | ImpactBridge",
  description: "Terms of use for ImpactBridge.",
}

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms & Conditions">
      <p>
        By accessing or using ImpactBridge, you agree to these terms. If you do not agree, do not use the service.
      </p>
      <h2 className="!mt-8 text-foreground">The service</h2>
      <p>
        ImpactBridge provides an online marketplace for social impact: NGOs may publish campaigns; users may donate,
        volunteer, and view updates; brands may record sponsorships subject to product rules. We may change features
        with reasonable notice where appropriate.
      </p>
      <h2 className="!mt-8 text-foreground">Accounts</h2>
      <p>
        You must provide accurate information and keep credentials secure. You are responsible for activity under your
        account. We may suspend accounts that violate these terms or harm the community.
      </p>
      <h2 className="!mt-8 text-foreground">NGOs and campaigns</h2>
      <p>
        NGOs are responsible for the accuracy of their campaigns, use of funds, compliance with law, and conduct of
        events. Verification or &quot;active&quot; status on the platform does not replace your own due diligence as
        a donor or volunteer.
      </p>
      <h2 className="!mt-8 text-foreground">Donations and payments</h2>
      <p>
        Payments may be processed by third parties (e.g. Razorpay, Stripe). Their terms apply. Refunds follow the policy
        of the payment provider and the NGO where applicable; ImpactBridge may facilitate communication but is not the
        merchant of record unless explicitly stated.
      </p>
      <h2 className="!mt-8 text-foreground">Limitation of liability</h2>
      <p>
        The service is provided &quot;as is&quot; to the maximum extent permitted by law. We are not liable for indirect
        or consequential damages arising from use of the platform, third-party content, or offline activities organized
        by NGOs.
      </p>
      <h2 className="!mt-8 text-foreground">Contact</h2>
      <p>
        <a href="mailto:support@impactbridge.app" className="text-primary underline">
          support@impactbridge.app
        </a>
      </p>
      <p className="!mt-6 text-xs">Last updated: {new Date().toISOString().slice(0, 10)}. Not legal advice; obtain local review.</p>
    </LegalPageShell>
  )
}
