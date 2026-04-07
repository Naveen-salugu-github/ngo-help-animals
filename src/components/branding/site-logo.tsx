import Image from "next/image"
import Link from "next/link"
import { APP_NAME, LOGO_PATH } from "@/lib/branding"
import { cn } from "@/lib/utils"

type SiteLogoProps = {
  /** e.g. footer: smaller mark */
  size?: "header" | "footer"
  className?: string
}

export function SiteLogo({ size = "header", className }: SiteLogoProps) {
  const isFooter = size === "footer"
  return (
    <Link
      href="/"
      aria-label={`${APP_NAME} home`}
      className={cn(
        "inline-flex shrink-0 items-center",
        isFooter && "rounded-lg bg-[#F2EDE4] px-4 py-2.5",
        className,
      )}
    >
      <Image
        src={LOGO_PATH}
        alt=""
        width={isFooter ? 160 : 200}
        height={isFooter ? 52 : 56}
        className={cn(
          "w-auto object-contain object-left",
          isFooter ? "h-10" : "h-9 max-h-9 sm:h-10 sm:max-h-10",
        )}
        priority={!isFooter}
        sizes="(max-width: 640px) 160px, 200px"
      />
    </Link>
  )
}
