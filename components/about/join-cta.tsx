import Link from "next/link"
import { Button } from "@/components/ui/button"

export function JoinCta() {
  return (
    <section aria-labelledby="join-heading" className="w-full bg-background">
      <div className="mx-auto max-w-7xl px-8 py-12 lg:py-16">
        <div className="rounded-lg border bg-card p-8 md:p-10">
          <h2
            id="join-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Join Us
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Be part of a campus-powered marketplace. Create your profile, list your skills, or find the right talent
            today.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href="/auth/signup" aria-label="Create an account on GigCampus">
                Create an Account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
