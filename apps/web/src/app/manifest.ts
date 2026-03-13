import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agenda GenZ",
    short_name: "Agenda GenZ",
    description:
      "App gratuito de agendamento para profissionais da beleza: nail designers, lash artists, manicures e mais.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0ff",
    theme_color: "#7c3aed",
    orientation: "portrait",
    categories: ["productivity", "business", "lifestyle"],
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
