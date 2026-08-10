import { NextFunction, Request, Response } from "express";
import { loginSchema } from "./validation";
import { authService } from "./service";
import sendResponse from "../../util/sendResponse";

class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.loginStaff(validatedData);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

const authController = new AuthController();

export default authController;
