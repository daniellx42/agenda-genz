import { Download } from "lucide-react";

import { trackAppleStoreClickAction, trackPlayStoreClickAction } from "@/app/actions/utm";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
  return (
    <section className="py-20" id="download">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-chart-1 p-10 md:p-16 text-center text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-0 top-0 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-0 bottom-0 size-[300px] translate-x-1/2 translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 grid gap-6 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Comece hoje, é de graça
          </h2>
          <p className="text-lg opacity-90">
            Junte-se a mais de 5.000 profissionais da beleza que já usam o app para organizar
            seus agendamentos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <form action={trackAppleStoreClickAction}>
              <Button
                size="lg"
                type="submit"
                variant="secondary"
                className="gap-2 font-semibold shadow-xl"
              >
                <Download className="size-4" />
                App Store — iPhone
              </Button>
            </form>
            <form action={trackPlayStoreClickAction}>
              <Button
                size="lg"
                type="submit"
                variant="outline"
                className="gap-2 font-semibold border-white/30 bg-white/10 text-white hover:bg-white/20 shadow-xl"
              >
                <Download className="size-4" />
                Google Play — Android
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
