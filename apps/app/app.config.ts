import "dotenv/config";
import { env } from "@agenda-genz/env/native";
import type { ConfigContext, ExpoConfig } from "expo/config";

const googleIosUrlScheme = env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const staticPlugins: NonNullable<ExpoConfig["plugins"]> = [
  "expo-router",
  "expo-apple-authentication",
  [
    "expo-splash-screen",
    {
      image: "./assets/images/splash-icon.png",
      imageWidth: 200,
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
  ],
  [
    "expo-notifications",
    {
      icon: "./assets/images/notification-icon.png",
      color: "#7d0000",
      sounds: [
        "./assets/sounds/notifications/agendamento1h.wav",
        "./assets/sounds/notifications/agendamento30min.wav",
      ],
    },
  ],
];
const buildPropertiesPlugin: NonNullable<ExpoConfig["plugins"]> = [
  [
    "expo-build-properties",
    {
      ios: {
        buildReactNativeFromSource: true,
      },
    },
  ],
];
const googlePlugin: NonNullable<ExpoConfig["plugins"]> = googleIosUrlScheme
  ? [["@react-native-google-signin/google-signin", { iosUrlScheme: googleIosUrlScheme }]]
  : [];

export default (_context: ConfigContext): ExpoConfig => {
  return {
    name: "Agenda GenZ",
    slug: "agenda-genz",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "app",
    ios: {
      supportsTablet: false,
      usesAppleSignIn: true,
      bundleIdentifier: "com.daniellx42.agendagenz",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.daniellx42.agendagenz",
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      ...staticPlugins,
      ...buildPropertiesPlugin,
      ...googlePlugin,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "411da2ab-584a-404f-a776-dd0c7a2d2554",
      },
    },
    owner: "daniellx42",
  };
};
