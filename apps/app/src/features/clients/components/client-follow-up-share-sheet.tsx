import { ClientMessageShareSheet } from "./client-message-share-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

interface ClientFollowUpShareSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  clientName: string;
  lastAppointmentLabel: string;
  highlightLabel: string;
  message: string;
  onChangeMessage: (value: string) => void;
  disableWhatsApp?: boolean;
  onDismiss?: () => void;
  onShareWhatsApp: () => void;
  onShareMore: () => void;
}

export function ClientFollowUpShareSheet({
  sheetRef,
  clientName,
  lastAppointmentLabel,
  highlightLabel,
  message,
  onChangeMessage,
  disableWhatsApp = false,
  onDismiss,
  onShareWhatsApp,
  onShareMore,
}: ClientFollowUpShareSheetProps) {
  return (
    <ClientMessageShareSheet
      sheetRef={sheetRef}
      title="Reativar cliente"
      description="Compartilhe uma mensagem pronta para retomar o contato e convidar a cliente para um novo atendimento."
      clientName={clientName}
      facts={[
        {
          icon: "calendar",
          text: `Último atendimento em ${lastAppointmentLabel}`,
        },
        {
          icon: "message-circle",
          text: "Convite pronto para marcar um novo horário",
        },
      ]}
      highlightLabel={highlightLabel}
      message={message}
      onChangeMessage={onChangeMessage}
      disableWhatsApp={disableWhatsApp}
      onDismiss={onDismiss}
      onShareWhatsApp={onShareWhatsApp}
      onShareMore={onShareMore}
    />
  );
}
