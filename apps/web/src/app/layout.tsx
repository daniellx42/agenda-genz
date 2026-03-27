import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import Header from "@/components/header";
import Providers from "@/components/providers";
import { env } from "@agenda-genz/env/web";
import "../index.css";

const appleTouchIconSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180] as const;

const appleTouchIcons = appleTouchIconSizes.map((size) => ({
  url: `/icons/apple-icon-${size}x${size}.png`,
  sizes: `${size}x${size}`,
  type: "image/png",
}));

const standardIcons = [
  {
    url: "/icons/favicon-16x16.png",
    sizes: "16x16",
    type: "image/png",
  },
  {
    url: "/icons/favicon-32x32.png",
    sizes: "32x32",
    type: "image/png",
  },
  {
    url: "/icons/favicon-96x96.png",
    sizes: "96x96",
    type: "image/png",
  },
  {
    url: "/icons/android-icon-192x192.png",
    sizes: "192x192",
    type: "image/png",
  },
];

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0ff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1028" },
  ],
};

const siteUrl = env.NEXT_PUBLIC_FRONTEND_URL;
const siteName = "Agenda GenZ";
const siteDescription =
  "Aplicativo gratuito de agendamento para nail designers, lash artists, manicures, cabeleireiras e todos os profissionais da beleza. Organize clientes, serviços e horários com facilidade.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | App Gratuito para Profissionais da Beleza`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "app agendamento nail designer",
    "sistema agendamento nail",
    "agenda eletrônica beleza",
    "app gratuito agendamento lash",
    "sistema agendamento profissional beleza",
    "agenda manicure",
    "app cabeleireiro agendamento",
    "software agendamento salão",
    "agenda digital beleza grátis",
    "app agendamento grátis",
    "gestão salão de beleza",
    "agenda online manicure",
  ],
  authors: [{ name: "Agenda GenZ" }],
  creator: "Agenda GenZ",
  publisher: "Agenda GenZ",
  applicationName: siteName,
  category: "productivity",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: standardIcons,
    apple: appleTouchIcons,
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/icons/apple-icon-precomposed.png",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName,
    title: `${siteName} | App Gratuito para Profissionais da Beleza`,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Agenda GenZ — App de agendamento para profissionais da beleza",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | App Gratuito para Profissionais da Beleza`,
    description: siteDescription,
    images: ["/opengraph-image"],
    creator: "@agendagenz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "pt-BR": siteUrl,
    },
  },
  verification: {
    google: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  other: {
    "msapplication-config": "/icons/browserconfig.xml",
    "msapplication-TileColor": "#f5f0ff",
    "msapplication-TileImage": "/icons/ms-icon-144x144.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
