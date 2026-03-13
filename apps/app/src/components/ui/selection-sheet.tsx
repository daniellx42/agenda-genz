import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

export interface SelectionSheetOption<TValue extends string = string> {
  value: TValue;
  title: string;
  description?: string;
  icon?: string;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

interface SelectionSheetProps<TValue extends string = string> {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  title: string;
  description?: string;
  options: SelectionSheetOption<TValue>[];
  onSelect: (value: TValue) => void;
  onClose?: () => void;
  cancelLabel?: string;
}

export function SelectionSheet<TValue extends string = string>({
  sheetRef,
  title,
  description,
  options,
  onSelect,
  onClose,
  cancelLabel = "Cancelar",
}: SelectionSheetProps<TValue>) {
  const snapPoints = useMemo(() => {
    const height = Math.min(Math.max(34, 24 + options.length * 12), 72);
    return [`${height}%`];
  }, [options.length]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#fbcfe8", width: 44 }}
      backgroundStyle={{ backgroundColor: "#fff9fb", borderRadius: 28 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
      >
        <View className="mb-4 rounded-[28px] border border-rose-100 bg-white p-4">
          <Text className="text-base font-bold text-zinc-900">{title}</Text>
          {description ? (
            <Text className="mt-1 text-sm leading-5 text-zinc-500">
              {description}
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              disabled={option.disabled || option.loading}
              className={`rounded-[28px] border p-4 active:opacity-80 ${
                option.selected
                  ? "border-rose-200 bg-rose-50"
                  : "border-rose-100 bg-white"
              }`}
              style={{
                opacity: option.disabled && !option.loading ? 0.55 : 1,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`h-11 w-11 items-center justify-center rounded-2xl ${
                    option.selected ? "bg-white" : "bg-rose-50"
                  }`}
                >
                  <Text className="text-lg">{option.icon ?? "•"}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-semibold text-zinc-900">
                    {option.title}
                  </Text>
                  {option.description ? (
                    <Text className="mt-1 text-xs leading-5 text-zinc-500">
                      {option.description}
                    </Text>
                  ) : null}
                </View>

                {option.loading ? (
                  <ActivityIndicator color="#f43f5e" />
                ) : option.selected ? (
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-rose-500">
                    <Text className="text-xs font-bold text-white">✓</Text>
                  </View>
                ) : (
                  <View className="h-8 w-8 rounded-full border border-zinc-200 bg-zinc-50" />
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => sheetRef.current?.dismiss()}
          className="mt-4 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-zinc-600">
            {cancelLabel}
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
