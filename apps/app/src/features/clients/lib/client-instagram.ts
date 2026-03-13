import { formatInstagramDisplay, normalizeInstagram } from "@/lib/formatters";
import { Linking } from "react-native";
import { toast } from "sonner-native";

export function normalizeInstagramHandle(value: string): string {
  return normalizeInstagram(value);
}

export function formatInstagramHandle(value: string): string {
  return formatInstagramDisplay(value);
}

export async function openInstagramProfile(handle: string): Promise<void> {
  const normalizedHandle = normalizeInstagramHandle(handle);

  if (!normalizedHandle) {
    toast.error("Instagram invalido");
    return;
  }

  const url = `https://www.instagram.com/${normalizedHandle}/`;

  try {
    await Linking.openURL(url);
  } catch {
    toast.error("Nao foi possivel abrir o Instagram");
  }
}
