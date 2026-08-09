import fs from "fs";
import path from "path";
import { prisma } from "../../util/prisma";
import ServerError from "../../util/error";
import paginationBuilder from "../../util/pagination";
import { CreateVehicleInput, UpdateVehicleInput, VehicleQueryInput } from "./validation";

export class VehicleService {
  async getAllVehicles(query: VehicleQueryInput) {
    const { page = 1, limit = 10, category, search } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (category && category.trim() !== "") {
      where.category = {
        equals: category.trim(),
        mode: "insensitive",
      };
    }

    if (search && search.trim() !== "") {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const [vehicles, totalData] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    const meta = paginationBuilder({
      totalData,
      currentPage: page,
      limit,
    });

    return {
      vehicles,
      meta,
    };
  }

  async getVehicleById(id: number) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!vehicle) {
      throw new ServerError(404, "Vehicle not found");
    }

    return vehicle;
  }

  async createVehicle(payload: CreateVehicleInput, photoPath?: string) {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate_number: payload.plate_number },
    });

    if (existingVehicle) {
      throw new ServerError(409, "Vehicle with this plate number already exists");
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        name: payload.name,
        plate_number: payload.plate_number,
        category: payload.category,
        daily_rate: payload.daily_rate,
        photo_path: photoPath || null,
      },
    });

    return vehicle;
  }

  async updateVehicle(id: number, payload: UpdateVehicleInput, photoPath?: string) {
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!existingVehicle) {
      throw new ServerError(404, "Vehicle not found");
    }

    if (payload.plate_number && payload.plate_number !== existingVehicle.plate_number) {
      const duplicatePlate = await prisma.vehicle.findUnique({
        where: { plate_number: payload.plate_number },
      });

      if (duplicatePlate) {
        throw new ServerError(409, "Vehicle with this plate number already exists");
      }
    }

    if (photoPath && existingVehicle.photo_path) {
      const oldPath = path.resolve(existingVehicle.photo_path);
      fs.unlink(oldPath, (err) => {
        if (err) {
          console.warn("Could not delete previous photo file:", err.message);
        }
      });
    }

    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.plate_number !== undefined) updateData.plate_number = payload.plate_number;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.daily_rate !== undefined) updateData.daily_rate = payload.daily_rate;
    if (photoPath !== undefined) updateData.photo_path = photoPath;

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });

    return updatedVehicle;
  }

  async deleteVehicle(id: number) {
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!existingVehicle) {
      throw new ServerError(404, "Vehicle not found");
    }

    await prisma.vehicle.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });

    return { message: "Vehicle soft deleted successfully" };
  }
}

export const vehicleService = new VehicleService();
