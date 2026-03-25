import { create } from "zustand";
import { toLocalDateString } from "@/lib/formatters";

interface ClientDraft {
  id: string;
  name: string;
  phone: string;
  profileImageKey: string | null;
}

interface ServiceDraft {
  id: string;
  name: string;
  price: number;
  depositPercentage: number | null;
  imageKey: string;
  color: string | null;
}

interface TimeSlotDraft {
  id: string;
  time: string;
}

export type AppointmentStep = "client" | "service" | "slot" | "review";

interface AppointmentDraftState {
  // Dados do draft
  date: string; // "YYYY-MM-DD"
  client: ClientDraft | null;
  service: ServiceDraft | null;
  timeSlot: TimeSlotDraft | null;
  step: AppointmentStep;
  notes: string;

  // Actions
  setDate: (date: string) => void;
  setClient: (client: ClientDraft) => void;
  setService: (service: ServiceDraft) => void;
  setTimeSlot: (timeSlot: TimeSlotDraft) => void;
  setStep: (step: AppointmentStep) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
  goBack: () => void;
}

function createInitialState() {
  return {
    date: toLocalDateString(),
    client: null,
    service: null,
    timeSlot: null,
    step: "client" as AppointmentStep,
    notes: "",
  };
}

const INITIAL_STATE = createInitialState();

const STEP_ORDER: AppointmentStep[] = ["client", "service", "slot", "review"];

export const useAppointmentDraft = create<AppointmentDraftState>((set, get) => ({
  ...INITIAL_STATE,

  setDate: (date) => set({ date }),

  setClient: (client) =>
    set({ client, step: "service", service: null, timeSlot: null }),

  setService: (service) =>
    set({ service, step: "slot", timeSlot: null }),

  setTimeSlot: (timeSlot) =>
    set({ timeSlot, step: "review" }),

  setStep: (step) => set({ step }),

  setNotes: (notes) => set({ notes }),

  reset: () =>
    set((state) => ({
      ...createInitialState(),
      date: state.date,
    })),

  goBack: () => {
    const currentStep = get().step;
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1]!;
      set({ step: prevStep });
    }
  },
}));
