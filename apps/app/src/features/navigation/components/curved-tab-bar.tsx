import Entypo from '@expo/vector-icons/Entypo';
import Feather from "@expo/vector-icons/Feather";
import { useTabContextualActionRegistry } from "@/features/navigation/lib/tab-contextual-action-context";
import type { AppTabRouteName } from "@/features/navigation/types/app-tab-route";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const TAB_BAR_HEIGHT = 66;
const FAB_SIZE = 64;
const MAX_BAR_WIDTH = 360;
const SIDE_GAP = 12;
const TAB_BAR_RADIUS = 30;
const TAB_BAR_BORDER_COLOR = "#ffe4ec";
const TAB_BAR_FILL = "rgba(255,255,255,0.98)";
const FAB_RING_COLOR = "#fff9fb";
const CENTER_CUTOUT_WIDTH = FAB_SIZE + 32;

function createTabBarPath(barWidth: number) {
  const centerX = barWidth / 2;
  const notchShoulderY = 20;
  const notchBottom = 38;
  const notchStart = centerX - CENTER_CUTOUT_WIDTH / 1.5;
  const notchEnd = centerX + CENTER_CUTOUT_WIDTH / 1.5;

  return [
    `M ${TAB_BAR_RADIUS} 0`,
    `H ${notchStart}`,
    `C ${notchStart + 10} 0 ${centerX - 36} 0 ${centerX - 31} ${notchShoulderY}`,
    `C ${centerX - 24} ${notchBottom - 2} ${centerX - 9} ${notchBottom} ${centerX} ${notchBottom}`,
    `C ${centerX + 9} ${notchBottom} ${centerX + 24} ${notchBottom - 2} ${centerX + 31} ${notchShoulderY}`,
    `C ${centerX + 36} 0 ${notchEnd - 10} 0 ${notchEnd} 0`,
    `H ${barWidth - TAB_BAR_RADIUS}`,
    `Q ${barWidth} 0 ${barWidth} ${TAB_BAR_RADIUS}`,
    `V ${TAB_BAR_HEIGHT - TAB_BAR_RADIUS}`,
    `Q ${barWidth} ${TAB_BAR_HEIGHT} ${barWidth - TAB_BAR_RADIUS} ${TAB_BAR_HEIGHT}`,
    `H ${TAB_BAR_RADIUS}`,
    `Q 0 ${TAB_BAR_HEIGHT} 0 ${TAB_BAR_HEIGHT - TAB_BAR_RADIUS}`,
    `V ${TAB_BAR_RADIUS}`,
    `Q 0 0 ${TAB_BAR_RADIUS} 0`,
    "Z",
  ].join(" ");
}

const TAB_CONFIG = {
  appointments: {
    label: "Agenda",
    renderIcon: (color: string) => <Feather name="calendar" size={20} color={color} />,
  },
  clients: {
    label: "Clientes",
    renderIcon: (color: string) => <Feather name="users" size={20} color={color} />,
  },
  services: {
    label: "Servicos",
    renderIcon: (color: string) => (
      <Entypo name="tools" size={20} color={color} />
    ),
  },
  "time-slots": {
    label: "Horarios",
    renderIcon: (color: string) => <Feather name="clock" size={20} color={color} />,
  },
} as const;

type TabRouteName = keyof typeof TAB_CONFIG;

interface CurvedTabBarProps extends BottomTabBarProps {
  width: number;
}

export function CurvedTabBar({
  state,
  navigation,
  width,
}: CurvedTabBarProps) {
  const { getAction } = useTabContextualActionRegistry();
  const insets = useSafeAreaInsets();
  const activeRouteName =
    (state.routes[state.index]?.name as AppTabRouteName | undefined) ??
    "appointments";
  const centerAction = getAction(activeRouteName);
  const bottomOffset = Math.max(insets.bottom, 12);
  const barWidth = Math.min(width - 24, MAX_BAR_WIDTH);
  const barLeft = (width - barWidth) / 2;
  const sideWidth = (barWidth - CENTER_CUTOUT_WIDTH - SIDE_GAP * 2) / 2;
  const tabBarPath = createTabBarPath(barWidth);
  const fabBottom = bottomOffset + TAB_BAR_HEIGHT - FAB_SIZE / 2 - 2;

  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2);

  const renderTab = (route: typeof state.routes[0], index: number) => {
    const isFocused = state.index === index;
    const config = TAB_CONFIG[(route.name as TabRouteName) ?? "appointments"];

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const color = isFocused ? "#f43f5e" : "#a1a1aa";

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={config.label}
        style={[styles.tabButton, isFocused && styles.tabButtonActive]}
      >
        {config.renderIcon(color)}
        {isFocused ? <View style={styles.activeDot} /> : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.tabBarWrapper} pointerEvents="box-none">
      <View
        style={[
          styles.tabBarShape,
          {
            width: barWidth,
            bottom: bottomOffset,
            left: barLeft,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={barWidth} height={TAB_BAR_HEIGHT}>
          <Path d={tabBarPath} fill={TAB_BAR_FILL} />
          <Path
            d={tabBarPath}
            fill="none"
            stroke={TAB_BAR_BORDER_COLOR}
            strokeWidth={1}
          />
        </Svg>
      </View>

      <View
        style={[
          styles.tabBarRight,
          {
            width: sideWidth,
            bottom: bottomOffset,
            right: barLeft + SIDE_GAP,
          },
        ]}
      >
        {rightRoutes.map((route) => renderTab(route, state.routes.indexOf(route)))}
      </View>

      <View
        style={[
          styles.tabBarLeft,
          {
            width: sideWidth,
            bottom: bottomOffset,
            left: barLeft + SIDE_GAP,
          },
        ]}
      >
        {leftRoutes.map((route) => renderTab(route, state.routes.indexOf(route)))}
      </View>

      <Pressable
        onPress={centerAction?.onPress}
        disabled={!centerAction}
        style={[
          styles.fab,
          { bottom: fabBottom, opacity: centerAction ? 1 : 0.6 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          centerAction?.accessibilityLabel ??
          centerAction?.label ??
          "Abrir acao principal"
        }
        accessibilityState={{ disabled: !centerAction }}
      >
        <Feather name="plus" size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: "box-none",
    minHeight: TAB_BAR_HEIGHT + FAB_SIZE + 12,
    alignItems: "center",
  },
  tabBarShape: {
    position: "absolute",
    height: TAB_BAR_HEIGHT,
    shadowColor: "#19070d",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 14,
  },
  tabBarLeft: {
    position: "absolute",
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabBarRight: {
    position: "absolute",
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: "#fff1f5",
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#f43f5e",
  },
  fab: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: "#f43f5e",
    borderWidth: 6,
    borderColor: FAB_RING_COLOR,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f43f5e",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 16,
  },
});
