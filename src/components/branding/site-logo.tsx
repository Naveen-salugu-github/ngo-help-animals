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
        width={isFooter ? 272 : 340}
        height={isFooter ? 89 : 96}
        className={cn(
          "w-auto max-w-[min(100vw-8rem,24rem)] object-contain object-left",
          isFooter
            ? "h-[52px] max-h-[52px] sm:h-14 sm:max-h-14"
            : "h-14 max-h-14 sm:h-16 sm:max-h-16",
        )}
        priority={!isFooter}
        sizes="(max-width: 640px) 272px, 340px"
      />
    </Link>
  )
}
