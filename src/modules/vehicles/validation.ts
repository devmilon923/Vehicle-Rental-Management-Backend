import { z } from "zod";

export const createVehicleSchema = z.object({
  name: z.string().min(1, "Vehicle name cannot be empty"),
  plate_number: z.string().min(1, "Plate number cannot be empty"),
  category: z.string().min(1, "Category cannot be empty"),
  daily_rate: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z.number({ message: "Daily rate must be a valid number" })
      .gt(0, "Daily rate must be greater than zero")
  ),
});

export const updateVehicleSchema = z.object({
  name: z.string().min(1, "Vehicle name cannot be empty").optional(),
  plate_number: z.string().min(1, "Plate number cannot be empty").optional(),
  category: z.string().min(1, "Category cannot be empty").optional(),
  daily_rate: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z.number({ message: "Daily rate must be a valid number" })
      .gt(0, "Daily rate must be greater than zero")
      .optional()
  ),
});

export const vehicleIdSchema = z.object({
  id: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z.number({ message: "Invalid vehicle ID" }).int().positive("Invalid vehicle ID")
  ),
});

export const vehicleQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : 1),
    z.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : 10),
    z.number().int().positive().default(10)
  ),
  category: z.string().optional(),
  search: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleIdInput = z.infer<typeof vehicleIdSchema>;
export type VehicleQueryInput = z.infer<typeof vehicleQuerySchema>;
