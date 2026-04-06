"use client"

import { Button } from "@/components/ui/button"
import { Share2, MessageCircle, Link2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  url: string
  title: string
  description?: string
}

export function EventShareRow({ url, title, description }: Props) {
  const text = `${title}${description ? `. ${description}` : ""}`.slice(0, 280)
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy")
    }
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => copyLink())
    } else {
      copyLink()
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={nativeShare}>
        <Share2 className="mr-1 h-4 w-4" />
        Share
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
        <a
          href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          WhatsApp
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
        >
          X / Twitter
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
        >
          Facebook
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
        >
          LinkedIn
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={copyLink}>
        <Link2 className="mr-1 h-4 w-4" />
        Copy link
      </Button>
      <p className="w-full text-xs text-muted-foreground">
        Instagram doesn’t support one-tap web sharing. Use <strong>Copy link</strong> and paste in your story or bio.
      </p>
    </div>
  )
}
