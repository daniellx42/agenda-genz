import Feather from "@expo/vector-icons/Feather";
import * as Clipboard from "expo-clipboard";
import { Image, Pressable, Text, View } from "react-native";
import { toast } from "sonner-native";
import { usePixCountdown } from "../hooks/use-pix-countdown";

interface PixQrDisplayProps {
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: string;
}

export function PixQrDisplay({
  pixQrCode,
  pixQrCodeBase64,
  pixExpiresAt,
}: PixQrDisplayProps) {
  const { formatted, isExpired } = usePixCountdown(pixExpiresAt);

  const handleCopyCode = async () => {
    if (!pixQrCode) return;
    await Clipboard.setStringAsync(pixQrCode);
    toast.success("Codigo PIX copiado!");
  };

  return (
    <View className="items-center">
      {/* QR Code image */}
      {pixQrCodeBase64 ? (
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Image
            source={{
              uri: `data:image/png;base64,${pixQrCodeBase64}`,
            }}
            className="w-56 h-56"
            resizeMode="contain"
          />
        </View>
      ) : null}

      {/* Countdown timer */}
      <View className="flex-row items-center gap-2 mb-4">
        <Feather name="clock" size={16} color={isExpired ? "#ef4444" : "#6b7280"} />
        <Text
          className={`text-base font-mono font-semibold ${isExpired ? "text-red-500" : "text-gray-600"
            }`}
        >
          {isExpired ? "PIX expirado" : `Expira em ${formatted}`}
        </Text>
      </View>

      {/* Copy button */}
      {pixQrCode ? (
        <Pressable
          onPress={handleCopyCode}
          className="flex-row items-center gap-2 bg-gray-100 rounded-xl px-5 py-3"
        >
          <Feather name="copy" size={18} color="#374151" />
          <Text className="text-base font-medium text-gray-700">
            Copiar codigo PIX
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
