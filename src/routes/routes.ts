import { Router } from "express";
import AuthRoutes from "../modules/auth/route";
import VehicleRoutes from "../modules/vehicles/route";

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
];


// ready for use
appRouters.forEach(({ path, handler }) => {
  router.use(path, handler);
});

export default router;
