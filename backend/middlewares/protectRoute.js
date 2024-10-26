import User from "../models/userModel.js";
import jsonwebtoken from "jsonwebtoken";
import { promisify } from "util";

export const protectRoute = async (req, res, next) => {
  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ message: "You are not logged in!" });
    }
    //verify the token
    const decoded = await promisify(jsonwebtoken.verify)(
      token,
      process.env.SECRET_KEY
    );
    if (!decoded) {
      return res.status(400).json({ message: "Invalid token" });
    }
    //check if user still exists
    const currentUser = await User.findById(decoded.userId).select("-password");
    if (!currentUser) {
      return res.status(400).json({ message: "User does not exist" });
    }
    req.user = currentUser;
    next();
  } catch (error) {
    console.log("error in protect route middleware", error.message);
    res.status(404).json({ error: "Internal Server Error" });
  }
};
