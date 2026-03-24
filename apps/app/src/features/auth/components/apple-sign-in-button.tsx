import * as AppleAuthentication from "expo-apple-authentication";
import { ActivityIndicator, View } from "react-native";

type AppleSignInButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

export function AppleSignInButton({
  disabled = false,
  loading = false,
  onPress,
}: AppleSignInButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <View
      pointerEvents={isDisabled ? "none" : "auto"}
      style={{ opacity: isDisabled ? 0.7 : 1, position: "relative" }}
    >
      <AppleAuthentication.AppleAuthenticationButton
        onPress={onPress}
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={16}
        style={{ width: "100%", height: 50 }}
      />

      {loading ? (
        <ActivityIndicator
          size="small"
          color="#ffffff"
          style={{ position: "absolute", right: 18, top: 18 }}
        />
      ) : null}
    </View>
  );
}
