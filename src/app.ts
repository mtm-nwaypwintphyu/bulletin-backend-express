import express, { Application } from "express";
import authRoute from "./routes/auth";
import userRoute from "./routes/user";
import { errorHandler } from "./middlewares/error";

const app: Application = express();

app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use(errorHandler);

export default app;
