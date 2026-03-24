import {
  formatDurationLabel,
  formatPerMonth,
  formatPrice,
} from "../lib/billing-formatters";
import { PLAN_DISPLAY } from "../constants/plan-intervals";
import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

interface PlanCardProps {
  id: string;
  interval: string;
  name: string;
  priceInCents: number;
  durationDays: number;
  discountLabel: string | null;
  onPress: (id: string) => void;
}

export function PlanCard({
  id,
  interval,
  name,
  priceInCents,
  durationDays,
  discountLabel,
  onPress,
}: PlanCardProps) {
  const display = PLAN_DISPLAY[interval];
  const isHighlight = display?.highlight;

  return (
    <Pressable
      onPress={() => onPress(id)}
      className={`mb-4 overflow-hidden rounded-[30px] border border-rose-100 bg-white p-5 active:opacity-90 ${
        isHighlight ? "border-rose-200" : ""
      }`}
    >
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="rounded-full bg-[#fff4f7] px-3 py-1">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-rose-500">
                {display?.eyebrow ?? name}
              </Text>
            </View>

            {isHighlight ? (
              <View className="rounded-full bg-rose-500 px-3 py-1">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-white">
                  Mais escolhido
                </Text>
              </View>
            ) : null}

            {discountLabel || display?.badge ? (
              <View className="rounded-full bg-amber-100 px-3 py-1">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-amber-700">
                  {discountLabel ?? display?.badge}
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="mt-4 text-2xl font-bold text-zinc-900">
            {display?.label ?? name}
          </Text>

          {display?.description ? (
            <Text className="mt-2 text-sm leading-6 text-zinc-500">
              {display.description}
            </Text>
          ) : null}

          <View className="mt-4 rounded-[24px] bg-[#fff7f9] p-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-rose-400">
              Valor total
            </Text>

            <View className="mt-2 flex-row items-end justify-between gap-3">
              <Text className="text-3xl font-black text-zinc-900">
                {formatPrice(priceInCents)}
              </Text>

              <Text className="pb-1 text-sm font-semibold text-rose-500">
                {formatPerMonth(priceInCents, durationDays)}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row flex-wrap items-center gap-2">
            <View className="rounded-full bg-white px-3 py-2">
              <Text className="text-xs font-medium text-zinc-600">
                {formatDurationLabel(durationDays)}
              </Text>
            </View>
          </View>
        </View>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-[#fff4f7]">
          <Feather name="arrow-right" size={18} color="#f43f5e" />
        </View>
      </View>
    </Pressable>
  );
}
