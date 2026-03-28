import { useEffect, useMemo, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface UseFormSheetOptions {
  horizontalPadding?: number;
  bottomPadding?: number;
}

export function useFormSheet({
  horizontalPadding = 20,
  bottomPadding = 32,
}: UseFormSheetOptions = {}) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = Math.max(0, event.endCoordinates.height - insets.bottom);
      setKeyboardHeight(nextHeight);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom]);

  const contentBottomPadding =
    Math.max(insets.bottom, 12) + bottomPadding + keyboardHeight;
  const topInset = Math.max(insets.top, 12);

  return useMemo(
    () => ({
      bottomInset: 0,
      topInset,
      enableDynamicSizing: false,
      enableOverDrag: false,
      enablePanDownToClose: true,
      enableBlurKeyboardOnGesture: false,
      keyboardBehavior: "interactive" as const,
      keyboardBlurBehavior: "restore" as const,
      androidKeyboardInputMode: "adjustResize" as const,
      keyboardShouldPersistTaps: "always" as const,
      keyboardDismissMode: "none" as const,
      contentBottomPadding,
      viewContentContainerStyle: {
        paddingHorizontal: horizontalPadding,
        paddingBottom: contentBottomPadding,
      },
      scrollContentContainerStyle: {
        paddingHorizontal: horizontalPadding,
        paddingBottom: contentBottomPadding,
      },
    }),
    [contentBottomPadding, horizontalPadding, topInset],
  );
}
