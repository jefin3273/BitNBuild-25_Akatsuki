import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const team = [
  { name: "Jefin John", role: "Co-founder & CEO" },
  { name: "Alvin D'souza", role: "Co-founder & Product" },
  { name: "Jayden Colaco", role: "Engineering Lead" },
  { name: "Pratipal Dhaulakhandi", role: "Design Lead" },
] as const

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function Team() {
  return (
    <section aria-labelledby="team-heading" className="w-full border-b bg-background">
      <div className="mx-auto max-w-7xl px-8 py-12 lg:py-16">
        <div className="mb-8">
          <h2
            id="team-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Meet the Team
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            The people building GigCampus and supporting our community.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {team.map((member) => (
            <li key={member.name} className="flex flex-col items-center rounded-lg border bg-card p-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/boyavatar.png" alt={`Avatar of ${member.name}`} />
                <AvatarFallback aria-hidden className="font-medium">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4 text-center">
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
