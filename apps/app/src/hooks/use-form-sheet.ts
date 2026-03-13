import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UseFormSheetOptions {
  horizontalPadding?: number;
  bottomPadding?: number;
}

export function useFormSheet({
  horizontalPadding = 20,
  bottomPadding = 32,
}: UseFormSheetOptions = {}) {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      bottomInset: insets.bottom,
      enablePanDownToClose: true,
      enableBlurKeyboardOnGesture: true,
      keyboardBehavior: "interactive" as const,
      keyboardBlurBehavior: "restore" as const,
      androidKeyboardInputMode: "adjustResize" as const,
      scrollContentContainerStyle: {
        paddingHorizontal: horizontalPadding,
        paddingBottom: Math.max(insets.bottom, 12) + bottomPadding,
      },
    }),
    [bottomPadding, horizontalPadding, insets.bottom],
  );
}
