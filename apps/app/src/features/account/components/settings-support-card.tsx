import { formatPhone } from "@/lib/formatters";
import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

interface SettingsSupportCardProps {
  phone: string;
  onPress: () => void;
}

export function SettingsSupportCard({
  phone,
  onPress,
}: SettingsSupportCardProps) {
  return (
    <View className="rounded-[28px] border border-emerald-100 bg-white p-5">
      <Text className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
        Suporte
      </Text>

      <Text className="mt-3 text-lg font-bold text-zinc-900">
        Fale com a nossa equipe
      </Text>
      <Text className="mt-2 text-sm leading-6 text-zinc-500">
        Se precisar de ajuda, dúvidas ou suporte técnico, fale com a gente
        direto no WhatsApp.
      </Text>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Abrir suporte no WhatsApp"
        className="mt-5 flex-row items-center gap-4 rounded-3xl bg-emerald-50 px-4 py-4 active:opacity-80"
      >
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
          <Feather name="message-circle" size={18} color="#16a34a" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-emerald-700">
            Abrir WhatsApp de suporte
          </Text>
          <Text className="mt-1 text-sm leading-5 text-emerald-600">
            {formatPhone(phone)}
          </Text>
        </View>

        <Feather name="chevron-right" size={18} color="#16a34a" />
      </Pressable>
    </View>
  );
}
