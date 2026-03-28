import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, type ReactNode } from "react";
import type { BottomSheetBackdropProps, BottomSheetModalProps } from "@gorhom/bottom-sheet";

type FormSheetTheme = "neutral" | "rose";

interface FormSheetConfig {
  bottomInset: number;
  topInset: number;
  enableDynamicSizing: boolean;
  enableOverDrag: boolean;
  enableBlurKeyboardOnGesture: boolean;
  keyboardBehavior: "interactive";
  keyboardBlurBehavior: "restore";
  androidKeyboardInputMode: "adjustResize";
}

interface FormSheetModalProps
  extends Omit<
    BottomSheetModalProps,
    | "children"
    | "backdropComponent"
    | "topInset"
    | "bottomInset"
    | "enableDynamicSizing"
    | "enableOverDrag"
    | "enableBlurKeyboardOnGesture"
    | "keyboardBehavior"
    | "keyboardBlurBehavior"
    | "android_keyboardInputMode"
  > {
  children: ReactNode;
  formSheet: FormSheetConfig;
  theme?: FormSheetTheme;
  backdropOpacity?: number;
  keyboardBehavior?: BottomSheetModalProps["keyboardBehavior"];
}

const THEME_STYLES = {
  neutral: {
    handleIndicatorStyle: { backgroundColor: "#e4e4e7", width: 40 },
    backgroundStyle: { backgroundColor: "white", borderRadius: 24 },
  },
  rose: {
    handleIndicatorStyle: { backgroundColor: "#fbcfe8", width: 44 },
    backgroundStyle: { backgroundColor: "#fff9fb", borderRadius: 28 },
  },
} as const;

export const FormSheetModal = forwardRef<BottomSheetModal, FormSheetModalProps>(
  function FormSheetModal(
    {
      children,
      formSheet,
      theme = "neutral",
      backdropOpacity = 0.5,
      keyboardBehavior,
      handleIndicatorStyle,
      backgroundStyle,
      ...props
    },
    ref,
  ) {
    const themeStyles = THEME_STYLES[theme];

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={backdropOpacity}
        />
      ),
      [backdropOpacity],
    );

    return (
      <BottomSheetModal
        ref={ref}
        backdropComponent={renderBackdrop}
        bottomInset={formSheet.bottomInset}
        topInset={formSheet.topInset}
        enableDynamicSizing={formSheet.enableDynamicSizing}
        enableOverDrag={formSheet.enableOverDrag}
        enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
        keyboardBehavior={keyboardBehavior ?? formSheet.keyboardBehavior}
        keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
        android_keyboardInputMode={formSheet.androidKeyboardInputMode}
        handleIndicatorStyle={[
          themeStyles.handleIndicatorStyle,
          handleIndicatorStyle,
        ]}
        backgroundStyle={[themeStyles.backgroundStyle, backgroundStyle]}
        {...props}
      >
        {children}
      </BottomSheetModal>
    );
  },
);
