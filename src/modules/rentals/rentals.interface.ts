import { RentalStatus } from "../../generated/prisma/client";

export interface IRentalQueryFilter {
  vehicle_id?: number;
  status?: RentalStatus | string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}
