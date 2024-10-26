import jsonwebtoken from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
  const token = jsonwebtoken.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: "15d",
  });
  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "developement",
  });
};
