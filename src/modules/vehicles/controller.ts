import { NextFunction, Request, Response } from "express";
import { vehicleService } from "./service";
import ServerError from "../../util/error";
import sendResponse from "../../util/sendResponse";
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdSchema,
  vehicleQuerySchema,
} from "./validation";

class VehicleController {
  getAllVehicles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = vehicleQuerySchema.parse(req.query);
      const result = await vehicleService.getAllVehicles(validatedQuery);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Vehicles fetched successfully",
        data: result.vehicles,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  getVehicleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = vehicleIdSchema.parse(req.params);
      const vehicle = await vehicleService.getVehicleById(id);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Vehicle retrieved successfully",
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  createVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createVehicleSchema.parse(req.body);
      const photoPath = req.file ? req.file.path : undefined;

      const vehicle = await vehicleService.createVehicle(
        validatedData,
        photoPath
      );

      return sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Vehicle created successfully",
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = vehicleIdSchema.parse(req.params);
      const validatedData = updateVehicleSchema.parse(req.body);
      const photoPath = req.file ? req.file.path : undefined;

      if (Object.keys(validatedData).length === 0 && !photoPath) {
        throw new ServerError(
          400,
          "At least one field or photo must be provided for update"
        );
      }

      const vehicle = await vehicleService.updateVehicle(
        id,
        validatedData,
        photoPath
      );

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Vehicle updated successfully",
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = vehicleIdSchema.parse(req.params);
      await vehicleService.deleteVehicle(id);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

const vehicleController = new VehicleController();

export default vehicleController;
