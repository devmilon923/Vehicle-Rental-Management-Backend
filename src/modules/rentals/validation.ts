import { z } from "zod";
import { toUTCMidnight } from "../../util/date";

const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date format. Expected a valid date string (e.g. YYYY-MM-DD)",
});

const rentalStatusSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    return val.toUpperCase();
  }
  return val;
}, z.enum(["BOOKED", "ONGOING", "COMPLETED", "CANCELLED"], {
  message: "Invalid status. Allowed values are booked, ongoing, completed, cancelled",
}));

export const createRentalSchema = z
  .object({
    vehicle_id: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          const parsed = parseInt(val, 10);
          return isNaN(parsed) ? val : parsed;
        }
        return val;
      },
      z.number({ message: "vehicle_id must be a valid number" })
        .int("vehicle_id must be an integer")
        .positive("vehicle_id must be a positive integer")
    ),
    customer_name: z.string().min(1, "Customer name cannot be empty"),
    customer_phone: z.string().min(1, "Customer phone cannot be empty"),
    start_date: dateStringSchema,
    end_date: dateStringSchema,
  })
  .refine(
    (data) => {
      const start = toUTCMidnight(data.start_date);
      const end = toUTCMidnight(data.end_date);
      return start.getTime() <= end.getTime();
    },
    {
      message: "start_date must be less than or equal to end_date",
      path: ["end_date"],
    }
  );

export const updateRentalSchema = z
  .object({
    vehicle_id: z
      .preprocess(
        (val) => {
          if (typeof val === "string") {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? val : parsed;
          }
          return val;
        },
        z.number({ message: "vehicle_id must be a valid number" })
          .int("vehicle_id must be an integer")
          .positive("vehicle_id must be a positive integer")
      )
      .optional(),
    customer_name: z.string().min(1, "Customer name cannot be empty").optional(),
    customer_phone: z.string().min(1, "Customer phone cannot be empty").optional(),
    start_date: dateStringSchema.optional(),
    end_date: dateStringSchema.optional(),
    status: rentalStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const start = toUTCMidnight(data.start_date);
        const end = toUTCMidnight(data.end_date);
        return start.getTime() <= end.getTime();
      }
      return true;
    },
    {
      message: "start_date must be less than or equal to end_date",
      path: ["end_date"],
    }
  );

export const rentalIdSchema = z.object({
  id: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z.number({ message: "Invalid rental ID" }).int().positive("Invalid rental ID")
  ),
});

export const rentalQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : 1),
    z.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : 10),
    z.number().int().positive().default(10)
  ),
  vehicle_id: z.preprocess((val) => {
    if (val !== undefined && val !== null && val !== "") {
      const parsed = parseInt(val as string, 10);
      return isNaN(parsed) ? val : parsed;
    }
    return undefined;
  }, z.number().int().positive().optional()),
  status: rentalStatusSchema.optional(),
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export type UpdateRentalInput = z.infer<typeof updateRentalSchema>;
export type RentalIdInput = z.infer<typeof rentalIdSchema>;
export type RentalQueryInput = z.infer<typeof rentalQuerySchema>;
