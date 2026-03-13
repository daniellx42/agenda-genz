export type ClientGender = "FEMALE" | "MALE" | "OTHER";

export interface ClientItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  instagram: string | null;
  profileImageKey: string | null;
}

export interface ClientDetail extends ClientItem {
  cpf: string | null;
  address: string | null;
  age: number | null;
  gender: ClientGender | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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
