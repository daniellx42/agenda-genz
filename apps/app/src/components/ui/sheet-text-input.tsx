import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  forwardRef,
  type ComponentProps,
  type ComponentRef,
} from "react";
import { NativeViewGestureHandler } from "react-native-gesture-handler";

type SheetTextInputProps = ComponentProps<typeof BottomSheetTextInput>;
export type SheetTextInputRef = ComponentRef<typeof BottomSheetTextInput>;

export const SheetTextInput = forwardRef<SheetTextInputRef, SheetTextInputProps>(
  function SheetTextInput(props, ref) {
    return (
      <NativeViewGestureHandler disallowInterruption>
        <BottomSheetTextInput ref={ref} {...props} />
      </NativeViewGestureHandler>
    );
  },
);
