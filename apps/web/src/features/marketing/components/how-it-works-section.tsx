import { CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Baixe o app",
    description:
      "Disponível gratuitamente na App Store e Google Play. Instale em menos de 1 minuto.",
    details: ["Sem cartão de crédito", "Aplicativo grátis", "Sem limite de clientes"],
  },
  {
    number: "02",
    title: "Configure seus serviços",
    description:
      "Cadastre seus serviços, preços e horários de trabalho. Leva menos de 5 minutos.",
    details: ["Preços personalizados", "Duração por serviço", "Horários flexíveis"],
  },
  {
    number: "03",
    title: "Comece a agendar",
    description:
      "Compartilhe seu link de agendamento com os clientes e gerencie tudo pelo app.",
    details: ["Link de agendamento", "Confirmação automática", "Lembretes por WhatsApp"],
  },
] as const;

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted/30 rounded-3xl px-8 md:px-12" id="como-funciona">
      <div className="grid gap-12">
        <div className="grid gap-4 text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Como funciona
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simples assim
          </h2>
          <p className="text-lg text-muted-foreground">
            Em 3 passos você já está agendando e organizando seus clientes.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative grid gap-4">
              {index < steps.length - 1 && (
                <div className="absolute left-[3.25rem] top-8 hidden h-px w-[calc(100%-2rem)] border-t border-dashed border-border md:block" />
              )}
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  {step.number}
                </div>
              </div>
              <div className="grid gap-2">
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
              <ul className="grid gap-1.5">
                {step.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="size-4 shrink-0 text-primary" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
