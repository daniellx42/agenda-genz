const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function getAppointmentTimePeriod(time: string) {
  const match = time.match(TIME_PATTERN);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);

  if (Number.isNaN(hours)) {
    return null;
  }

  if (hours < 12) {
    return "da manhã";
  }

  if (hours < 18) {
    return "da tarde";
  }

  return "da noite";
}

export function formatAppointmentTimeWithPeriod(time: string) {
  const period = getAppointmentTimePeriod(time);

  return period ? `${time} ${period}` : time;
}
