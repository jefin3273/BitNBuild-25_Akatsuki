import Image from "next/image";

export function OurStory() {
  return (
    <section aria-labelledby="our-story-heading" className="w-full border-b bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-12 lg:py-16">
        <div>
          <h2
            id="our-story-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Our Story
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            GigCampus began with a simple idea: campus communities are filled with incredible talent that deserves
            real-world opportunities. We bridge students with jobgivers, from clubs to local businesses..... making it
            easy to collaborate, build portfolios, and earn along the way.
          </p>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
            By focusing on trust, affordability, and growth, we help students turn skills into experience and income,
            while giving jobgivers reliable access to capable, motivated talent right on campus.
          </p>
        </div>

        <figure className="order-first md:order-none">
          {/* Placeholder illustration with descriptive alt */}
          <Image
      src=""
      alt="Illustration of students collaborating on campus projects"
      width={800}
      height={600}
      className="h-auto w-full rounded-lg border bg-card"
    />
          <figcaption className="sr-only">Students collaborating on campus projects</figcaption>
        </figure>
      </div>
    </section>
  )
}
