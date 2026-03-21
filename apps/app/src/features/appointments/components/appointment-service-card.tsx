import { ServiceImage } from "@/features/services/components/service-image";
import Feather from "@expo/vector-icons/Feather";
import { Text, View } from "react-native";
import {
  getAppointmentDepositAmountCents,
  getAppointmentRemainingAmountCents,
} from "../lib/appointment-financials";

interface AppointmentServiceCardProps {
  imageKey: string;
  color: string | null;
  name: string;
  price: number;
  depositPercentage: number | null;
  formattedDate: string;
  time: string;
}

export function AppointmentServiceCard({
  imageKey,
  color,
  name,
  price,
  depositPercentage,
  formattedDate,
  time,
}: AppointmentServiceCardProps) {
  const depositAmount = getAppointmentDepositAmountCents(price, depositPercentage);
  const remaining = getAppointmentRemainingAmountCents(price, depositPercentage);

  return (
    <View className="mb-4 gap-3 rounded-2xl border border-rose-100 bg-white p-4">
      <View className="flex-row items-center gap-3">
        <ServiceImage
          imageKey={imageKey}
          backgroundColor={color}
          size={48}
          borderRadius={16}
        />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-zinc-900">{name}</Text>
          <Text className="mt-0.5 text-xs text-zinc-400">
            R$ {(price / 100).toFixed(2)}
          </Text>
          {depositAmount !== null && remaining !== null && (
            <View className="mt-1 gap-0.5">
              <View className="flex-row items-center gap-1">
                <Feather name="credit-card" size={12} color="#3b82f6" />
                <Text className="text-xs text-blue-500">
                  Sinal ({depositPercentage}%): R$ {(depositAmount / 100).toFixed(2)}
                </Text>
              </View>
              <Text className="text-xs text-zinc-400">
                Restante no dia: R$ {(remaining / 100).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="gap-1.5 border-t border-zinc-100 pt-3">
        <View className="flex-row items-center gap-2">
          <Feather name="calendar" size={14} color="#52525b" />
          <Text className="text-sm text-zinc-600">{formattedDate}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Feather name="clock" size={14} color="#52525b" />
          <Text className="text-sm text-zinc-600">{time}</Text>
        </View>
      </View>
    </View>
  );
}
