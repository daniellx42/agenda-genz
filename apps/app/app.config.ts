import { env } from "@agenda-genz/env/native";
import "dotenv/config";
import type { ConfigContext, ExpoConfig } from "expo/config";

const googleIosUrlScheme = env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const googlePlugin: NonNullable<ExpoConfig["plugins"]> = googleIosUrlScheme
  ? [["@react-native-google-signin/google-signin", { iosUrlScheme: googleIosUrlScheme }]]
  : [];

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseConfig = config as ExpoConfig;

  return {
    ...baseConfig,
    plugins: [...(baseConfig.plugins ?? []), ...googlePlugin],
  };
};
