import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { formatPhone } from "@/lib/formatters";
import { useResolvedImage } from "@/lib/media/use-resolved-image";
import { Pressable, Text, View } from "react-native";
import { ClientAvatar } from "./client-avatar";
import {
  formatInstagramHandle,
  openInstagramProfile,
} from "../lib/client-instagram";
import { getClientBirthdayListBadge } from "../lib/client-birthday";
import { formatDaysLabel, getDaysSince } from "../lib/client-relative-time";
import { openWhatsApp } from "../lib/client-whatsapp";
import type { ClientItem } from "../types";

interface ClientCardProps {
  client: ClientItem;
  onEdit: () => void;
  onDelete: () => void;
  onOpenFollowUpShare: () => void;
}

export function ClientCard({
  client,
  onEdit,
  onDelete,
  onOpenFollowUpShare,
}: ClientCardProps) {
  const router = useRouter();
  const { imageUrl: profileImageUrl } = useResolvedImage({
    imageKey: client.profileImageKey,
  });
  const birthdayBadge = client.birthDate
    ? getClientBirthdayListBadge(client.birthDate)
    : null;
  const lastCompletedAppointmentDays = client.lastCompletedAppointmentDate
    ? getDaysSince(client.lastCompletedAppointmentDate)
    : null;

  return (
    <View className="mb-2 overflow-hidden rounded-2xl border border-rose-100 bg-white">
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/client/[id]",
            params: { id: client.id },
          })
        }
        className="p-4 active:opacity-80"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 flex-row items-start gap-3">
            <ClientAvatar
              name={client.name}
              imageUrl={profileImageUrl}
              imageCacheKey={client.profileImageKey}
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-zinc-900">
                {client.name}
              </Text>
              {client.notes ? (
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  className="mt-1 text-xs leading-4 text-zinc-400"
                >
                  {client.notes}
                </Text>
              ) : null}
              <Text className="mt-1.5 text-xs text-zinc-500">
                Toque para abrir os detalhes
              </Text>
            </View>
          </View>

          <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-50">
            <Feather name="chevron-right" size={18} color="#f43f5e" />
          </View>
        </View>
      </Pressable>

      <View className="border-t border-rose-100 px-4 py-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => void openWhatsApp(client.phone)}
              className="self-start rounded-full bg-emerald-50 px-3 py-1.5 active:opacity-80"
            >
              <Text className="text-xs font-semibold text-emerald-600">
                {formatPhone(client.phone)}
              </Text>
            </Pressable>

            {client.instagram ? (
              <Pressable
                onPress={() => {
                  if (!client.instagram) return;
                  void openInstagramProfile(client.instagram);
                }}
                className="self-start rounded-full bg-rose-50 px-3 py-1.5 active:opacity-80"
              >
                <Text className="text-xs font-semibold text-rose-500">
                  {formatInstagramHandle(client.instagram)}
                </Text>
              </Pressable>
            ) : null}

            {birthdayBadge ? (
              <View
                className={`flex-row items-center gap-1.5 self-start rounded-2xl px-3 py-1.5 ${
                  birthdayBadge.tone === "red" ? "bg-red-50" : "bg-sky-50"
                }`}
              >
                <Feather
                  name={birthdayBadge.tone === "red" ? "gift" : "calendar"}
                  size={12}
                  color={birthdayBadge.tone === "red" ? "#dc2626" : "#0284c7"}
                />
                <Text
                  className={`text-xs font-semibold ${
                    birthdayBadge.tone === "red" ? "text-red-600" : "text-sky-700"
                  }`}
                >
                  {birthdayBadge.label}
                </Text>
              </View>
            ) : null}

            {lastCompletedAppointmentDays !== null ? (
              <Pressable
                onPress={onOpenFollowUpShare}
                className="flex-row items-center gap-1.5 self-start rounded-2xl bg-sky-50 px-3 py-1.5 active:opacity-80"
              >
                <Feather name="info" size={12} color="#0284c7" />
                <Text className="text-xs font-semibold text-sky-700">
                  {formatDaysLabel(lastCompletedAppointmentDays)} desde o último atendimento
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={onEdit}
              className="h-8 w-8 items-center justify-center rounded-full bg-zinc-100 active:opacity-70"
            >
              <Feather name="edit-2" size={14} color="#52525b" />
            </Pressable>
            <Pressable
              onPress={onDelete}
              className="h-8 w-8 items-center justify-center rounded-full bg-red-50 active:opacity-70"
            >
              <Feather name="trash-2" size={14} color="#ef4444" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
