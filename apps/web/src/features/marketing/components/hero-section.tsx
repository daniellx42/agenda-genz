import { Download, Star } from "lucide-react";

import { trackAppleStoreClickAction, trackPlayStoreClickAction } from "@/app/actions/utm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-36">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 size-[400px] -translate-y-1/4 translate-x-1/2 rounded-full bg-chart-1/10 blur-3xl" />
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
        <div className="grid gap-6">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1.5 px-3 py-1 text-xs font-medium">
              <Star className="size-3 fill-primary text-primary" />
              100% gratuito para profissionais
            </Badge>
          </div>

          <div className="grid gap-4">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              Agenda seus{" "}
              <span className="bg-linear-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                clientes com facilidade
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              O aplicativo gratuito para nail designers, lash artists, cabeleireiras e todos os
              profissionais da beleza. Organize horários, clientes e serviços em um só lugar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <form action={trackAppleStoreClickAction}>
              <Button size="lg" type="submit" className="gap-2 shadow-lg shadow-primary/25">
                <Download className="size-4" />
                Baixar no iPhone
              </Button>
            </form>
            <form action={trackPlayStoreClickAction}>
              <Button variant="outline" size="lg" type="submit" className="gap-2">
                <Download className="size-4" />
                Baixar no Android
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-6 border-t border-border/60 pt-6">
            <div className="grid gap-0.5">
              <strong className="text-2xl font-bold">5.000+</strong>
              <p className="text-xs text-muted-foreground">Profissionais ativos</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="grid gap-0.5">
              <strong className="text-2xl font-bold">50.000+</strong>
              <p className="text-xs text-muted-foreground">Agendamentos realizados</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="grid gap-0.5">
              <strong className="text-2xl font-bold">4.9★</strong>
              <p className="text-xs text-muted-foreground">Avaliação média</p>
            </div>
          </div>
        </div>

        {/* App mockup / visual */}
        <div className="relative hidden lg:flex items-center justify-center">
          <div className="relative size-[380px]">
            <div className="absolute inset-0 rounded-[2.5rem] bg-linear-to-br from-primary/20 to-chart-1/20 shadow-2xl" />
            <div className="absolute inset-4 rounded-[2rem] bg-card border border-border/60 shadow-xl overflow-hidden">
              <div className="bg-primary px-6 pt-10 pb-6">
                <p className="text-xs text-primary-foreground/70 font-medium">Hoje, Terça-feira</p>
                <p className="text-2xl font-bold text-primary-foreground mt-1">3 agendamentos</p>
              </div>
              <div className="p-4 grid gap-2">
                {[
                  { name: "Maria Silva", service: "Unhas gel", time: "09:00" },
                  { name: "Ana Costa", service: "Extensão de cílios", time: "11:30" },
                  { name: "Juliana Lima", service: "Manicure + pedicure", time: "14:00" },
                ].map((appt) => (
                  <div
                    key={appt.name}
                    className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {appt.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{appt.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{appt.service}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-primary">{appt.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
