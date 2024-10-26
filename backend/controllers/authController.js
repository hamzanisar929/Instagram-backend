import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import getDataUri from "../utils/getURI.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const signup = async (req, res) => {
  try {
    const { email, password, username, gender } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long!" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already taken" });
    }

    //crypting pwd
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      gender,
    });
    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();

      res.status(200).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        gender: newUser.gender,
      });
    } else {
      return res.status(400).json({ message: "Failed to create new user" });
    }
  } catch (error) {
    console.log("error in signup controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );
    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({ user });
  } catch (error) {
    console.log("error in login controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log("error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    res
      .status(200)
      .json({ success: true, message: "User found successfully!", data: user });
  } catch (error) {
    console.log("error in getProfile controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const editProfile = async (req, res) => {
  const userId = req.user._id;
  try {
    const { bio, gender } = req.body;
    let profilePicture = req.file;
    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      let cloudResponse = await cloudinary.uploader.upload(fileUri);
      profilePicture = cloudResponse.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { bio, gender, profilePicture },
      { runValidators: false, new: true }
    );

    res.status(200).json({
      success: true,
      message: "User profile updated successfully!",
      data: user,
    });
  } catch (error) {
    console.log("error in editProfile controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  const userId = req.user._id;
  try {
    const suggestedUsers = await User.find({
      _id: { $ne: userId },
    }).select("-password");

    if (!suggestedUsers) {
      return res.json({ message: "There are currently no suggested users!" });
    }

    res.status(200).json({
      success: true,
      message: "Suggested Users found successfully!",
      data: suggestedUsers,
    });
  } catch (error) {
    console.log("error in getSuggestedUsers controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const followUnfollowUsers = async (req, res) => {
  const { id } = req.params;
  try {
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot follow and unfollow yourself" });
    }

    if (!currentUser || !userToModify) {
      return res.status(404).json({ message: "No user found!" });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      return res.status(200).json({ message: "User unfollowed successfully!" });
    } else {
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      return res.status(200).json({ message: "User followed successfully!" });
    }
  } catch (error) {
    console.log("error in getfollowUnfollowUsers controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
