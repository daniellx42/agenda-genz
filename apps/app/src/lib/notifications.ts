import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const SOUND_1H = "agendamento1h.wav";
const SOUND_30MIN = "agendamento30min.wav";
// Android keeps channel sound settings after first creation, so new sounds need new IDs.
const ANDROID_CHANNEL_1H = "appointment_1h_v2";
const ANDROID_CHANNEL_30MIN = "appointment_30min_v2";

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function setupAndroidChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_1H, {
    name: "Lembrete 1 hora antes",
    importance: Notifications.AndroidImportance.HIGH,
    sound: SOUND_1H,
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_30MIN, {
    name: "Lembrete 30 minutos antes",
    importance: Notifications.AndroidImportance.HIGH,
    sound: SOUND_30MIN,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleAppointmentReminders(
  appointmentDate: string, // "YYYY-MM-DD"
  timeSlotTime: string, // "HH:MM"
  reminderId: string,
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  const [year, month, day] = appointmentDate.split("-").map(Number);
  const [hours, minutes] = timeSlotTime.split(":").map(Number);
  const appointmentTime = new Date(year, month - 1, day, hours, minutes, 0);

  const oneHourBefore = new Date(appointmentTime.getTime() - 60 * 60 * 1000);
  const thirtyMinBefore = new Date(
    appointmentTime.getTime() - 30 * 60 * 1000,
  );

  const now = new Date();

  if (oneHourBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `appt-1h-${reminderId}`,
      content: {
        title: "Lembrete de Agendamento",
        body: "Voce tem um agendamento em 1 hora.",
        sound: SOUND_1H,
        data: { reminderId, type: "1h" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneHourBefore,
        ...(Platform.OS === "android" && { channelId: ANDROID_CHANNEL_1H }),
      },
    });
  }

  if (thirtyMinBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `appt-30min-${reminderId}`,
      content: {
        title: "Lembrete de Agendamento",
        body: "Voce tem um agendamento em 30 minutos.",
        sound: SOUND_30MIN,
        data: { reminderId, type: "30min" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: thirtyMinBefore,
        ...(Platform.OS === "android" && {
          channelId: ANDROID_CHANNEL_30MIN,
        }),
      },
    });
  }
}

export async function cancelAppointmentReminders(
  reminderId: string,
): Promise<void> {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`appt-1h-${reminderId}`),
    Notifications.cancelScheduledNotificationAsync(
      `appt-30min-${reminderId}`,
    ),
  ]);
}
