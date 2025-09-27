"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserButton,
  OrganizationSwitcher,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  SignIn,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
};

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold">
            GigCampus
          </Link>
          <SignedIn>
            <nav className="hidden gap-1 sm:flex">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/admin">Admin</NavLink>
            </nav>
          </SignedIn>
        </div>
        <div className="flex items-center gap-3">
          <SignedIn>
            <OrganizationSwitcher
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "rounded-md border px-2 py-1",
                },
              }}
              hidePersonal
            />
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Button asChild size="sm">
              <SignInButton />
              {/* <Link href="/sign-in">Sign in</Link> */}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <SignUpButton />
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
