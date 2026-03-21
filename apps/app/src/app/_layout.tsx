import "../../global.css";

import { AuthSessionProvider } from "@/features/auth/lib/auth-session-context";
import { useSubscriptionStore } from "@/features/billing/store/subscription-store";
import { authClient } from "@/lib/auth-client";
import {
  setupAndroidChannels,
  setupNotificationHandler,
} from "@/lib/notifications";
import { queryClient } from "@/lib/query-client";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { AppState, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

setupNotificationHandler();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();
  const previousUserIdRef = useRef<string | null | undefined>(undefined);
  const { setPlanExpiresAt } = useSubscriptionStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isPending) return;

    void SplashScreen.hideAsync();
  }, [isPending]);

  useEffect(() => {
    if (isPending) return;

    const userId = session?.user?.id ?? null;

    if (previousUserIdRef.current === undefined) {
      previousUserIdRef.current = userId;
      return;
    }

    if (previousUserIdRef.current !== userId) {
      if (userId) {
        queryClient.clear();
      }
      previousUserIdRef.current = userId;
    }
  }, [isPending, session?.user?.id]);

  // Sync planExpiresAt from session to subscription store
  useEffect(() => {
    if (isPending) return;

    setPlanExpiresAt(session?.user?.planExpiresAt ?? null);
  }, [isPending, session?.user?.planExpiresAt, setPlanExpiresAt]);

  useEffect(() => {
    if (isPending) return;

    const rootSegment = segments[0];
    const isAuthRoute = rootSegment === "(auth)";
    const isProtectedRoute = rootSegment !== "(auth)";

    if (!session && isProtectedRoute) {
      router.replace("/login");
      return;
    }

    if (session && isAuthRoute) {
      router.replace("/");
    }
  }, [isPending, router, segments, session]);

  useEffect(() => {
    void setupAndroidChannels();
  }, []);

  // Re-check expiry when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        useSubscriptionStore.getState().checkExpired();
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <AuthSessionProvider session={session} isPending={isPending}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(paywall)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="appointment/[id]" />
                <Stack.Screen name="client/[id]" />
                <Stack.Screen name="client/[id]/appointments" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="index" options={{ animation: "none" }} />
              </Stack>
            </AuthSessionProvider>
            <StatusBar backgroundColor="#ffccd3" barStyle="dark-content" />
            <Toaster />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
