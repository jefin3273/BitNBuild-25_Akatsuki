import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <header className="w-full border-b bg-background" aria-labelledby="about-hero-heading">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:py-16 md:py-20">
        <h1
          id="about-hero-heading"
          className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl"
        >
          Empowering Students, Connecting Talent.
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          GigCampus is a hyperlocal student freelance hub where students showcase skills and jobgivers find trustworthy,
          affordable help.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/signup" aria-label="Go to Sign Up page">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
