import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Wallet, Rocket, TrendingUp } from "lucide-react"

const values = [
  {
    title: "Trust",
    description: "Verified profiles and transparent reviews help ensure reliable collaborations.",
    Icon: ShieldCheck,
  },
  {
    title: "Affordability",
    description: "Flexible, student-friendly pricing delivers value for jobgivers and students.",
    Icon: Wallet,
  },
  {
    title: "Opportunity",
    description: "Real projects to build portfolios, confidence, and professional networks.",
    Icon: Rocket,
  },
  {
    title: "Growth",
    description: "Feedback and mentorship loops turn practice into progress.",
    Icon: TrendingUp,
  },
] as const

export function CoreValues() {
  return (
    <section aria-labelledby="core-values-heading" className="w-full border-b bg-background">
      <div className="mx-auto max-w-7xl px-8 py-12 lg:py-16">
        <div className="mb-8">
          <h2
            id="core-values-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Core Values
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Principles that shape our product and community.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map(({ title, description, Icon }) => (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center gap-3">
                <span aria-hidden="true" className="rounded-md bg-card p-2">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <CardTitle className="text-foreground">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{description}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
