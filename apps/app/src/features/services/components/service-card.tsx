import Feather from "@expo/vector-icons/Feather";
import { formatPrice } from "../lib/service-formatters";
import { ServiceImage } from "./service-image";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { ServiceItem } from "../types";

interface ServiceCardProps {
  service: ServiceItem;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (service: ServiceItem) => void;
  onDelete: (service: ServiceItem) => void;
  toggleLoading?: boolean;
  deleting?: boolean;
}

export function ServiceCard({
  service,
  onToggle,
  onEdit,
  onDelete,
  toggleLoading = false,
  deleting = false,
}: ServiceCardProps) {
  const busy = toggleLoading || deleting;

  return (
    <View
      className="mb-2 rounded-2xl border border-rose-100 bg-white p-4"
      style={{ opacity: service.active ? 1 : 0.6 }}
    >
      <View className="flex-row items-center gap-3">
        <ServiceImage
          imageKey={service.imageKey}
          backgroundColor={service.color}
          size={48}
          borderRadius={16}
        />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-zinc-900">
            {service.name}
          </Text>
          {service.description && (
            <Text className="mt-0.5 text-xs text-zinc-400" numberOfLines={1}>
              {service.description}
            </Text>
          )}
          <View className="mt-1 flex-row flex-wrap gap-3">
            <Text className="text-xs font-semibold text-rose-500">
              {formatPrice(service.price)}
            </Text>
            {service.depositPercentage != null && (
              <View className="flex-row items-center gap-1">
                <Feather name="credit-card" size={12} color="#3b82f6" />
                <Text className="text-xs font-medium text-blue-500">
                  {service.depositPercentage}% sinal
                </Text>
              </View>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => onToggle(service.id, !service.active)}
          disabled={busy}
          className="rounded-full border px-3 py-1.5"
          style={{
            borderColor: service.active ? "#d4d4d8" : "#f43f5e",
            backgroundColor: service.active ? "#f4f4f5" : "#fff1f2",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {toggleLoading ? (
            <ActivityIndicator size="small" color="#f43f5e" />
          ) : (
            <Text
              className="text-xs font-semibold"
              style={{ color: service.active ? "#71717a" : "#f43f5e" }}
            >
              {service.active ? "Ativo" : "Inativo"}
            </Text>
          )}
        </Pressable>
      </View>

      <View className="mt-4 flex-row gap-2">
        <Pressable
          onPress={() => onEdit(service)}
          disabled={busy}
          className="flex-1 items-center rounded-2xl bg-zinc-100 py-3 active:opacity-80"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          <View className="flex-row items-center gap-2">
            <Feather name="edit-2" size={14} color="#3f3f46" />
            <Text className="text-sm font-semibold text-zinc-700">Editar</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => onDelete(service)}
          disabled={busy}
          className="flex-1 items-center rounded-2xl bg-red-50 py-3 active:opacity-80"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Feather name="trash-2" size={14} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-500">
                Deletar
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
