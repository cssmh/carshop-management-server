import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bodyParser from "body-parser";
import welcomeRoute from "./View/Welcome/welcomeRoute.js";
import authRoutes from "./Routes/auth.js";
import customersRouter from "./Routes/customerRoutes.js";
import shopRoutes from "./Routes/shopRoutes.js";
import vehicleLocationRoutes from "./Routes/vehicleLocationRoutes.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

// if handle your project file system use this
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const localhostPort1 = 5173;
const localhostPort2 = 5174;
const localhostPort3 = 3000;
const localhostPort4 = 3001;

const allowedOrigins = [
  `http://localhost:${localhostPort1}`,
  `http://localhost:${localhostPort2}`,
  `http://localhost:${localhostPort3}`,
  `http://localhost:${localhostPort4}`,
  `https://car-shop-management.vercel.app`,
  `https://www.car-shop-management.vercel.app`,
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Welcome route
app.use("/", welcomeRoute);
// auth route
app.use("/api/auth", authRoutes);

// /api/customers
app.use("/api/customers", customersRouter);
// Shop routes
app.use("/api", shopRoutes);
// vehicleLocationRoutes
app.use("/api", vehicleLocationRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running where ✅ http://localhost:${PORT}`);
});
