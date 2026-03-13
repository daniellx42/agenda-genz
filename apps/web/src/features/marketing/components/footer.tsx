import Link from "next/link";

const links = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "FAQ", href: "#faq" },
  { label: "Download", href: "#download" },
  { label: "Termos de Serviço", href: "/termos-de-servico" },
  { label: "Política de Privacidade", href: "/politica-de-privacidade" },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="grid gap-6 sm:flex sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <p className="font-semibold text-sm">Agenda GenZ</p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} · Todos os direitos reservados
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          Feito com 💜 para profissionais da beleza
        </p>
      </div>
    </footer>
  );
}
