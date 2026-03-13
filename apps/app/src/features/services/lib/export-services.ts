import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { toast } from "sonner-native";
import { buildServicesPdfDocument } from "./service-pdf";
import type { ServiceItem } from "../types";

export async function exportServices(
  services: ServiceItem[],
  professionalName: string,
) {
  if (services.length === 0) {
    toast.error("Nenhum serviço disponível para compartilhar.", {
      duration: 5000,
    });
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    toast.error("Compartilhamento não disponível neste dispositivo", {
      duration: 5000,
    });
    return;
  }

  const cacheDirectory = FileSystem.cacheDirectory;

  if (!cacheDirectory) {
    throw new Error("Diretório temporário indisponível para gerar o PDF.");
  }

  const pdfContent = buildServicesPdfDocument(services, professionalName);
  const fileUri = `${cacheDirectory}services-${Date.now()}.pdf`;

  await FileSystem.writeAsStringAsync(fileUri, pdfContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/pdf",
    dialogTitle: "Compartilhar catálogo de serviços",
    UTI: "com.adobe.pdf",
  });
}
