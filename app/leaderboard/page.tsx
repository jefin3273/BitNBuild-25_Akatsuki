import type { Metadata } from "next";
import FreelancerLeaderboard from "@/components/freelancer-leaderboard";
import data from "./data.json";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Leaderboard | GigCampus",
  description:
    "See the top freelancers on GigCampus ranked by completed gigs, ratings, and earnings.",
};

export default function LeaderboardPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SidebarInset>
        <main className="min-h-dvh">
          <div className="flex flex-col gap-6 py-27 px-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                🎉 GigCampus Freelancer Leaderboard
              </h1>
              <p className="mt-2 text-muted-foreground">
                Celebrating the top freelancers by gigs completed, average
                ratings, and total earnings.
              </p>
            </div>
            <div className="sm:w-[80%] mx-auto w-[90%]">
              <FreelancerLeaderboard data={data} />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
