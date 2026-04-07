import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

export const metadata: Metadata = {
  title: "Cookie Policy | Soul Space",
  description: "How Soul Space uses cookies and similar technologies.",
}

export default function CookiesPage() {
  return (
    <LegalPageShell title="Cookie Policy">
      <p>
        This policy explains how Soul Space uses cookies and similar technologies when you visit our site or use our
        app (including web views).
      </p>
      <h2 className="!mt-8 text-foreground">What are cookies?</h2>
      <p>
        Cookies are small files stored on your device. They help us keep you signed in, remember preferences, protect
        against abuse, and understand how the service is used.
      </p>
      <h2 className="!mt-8 text-foreground">Types we may use</h2>
      <ul>
        <li>
          <strong className="text-foreground">Essential:</strong> session and security cookies required for login and
          core features.
        </li>
        <li>
          <strong className="text-foreground">Functional:</strong> preferences such as theme or language where
          available.
        </li>
        <li>
          <strong className="text-foreground">Analytics:</strong> if enabled, aggregated usage to improve performance
          (configure to your analytics stack).
        </li>
      </ul>
      <h2 className="!mt-8 text-foreground">Your choices</h2>
      <p>
        You can block or delete cookies through your browser settings; some features may not work without essential
        cookies. For mobile apps built with a web view, OS-level controls may apply.
      </p>
      <h2 className="!mt-8 text-foreground">Updates</h2>
      <p>We may update this policy when our practices change. The date below reflects the latest version.</p>
      <p className="!mt-6 text-xs">Last updated: {new Date().toISOString().slice(0, 10)}.</p>
    </LegalPageShell>
  )
}
