import { useFocusEffect } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppTabRouteName } from "../types/app-tab-route";

export interface TabContextualAction {
  routeName: AppTabRouteName;
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
}

interface TabContextualActionContextValue {
  getAction: (routeName: AppTabRouteName) => TabContextualAction | null;
  registerAction: (action: TabContextualAction) => void;
  unregisterAction: (routeName: AppTabRouteName) => void;
}

const TabContextualActionContext =
  createContext<TabContextualActionContextValue | null>(null);

interface TabContextualActionProviderProps {
  children: ReactNode;
}

export function TabContextualActionProvider({
  children,
}: TabContextualActionProviderProps) {
  const [actionsByRoute, setActionsByRoute] = useState<
    Partial<Record<AppTabRouteName, TabContextualAction>>
  >({});

  const registerAction = useCallback((action: TabContextualAction) => {
    setActionsByRoute((previousActions) => ({
      ...previousActions,
      [action.routeName]: action,
    }));
  }, []);

  const unregisterAction = useCallback((routeName: AppTabRouteName) => {
    setActionsByRoute((previousActions) => {
      if (!previousActions[routeName]) {
        return previousActions;
      }

      const nextActions = { ...previousActions };
      delete nextActions[routeName];
      return nextActions;
    });
  }, []);

  const getAction = useCallback(
    (routeName: AppTabRouteName) => actionsByRoute[routeName] ?? null,
    [actionsByRoute],
  );

  const value = useMemo(
    () => ({
      getAction,
      registerAction,
      unregisterAction,
    }),
    [getAction, registerAction, unregisterAction],
  );

  return (
    <TabContextualActionContext.Provider value={value}>
      {children}
    </TabContextualActionContext.Provider>
  );
}

export function useTabContextualActionRegistry() {
  const context = useContext(TabContextualActionContext);

  if (!context) {
    throw new Error(
      "useTabContextualActionRegistry must be used within TabContextualActionProvider",
    );
  }

  return context;
}

export function useRegisterTabContextualAction({
  routeName,
  label,
  accessibilityLabel,
  onPress,
}: TabContextualAction) {
  const { registerAction, unregisterAction } =
    useTabContextualActionRegistry();

  useFocusEffect(
    useCallback(() => {
      registerAction({
        routeName,
        label,
        accessibilityLabel,
        onPress,
      });

      return () => {
        unregisterAction(routeName);
      };
    }, [
      accessibilityLabel,
      label,
      onPress,
      registerAction,
      routeName,
      unregisterAction,
    ]),
  );
}
