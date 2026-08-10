import { NextFunction, Request, Response } from "express";
import { rentalService } from "./service";
import sendResponse from "../../util/sendResponse";
import {
  createRentalSchema,
  updateRentalSchema,
  rentalIdSchema,
  rentalQuerySchema,
} from "./validation";

class RentalController {
  createRental = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createRentalSchema.parse(req.body);
      const rental = await rentalService.createRental(validatedData);

      return sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Rental created successfully",
        data: rental,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllRentals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = rentalQuerySchema.parse(req.query);
      const result = await rentalService.getAllRentals(validatedQuery);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Rentals fetched successfully",
        data: result.rentals,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  getRentalById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = rentalIdSchema.parse(req.params);
      const rental = await rentalService.getRentalById(id);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Rental retrieved successfully",
        data: rental,
      });
    } catch (error) {
      next(error);
    }
  };

  updateRental = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = rentalIdSchema.parse(req.params);
      const validatedData = updateRentalSchema.parse(req.body);
      const rental = await rentalService.updateRental(id, validatedData);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Rental updated successfully",
        data: rental,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteRental = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = rentalIdSchema.parse(req.params);
      const rental = await rentalService.deleteRental(id);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Rental cancelled successfully",
        data: rental,
      });
    } catch (error) {
      next(error);
    }
  };
}

const rentalController = new RentalController();
export default rentalController;
