import { LocaleConfig } from "react-native-calendars";

const PT_BR_CALENDAR_LOCALE = "pt-br";

const ptBrCalendarLocale = {
  monthNames: [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ],
  monthNamesShort: [
    "jan.",
    "fev.",
    "mar.",
    "abr.",
    "maio",
    "jun.",
    "jul.",
    "ago.",
    "set.",
    "out.",
    "nov.",
    "dez.",
  ],
  dayNames: [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ],
  dayNamesShort: ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."],
  today: "Hoje",
};

export function ensureCalendarPtBrLocale() {
  LocaleConfig.locales[PT_BR_CALENDAR_LOCALE] = ptBrCalendarLocale;
  LocaleConfig.defaultLocale = PT_BR_CALENDAR_LOCALE;
}
