import Link from "next/link"
import { Mail, Phone } from "lucide-react"
import { SiteLogo } from "@/components/branding/site-logo"
import { SUPPORT_EMAIL } from "@/lib/branding"

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://www.instagram.com/space_for_animals_?igsh=MWhiY3J1djBrMDE1cg==", Icon: IconInstagram },
  { name: "LinkedIn", href: "https://www.linkedin.com", Icon: IconLinkedin },
  { name: "YouTube", href: "https://www.youtube.com", Icon: IconYoutube },
  { name: "X (Twitter)", href: "https://x.com", Icon: IconX },
  { name: "Facebook", href: "https://www.facebook.com", Icon: IconFacebook },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex justify-center">
          <SiteLogo size="footer" />
        </div>
        <p className="text-center text-xs text-zinc-500 sm:text-sm">
          For queries, partnerships, or support, reach us at:
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
          <a
            href="tel:+9118000000000"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white hover:text-zinc-200 sm:text-xl"
          >
            <Phone className="h-5 w-5 shrink-0" aria-hidden />
            <span>+91 9948636541, +91 8143420710</span>
          </a>
          <span className="hidden h-6 w-px bg-zinc-700 sm:block" aria-hidden />
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white hover:text-zinc-200 sm:text-xl"
          >
            <Mail className="h-5 w-5 shrink-0" aria-hidden />
            <span>{SUPPORT_EMAIL}</span>
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {SOCIAL_LINKS.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              aria-label={name}
              title={name}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-400 sm:text-sm">
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms &amp; Conditions
          </Link>
          <Link href="/cookies" className="hover:text-white">
            Cookie Policy
          </Link>
          <Link href="/guidelines" className="hover:text-white">
            Community Guidelines
          </Link>
        </nav>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 text-[10px] text-zinc-600 sm:flex-row sm:text-xs">
          <p>© {new Date().getFullYear()} Soul Space. All rights reserved.</p>
          <p className="max-w-md text-center sm:text-right">
            Campaigns and impact posts are published by partner organizations. Numbers and images are as reported by
            NGOs; verify directly with the organizer when needed.
          </p>
        </div>
      </div>
    </footer>
  )
}
