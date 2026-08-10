export interface VehicleReportItem {
  id: number;
  name: string;
  total_bookings: number;
  days_rented: number;
  revenue: number;
}

export interface MonthlyReportResponse {
  month: string;
  vehicles: VehicleReportItem[];
  highest_revenue_vehicle: VehicleReportItem | null;
}
