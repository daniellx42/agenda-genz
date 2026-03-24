export const PLAN_DISPLAY: Record<
  string,
  {
    label: string;
    badge?: string;
    highlight?: boolean;
    eyebrow: string;
    description?: string;
  }
> = {
  MONTHLY: {
    label: "Mensal",
    eyebrow: "Mais flexível",
  },
  QUARTERLY: {
    label: "Trimestral",
    badge: "17% off",
    eyebrow: "Equilíbrio",
    description: "Combina economia com um compromisso leve e simples.",
  },
  SEMIANNUAL: {
    label: "Semestral",
    badge: "25% off",
    eyebrow: "Mais tranquilidade",
    description: "Menos preocupação com renovação e mais tempo para atender.",
  },
  ANNUAL: {
    label: "Anual",
    badge: "40% off",
    highlight: true,
    eyebrow: "Mais vantajoso",
    description: "Melhor custo por mês para quem quer previsibilidade o ano todo.",
  },
};
