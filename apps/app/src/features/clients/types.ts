export type ClientDateValue = string | Date;

export type ClientGender = "FEMALE" | "MALE" | "OTHER";

export interface ClientItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  instagram: string | null;
  notes: string | null;
  birthDate: ClientDateValue | null;
  profileImageKey: string | null;
  lastCompletedAppointmentDate: ClientDateValue | null;
}

export interface ClientDetail extends ClientItem {
  cpf: string | null;
  address: string | null;
  gender: ClientGender | null;
  createdAt: ClientDateValue;
  updatedAt: ClientDateValue;
}

export interface ClientListResponse {
  data: ClientItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
