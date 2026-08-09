export interface VehicleQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export interface CreateVehiclePayload {
  name: string;
  plate_number: string;
  category: string;
  daily_rate: number;
}

export interface UpdateVehiclePayload {
  name?: string;
  plate_number?: string;
  category?: string;
  daily_rate?: number;
}
