import { ArrowLeft, Clock3, Scale, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LegalSection = {
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
  note?: string;
};

type LegalPageShellProps = {
  badge: string;
  title: string;
  description: string;
  updatedAt: string;
  currentPath: string;
  sections: readonly LegalSection[];
};

const relatedPages = [
  { href: "/termos-de-servico", label: "Termos de Serviço" },
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
];

export default function LegalPageShell({
  badge,
  title,
  description,
  updatedAt,
  currentPath,
  sections,
}: LegalPageShellProps) {
  return (
    <main className="mx-auto grid w-full max-w-4xl gap-8 pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/85 shadow-lg shadow-primary/5 backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-16 top-0 size-56 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-48 rounded-full bg-chart-1/12 blur-3xl" />
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              <ShieldCheck className="size-3.5" />
              {badge}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              Atualizado em {updatedAt}
            </span>
          </div>

          <div className="grid gap-4">
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="size-4" />
              Voltar para o início
            </Link>

            {relatedPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  currentPath === page.href
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 bg-background/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <Scale className="size-4" />
                {page.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-[1.75rem] border border-border/60 bg-card/85 p-6 shadow-sm shadow-primary/5 backdrop-blur-sm sm:p-8"
          >
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>

              <div className="grid gap-4 text-sm leading-7 text-muted-foreground sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.items ? (
                  <ul className="grid gap-3 pl-5">
                    {section.items.map((item) => (
                      <li key={item} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.note ? (
                  <p className="rounded-2xl border border-border/70 bg-muted/70 px-4 py-3 text-foreground/85">
                    {section.note}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-[1.75rem] border border-border/60 bg-secondary/45 p-6 sm:p-8">
        <div className="grid gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Contato e atualizações</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Estes documentos podem ser atualizados para refletir ajustes legais, operacionais ou
            evoluções do produto. Quando houver mudanças relevantes, a versão mais recente ficará
            disponível nesta área do site e, quando cabível, poderá ser comunicada pelos canais
            oficiais da plataforma.
          </p>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Para dúvidas relacionadas a estes documentos, privacidade ou tratamento de dados, use
            os canais oficiais de atendimento disponibilizados no aplicativo, no painel da conta ou
            no site institucional.
          </p>
        </div>
      </section>
    </main>
  );
}
