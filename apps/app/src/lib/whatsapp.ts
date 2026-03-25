import { normalizePhone } from "@/lib/formatters";
import { Linking } from "react-native";
import { toast } from "sonner-native";

export async function openWhatsApp(
  phone: string,
  message?: string,
): Promise<void> {
  const digits = normalizePhone(phone);

  if (!digits) {
    toast.error("Telefone inválido");
    return;
  }

  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const encodedMessage = message
    ? `?text=${encodeURIComponent(message)}`
    : "";
  const url = `https://wa.me/${number}${encodedMessage}`;

  try {
    await Linking.openURL(url);
  } catch {
    toast.error("Não foi possível abrir o WhatsApp");
  }
}
