import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bodyParser from "body-parser";
import welcomeRoute from "./View/Welcome/welcomeRoute.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

// if handle your project file system use this
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const localhostPort1 = 5173;
const localhostPort2 = 5174;
const localhostPort3 = 3000;

const allowedOrigins = [
  `http://localhost:${localhostPort1}`,
  `http://localhost:${localhostPort2}`,
  `http://localhost:${localhostPort3}`,
  `https://ts-geosystems.com.bd`,
  `https://www.ts-geosystems.com.bd`,
  `https://admin.ts-geosystems.com.bd`,
  `https://www.admin.ts-geosystems.com.bd`,
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

app.use("/", welcomeRoute);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running where http://localhost:${PORT}`);
});
