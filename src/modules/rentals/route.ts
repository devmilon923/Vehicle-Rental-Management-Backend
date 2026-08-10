import { Router } from "express";
import { authenticateStaff } from "../../middleware/auth";
import rentalController from "./controller";

const router = Router();

// Protect all rental routes with JWT authentication middleware
router.use(authenticateStaff);

router.get("/", rentalController.getAllRentals);
router.get("/:id", rentalController.getRentalById);
router.post("/", rentalController.createRental);
router.put("/:id", rentalController.updateRental);
router.delete("/:id", rentalController.deleteRental);

export default router;
