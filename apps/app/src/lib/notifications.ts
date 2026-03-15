import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const SOUND_1H = "agendamento1h.wav";
const SOUND_30MIN = "agendamento30min.wav";
// Android keeps channel sound settings after first creation, so new sounds need new IDs.
const ANDROID_CHANNEL_1H = "appointment_1h_v2";
const ANDROID_CHANNEL_30MIN = "appointment_30min_v2";

export interface AppointmentReminderScheduleResult {
  permissionGranted: boolean;
  scheduledCount: number;
}

type AppointmentDateInput = string | Date;

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeAppointmentDate(
  appointmentDate: AppointmentDateInput,
): {
  normalizedDate: string;
  year: number;
  month: number;
  day: number;
} {
  if (appointmentDate instanceof Date) {
    if (Number.isNaN(appointmentDate.getTime())) {
      throw new Error("Appointment date is invalid.");
    }

    const year = appointmentDate.getUTCFullYear();
    const month = appointmentDate.getUTCMonth() + 1;
    const day = appointmentDate.getUTCDate();

    return {
      normalizedDate: `${year}-${padDatePart(month)}-${padDatePart(day)}`,
      year,
      month,
      day,
    };
  }

  if (typeof appointmentDate !== "string") {
    throw new Error("Appointment date must be a string or Date.");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    const [year, month, day] = appointmentDate.split("-").map(Number);

    return {
      normalizedDate: appointmentDate,
      year,
      month,
      day,
    };
  }

  const parsedDate = new Date(appointmentDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Appointment date string is invalid.");
  }

  const year = parsedDate.getUTCFullYear();
  const month = parsedDate.getUTCMonth() + 1;
  const day = parsedDate.getUTCDate();

  return {
    normalizedDate: `${year}-${padDatePart(month)}-${padDatePart(day)}`,
    year,
    month,
    day,
  };
}

function formatAppointmentLabel(appointmentTime: Date): string {
  const formattedDate = appointmentTime.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const formattedTime = appointmentTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formattedDate} as ${formattedTime}`;
}

function buildReminderBody(
  appointmentTime: Date,
  leadTimeLabel: "1 hora" | "30 minutos",
): string {
  return `Seu agendamento de ${formatAppointmentLabel(appointmentTime)} comeca em ${leadTimeLabel}.`;
}

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
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
  const permissions = await Notifications.getPermissionsAsync();
  const existing = permissions.status;

  if (existing === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync();

  return requested.status === "granted";
}

export async function scheduleAppointmentReminders(
  appointmentDate: AppointmentDateInput,
  timeSlotTime: string, // "HH:MM"
  appointmentId: string,
): Promise<AppointmentReminderScheduleResult> {
  const granted = await requestPermissions();
  if (!granted) {
    return {
      permissionGranted: false,
      scheduledCount: 0,
    };
  }

  let scheduledCount = 0;

  const normalizedAppointmentDate = normalizeAppointmentDate(appointmentDate);
  const { normalizedDate, year, month, day } = normalizedAppointmentDate;
  const [hours, minutes] = timeSlotTime.split(":").map(Number);
  const appointmentTime = new Date(year, month - 1, day, hours, minutes, 0);

  const oneHourBefore = new Date(appointmentTime.getTime() - 60 * 60 * 1000);
  const thirtyMinBefore = new Date(
    appointmentTime.getTime() - 30 * 60 * 1000,
  );

  const now = new Date();

  if (oneHourBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `appt-1h-${appointmentId}`,
      content: {
        title: "Lembrete de Agendamento",
        body: buildReminderBody(appointmentTime, "1 hora"),
        sound: SOUND_1H,
        data: {
          appointmentId,
          appointmentDate: normalizedDate,
          timeSlotTime,
          type: "1h",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneHourBefore,
        ...(Platform.OS === "android" && { channelId: ANDROID_CHANNEL_1H }),
      },
    });
    scheduledCount += 1;
  }

  if (thirtyMinBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `appt-30min-${appointmentId}`,
      content: {
        title: "Lembrete de Agendamento",
        body: buildReminderBody(appointmentTime, "30 minutos"),
        sound: SOUND_30MIN,
        data: {
          appointmentId,
          appointmentDate: normalizedDate,
          timeSlotTime,
          type: "30min",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: thirtyMinBefore,
        ...(Platform.OS === "android" && {
          channelId: ANDROID_CHANNEL_30MIN,
        }),
      },
    });
    scheduledCount += 1;
  }

  return {
    permissionGranted: true,
    scheduledCount,
  };
}

export async function cancelAppointmentReminders(
  appointmentId: string,
): Promise<void> {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`appt-1h-${appointmentId}`),
    Notifications.cancelScheduledNotificationAsync(
      `appt-30min-${appointmentId}`,
    ),
  ]);
}
