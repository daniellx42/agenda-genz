import { SelectionSheet } from "@/components/ui/selection-sheet";
import { SkeletonBox } from "@/components/ui/skeleton-box";
import { useApiError } from "@/hooks/use-api-error";
import { formatCpf, formatPhone } from "@/lib/formatters";
import { useResolvedImage } from "@/lib/media/use-resolved-image";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clientDetailQueryOptions } from "../api/client-query-options";
import { ClientAvatar } from "../components/client-avatar";
import { ClientBirthdayHighlightCard } from "../components/client-birthday-highlight-card";
import {
  ClientDetailInfoCard,
  type ClientDetailInfoAction,
  type ClientDetailInfoRow,
} from "../components/client-detail-info-card";
import { ClientMessageShareSheet } from "../components/client-message-share-sheet";
import {
  formatInstagramHandle,
  openInstagramProfile,
} from "../lib/client-instagram";
import {
  getEmailAppOptions,
  getMapAppOptions,
  openEmailApp,
  openMapApp,
  type ClientEmailAppOption,
  type ClientMapAppOption,
} from "../lib/client-detail-links";
import {
  formatBirthDate,
  getClientBirthdayDetails,
} from "../lib/client-birthday";
import { formatDaysLabel, getDaysSince } from "../lib/client-relative-time";
import { buildClientBirthdayMessage } from "../lib/client-share-messages";
import { openWhatsApp } from "../lib/client-whatsapp";
import type { ClientDateValue, ClientGender } from "../types";

