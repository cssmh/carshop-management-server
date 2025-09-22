import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import uploadCustomerImage from "../MiddleWare/uploadCustomerImage.js";
import {
  createCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
  deleteCustomer,
  addCustomerRemark,
  listCustomerRemarks,
} from "../Controllers/customerController.js";

const router = express.Router();

/**
 * All routes assume verifyAuth sets:
 *  req.user  -> authenticated user object
 *  req.user.tenantId (or similar)
 * Optionally: shop context (e.g., req.user.defaultShopId)
 */

router.post(
  "/",
  verifyAuth,
  uploadCustomerImage.single("profilePicture"),
  createCustomer
);

router.get("/", verifyAuth, listCustomers);
router.get("/:id", verifyAuth, getCustomerById);

router.put(
  "/:id",
  verifyAuth,
  uploadCustomerImage.single("profilePicture"),
  updateCustomer
);

router.delete("/:id", verifyAuth, deleteCustomer);

/* Remarks (threaded) */
router.post("/:id/remarks", verifyAuth, addCustomerRemark);
router.get("/:id/remarks", verifyAuth, listCustomerRemarks);

export default router;
