import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { imageUrlQueryOptions } from "@/lib/api/upload-query-options";
import { useApiError } from "@/hooks/use-api-error";
import { formatPhone } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";
import { ClientAvatar } from "./client-avatar";
import {
  formatInstagramHandle,
  openInstagramProfile,
} from "../lib/client-instagram";
import { openWhatsApp } from "../lib/client-whatsapp";
import type { ClientItem } from "../types";

interface ClientCardProps {
  client: ClientItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const router = useRouter();
  const { showError } = useApiError();
  const { data: profileImageUrl } = useQuery(
    imageUrlQueryOptions(client.profileImageKey, showError),
  );

  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4">
      <View className="flex-1">
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/client/[id]",
              params: { id: client.id },
            })
          }
          className="flex-row items-center gap-3 active:opacity-80"
        >
          <ClientAvatar name={client.name} imageUrl={profileImageUrl} />
          <Text className="text-sm font-semibold text-zinc-900">
            {client.name}
          </Text>
        </Pressable>

        <View className="mt-2 flex-row flex-wrap gap-2">
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
        </View>
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
  );
}
