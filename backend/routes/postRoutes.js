import express from "express";

import { protectRoute } from "../middlewares/protectRoute.js";
import upload from "../middlewares/multer.js";
import {
  bookmarkPost,
  commentPost,
  createPost,
  deletePost,
  getAllPosts,
  getCommentPost,
  getFollowingPosts,
  getUserPosts,
  likeUnlikePosts,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/create", protectRoute, upload.single("image"), createPost);

router.delete("/delete/:id", protectRoute, deletePost);

router.get("/posts", protectRoute, getAllPosts);

router.post("/comment/:postId", protectRoute, commentPost);

router.post("/likeunlikepost/:postId", protectRoute, likeUnlikePosts);

router.get("/userPosts", protectRoute, getUserPosts);

router.get("/feedPosts", protectRoute, getFollowingPosts);

router.get("/getComments/:postId", getCommentPost);

router.get("/bookmark/:postId", protectRoute, bookmarkPost);

export default router;
