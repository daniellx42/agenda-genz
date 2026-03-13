const faqs = [
  {
    q: "O app é realmente gratuito?",
    a: "Sim! O app é 100% gratuito para baixar e usar",
  },
  {
    q: "Quantos clientes posso cadastrar?",
    a: "O cadastro é ilimitado.",
  },
  {
    q: "Funciona para quais tipos de profissionais?",
    a: "O app foi desenvolvido para qualquer profissional autônomo da beleza: nail designers, manicures, lash artists, cabeleireiras, barbeiros, massoterapeutas, esteticistas e muito mais.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Todos os dados são armazenados com criptografia. Nunca compartilhamos informações dos seus clientes com terceiros.",
  },
  {
    q: "Posso exportar meus dados?",
    a: "Sim! Você pode exportar sua lista de clientes e agendamentos em formato Excel a qualquer momento.",
  },
] as const;

export default function FaqSection() {
  return (
    <section className="py-20" id="faq">
      <div className="grid gap-12">
        <div className="grid gap-4 text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Perguntas frequentes
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Dúvidas? A gente responde.
          </h2>
        </div>

        <div className="grid gap-3 max-w-3xl mx-auto w-full">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-border/60 bg-card/70 px-6 py-4 transition-all"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold list-none">
                {faq.q}
                <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
