import express from "express";
import multer from "multer";

const app = express();

app.use("/uploads", express.static("uploads"));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

export const upload = multer({ storage });

export const uploadAny = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size
    fieldSize: 25 * 1024 * 1024, // 25MB field size (for large text fields like infoBox)
    fields: 20,
  },
}).any();
