import { Quote } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "Antes eu usava caderninho e sempre esquecia um cliente ou outro. Com o app, tudo ficou organizado e nunca mais perdi um horário.",
    author: "Camila Rodrigues",
    role: "Nail Designer · São Paulo, SP",
    initial: "C",
  },
  {
    quote:
      "Minha cliente recebe o lembrete automático e quase nunca falta mais. Reduzi 80% das faltas desde que comecei a usar.",
    author: "Fernanda Alves",
    role: "Lash Designer · Curitiba, PR",
    initial: "F",
  },
  {
    quote:
      "Amei a parte do relatório financeiro. Agora sei exatamente quanto faturei no mês e quais serviços vendem mais.",
    author: "Bianca Souza",
    role: "Manicure e Pedicure · Rio de Janeiro, RJ",
    initial: "B",
  },
] as const;

export default function TestimonialsSection() {
  return (
    <section className="py-20" id="depoimentos">
      <div className="grid gap-12">
        <div className="grid gap-4 text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Depoimentos
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            O que nossas profissionais dizem
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.author}
              className="border-border/60 bg-card/70"
            >
              <CardContent className="grid gap-4 pt-6">
                <Quote className="size-6 text-primary/40" />
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {testimonial.initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{testimonial.author}</p>
                    <p className="truncate text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
