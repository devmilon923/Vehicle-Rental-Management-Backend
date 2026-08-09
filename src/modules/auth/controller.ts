import { NextFunction, Request, Response } from "express";
import { loginSchema } from "./validation";
import { authService } from "./service";

class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.loginStaff(validatedData);

      return res.status(200).json({
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
