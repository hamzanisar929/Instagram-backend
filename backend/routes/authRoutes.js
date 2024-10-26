import express from "express";

import {
  editProfile,
  followUnfollowUsers,
  getProfile,
  getSuggestedUsers,
  login,
  logout,
  signup,
} from "../controllers/authController.js";

import { protectRoute } from "../middlewares/protectRoute.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);

router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUsers);
router.get("/:id", getProfile);
router.patch(
  "/edit",
  protectRoute,
  upload.single("profilePicture"),
  editProfile
);

export default router;
