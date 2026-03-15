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
  const contentBottomPadding = Math.max(insets.bottom, 12) + bottomPadding;

  return useMemo(
    () => ({
      bottomInset: 0,
      enablePanDownToClose: true,
      enableBlurKeyboardOnGesture: true,
      keyboardBehavior: "interactive" as const,
      keyboardBlurBehavior: "restore" as const,
      androidKeyboardInputMode: "adjustResize" as const,
      contentBottomPadding,
      scrollContentContainerStyle: {
        paddingHorizontal: horizontalPadding,
        paddingBottom: contentBottomPadding,
      },
    }),
    [contentBottomPadding, horizontalPadding],
  );
}
