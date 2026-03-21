export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  depositPercentage: number | null;
  imageKey: string;
  color: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceListResponse {
  data: ServiceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
