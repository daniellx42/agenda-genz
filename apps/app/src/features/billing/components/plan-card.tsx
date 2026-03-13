import {
  formatPerMonth,
  formatPrice,
} from "../lib/billing-formatters";
import { PLAN_DISPLAY } from "../constants/plan-intervals";
import { Pressable, Text, View } from "react-native";

interface PlanCardProps {
  id: string;
  interval: string;
  name: string;
  priceInCents: number;
  durationDays: number;
  discountLabel: string | null;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function PlanCard({
  id,
  interval,
  priceInCents,
  durationDays,
  discountLabel,
  isSelected,
  onSelect,
}: PlanCardProps) {
  const display = PLAN_DISPLAY[interval];
  const isHighlight = display?.highlight;

  return (
    <Pressable
      onPress={() => onSelect(id)}
      className={`rounded-2xl border-2 p-4 mb-3 ${
        isSelected
          ? "border-rose-400 bg-rose-50"
          : "border-gray-200 bg-white"
      } ${isHighlight && !isSelected ? "border-rose-200" : ""}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold text-gray-900">
              {display?.label ?? interval}
            </Text>
            {discountLabel ? (
              <View className="rounded-full bg-rose-400 px-2.5 py-0.5">
                <Text className="text-xs font-semibold text-white">
                  {discountLabel}
                </Text>
              </View>
            ) : null}
            {isHighlight ? (
              <View className="rounded-full bg-amber-400 px-2.5 py-0.5">
                <Text className="text-xs font-semibold text-amber-900">
                  Melhor valor
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-sm text-gray-500 mt-1">
            {formatPerMonth(priceInCents, durationDays)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-xl font-bold text-gray-900">
            {formatPrice(priceInCents)}
          </Text>
        </View>
      </View>

      {/* Selection indicator */}
      <View className="absolute top-4 right-4">
        <View
          className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
            isSelected ? "border-rose-400 bg-rose-400" : "border-gray-300"
          }`}
        >
          {isSelected ? (
            <View className="w-2.5 h-2.5 rounded-full bg-white" />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
