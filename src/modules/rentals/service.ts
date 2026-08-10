import { prisma } from "../../util/prisma";
import ServerError from "../../util/error";
import paginationBuilder from "../../util/pagination";
import { calculateRentalDays, toUTCMidnight } from "../../util/date";
import { CreateRentalInput, UpdateRentalInput, RentalQueryInput } from "./validation";
import { RentalStatus } from "../../generated/prisma/client";

export class RentalService {
  /**
   * Helper to check active rental overlap for a given vehicle and date range.
   * Only BOOKED and ONGOING rentals block other bookings.
   * CANCELLED and COMPLETED rentals do not block bookings.
   */
  private async checkOverlap(
    vehicleId: number,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: number
  ) {
    const overlappingRental = await prisma.rental.findFirst({
      where: {
        vehicle_id: vehicleId,
        status: {
          in: [RentalStatus.BOOKED, RentalStatus.ONGOING],
        },
        ...(excludeRentalId ? { id: { not: excludeRentalId } } : {}),
        start_date: {
          lte: endDate,
        },
        end_date: {
          gte: startDate,
        },
      },
    });

    if (overlappingRental) {
      throw new ServerError(
        409,
        "Vehicle is already booked for an overlapping period"
      );
    }
  }

  /**
   * Create a new rental
   */
  async createRental(payload: CreateRentalInput) {
    const startDate = toUTCMidnight(payload.start_date);
    const endDate = toUTCMidnight(payload.end_date);

    if (startDate.getTime() > endDate.getTime()) {
      throw new ServerError(400, "start_date must be less than or equal to end_date");
    }

    // Step 2 — Find Vehicle (must exist and not be soft-deleted)
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: payload.vehicle_id,
        deleted_at: null,
      },
    });

    if (!vehicle) {
      throw new ServerError(404, "Vehicle not found");
    }

    // Step 3 — Double-Booking / Overlap Detection
    await this.checkOverlap(payload.vehicle_id, startDate, endDate);

    // Step 4 — Calculate Rental Days and Total Amount
    const rentalDays = calculateRentalDays(startDate, endDate);
    const dailyRate = Number(vehicle.daily_rate);
    const totalAmount = dailyRate * rentalDays;

    // Step 5 — Save Rental
    const rental = await prisma.rental.create({
      data: {
        vehicle_id: payload.vehicle_id,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        start_date: startDate,
        end_date: endDate,
        total_amount: totalAmount,
        status: RentalStatus.BOOKED,
      },
      include: {
        vehicle: true,
      },
    });

    return rental;
  }

  /**
   * Get list of rentals with optional filters (vehicle_id, status, date range)
   */
  async getAllRentals(query: RentalQueryInput) {
    const { page = 1, limit = 10, vehicle_id, status, start_date, end_date } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (vehicle_id !== undefined) {
      where.vehicle_id = vehicle_id;
    }

    if (status) {
      where.status = status as RentalStatus;
    }

    if (start_date && end_date) {
      const filterStart = toUTCMidnight(start_date);
      const filterEnd = toUTCMidnight(end_date);
      where.start_date = { lte: filterEnd };
      where.end_date = { gte: filterStart };
    } else if (start_date) {
      const filterStart = toUTCMidnight(start_date);
      where.end_date = { gte: filterStart };
    } else if (end_date) {
      const filterEnd = toUTCMidnight(end_date);
      where.start_date = { lte: filterEnd };
    }

    const [rentals, totalData] = await Promise.all([
      prisma.rental.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
        include: {
          vehicle: true,
        },
      }),
      prisma.rental.count({ where }),
    ]);

    const meta = paginationBuilder({
      totalData,
      currentPage: page,
      limit,
    });

    return {
      rentals,
      meta,
    };
  }

  /**
   * Get single rental by ID
   */
  async getRentalById(id: number) {
    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!rental) {
      throw new ServerError(404, "Rental not found");
    }

    return rental;
  }

  /**
   * Update rental by ID
   */
  async updateRental(id: number, payload: UpdateRentalInput) {
    const existingRental = await prisma.rental.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!existingRental) {
      throw new ServerError(404, "Rental not found");
    }

    const targetVehicleId = payload.vehicle_id ?? existingRental.vehicle_id;
    const targetStartDate = payload.start_date
      ? toUTCMidnight(payload.start_date)
      : existingRental.start_date;
    const targetEndDate = payload.end_date
      ? toUTCMidnight(payload.end_date)
      : existingRental.end_date;
    const targetStatus = (payload.status as RentalStatus) ?? existingRental.status;

    if (targetStartDate.getTime() > targetEndDate.getTime()) {
      throw new ServerError(400, "start_date must be less than or equal to end_date");
    }

    // Verify vehicle exists and is not soft deleted
    const targetVehicle = await prisma.vehicle.findFirst({
      where: {
        id: targetVehicleId,
        deleted_at: null,
      },
    });

    if (!targetVehicle) {
      throw new ServerError(404, "Vehicle not found");
    }

    // Re-check double-booking conflict if vehicle, dates, or active status are involved
    if (targetStatus === RentalStatus.BOOKED || targetStatus === RentalStatus.ONGOING) {
      await this.checkOverlap(targetVehicleId, targetStartDate, targetEndDate, id);
    }

    // Recalculate total amount if vehicle or dates changed
    const vehicleChanged = payload.vehicle_id !== undefined && payload.vehicle_id !== existingRental.vehicle_id;
    const datesChanged = payload.start_date !== undefined || payload.end_date !== undefined;

    let totalAmount = existingRental.total_amount;
    if (vehicleChanged || datesChanged) {
      const rentalDays = calculateRentalDays(targetStartDate, targetEndDate);
      const dailyRate = Number(targetVehicle.daily_rate);
      totalAmount = (dailyRate * rentalDays) as any;
    }

    const updateData: any = {};
    if (payload.vehicle_id !== undefined) updateData.vehicle_id = payload.vehicle_id;
    if (payload.customer_name !== undefined) updateData.customer_name = payload.customer_name;
    if (payload.customer_phone !== undefined) updateData.customer_phone = payload.customer_phone;
    if (payload.start_date !== undefined) updateData.start_date = targetStartDate;
    if (payload.end_date !== undefined) updateData.end_date = targetEndDate;
    if (payload.status !== undefined) updateData.status = targetStatus;

    if (vehicleChanged || datesChanged) {
      updateData.total_amount = totalAmount;
    }

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
      },
    });

    return updatedRental;
  }

  /**
   * Delete (cancel) rental by ID
   */
  async deleteRental(id: number) {
    const existingRental = await prisma.rental.findUnique({
      where: { id },
    });

    if (!existingRental) {
      throw new ServerError(404, "Rental not found");
    }

    const cancelledRental = await prisma.rental.update({
      where: { id },
      data: {
        status: RentalStatus.CANCELLED,
      },
      include: {
        vehicle: true,
      },
    });

    return cancelledRental;
  }
}

export const rentalService = new RentalService();
