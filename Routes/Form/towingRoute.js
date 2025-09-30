import express from "express";
import {
  addTowingCompany,
  getTowingCompanies,
  deleteTowingCompany,
} from "../../Controllers/Form/towingCont.js";
import { verifyAuth } from "../../MiddleWare/verifyAuth.js";

const towingRoutes = express.Router();

towingRoutes.post("/towing", verifyAuth, addTowingCompany);
towingRoutes.get("/towing", verifyAuth, getTowingCompanies); // Add verifyAuth here
towingRoutes.delete("/towing/:id", verifyAuth, deleteTowingCompany); // Add verifyAuth here

export default towingRoutes;
