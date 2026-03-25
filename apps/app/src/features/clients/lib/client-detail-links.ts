import type { ComponentProps } from "react";
import { Linking, Platform } from "react-native";
import { toast } from "sonner-native";
import Feather from "@expo/vector-icons/Feather";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

export type ClientEmailAppOption = "default_mail" | "gmail" | "outlook";
export type ClientMapAppOption = "device_maps" | "google_maps" | "waze" | "browser";

export interface ClientDetailExternalOption<TValue extends string> {
  value: TValue;
  title: string;
  description: string;
  iconName: FeatherIconName;
}

function normalizeValue(value: string) {
  return value.trim();
}

async function openFirstAvailableUrl(urls: string[]) {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

export function getEmailAppOptions(): ClientDetailExternalOption<ClientEmailAppOption>[] {
  return [
    {
      value: "default_mail",
      title: Platform.OS === "ios" ? "Mail do iPhone" : "Email do aparelho",
      description: "Abre o app de email padrão configurado no telefone.",
      iconName: "mail",
    },
    {
      value: "gmail",
      title: "Gmail",
      description: "Tenta abrir direto no Gmail, se ele estiver instalado.",
      iconName: "send",
    },
    {
      value: "outlook",
      title: "Outlook",
      description: "Usa o Outlook se ele estiver disponível no aparelho.",
      iconName: "inbox",
    },
  ];
}

export async function openEmailApp(
  option: ClientEmailAppOption,
  email: string,
): Promise<void> {
  const normalizedEmail = normalizeValue(email);

  if (!normalizedEmail) {
    toast.error("Email inválido");
    return;
  }

  const encodedEmail = encodeURIComponent(normalizedEmail);
  const defaultMailUrl = `mailto:${encodedEmail}`;

  const urls =
    option === "gmail"
      ? [`googlegmail://co?to=${encodedEmail}`, defaultMailUrl]
      : option === "outlook"
        ? [`ms-outlook://compose?to=${encodedEmail}`, defaultMailUrl]
        : [defaultMailUrl];

  const opened = await openFirstAvailableUrl(urls);

  if (!opened) {
    toast.error("Não foi possível abrir um app de email");
  }
}

export function getMapAppOptions(): ClientDetailExternalOption<ClientMapAppOption>[] {
  return [
    {
      value: "device_maps",
      title: Platform.OS === "ios" ? "Mapas do iPhone" : "Mapa do aparelho",
      description:
        Platform.OS === "ios"
          ? "Abre direto no Apple Maps."
          : "Usa o app de mapas padrão ou o seletor do Android.",
      iconName: "map-pin",
    },
    {
      value: "google_maps",
      title: "Google Maps",
      description: "Tenta abrir o endereço no Google Maps.",
      iconName: "navigation",
    },
    {
      value: "waze",
      title: "Waze",
      description: "Abre no Waze com a busca do endereço pronta.",
      iconName: "compass",
    },
    {
      value: "browser",
      title: "Outro mapa ou navegador",
      description: "Abre a busca no navegador para usar outra opção.",
      iconName: "external-link",
    },
  ];
}

export async function openMapApp(
  option: ClientMapAppOption,
  address: string,
): Promise<void> {
  const normalizedAddress = normalizeValue(address);

  if (!normalizedAddress) {
    toast.error("Endereço inválido");
    return;
  }

  const encodedAddress = encodeURIComponent(normalizedAddress);
  const browserUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  const urls =
    option === "google_maps"
      ? Platform.OS === "ios"
        ? [`comgooglemaps://?q=${encodedAddress}`, browserUrl]
        : [`google.navigation:q=${encodedAddress}`, `geo:0,0?q=${encodedAddress}`, browserUrl]
      : option === "waze"
        ? [`waze://?q=${encodedAddress}&navigate=yes`, `https://waze.com/ul?q=${encodedAddress}&navigate=yes`]
        : option === "browser"
          ? [browserUrl]
          : Platform.OS === "ios"
            ? [`http://maps.apple.com/?q=${encodedAddress}`]
            : [`geo:0,0?q=${encodedAddress}`, browserUrl];

  const opened = await openFirstAvailableUrl(urls);

  if (!opened) {
    toast.error("Não foi possível abrir um app de mapas");
  }
}
