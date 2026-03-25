import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";
import type { ComponentProps } from "react";

type FeatherIconName = ComponentProps<typeof Feather>["name"];
export type ClientDetailActionTone = "rose" | "emerald" | "sky" | "zinc" | "success";

export interface ClientDetailInfoAction {
  key: string;
  icon: FeatherIconName;
  label: string;
  tone?: ClientDetailActionTone;
  onPress: () => void;
}

export interface ClientDetailInfoRow {
  key: string;
  icon: FeatherIconName;
  label: string;
  value: string;
  helper?: string;
  actions?: ClientDetailInfoAction[];
}

interface ClientDetailInfoCardProps {
  title?: string;
  rows: ClientDetailInfoRow[];
}

const ACTION_TONES: Record<ClientDetailActionTone, { button: string; icon: string }> = {
  rose: { button: "bg-rose-50", icon: "#f43f5e" },
  emerald: { button: "bg-emerald-50", icon: "#10b981" },
  sky: { button: "bg-sky-50", icon: "#0284c7" },
  zinc: { button: "bg-zinc-100", icon: "#52525b" },
  success: { button: "bg-emerald-500", icon: "#ffffff" },
};

export function ClientDetailInfoCard({
  title = "Informações da cliente",
  rows,
}: ClientDetailInfoCardProps) {
  return (
    <View className="rounded-[32px] border border-rose-100 bg-white p-5">
      <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-rose-400">
        {title}
      </Text>

      <View className="mt-4">
        {rows.map((row, index) => (
          <View
            key={row.key}
            className={index === 0 ? "" : "border-t border-rose-100 pt-4"}
            style={{ marginTop: index === 0 ? 0 : 16 }}
          >
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7f9]">
                <Feather name={row.icon} size={16} color="#f43f5e" />
              </View>

              <View className="flex-1">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-400">
                  {row.label}
                </Text>
                <Text selectable className="mt-1 text-sm leading-6 text-zinc-900">
                  {row.value}
                </Text>
                {row.helper ? (
                  <Text className="mt-1 text-xs leading-5 text-zinc-500">
                    {row.helper}
                  </Text>
                ) : null}
              </View>

              {row.actions?.length ? (
                <View className="flex-row flex-wrap justify-end gap-2">
                  {row.actions.map((action) => {
                    const tone = ACTION_TONES[action.tone ?? "zinc"];

                    return (
                      <Pressable
                        key={action.key}
                        accessibilityLabel={action.label}
                        onPress={action.onPress}
                        className={`h-10 w-10 items-center justify-center rounded-2xl active:opacity-80 ${tone.button}`}
                      >
                        <Feather name={action.icon} size={16} color={tone.icon} />
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
