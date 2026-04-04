import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HeartHandshake, Sparkles } from "lucide-react"

export function DonorQuickActions() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Make an impact</CardTitle>
        <CardDescription>
          NGOs run campaigns here — you can fund existing projects or register as an NGO to publish your own.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1 gap-2">
          <Link href="/projects">
            <HeartHandshake className="h-5 w-5" />
            Donate &amp; support projects
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1 gap-2">
          <Link href="/register?role=ngo">
            <Sparkles className="h-5 w-5" />
            Create a campaign (NGO signup)
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
