import { Router } from "express";
import { authenticateStaff } from "../../middleware/auth";
import upload from "../../util/multer";
import vehicleController from "./controller";

const router = Router();

// Protect all vehicle routes with JWT authentication middleware
router.use(authenticateStaff);

router.get("/", vehicleController.getAllVehicles);
router.get("/:id", vehicleController.getVehicleById);
router.post("/", upload.single("photo"), vehicleController.createVehicle);
router.put("/:id", upload.single("photo"), vehicleController.updateVehicle);
router.delete("/:id", vehicleController.deleteVehicle);

export default router;
