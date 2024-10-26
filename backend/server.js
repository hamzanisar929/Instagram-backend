import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";

import connectDB from "./database/connectDB.js";

import authRouter from "./routes/authRoutes.js";
import postRouter from "./routes/postRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

dotenv.config();

const app = express();
``;
const port = process.env.PORT || 4000;

const corsOptions = {
  origin: true,
};

//middlewares`
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/message", messageRouter);

app.listen(port, () => {
  console.log(`Server ruuning on port ${port}`);
  connectDB();
});
