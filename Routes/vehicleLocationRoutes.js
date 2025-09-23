import express from "express";
import {
  createVehicleLocation,
  listVehicleLocations,
  getVehicleLocation,
  updateVehicleLocation,
  deleteVehicleLocation,
} from "../Controllers/vehicleLocationController.js";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";

const router = express.Router();

router.post("/vehicle-locations", verifyAuth, createVehicleLocation);
router.get("/vehicle-locations", verifyAuth, listVehicleLocations);
router.get("/vehicle-locations/:id", verifyAuth, getVehicleLocation);
router.put("/vehicle-locations/:id", verifyAuth, updateVehicleLocation);
router.delete("/vehicle-locations/:id", verifyAuth, deleteVehicleLocation);

export default router;
