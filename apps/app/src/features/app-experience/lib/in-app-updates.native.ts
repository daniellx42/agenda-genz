import { NativeModules, Platform } from "react-native";
import SpInAppUpdates, {
  IAUUpdateKind,
  type CheckOptions,
  type NeedsUpdateResponse,
  type StartUpdateOptions,
} from "sp-react-native-in-app-updates";

export type InAppUpdatesCheckOptions = CheckOptions;
export type InAppUpdatesCheckResult = NeedsUpdateResponse;
export type InAppUpdatesStartOptions = StartUpdateOptions;

export interface InAppUpdatesClient {
  checkNeedsUpdate: (
    checkOptions?: InAppUpdatesCheckOptions,
  ) => Promise<InAppUpdatesCheckResult>;
  startUpdate: (updateOptions: InAppUpdatesStartOptions) => Promise<void>;
}

export const IMMEDIATE_IN_APP_UPDATE = IAUUpdateKind.IMMEDIATE;

export function createInAppUpdatesClient(
  isDebug: boolean,
): InAppUpdatesClient | null {
  if (Platform.OS === "android" && !NativeModules.SpInAppUpdates) {
    return null;
  }

  return new SpInAppUpdates(isDebug);
}
