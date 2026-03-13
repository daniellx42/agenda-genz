import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { toast } from "sonner-native";

const SOUND_1H = "agendamento1h.wav";
const SOUND_30MIN = "agendamento30min.wav";
const ANDROID_CHANNEL_1H = "appointment_1h_v2";
const ANDROID_CHANNEL_30MIN = "appointment_30min_v2";

async function fireTestNotification(
  type: "1h" | "30min",
  delaySeconds: number,
) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: requested } =
      await Notifications.requestPermissionsAsync();
    if (requested !== "granted") {
      toast.error("Permissao de notificacao negada.");
      return;
    }
  }

  const is1h = type === "1h";

  await Notifications.scheduleNotificationAsync({
    identifier: `test-${type}-${Date.now()}`,
    content: {
      title: "Lembrete de Agendamento",
      body: is1h
        ? "Voce tem um agendamento em 1 hora."
        : "Voce tem um agendamento em 30 minutos.",
      sound: is1h ? SOUND_1H : SOUND_30MIN,
      data: { test: true, type },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      ...(Platform.OS === "android" && {
        channelId: is1h ? ANDROID_CHANNEL_1H : ANDROID_CHANNEL_30MIN,
      }),
    },
  });
}

async function cancelAllTestNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const testIds = scheduled
    .filter((n) => n.identifier.startsWith("test-"))
    .map((n) => n.identifier);

  await Promise.allSettled(
    testIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id),
    ),
  );

  return testIds.length;
}

interface ActionButtonProps {
  label: string;
  subtitle: string;
  iconName: React.ComponentProps<typeof Feather>["name"];
  iconColor: string;
  iconBg: string;
  onPress: () => void;
  loading: boolean;
  destructive?: boolean;
}

function ActionButton({
  label,
  subtitle,
  iconName,
  iconColor,
  iconBg,
  onPress,
  loading,
  destructive,
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`flex-row items-center gap-4 rounded-3xl px-4 py-4 active:opacity-80 ${destructive ? "bg-red-50" : "bg-[#fff9fb]"}`}
      style={{ opacity: loading ? 0.65 : 1 }}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: iconBg }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Feather name={iconName} size={18} color={iconColor} />
        )}
      </View>

      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${destructive ? "text-red-600" : "text-zinc-900"}`}
        >
          {label}
        </Text>
        <Text
          className={`mt-1 text-sm leading-5 ${destructive ? "text-red-500" : "text-zinc-500"}`}
        >
          {subtitle}
        </Text>
      </View>

      <Feather
        name="chevron-right"
        size={18}
        color={destructive ? "#f87171" : "#a1a1aa"}
      />
    </Pressable>
  );
}

export default function NotificationTestScreen() {
  const router = useRouter();
  const [loading1h5s, setLoading1h5s] = useState(false);
  const [loading30m5s, setLoading30m5s] = useState(false);
  const [loading1h30s, setLoading1h30s] = useState(false);
  const [loading30m30s, setLoading30m30s] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/settings");
  }, [router]);

  const handle = (
    type: "1h" | "30min",
    delay: number,
    setLoading: (v: boolean) => void,
  ) =>
    async () => {
      setLoading(true);
      try {
        await fireTestNotification(type, delay);
        toast.success(
          `Notificacao "${type}" agendada para ${delay} segundo${delay > 1 ? "s" : ""}.`
        );
      } catch {
        toast.error("Erro ao agendar notificacao.");
      } finally {
        setLoading(false);
      }
    };

  const handleCancel = async () => {
    setLoadingCancel(true);
    try {
      const count = await cancelAllTestNotifications();
      toast.success(
        count > 0
          ? `${count} notificacao${count > 1 ? "es canceladas" : " cancelada"}.`
          : "Nenhuma notificacao de teste pendente.",
      );
    } catch {
      toast.error("Erro ao cancelar notificacoes.");
    } finally {
      setLoadingCancel(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Testar Notificacoes",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff9fb" },
          headerTintColor: "#18181b",
          contentStyle: { backgroundColor: "#fff9fb" },
          headerLeft: () => (
            <Pressable
              onPress={handleGoBack}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
            >
              <Feather name="chevron-left" size={20} color="#18181b" />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: "#fff9fb" }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 48,
          gap: 16,
        }}
      >
        <View className="rounded-[28px] border border-rose-100 bg-white p-5">
          <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            Lembrete 1 hora antes
          </Text>
          <Text className="mt-1 mb-4 text-sm text-zinc-500">
            Dispara a notificacao com o som agendamento1h.wav
          </Text>

          <ActionButton
            label="Disparar em 5 segundos"
            subtitle="Tempo para fechar o app e ver chegar"
            iconName="bell"
            iconColor="#18181b"
            iconBg="#f4f4f5"
            onPress={handle("1h", 5, setLoading1h5s)}
            loading={loading1h5s}
          />

          <View className="my-3 h-px bg-rose-100" />

          <ActionButton
            label="Disparar em 30 segundos"
            subtitle="Tempo para colocar o app em background"
            iconName="bell"
            iconColor="#18181b"
            iconBg="#f4f4f5"
            onPress={handle("1h", 30, setLoading1h30s)}
            loading={loading1h30s}
          />
        </View>

        <View className="rounded-[28px] border border-rose-100 bg-white p-5">
          <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            Lembrete 30 minutos antes
          </Text>
          <Text className="mt-1 mb-4 text-sm text-zinc-500">
            Dispara a notificacao com o som agendamento30min.wav
          </Text>

          <ActionButton
            label="Disparar em 5 segundos"
            subtitle="Tempo para fechar o app e ver chegar"
            iconName="bell"
            iconColor="#18181b"
            iconBg="#f4f4f5"
            onPress={handle("30min", 5, setLoading30m5s)}
            loading={loading30m5s}
          />

          <View className="my-3 h-px bg-rose-100" />

          <ActionButton
            label="Disparar em 30 segundos"
            subtitle="Tempo para colocar o app em background"
            iconName="bell"
            iconColor="#18181b"
            iconBg="#f4f4f5"
            onPress={handle("30min", 30, setLoading30m30s)}
            loading={loading30m30s}
          />
        </View>

        <View className="rounded-[28px] border border-rose-100 bg-white p-5">
          <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            Gerenciar
          </Text>

          <ActionButton
            label="Cancelar pendentes"
            subtitle="Remove todas as notificacoes de teste ainda nao disparadas."
            iconName="x-circle"
            iconColor="#ef4444"
            iconBg="#fff1f2"
            onPress={handleCancel}
            loading={loadingCancel}
            destructive
          />
        </View>
      </ScrollView>
    </>
  );
}
