"use client";

import { CalendarHeart, Home, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const navLinks = [
  { to: "/", label: "Início", icon: Home },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = isAdminRole(userRole);

  const links = [
    ...navLinks,
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  const isLandingPage = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-primary shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
            <CalendarHeart className="size-5 text-primary-foreground" />
          </div>
          <div className="grid gap-0">
            <p className="text-sm font-bold leading-none tracking-tight pb-0.5">Agendar GenZ</p>
            <p className="text-[10px] leading-none text-muted-foreground">para profissionais</p>
          </div>
        </Link>

        {/* Desktop navigation */}
        {isLandingPage ? (
          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#funcionalidades"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
            >
              Funcionalidades
            </a>
            <a
              href="#como-funciona"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
            >
              Como funciona
            </a>
            <a
              href="#faq"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
            >
              FAQ
            </a>
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
              >
                <ShieldCheck className="size-4" />
                Admin
              </Link>
            )}
          </nav>
        ) : (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                href={to}
                className={cn(
                  buttonVariants({
                    variant: pathname === to || pathname.startsWith(`${to}/`) ? "default" : "ghost",
                    size: "sm",
                  }),
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          {session ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "shadow-md shadow-primary/20",
              )}
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
