import { Router } from "express";
import AuthRoutes from "../modules/auth/route";
import VehicleRoutes from "../modules/vehicles/route";
import RentalRoutes from "../modules/rentals/route";
import ReportsRoutes from "../modules/reports/route";

const router = Router();

// config all root and handler
export const appRouters = [
  {
    path: "/auth",
    handler: AuthRoutes,
  },
  {
    path: "/vehicles",
    handler: VehicleRoutes,
  },
  {
    path: "/rentals",
    handler: RentalRoutes,
  },
  {
    path: "/reports",
    handler: ReportsRoutes,
  },
];

// ready for use
appRouters.forEach(({ path, handler }) => {
  router.use(path, handler);
});

export default router;
