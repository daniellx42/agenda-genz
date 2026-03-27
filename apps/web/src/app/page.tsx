import type { Metadata } from "next";

import UtmLandingTracker from "@/components/utm/utm-landing-tracker";
import CtaSection from "@/features/marketing/components/cta-section";
import FaqSection from "@/features/marketing/components/faq-section";
import FeaturesSection from "@/features/marketing/components/features-section";
import MarketingFooter from "@/features/marketing/components/footer";
import HeroSection from "@/features/marketing/components/hero-section";
import HowItWorksSection from "@/features/marketing/components/how-it-works-section";
import TestimonialsSection from "@/features/marketing/components/testimonials-section";

export const metadata: Metadata = {
  title: "App Gratuito de Agendamento para Profissionais da Beleza",
  description:
    "Organize seus agendamentos, clientes e serviços com o Agenda GenZ. Aplicativo gratuito para nail designers, lash artists, manicures e todos os profissionais da beleza.",
  openGraph: {
    title: "Agenda GenZ | App Gratuito para Profissionais da Beleza",
    description:
      "Organize seus agendamentos, clientes e serviços com o Agenda GenZ. Aplicativo gratuito para nail designers, lash artists, manicures e todos os profissionais da beleza.",
  },
};

// JSON-LD: FAQ schema for rich snippets / featured snippets in Google
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "O app é realmente gratuito?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim! O app é 100% gratuito para baixar e usar.",
      },
    },
    {
      "@type": "Question",
      name: "Para quais profissionais da beleza o app funciona?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "O Agenda GenZ funciona para nail designers, manicures, lash artists, extensionistas de cílios, cabeleireiras, barbeiros, massoterapeutas, esteticistas e todos os profissionais autônomos da beleza.",
      },
    },
    {
      "@type": "Question",
      name: "Preciso de internet para usar o app de agendamento?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "O app funciona offline para a maioria das funções. Para sincronização e lembretes automáticos, uma conexão à internet é necessária.",
      },
    },
    {
      "@type": "Question",
      name: "O app de agendamento para nail designer está disponível para iPhone e Android?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim. O Agenda GenZ está disponível gratuitamente na App Store (iPhone) e Google Play (Android).",
      },
    },
  ],
};

// JSON-LD: SoftwareApplication schema
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Agenda GenZ",
  applicationCategory: "BusinessApplication",
  operatingSystem: "iOS, Android",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "1200",
  },
  description:
    "Aplicativo gratuito de agendamento para profissionais da beleza: nail designers, lash artists, manicures, cabeleireiras e mais.",
  screenshot: "/screenshots/app-screenshot.png",
  featureList: [
    "Agendamento de clientes",
    "Lembretes automáticos por WhatsApp",
    "Gestão de serviços e preços",
    "Controle financeiro",
    "Histórico de clientes",
    "Exportação de dados em Excel",
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <UtmLandingTracker />
      <main className="grid w-full gap-0">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CtaSection />
        <FaqSection />
        <MarketingFooter />
      </main>
    </>
  );
}
