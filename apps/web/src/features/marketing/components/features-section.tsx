import {
  Bell,
  Calendar,
  ChartBar,
  CreditCard,
  Smartphone,
  Users,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description:
      "Visualize todos os seus horários em uma agenda bonita e fácil de usar. Nunca mais esqueça um cliente.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Users,
    title: "Gestão de clientes",
    description:
      "Cadastre clientes, veja o histórico de atendimentos, aniversários e preferências de cada um.",
    color: "text-chart-1 bg-chart-1/10",
  },
  {
    icon: Bell,
    title: "Lembretes automáticos",
    description:
      "Envie lembretes automáticos para seus clientes e reduza o número de faltas e cancelamentos.",
    color: "text-chart-3 bg-chart-3/10",
  },
  {
    icon: CreditCard,
    title: "Controle financeiro",
    description:
      "Acompanhe faturamento, serviços realizados e receba pagamentos de forma organizada.",
    color: "text-chart-4 bg-chart-4/10",
  },
  {
    icon: ChartBar,
    title: "Relatórios detalhados",
    description:
      "Veja quais serviços mais vendem, horários de pico e o crescimento do seu negócio.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Smartphone,
    title: "iOS e Android",
    description:
      "Disponível no iPhone e Android. Acesse de qualquer lugar, mesmo sem internet.",
    color: "text-chart-2 bg-chart-2/10",
  },
] as const;

export default function FeaturesSection() {
  return (
    <section className="py-20" id="funcionalidades">
      <div className="grid gap-12">
        <div className="grid gap-4 text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Funcionalidades
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Tudo que você precisa para crescer
          </h2>
          <p className="text-lg text-muted-foreground">
            Desenvolvido especialmente para profissionais autônomos da beleza que querem
            organizar o negócio sem complicação.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="border-border/60 bg-card/70 transition-shadow hover:shadow-md"
              >
                <CardHeader className="gap-3">
                  <div className={`flex size-11 items-center justify-center rounded-2xl ${feature.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
