import type { Metadata } from "next"
import { Hero } from "@/components/about/hero"
import { OurStory } from "@/components/about/our-story"
import { MissionVision } from "@/components/about/mission-vision"
import { CoreValues } from "@/components/about/core-values"
import { Team } from "@/components/about/team"
import { JoinCta } from "@/components/about/join-cta"

export const metadata: Metadata = {
  title: "About Us | GigCampus",
  description: "Learn about GigCampus — empowering students and connecting talent.",
}

export default function AboutPage() {
  return (
    <main className="min-h-dvh">
      {/* Hero */}
      <Hero />

      {/* Our Story */}
      <OurStory />

      {/* Mission & Vision */}
      <MissionVision />

      {/* Core Values */}
      <CoreValues />

      {/* Meet the Team */}
      <Team />

      {/* Join CTA */}
      <JoinCta />
    </main>
  )
}
