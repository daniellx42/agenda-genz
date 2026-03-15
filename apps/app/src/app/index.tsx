import { useAuthSession } from "@/features/auth/lib/auth-session-context";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { session, isPending } = useAuthSession();

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#fb7185" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  const isExpired = !session.user.planExpiresAt
    || new Date(session.user.planExpiresAt) <= new Date();

  if (isExpired) {
    return <Redirect href="/plans" />;
  }

  return <Redirect href="/appointments" />;
}
