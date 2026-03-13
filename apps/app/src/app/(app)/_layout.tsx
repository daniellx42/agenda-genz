import { NewAppointmentSheet } from "@/features/appointments/components/new-appointment-sheet";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { CurvedTabBar } from "@/features/navigation/components/curved-tab-bar";
import { toLocalDateString } from "@/lib/formatters";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Tabs } from "expo-router";
import { useCallback, useRef } from "react";
import { useWindowDimensions } from "react-native";

export default function AppLayout() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { setDate, reset } = useAppointmentDraft();
  const { width } = useWindowDimensions();

  const openSheet = useCallback((activeRouteName: string) => {
    if (activeRouteName !== "appointments") {
      setDate(toLocalDateString());
    }

    sheetRef.current?.present();
  }, [setDate]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
    reset();
  }, [reset]);

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CurvedTabBar
            {...props}
            onPressCenter={openSheet}
            width={width}
          />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="appointments"
          options={{ href: "/appointments" }}
        />
        <Tabs.Screen
          name="clients"
          options={{ href: "/clients" }}
        />
        <Tabs.Screen
          name="services"
          options={{ href: "/services" }}
        />
        <Tabs.Screen
          name="time-slots"
          options={{ href: "/time-slots" }}
        />
      </Tabs>

      <NewAppointmentSheet ref={sheetRef} onClose={closeSheet} />
    </>
  );
}
