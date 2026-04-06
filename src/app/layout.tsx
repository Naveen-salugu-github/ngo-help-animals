import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/layout/site-header"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

export const metadata: Metadata = {
  title: "ImpactBridge | Social impact marketplace",
  description:
    "Connect NGOs, donors, volunteers, and brands. Fund verified impact projects and follow transparent outcomes.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <SiteHeader />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
