import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ServerError from "../util/error";
import { JwtPayload } from "../modules/auth/auth.interface";

export const authenticateStaff = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ServerError(401, "Unauthorized: No token provided"));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new ServerError(401, "Unauthorized: No token provided"));
  }

  const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

  if (!secret) {
    return next(new ServerError(500, "JWT secret is not configured"));
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new ServerError(401, "Unauthorized: Invalid or expired token"));
  }
};
