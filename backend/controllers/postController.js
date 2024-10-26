import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import Comment from "../models/commentModel.js";

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    let postImage = req.file;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "No user found!" });
    }

    if (!caption && !postImage) {
      return res
        .status(400)
        .json({ message: "A post should have an image and a caption" });
    }
    if (postImage) {
      const uploadedResponse = await cloudinary.uploader.upload(postImage.path);
      postImage = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      author: user._id,
      caption,
      image: postImage,
    });
    await newPost.save();

    user.posts.push(newPost._id);
    await user.save();

    await newPost.populate({ path: "author", select: "-password" });

    await res.status(200).json({
      success: true,
      message: "Post created successfully!",
      data: newPost,
    });
  } catch (error) {
    console.log("error in createPost controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "No user found!" });
    }

    const post = await Post.findByIdAndDelete(id);

    user.posts.filter((item) => item._id !== id);

    await user.save();

    await Comment.deleteMany({ post: id });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully!",
      data: post,
    });
  } catch (error) {
    console.log("error in deletePost controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "A comment must have a text!" });
    }
    const post = await Post.findById(postId);

    const newComment = new Comment({
      author: userId,
      text,
      post: postId,
    });
    await newComment.save();

    post.comments.push(newComment._id);
    await post.save();

    res.status(200).json({
      success: true,
      message: "Commented successfully!",
      data: newComment,
    });
  } catch (error) {
    console.log("error in commentPost controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCommentPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId });

    res.status(200).json({
      success: true,
      message: "Get comment posts successfully!",
      data: comments,
    });
  } catch (error) {
    console.log("error in getCommentPost controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const likeUnlikePosts = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);

    const post = await Post.findById(postId);

    const isAlreadyLiked = post.likes.includes(userId);

    if (isAlreadyLiked) {
      await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Post unliked successfully!",
      });
    } else if (!isAlreadyLiked) {
      post.likes.push(userId);
      await post.save();

      res.status(200).json({
        success: true,
        message: "Post liked successfully!",
      });
    }
  } catch (error) {
    console.log("error in likeUnlikePosts controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePicture" },
      });

    res.status(200).json({
      success: true,
      message: "Post found successfully!",
      data: posts,
    });
  } catch (error) {
    console.log("error in getAllPosts controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const userPosts = await Post.find({ author: req.user._id })
      .populate({
        path: "author",
        select: "-password",
      })
      .populate({ path: "comments" });

    if (!userPosts) {
      return res.status(404).json({ error: "You have no posts yet!" });
    }

    res.status(200).json({
      success: true,
      message: "User posts found successfully!",
      data: userPosts,
    });
  } catch (error) {
    console.log("error in getUserPosts controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "No user found!" });
    }

    const feedPost = await Post.find({
      author: { $in: user.following },
    })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture" })
      .populate({ path: "comments" });

    res.status(200).json({
      success: true,
      message: "Feed posts found successfully!",
      data: feedPost,
    });
  } catch (error) {
    console.log("error in getFollowingPosts controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    const user = await User.findById(req.user._id);

    const isAlreadyBookmarked = user.bookmarks.includes(postId);

    if (isAlreadyBookmarked) {
      await User.findByIdAndUpdate(
        userId,
        { $pull: { bookmarks: postId } },
        { new: true }
      );
      await user.save();

      res.status(200).json({
        success: true,
        message: "Post unbookmarked successfully!",
      });
    } else if (!isAlreadyBookmarked) {
      await User.findByIdAndUpdate(
        userId,
        { $push: { bookmarks: postId } },
        { new: true }
      );
      await user.save();

      res.status(200).json({
        success: true,
        message: "Post bookmarked successfully!",
      });
    }
  } catch (error) {
    console.log("error in bookmarkPost controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
