import { z } from "zod";

export const reportQuerySchema = z.object({
  month: z
    .string({ message: "Month parameter is required in YYYY-MM format" })
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])$/,
      "Month must be in YYYY-MM format (e.g. 2026-08)"
    ),
  vehicle_id: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : undefined),
    z.number().int().positive("Invalid vehicle ID").optional()
  ),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
