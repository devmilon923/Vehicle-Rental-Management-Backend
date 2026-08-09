import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../util/prisma";
import ServerError from "../../util/error";
import { LoginInput } from "./validation";
import { JwtPayload } from "./auth.interface";

export class AuthService {
  async loginStaff(payload: LoginInput) {
    const { email, password } = payload;

    const staff = await prisma.staff.findUnique({
      where: { email },
    });

    if (!staff) {
      throw new ServerError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password_hash);

    if (!isPasswordValid) {
      throw new ServerError(401, "Invalid email or password");
    }

    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    if (!secret) {
      throw new ServerError(500, "JWT secret is not configured");
    }

    const jwtPayload: JwtPayload = {
      staffId: staff.id,
      email: staff.email,
      role: staff.role as "ADMIN" | "STAFF",
    };

    const token = jwt.sign(jwtPayload, secret, {
      expiresIn: "1d",
    });

    return {
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
    };
  }
}

export const authService = new AuthService();
