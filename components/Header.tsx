"use client";
import Link from "next/link";
import { Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDashboardRedirect = () => {
    if (profile?.role === "client") {
      router.push("/client-dashboard");
    } else if (profile?.role === "freelancer") {
      router.push("/freelancer-dashboard");
    }
  };

  const menuItems = [
    { name: "Features", href: "/#features" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Profile", href: "/profile" },
    { name: "About", href: "/about" },
  ];

  if (loading) {
    return (
      <header>
        <nav className="fixed z-20 w-full px-2">
          <div className="mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12">
            <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                GigCampus
              </Link>
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                GigCampus
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            {/* Mobile menu overlay */}
            {menuState && (
              <div
                className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm lg:hidden"
                onClick={() => setMenuState(false)}
              ></div>
            )}

            {/* Mobile menu content */}
            {menuState && (
              <div className="absolute top-full left-0 right-0 z-20 mt-2 w-full rounded-xl bg-white p-6 shadow-lg lg:hidden">
                <ul className="flex flex-col gap-4">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block py-2 text-lg"
                        onClick={() => setMenuState(false)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t">
                  {user ? (
                    // Signed In
                    <div className="flex flex-col gap-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          handleDashboardRedirect();
                          setMenuState(false);
                        }}
                      >
                        Dashboard
                      </Button>

                      <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <User className="h-4 w-4 mr-2" />
                            {profile?.name || user.email}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-full">
                          <div className="flex flex-col space-y-1 p-2">
                            <p className="text-sm font-medium">
                              {profile?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="text-xs bg-muted px-2 py-1 rounded capitalize">
                              {profile?.role}
                            </p>
                          </div>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              handleDashboardRedirect();
                              setOpen(false);
                              setMenuState(false);
                            }}
                          >
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            onClick={() => setMenuState(false)}
                          >
                            <Link href="/profile">Profile</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    // Signed Out
                    <div className="flex flex-col gap-3">
                      <Button asChild variant="outline" className="w-full">
                        <Link
                          href="/auth/signin"
                          onClick={() => setMenuState(false)}
                        >
                          Sign In
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link
                          href="/auth/signup"
                          onClick={() => setMenuState(false)}
                        >
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Desktop menu */}
            <div
              className={cn(
                "hidden lg:flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit",
                !menuState && "hidden lg:flex"
              )}
            >
              <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ml-auto">
                {user ? (
                  // Signed In
                  <div className="flex gap-3">
                    <div className={cn(isScrolled && "lg:hidden")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDashboardRedirect}
                      >
                        Dashboard
                      </Button>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-2">
                          <User className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">
                            {profile?.name || user.email}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="flex flex-col space-y-1 p-2">
                          <p className="text-sm font-medium">{profile?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                          <p className="text-xs bg-muted px-2 py-1 rounded capitalize">
                            {profile?.role}
                          </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDashboardRedirect}>
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  // Signed Out
                  <>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link href="/auth/signup">Sign Up</Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                    >
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
