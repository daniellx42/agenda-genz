export interface AppointmentListItem {
  id: string;
  date: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  beforeImageKey: string | null;
  afterImageKey: string | null;
  client: {
    id: string;
    name: string;
    phone: string;
    profileImageKey: string | null;
  };
  service: {
    id: string;
    name: string;
    price: number;
    depositPercentage: number | null;
    emoji: string | null;
    color: string | null;
  };
  timeSlot: {
    id: string;
    time: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentHistorySummary {
  totalAppointments: number;
  completedAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  fullyPaidAppointments: number;
  pendingPaymentAppointments: number;
  totalReceivedCents: number;
  totalPendingAmountCents: number;
  totalBookedCents: number;
  firstAppointmentDate: string | null;
  lastAppointmentDate: string | null;
  nextAppointmentDate: string | null;
  lastCompletedAppointmentDate: string | null;
}

export interface AppointmentHistoryResponse {
  data: AppointmentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: AppointmentHistorySummary;
}
