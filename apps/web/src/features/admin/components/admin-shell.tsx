"use client";

import { Megaphone, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const adminLinks = [
  {
    href: "/admin/utm",
    label: "UTM",
    description: "Campanhas, atribuição e URLs rastreadas",
    icon: Megaphone,
  },
  {
    href: "/admin/referral-withdrawal",
    label: "Saques de convite",
    description: "Pedidos Pix, filtros e atualização de status",
    icon: Wallet,
  },
] as const;

type AdminShellProps = {
  children: React.ReactNode;
  userName: string;
};

export function AdminShell({ children, userName }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="grid w-full gap-6">
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-2">
              <Badge variant="outline">Admin</Badge>
              <CardTitle className="text-xl sm:text-2xl">Área administrativa</CardTitle>
              <CardDescription>
                Bem-vindo, {userName}. Escolha uma operação abaixo para acompanhar os dados do app.
              </CardDescription>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {adminLinks.map(({ href, label, description, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({
                    variant: isActive ? "default" : "outline",
                    size: "lg",
                  }),
                  "h-auto min-w-[220px] items-start justify-start gap-3 rounded-2xl px-4 py-3 text-left",
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold">{label}</span>
                  <span
                    className={cn(
                      "text-[11px] leading-relaxed",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {description}
                  </span>
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
