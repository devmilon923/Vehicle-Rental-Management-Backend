import { NextFunction, Request, Response } from "express";
import { reportService } from "./service";
import { reportQuerySchema } from "./validation";
import sendResponse from "../../util/sendResponse";

class ReportController {
  getMonthlyRentalReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const validatedQuery = reportQuerySchema.parse(req.query);
      const result = await reportService.getMonthlyRentalReport(validatedQuery);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Rental report generated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

const reportController = new ReportController();

export default reportController;
