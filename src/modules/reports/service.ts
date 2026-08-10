import { prisma } from "../../util/prisma";
import { calculateRentalDays, toUTCMidnight } from "../../util/date";
import { RentalStatus } from "../../generated/prisma/client";
import { MonthlyReportResponse, VehicleReportItem } from "./reports.interface";
import { ReportQueryInput } from "./validation";

export class ReportService {
  /**
   * Helper to calculate how many days of a rental fall within a given month.
   */
  private calculateDaysInMonth(
    startDate: Date,
    endDate: Date,
    monthStart: Date,
    monthEnd: Date
  ): number {
    const start = toUTCMidnight(startDate);
    const end = toUTCMidnight(endDate);

    const isEntirelyInside = start >= monthStart && end <= monthEnd;
    if (isEntirelyInside) {
      return calculateRentalDays(start, end);
    }

    const overlapStart = start < monthStart ? monthStart : start;
    const overlapEnd = end > monthEnd ? monthEnd : end;

    if (overlapStart.getTime() > overlapEnd.getTime()) {
      return 0;
    }

    const diffMs = overlapEnd.getTime() - overlapStart.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  async getMonthlyRentalReport(
    query: ReportQueryInput
  ): Promise<MonthlyReportResponse> {
    const { month, vehicle_id } = query;

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const monthStart = new Date(Date.UTC(year, monthIndex, 1));
    const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));

    const vehicles = await prisma.vehicle.findMany({
      where: {
        deleted_at: null,
        ...(vehicle_id ? { id: vehicle_id } : {}),
      },
      orderBy: { id: "asc" },
    });

    const rentals = await prisma.rental.findMany({
      where: {
        status: {
          in: [
            RentalStatus.BOOKED,
            RentalStatus.ONGOING,
            RentalStatus.COMPLETED,
          ],
        },
        start_date: {
          lte: monthEnd,
        },
        end_date: {
          gte: monthStart,
        },
        ...(vehicle_id ? { vehicle_id } : {}),
      },
    });

    const vehicleReportItems: VehicleReportItem[] = vehicles.map((vehicle) => {
      const vehicleRentals = rentals.filter((r) => r.vehicle_id === vehicle.id);
      const totalBookings = vehicleRentals.length;
      const dailyRate = Number(vehicle.daily_rate);

      let totalDaysRented = 0;
      let totalRevenue = 0;

      for (const rental of vehicleRentals) {
        const daysInMonth = this.calculateDaysInMonth(
          rental.start_date,
          rental.end_date,
          monthStart,
          monthEnd
        );
        totalDaysRented += daysInMonth;
        totalRevenue += daysInMonth * dailyRate;
      }

      return {
        id: vehicle.id,
        name: vehicle.name,
        total_bookings: totalBookings,
        days_rented: totalDaysRented,
        revenue: totalRevenue,
      };
    });

    let highestRevenueVehicle: VehicleReportItem | null = null;
    if (vehicleReportItems.length > 0) {
      const topVehicle = vehicleReportItems.reduce((max, current) =>
        current.revenue > max.revenue ? current : max
      );
      if (topVehicle.revenue > 0) {
        highestRevenueVehicle = topVehicle;
      }
    }

    return {
      month,
      vehicles: vehicleReportItems,
      highest_revenue_vehicle: highestRevenueVehicle,
    };
  }
}

export const reportService = new ReportService();
