import { CurvedTabBar } from "@/features/navigation/components/curved-tab-bar";
import { TabContextualActionProvider } from "@/features/navigation/lib/tab-contextual-action-context";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";

export default function AppLayout() {
  const { width } = useWindowDimensions();

  return (
    <TabContextualActionProvider>
      <Tabs
        tabBar={(props) => (
          <CurvedTabBar
            {...props}
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
    </TabContextualActionProvider>
  );
}
