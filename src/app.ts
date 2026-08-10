import express, { Application } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth";
import userRoute from "./routes/users";
import postRoute from "./routes/posts";
import cors from "cors";
import { errorHandler } from "./middlewares/error";

const app: Application = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use(errorHandler);

export default app;
