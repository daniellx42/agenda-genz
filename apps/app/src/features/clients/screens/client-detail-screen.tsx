import { clientDetailQueryOptions } from "../api/client-query-options";
import { ClientAvatar } from "../components/client-avatar";
import { SkeletonBox } from "@/components/ui/skeleton-box";
import {
  formatInstagramHandle,
  openInstagramProfile,
} from "../lib/client-instagram";
import { imageUrlQueryOptions } from "@/lib/api/upload-query-options";
import { useApiError } from "@/hooks/use-api-error";
import { formatCpf, formatPhone } from "@/lib/formatters";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClientGender } from "../types";

function DetailCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="rounded-3xl border border-rose-100 bg-white p-4"
      style={{ opacity: onPress ? 1 : 1 }}
    >
      <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-zinc-400">
        {label}
      </Text>
      <Text className="mt-2 text-sm font-medium text-zinc-900">{value}</Text>
      {onPress ? (
        <Text className="mt-2 text-xs font-semibold text-rose-500">
          Toque para abrir
        </Text>
      ) : null}
    </Pressable>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatGender(value: ClientGender) {
  if (value === "FEMALE") return "Feminino";
  if (value === "MALE") return "Masculino";
  return "Outro";
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showError } = useApiError();

  const { data: client, isLoading } = useQuery(
    clientDetailQueryOptions(id ?? null, showError),
  );

  const { data: profileImageUrl } = useQuery(
    imageUrlQueryOptions(client?.profileImageKey, showError),
  );

  const handleOpenInstagram = async () => {
    if (!client?.instagram) return;
    await openInstagramProfile(client.instagram);
  };

  if (isLoading || !client) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
        <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
          <SkeletonBox style={{ width: 44, height: 44, borderRadius: 22 }} />
          <SkeletonBox style={{ width: 160, height: 18 }} />
          <View className="h-11 w-11" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          <View className="rounded-[32px] border border-rose-100 bg-white p-5">
            <View className="items-center">
              <SkeletonBox style={{ width: 88, height: 88, borderRadius: 44 }} />
              <SkeletonBox style={{ marginTop: 16, width: 180, height: 20 }} />
              <SkeletonBox style={{ marginTop: 10, width: 120, height: 14 }} />
            </View>
          </View>

          <View className="mt-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={index}
                className="rounded-3xl border border-rose-100 bg-white p-4"
              >
                <SkeletonBox style={{ width: 84, height: 12 }} />
                <SkeletonBox style={{ marginTop: 12, width: "72%", height: 16 }} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Feather name="arrow-left" size={18} color="#3f3f46" />
        </Pressable>
        <Text className="text-base font-bold text-zinc-900">
          Detalhes do cliente
        </Text>
        <View className="h-11 w-11" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View className="rounded-[32px] border border-rose-100 bg-white p-5">
          <View className="items-center">
            <ClientAvatar
              name={client.name}
              size={88}
              imageUrl={profileImageUrl}
            />

            <Text className="mt-4 text-lg font-bold text-zinc-900">
              {client.name}
            </Text>
            <Text className="mt-1 text-sm text-zinc-500">
              {formatPhone(client.phone)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push(`/client/${client.id}/appointments` as never)}
          className="mt-4 rounded-[32px] bg-rose-500 p-5 active:opacity-90"
        >
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-rose-100">
                Histórico do cliente
              </Text>
              <Text className="mt-2 text-lg font-bold text-white">
                Ver agendamentos, recebimentos e métricas
              </Text>
              <Text className="mt-2 text-sm leading-6 text-rose-50">
                Abra uma página com todos os agendamentos deste cliente, total
                recebido, valores pendentes e resumo do histórico.
              </Text>
            </View>

            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </View>
          </View>
        </Pressable>

        <View className="mt-4 gap-3">
          <DetailCard label="Telefone" value={formatPhone(client.phone)} />

          {client.email ? (
            <DetailCard label="Email" value={client.email} />
          ) : null}

          {client.instagram ? (
            <DetailCard
              label="Instagram"
              value={formatInstagramHandle(client.instagram)}
              onPress={handleOpenInstagram}
            />
          ) : null}

          {client.cpf ? (
            <DetailCard label="CPF" value={formatCpf(client.cpf)} />
          ) : null}

          {client.address ? (
            <DetailCard label="Endereço" value={client.address} />
          ) : null}

          {client.age ? (
            <DetailCard label="Idade" value={`${client.age} anos`} />
          ) : null}

          {client.gender ? (
            <DetailCard label="Sexo" value={formatGender(client.gender)} />
          ) : null}

          {client.notes ? (
            <View className="rounded-3xl border border-rose-100 bg-white p-4">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-zinc-400">
                Observacoes
              </Text>
              <Text className="mt-2 text-sm leading-6 text-zinc-700">
                {client.notes}
              </Text>
            </View>
          ) : null}

          <View className="rounded-3xl border border-rose-100 bg-white p-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-zinc-400">
              Cadastro
            </Text>
            <Text className="mt-2 text-sm text-zinc-700">
              Criado em {formatDate(client.createdAt)}
            </Text>
            <Text className="mt-1 text-sm text-zinc-500">
              Atualizado em {formatDate(client.updatedAt)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
