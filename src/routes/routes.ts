import { Router } from "express";
const router = Router();

// config all root and handler
export const appRouters = [
  //   {
  //     path: "/auth",
  //     handler: AuthRoutes,
  //   },
];

// ready for use
appRouters.forEach(({ path, handler }) => {
  router.use(path, handler);
});

export default router;
