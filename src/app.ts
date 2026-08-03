import express, { Application } from "express";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth";
import userRoute from "./routes/user";
import cors from "cors";
import { errorHandler } from "./middlewares/error";

const app: Application = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use(errorHandler);

export default app;
