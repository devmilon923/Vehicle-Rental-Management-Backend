import { Router } from "express";
import { authenticateStaff } from "../../middleware/auth";
import reportController from "./controller";

const router = Router();

// Protect all report routes with JWT authentication middleware
router.use(authenticateStaff);

router.get("/rentals", reportController.getMonthlyRentalReport);

export default router;
