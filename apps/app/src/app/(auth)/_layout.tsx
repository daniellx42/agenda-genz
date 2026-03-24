import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#fff9fb" },
        headerTintColor: "#18181b",
        contentStyle: { backgroundColor: "#fff9fb" },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="email-login"
        options={{
          headerShown: true,
          title: "Entrar com email",
        }}
      />
      <Stack.Screen
        name="email-sign-up"
        options={{
          headerShown: true,
          title: "Criar conta",
        }}
      />
    </Stack>
  );
}
