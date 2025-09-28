import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MissionVision() {
  return (
    <section aria-labelledby="mission-vision-heading" className="w-full border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <div className="mb-8">
          <h2
            id="mission-vision-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Our Mission & Vision
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Clear goals guide every product decision — from trust and access to long-term student success.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Empower students with real opportunities to learn, earn, and grow by connecting talent and needs within
              campus communities.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Vision</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              A trusted, vibrant ecosystem where every campus becomes a launchpad for skills, careers, and
              collaboration.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
