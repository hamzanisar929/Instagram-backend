import express from "express";

import { protectRoute } from "../middlewares/protectRoute.js";
import { getMessage, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.use(protectRoute);

router.post("/:receiverId", sendMessage);

router.get("/getMessages/:receiverId", getMessage);

export default router;
