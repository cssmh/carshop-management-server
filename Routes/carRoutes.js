import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import * as carController from "../Controllers/carController.js";

const router = express.Router();

// All endpoints require authentication
router.post("/cars", verifyAuth, carController.createCar); // Create
router.get("/cars", verifyAuth, carController.listCars); // List + search/filter
router.get("/cars/:id", verifyAuth, carController.getCar); // View one
router.put("/cars/:id", verifyAuth, carController.updateCar); // Edit
router.delete("/cars/:id", verifyAuth, carController.deleteCar); // Soft delete

export default router;
