import { NextFunction, Request, Response } from "express";

class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
    } catch (error) {
      next(error);
    }
  };
}

const authController = new AuthController();

export default authController;