function formatAbsoluteDate(value: ClientDateValue) {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString("pt-BR", {
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
  const birthdayShareSheetRef = useRef<BottomSheetModal>(null);
  const emailSheetRef = useRef<BottomSheetModal>(null);
  const mapSheetRef = useRef<BottomSheetModal>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [birthdayDraftMessage, setBirthdayDraftMessage] = useState("");
  const [copiedFieldKey, setCopiedFieldKey] = useState<string | null>(null);

  const { data: client, isLoading } = useQuery(
    clientDetailQueryOptions(id ?? null, showError),
  );

  const { imageUrl: profileImageUrl } = useResolvedImage({
    imageKey: client?.profileImageKey,
    handleError: showError,
  });

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const clientSinceDays = client ? getDaysSince(client.createdAt) : null;
  const birthdayDetails = client?.birthDate
    ? getClientBirthdayDetails(client.birthDate)
    : null;

  const emailOptions = useMemo(
    () =>
      getEmailAppOptions().map((option) => ({
        value: option.value,
        title: option.title,
        description: option.description,
        icon: <Feather name={option.iconName} size={18} color="#f43f5e" />,
      })),
    [],
  );
  const mapOptions = useMemo(
    () =>
      getMapAppOptions().map((option) => ({
        value: option.value,
        title: option.title,
        description: option.description,
        icon: <Feather name={option.iconName} size={18} color="#f43f5e" />,
      })),
    [],
  );

  const handleCopyValue = useCallback(async (fieldKey: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopiedFieldKey(fieldKey);

    if (copyResetTimerRef.current) {
      clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = setTimeout(() => {
      setCopiedFieldKey((current) => (current === fieldKey ? null : current));
    }, 1600);
  }, []);

  const buildCopyAction = useCallback(
    (fieldKey: string, label: string, value: string): ClientDetailInfoAction => ({
      key: `${fieldKey}-copy`,
      icon: copiedFieldKey === fieldKey ? "check" : "copy",
      label,
      tone: copiedFieldKey === fieldKey ? "success" : "zinc",
      onPress: () => {
        void handleCopyValue(fieldKey, value);
      },
    }),
    [copiedFieldKey, handleCopyValue],
  );

  const buildAction = useCallback(
    (
      key: string,
      icon: ClientDetailInfoAction["icon"],
      label: string,
      tone: NonNullable<ClientDetailInfoAction["tone"]>,
      onPress: () => void,
    ): ClientDetailInfoAction => ({
      key,
      icon,
      label,
      tone,
      onPress,
    }),
    [],
  );

  const handleDismissBirthdaySheet = useCallback(() => {
    setBirthdayDraftMessage("");
  }, []);

  const handleOpenBirthdaySheet = useCallback(() => {
    if (!client || !birthdayDetails) return;

    setBirthdayDraftMessage(
      buildClientBirthdayMessage({
        clientName: client.name,
        daysUntilBirthday: birthdayDetails.daysUntilBirthday,
        turningAge: birthdayDetails.turningAge,
      }),
    );
    birthdayShareSheetRef.current?.present();
  }, [birthdayDetails, client]);

  const handleShareBirthdayViaWhatsApp = useCallback(async () => {
    if (!client) return;

    birthdayShareSheetRef.current?.dismiss();
    await openWhatsApp(client.phone, birthdayDraftMessage);
  }, [birthdayDraftMessage, client]);

  const handleShareBirthdayNative = useCallback(async () => {
    birthdayShareSheetRef.current?.dismiss();

    try {
      await Share.share({ message: birthdayDraftMessage });
    } catch (error) {
      showError(error);
    }
  }, [birthdayDraftMessage, showError]);

  const handleSelectEmailApp = useCallback(
    async (option: ClientEmailAppOption) => {
      emailSheetRef.current?.dismiss();
      if (!client?.email) return;
      await openEmailApp(option, client.email);
    },
    [client?.email],
  );

  const handleSelectMapApp = useCallback(
    async (option: ClientMapAppOption) => {
      mapSheetRef.current?.dismiss();
      if (!client?.address) return;
      await openMapApp(option, client.address);
    },
    [client?.address],
  );

  const detailRows = useMemo(() => {
    if (!client) {
      return [] satisfies ClientDetailInfoRow[];
    }

    const rows: ClientDetailInfoRow[] = [
      {
        key: "phone",
        icon: "phone",
        label: "Telefone",
        value: formatPhone(client.phone),
        actions: [
          buildAction(
            "phone-whatsapp",
            "message-circle",
            "Abrir no WhatsApp",
            "emerald",
            () => {
              void openWhatsApp(client.phone);
            },
          ),
          buildCopyAction("phone", "Copiar telefone", formatPhone(client.phone)),
        ],
      },
    ];

    if (client.email) {
      rows.push({
        key: "email",
        icon: "mail",
        label: "Email",
        value: client.email,
        actions: [
          buildAction(
            "email-open",
            "send",
            "Escolher app de email",
            "sky",
            () => emailSheetRef.current?.present(),
          ),
          buildCopyAction("email", "Copiar email", client.email),
        ],
      });
    }

    if (client.instagram) {
      const instagram = client.instagram;
      const formattedInstagram = formatInstagramHandle(instagram);

      rows.push({
        key: "instagram",
        icon: "instagram",
        label: "Instagram",
        value: formattedInstagram,
        actions: [
          buildAction(
            "instagram-open",
            "external-link",
            "Abrir Instagram",
            "rose",
            () => {
              void openInstagramProfile(instagram);
            },
          ),
          buildCopyAction(
            "instagram",
            "Copiar Instagram",
            formattedInstagram,
          ),
        ],
      });
    }

    if (client.cpf) {
      const formattedCpf = formatCpf(client.cpf);

      rows.push({
        key: "cpf",
        icon: "credit-card",
        label: "CPF",
        value: formattedCpf,
        actions: [buildCopyAction("cpf", "Copiar CPF", formattedCpf)],
      });
    }

    if (client.address) {
      rows.push({
        key: "address",
        icon: "map-pin",
        label: "Endereço",
        value: client.address,
        actions: [
          buildAction(
            "address-open",
            "navigation",
            "Escolher app de mapas",
            "sky",
            () => mapSheetRef.current?.present(),
          ),
          buildCopyAction("address", "Copiar endereço", client.address),
        ],
      });
    }

    if (client.birthDate) {
      const formattedBirthDate = formatBirthDate(client.birthDate);

      rows.push({
        key: "birth-date",
        icon: "gift",
        label: "Data de nascimento",
        value: formattedBirthDate,
        actions: [
          buildCopyAction(
            "birth-date",
            "Copiar data de nascimento",
            formattedBirthDate,
          ),
        ],
      });
    }

    if (client.gender) {
      const formattedGender = formatGender(client.gender);

      rows.push({
        key: "gender",
        icon: "user",
        label: "Sexo",
        value: formattedGender,
        actions: [buildCopyAction("gender", "Copiar sexo", formattedGender)],
      });
    }

    if (client.notes) {
      rows.push({
        key: "notes",
        icon: "file-text",
        label: "Observações",
        value: client.notes,
        actions: [buildCopyAction("notes", "Copiar observações", client.notes)],
      });
    }

    const createdAtLabel = formatAbsoluteDate(client.createdAt);
    const updatedAtLabel = formatAbsoluteDate(client.updatedAt);

    rows.push({
        key: "created-at",
        icon: "calendar",
        label: "Cadastro",
        value: createdAtLabel,
      helper:
        clientSinceDays !== null
          ? `Cliente há ${formatDaysLabel(clientSinceDays)}`
          : undefined,
      actions: [
        buildCopyAction("created-at", "Copiar data de cadastro", createdAtLabel),
      ],
    });

    rows.push({
      key: "updated-at",
      icon: "refresh-cw",
      label: "Última atualização",
      value: updatedAtLabel,
      actions: [
        buildCopyAction(
          "updated-at",
          "Copiar data de atualização",
          updatedAtLabel,
        ),
      ],
    });

    return rows;
  }, [buildAction, buildCopyAction, client, clientSinceDays]);

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

          <View className="mt-4 rounded-[32px] border border-rose-100 bg-white p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                className={index === 0 ? "" : "border-t border-rose-100 pt-4"}
                style={{ marginTop: index === 0 ? 0 : 16 }}
              >
                <View className="flex-row items-start gap-3">
                  <SkeletonBox style={{ width: 44, height: 44, borderRadius: 16 }} />
                  <View className="flex-1">
                    <SkeletonBox style={{ width: 84, height: 12 }} />
                    <SkeletonBox style={{ marginTop: 10, width: "75%", height: 16 }} />
                  </View>
                </View>
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
              imageCacheKey={client.profileImageKey}
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
          onPress={() =>
            router.push({
              pathname: "/client/[id]/appointments",
              params: { id: client.id },
            })
          }
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
          <ClientDetailInfoCard rows={detailRows} />

          {birthdayDetails ? (
            <ClientBirthdayHighlightCard
              details={birthdayDetails}
              onPress={handleOpenBirthdaySheet}
            />
          ) : null}
        </View>
      </ScrollView>

      {birthdayDetails ? (
        <ClientMessageShareSheet
          sheetRef={birthdayShareSheetRef}
          title="Mensagem de aniversário"
          description="Aproveite a proximidade do aniversário para puxar conversa, oferecer uma condição especial e incentivar um novo agendamento."
          clientName={client.name}
          facts={[
            {
              icon: "gift",
              text: birthdayDetails.headline,
              emphasize: true,
            },
            {
              icon: "calendar",
              text: `Nascimento em ${birthdayDetails.birthDateLabel}`,
            },
            {
              icon: "star",
              text: `Completa ${birthdayDetails.turningAge} anos em ${birthdayDetails.nextBirthdayLabel}`,
            },
          ]}
          highlightLabel={birthdayDetails.badgeLabel}
          highlightTone={birthdayDetails.isBirthdayMonth ? "red" : "sky"}
          message={birthdayDraftMessage}
          onChangeMessage={setBirthdayDraftMessage}
          disableWhatsApp={client.phone.trim().length === 0}
          onDismiss={handleDismissBirthdaySheet}
          onShareWhatsApp={() => void handleShareBirthdayViaWhatsApp()}
          onShareMore={() => void handleShareBirthdayNative()}
        />
      ) : null}

      <SelectionSheet<ClientEmailAppOption>
        sheetRef={emailSheetRef}
        title="Abrir email"
        description="Escolha em qual app você quer continuar esse contato."
        options={emailOptions}
        onSelect={(option) => {
          void handleSelectEmailApp(option);
        }}
      />

      <SelectionSheet<ClientMapAppOption>
        sheetRef={mapSheetRef}
        title="Abrir endereço"
        description="Escolha em qual app de mapas você quer abrir este endereço."
        options={mapOptions}
        onSelect={(option) => {
          void handleSelectMapApp(option);
        }}
      />
    </SafeAreaView>
  );
}
