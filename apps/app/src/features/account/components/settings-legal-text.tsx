import { Text } from "react-native";

interface SettingsLegalTextProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export function SettingsLegalText({
  onOpenTerms,
  onOpenPrivacy,
}: SettingsLegalTextProps) {
  return (
    <Text className="px-2 text-center text-xs leading-6 text-zinc-400">
      Ao continuar usando o aplicativo, você concorda com nossos{" "}
      <Text
        className="font-semibold text-rose-400"
        accessibilityRole="link"
        onPress={onOpenTerms}
      >
        Termos de Serviço
      </Text>{" "}
      e{" "}
      <Text
        className="font-semibold text-rose-400"
        accessibilityRole="link"
        onPress={onOpenPrivacy}
      >
        Política de Privacidade
      </Text>
      .
    </Text>
  );
}
