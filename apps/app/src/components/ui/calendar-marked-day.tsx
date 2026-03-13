import type { DateData } from "react-native-calendars";
import { Pressable, Text, View } from "react-native";

interface CalendarMarkedDayProps {
  date?: DateData;
  state?: string;
  marking?: {
    selected?: boolean;
    selectedColor?: string;
    textColor?: string;
    marked?: boolean;
    dotColor?: string;
    dots?: { color?: string }[];
  };
  onPress?: (date: DateData) => void;
}

export function CalendarMarkedDay({
  date,
  state,
  marking,
  onPress,
}: CalendarMarkedDayProps) {
  if (!date) {
    return <View style={{ width: 36, height: 36, marginVertical: 2 }} />;
  }

  const isDisabled = state === "disabled";
  const isToday = state === "today";
  const isSelected = Boolean(marking?.selected);
  const dots = Array.isArray(marking?.dots) ? marking.dots : [];
  const showDot = Boolean(marking?.marked || dots.length > 0);
  const dotColor = marking?.dotColor ?? dots[0]?.color ?? "#f43f5e";

  const textColor = isDisabled
    ? "#d4d4d8"
    : isSelected
      ? marking?.textColor ?? "white"
      : isToday
        ? "#f43f5e"
        : marking?.textColor ?? "#18181b";

  return (
    <Pressable
      onPress={() => onPress?.(date)}
      disabled={isDisabled}
      style={{
        width: 36,
        height: 36,
        marginVertical: 2,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        backgroundColor: isSelected
          ? marking?.selectedColor ?? "#f43f5e"
          : "transparent",
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {date.day}
      </Text>
      {showDot ? (
        <View
          style={{
            position: "absolute",
            top: 5,
            right: 4,
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: dotColor,
          }}
        />
      ) : null}
    </Pressable>
  );
}
