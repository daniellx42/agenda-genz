import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { getCurvedTabBarHeight } from "@/features/navigation/lib/curved-tab-bar-layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useCurvedTabBarHeight() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const fallbackHeight = getCurvedTabBarHeight(insets.bottom);

  return Math.max(tabBarHeight, fallbackHeight);
}
