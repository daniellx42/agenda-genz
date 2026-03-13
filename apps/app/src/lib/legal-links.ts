import { env } from "@agenda-genz/env/native";
import { Linking } from "react-native";
import { toast } from "sonner-native";

function buildFrontendUrl(path: string): string {
  return `${env.EXPO_PUBLIC_FRONTEND_URL.replace(/\/+$/, "")}${path}`;
}

async function openLegalUrl(path: string, label: string): Promise<void> {
  try {
    await Linking.openURL(buildFrontendUrl(path));
  } catch {
    toast.error(`Não foi possível abrir ${label.toLowerCase()}`);
  }
}

export async function openTermsOfService(): Promise<void> {
  await openLegalUrl("/termos-de-servico", "Termos de Serviço");
}

export async function openPrivacyPolicy(): Promise<void> {
  await openLegalUrl("/politica-de-privacidade", "Política de Privacidade");
}
