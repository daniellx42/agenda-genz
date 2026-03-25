import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface SettingsAppActionsCardProps {
  currentVersion: string | null;
  updateAvailable: boolean;
  checkingForUpdates: boolean;
  onCheckUpdates: () => void;
  onReviewApp: () => void;
}

export function SettingsAppActionsCard({
  currentVersion,
  updateAvailable,
  checkingForUpdates,
  onCheckUpdates,
  onReviewApp,
}: SettingsAppActionsCardProps) {
  const updateLabel = updateAvailable
    ? "Atualizar app"
    : "Verificar atualização";
  const updateDescription = updateAvailable
    ? "Encontramos uma versão mais recente na loja."
    : "Veja se existe uma nova versão publicada na App Store ou Google Play.";

  return (
    <View className="rounded-[28px] border border-amber-100 bg-white p-5">
      <Text className="text-xs font-semibold uppercase tracking-widest text-amber-500">
        Aplicativo
      </Text>

      <Text className="mt-3 text-lg font-bold text-zinc-900">
        Atualizações e avaliação
      </Text>
      <Text className="mt-2 text-sm leading-6 text-zinc-500">
        Versão atual: {currentVersion ?? "indisponível"}
      </Text>

      <View className="mt-5 gap-3">
        <Pressable
          onPress={onCheckUpdates}
          disabled={checkingForUpdates}
          className="flex-row items-center gap-4 rounded-3xl bg-amber-50 px-4 py-4 active:opacity-80"
          style={{ opacity: checkingForUpdates ? 0.7 : 1 }}
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            {checkingForUpdates ? (
              <ActivityIndicator size="small" color="#d97706" />
            ) : (
              <Feather
                name={updateAvailable ? "download-cloud" : "refresh-cw"}
                size={18}
                color="#d97706"
              />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-amber-700">
              {updateLabel}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-amber-600">
              {updateDescription}
            </Text>
          </View>

          <Feather name="chevron-right" size={18} color="#d97706" />
        </Pressable>

        <Pressable
          onPress={onReviewApp}
          className="flex-row items-center gap-4 rounded-3xl bg-zinc-50 px-4 py-4 active:opacity-80"
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            <Feather name="star" size={18} color="#18181b" />
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-zinc-900">
              Avaliar o app
            </Text>
            <Text className="mt-1 text-sm leading-5 text-zinc-500">
              Abrir a avaliação na loja do seu dispositivo.
            </Text>
          </View>

          <Feather name="chevron-right" size={18} color="#18181b" />
        </Pressable>
      </View>
    </View>
  );
}
