import Feather from "@expo/vector-icons/Feather";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { toast } from "sonner-native";
import {
  getPixCopyState,
  hasPixQrImage,
  type BillingRuntimeStatus,
} from "../lib/billing-flow";
import { usePixCountdown } from "../hooks/use-pix-countdown";

interface PixQrDisplayProps {
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: string | null;
  paymentStatus: BillingRuntimeStatus;
  hasCopiedCode: boolean;
  onCopySuccess: () => void;
  onRegenerate: () => void;
}

export function PixQrDisplay({
  pixQrCode,
  pixQrCodeBase64,
  pixExpiresAt,
  paymentStatus,
  hasCopiedCode,
  onCopySuccess,
  onRegenerate,
}: PixQrDisplayProps) {
  const { formatted, isExpired: isCountdownExpired } =
    usePixCountdown(pixExpiresAt);
  const isExpired = paymentStatus === "EXPIRED" || isCountdownExpired;
  const hasQrImage = hasPixQrImage(pixQrCodeBase64);
  const copyState = getPixCopyState({
    hasCopied: hasCopiedCode,
    hasPixCode: Boolean(pixQrCode),
    isExpired,
  });

  const handlePrimaryAction = async () => {
    if (!pixQrCode || isExpired) {
      onRegenerate();
      return;
    }

    await Clipboard.setStringAsync(pixQrCode);
    onCopySuccess();
    toast.success(
      "Código PIX copiado. Cole no app do seu banco para concluir o pagamento.",
    );
  };

  const buttonClasses =
    copyState.tone === "success"
      ? "bg-emerald-500"
      : copyState.tone === "muted"
        ? "bg-zinc-900"
        : "bg-rose-500";

  return (
    <View className="rounded-[30px] border border-rose-100 bg-white p-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-rose-400">
            Passo principal
          </Text>
          <Text className="mt-2 text-2xl font-black text-zinc-900">
            Copie o código e pague no seu banco
          </Text>
        </View>

        <View className="rounded-full bg-[#fff4f7] px-3 py-2">
          <View className="flex-row items-center gap-2">
            <Feather
              name="clock"
              size={14}
              color={isExpired ? "#d97706" : "#f43f5e"}
            />
            <Text
              className={`text-xs font-semibold ${
                isExpired ? "text-amber-700" : "text-rose-500"
              }`}
            >
              {isExpired ? "PIX expirado" : `Expira em ${formatted}`}
            </Text>
          </View>
        </View>
      </View>

      <Text className="mt-3 text-sm leading-6 text-zinc-500">
        {copyState.helperLabel}
      </Text>

      {hasQrImage ? (
        <View className="mt-4 items-center rounded-[24px] bg-[#fff9fb] p-4">
          <Image
            testID="pix-qr-image"
            source={{
              uri: `data:image/png;base64,${pixQrCodeBase64}`,
            }}
            style={{ width: 224, height: 224 }}
            contentFit="contain"
          />
        </View>
      ) : pixQrCode ? (
        <View className="mt-4 rounded-[24px] bg-[#fff9fb] px-4 py-5">
          <Text className="text-center text-sm leading-6 text-zinc-500">
            O QR Code não ficou disponível agora, mas o código PIX abaixo segue
            pronto para copiar e pagar.
          </Text>
        </View>
      ) : null}

      {pixQrCode ? (
        <View className="mt-4 rounded-[24px] bg-[#fff7f9] p-4">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-rose-400">
            Código PIX
          </Text>
          <Text
            selectable
            testID="pix-code-text"
            className="mt-2 text-sm leading-6 text-zinc-700"
          >
            {pixQrCode}
          </Text>
        </View>
      ) : (
        <View className="mt-4 rounded-[24px] bg-[#fff7f9] p-4">
          <Text className="text-sm leading-6 text-zinc-500">
            O código ainda não ficou disponível. Gere um novo PIX para seguir.
          </Text>
        </View>
      )}

      {copyState.badgeLabel ? (
        <View className="mt-4 self-start rounded-full bg-emerald-50 px-4 py-2">
          <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-emerald-700">
            {copyState.badgeLabel}
          </Text>
        </View>
      ) : null}

      <Pressable
        testID="pix-copy-button"
        onPress={() => {
          void handlePrimaryAction();
        }}
        className={`mt-4 flex-row items-center justify-center gap-3 rounded-[26px] px-5 py-4 active:opacity-85 ${buttonClasses}`}
      >
        <Feather
          name={
            copyState.tone === "success"
              ? "check"
              : copyState.tone === "muted"
                ? "refresh-cw"
                : "copy"
          }
          size={18}
          color="white"
        />
        <Text className="text-base font-bold text-white">
          {copyState.buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
}
