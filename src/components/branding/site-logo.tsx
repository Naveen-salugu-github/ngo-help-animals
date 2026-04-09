import Image from "next/image"
import Link from "next/link"
import { APP_NAME, LOGO_PATH } from "@/lib/branding"
import { cn } from "@/lib/utils"

type SiteLogoProps = {
  /** Footer: slightly smaller than header but still prominent */
  size?: "header" | "footer"
  className?: string
}

/** Source asset is 1024×1024; layout uses object-contain so the mark + wordmark scale clearly. */
const LOGO_INTRINSIC = { width: 1024, height: 1024 }

export function SiteLogo({ size = "header", className }: SiteLogoProps) {
  const isFooter = size === "footer"
  return (
    <Link
      href="/"
      aria-label={`${APP_NAME} home`}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <Image
        src={LOGO_PATH}
        alt={APP_NAME}
        width={LOGO_INTRINSIC.width}
        height={LOGO_INTRINSIC.height}
        className={cn(
          "w-auto object-contain object-left",
          isFooter
            ? "h-[4.5rem] max-h-[4.5rem] max-w-[min(100vw-2rem,22rem)] sm:h-24 sm:max-h-24 sm:max-w-[min(100vw-2rem,28rem)]"
            : "h-[4.25rem] max-h-[4.25rem] max-w-[min(100vw-5rem,24rem)] sm:h-[4.75rem] sm:max-h-[4.75rem] sm:max-w-[min(100vw-8rem,30rem)]",
        )}
        priority={!isFooter}
        sizes="(max-width: 640px) 90vw, 30rem"
      />
    </Link>
  )
}
