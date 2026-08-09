export type Role = "ADMIN" | "STAFF";

export interface JwtPayload {
  staffId: number;
  email: string;
  role: Role;
}
