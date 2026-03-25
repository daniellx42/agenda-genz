import { SelectionSheet } from "@/components/ui/selection-sheet";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

interface SettingsPhotoSourceSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onSelect: (value: "camera" | "gallery") => void;
}

export function SettingsPhotoSourceSheet({
  sheetRef,
  onSelect,
}: SettingsPhotoSourceSheetProps) {
  return (
    <SelectionSheet<"camera" | "gallery">
      sheetRef={sheetRef}
      title="Nova foto de perfil"
      description="Escolha de onde vem a nova foto. Se quiser trocar a atual, remova primeiro e depois adicione outra."
      options={[
        {
          value: "camera",
          title: "Tirar foto",
          description: "Abrir a câmera para capturar uma nova imagem.",
          icon: <Feather name="camera" size={18} color="#f43f5e" />,
        },
        {
          value: "gallery",
          title: "Escolher da galeria",
          description: "Usar uma foto que já está salva no aparelho.",
          icon: <Feather name="image" size={18} color="#f43f5e" />,
        },
      ]}
      onSelect={onSelect}
    />
  );
}
