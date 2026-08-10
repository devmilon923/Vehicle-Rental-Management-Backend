import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ServerError from "../util/error";

export interface IUserPayload extends jwt.JwtPayload {
  id: string;
  email: string;
  name: string;
  username: string;
  role: Role;
}

type Role = "admin" | "staff";
type AllowedRoles = Role | Role[];

export const guardRole = (allowedRoles: AllowedRoles) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new ServerError(401, "Access denied. No token provided.");
    }

    try {
      const decoded = jwt.verify(
        token,
        (process.env.JWT_SECRET || process.env.JWT_SECRET_KEY) as string
      ) as IUserPayload;

      (req as any).user = decoded;

      const userRole = decoded.role;

      if (
        (Array.isArray(allowedRoles) &&
          allowedRoles.includes(userRole as Role)) ||
        allowedRoles === userRole
      ) {
        return next();
      }

      throw new ServerError(
        403,
        "You are not authorized to access this resource."
      );
    } catch (error) {
      throw new ServerError(401, "Session Expired");
    }
  };
};
