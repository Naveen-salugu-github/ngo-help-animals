import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

export const metadata: Metadata = {
  title: "Privacy Policy | ImpactBridge",
  description: "How ImpactBridge collects, uses, and protects your information.",
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p>
        ImpactBridge (&quot;we&quot;, &quot;us&quot;) operates a platform connecting NGOs, donors, volunteers, and
        brands. This policy describes how we handle personal information when you use our website and related services.
      </p>
      <h2 className="!mt-8 text-foreground">Information we collect</h2>
      <ul>
        <li>
          <strong className="text-foreground">Account data:</strong> name, email, and role (e.g. donor, NGO, brand)
          when you register or sign in.
        </li>
        <li>
          <strong className="text-foreground">Profile and content:</strong> organization details, campaign text, photos
          and videos you upload, volunteer registrations, donations metadata, and messages you send through the
          platform.
        </li>
        <li>
          <strong className="text-foreground">Technical data:</strong> IP address, device/browser type, and cookies
          where used for security and basic analytics.
        </li>
      </ul>
      <h2 className="!mt-8 text-foreground">How we use information</h2>
      <p>
        We use data to run accounts, show projects and impact updates, process payments through third-party providers
        you choose, communicate about your activity, improve security, and meet legal obligations.
      </p>
      <h2 className="!mt-8 text-foreground">Sharing</h2>
      <p>
        We may share data with infrastructure providers (e.g. hosting, database, authentication), payment processors,
        and email or messaging services as needed to operate the service. We do not sell your personal information.
      </p>
      <h2 className="!mt-8 text-foreground">Your choices</h2>
      <p>
        You may update profile information where the product allows, contact us to access or delete certain data
        subject to law, and adjust cookie preferences as described in our Cookie Policy.
      </p>
      <h2 className="!mt-8 text-foreground">Contact</h2>
      <p>
        For privacy questions, email{" "}
        <a href="mailto:support@impactbridge.app" className="text-primary underline">
          support@impactbridge.app
        </a>
        . Replace this address with your production support inbox before launch.
      </p>
      <p className="!mt-6 text-xs">Last updated: {new Date().toISOString().slice(0, 10)}. Review with qualified legal counsel for your jurisdiction.</p>
    </LegalPageShell>
  )
}
