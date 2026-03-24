import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

function GoogleBrandMark() {
  return (
    <View className="h-8 w-8 items-center justify-center">
      <Svg width={20} height={20} viewBox="0 0 18 18" fill="none">
        <Path
          fill="#4285F4"
          d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.796 2.7155v2.2582h2.9081c1.7018-1.5664 2.6843-3.874 2.6843-6.6146Z"
        />
        <Path
          fill="#34A853"
          d="M9 18c2.43 0 4.4673-.8064 5.9564-2.1805l-2.9081-2.2582c-.8063.5409-1.8372.8604-3.0483.8604-2.3441 0-4.3282-1.5832-5.0364-3.71H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18Z"
        />
        <Path
          fill="#FBBC05"
          d="M3.9636 10.7127C3.7836 10.1718 3.68 9.5945 3.68 9s.1036-1.1718.2836-1.7127V4.9555H.9573C.3477 6.1691 0 7.5509 0 9s.3477 2.8309.9573 4.0445l3.0063-2.3318Z"
        />
        <Path
          fill="#EA4335"
          d="M9 3.5795c1.3214 0 2.5077.4545 3.4405 1.3455l2.5814-2.5814C13.4636.8918 11.4264 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9555l3.0063 2.3318C4.6718 5.1627 6.6559 3.5795 9 3.5795Z"
        />
      </Svg>
    </View>
  );
}

export function GoogleSignInButton({
  disabled = false,
  loading = false,
  onPress,
}: GoogleSignInButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel="Continuar com Google"
      accessibilityHint="Entrar usando a sua conta Google"
      className="h-14 items-center justify-center border border-zinc-200 bg-white active:opacity-90"
      style={{
        opacity: isDisabled ? 0.7 : 1,
        borderRadius: 18,
      }}
    >
      <View className="flex-row items-center justify-center gap-3">
        <GoogleBrandMark />

        <Text className="text-[17px] font-medium text-zinc-950">
          Continuar com Google
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="small"
          color="#4285F4"
          style={{ position: "absolute", right: 18 }}
        />
      ) : null}
    </Pressable>
  );
}
