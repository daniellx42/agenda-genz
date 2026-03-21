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
    disableTouchEvent?: boolean;
  };
  onPress?: (date: DateData) => void;
  allowDisabledPress?: boolean;
}

export function CalendarMarkedDay({
  date,
  state,
  marking,
  onPress,
  allowDisabledPress = false,
}: CalendarMarkedDayProps) {
  if (!date) {
    return <View style={{ width: 36, height: 36, marginVertical: 2 }} />;
  }

  const isOutsideMonth = state === "disabled";
  const isToday = state === "today";
  const isSelected = Boolean(marking?.selected);
  const isPressDisabled = marking?.disableTouchEvent === true
    || (isOutsideMonth && !allowDisabledPress);
  const dots = Array.isArray(marking?.dots) ? marking.dots : [];
  const showDot = Boolean(marking?.marked || dots.length > 0);
  const dotColor = isOutsideMonth && !isSelected
    ? "#fda4af"
    : marking?.dotColor ?? dots[0]?.color ?? "#f43f5e";

  const textColor = isOutsideMonth
    ? "#d4d4d8"
    : isSelected
      ? marking?.textColor ?? "white"
      : isToday
        ? "#f43f5e"
        : marking?.textColor ?? "#18181b";

  return (
    <Pressable
      onPress={() => onPress?.(date)}
      disabled={isPressDisabled}
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
