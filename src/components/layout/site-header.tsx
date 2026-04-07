import Link from "next/link"
import { SiteLogo } from "@/components/branding/site-logo"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navDefault = [
  { href: "/feed", label: "Impact feed" },
  { href: "/projects", label: "Projects" },
  { href: "/volunteer-map", label: "Volunteer map" },
]

const navNgo = [
  { href: "/projects", label: "Explore projects" },
  { href: "/dashboard/ngo#create-campaign", label: "Create campaign" },
  { href: "/feed", label: "Impact feed" },
  { href: "/dashboard/ngo", label: "NGO dashboard" },
  { href: "/dashboard/brand", label: "Brand dashboard" },
]

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { name: string; role: string; avatar_url: string | null } | null = null
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("name, role, avatar_url")
      .eq("id", user.id)
      .single()
    profile = data as { name: string; role: string; avatar_url: string | null } | null
  }

  const isNgo = profile?.role === "ngo"
  const nav = isNgo ? navNgo : navDefault

  const dash =
    profile?.role === "ngo"
      ? "/dashboard/ngo"
      : profile?.role === "brand"
        ? "/dashboard/brand"
        : profile?.role === "admin"
          ? "/dashboard/admin"
          : null

  /** Single “Dashboard” shortcut; hidden for NGO (nav already has NGO + Brand dashboards). */
  const showDashShortcut = user && dash && !isNgo

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <SiteLogo />

        <nav className="hidden items-center gap-5 lg:flex">
          {nav.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {showDashShortcut && (
                <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                  <Link href={dash!}>Dashboard</Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url ?? user.user_metadata?.avatar_url ?? undefined} alt="" />
                      <AvatarFallback>
                        {(profile?.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">{user.email}</div>
                  <DropdownMenuItem asChild>
                    <Link href="/account">My account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isNgo && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/projects">Explore projects</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/ngo#create-campaign">Create campaign</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/feed">Impact feed</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/ngo">NGO dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/brand">Brand dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {!isNgo && dash && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={dash}>Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <form action={signOut}>
                      <button type="submit" className="w-full text-left">
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="mt-8 flex flex-col gap-4">
                {nav.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className="text-lg font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
                {user && (
                  <Link href="/account" className="text-lg font-medium">
                    My account
                  </Link>
                )}
                {!user && (
                  <Link href="/login" className="text-lg">
                    Log in
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
