// pages/api/validate-token.js

import jwt from "jsonwebtoken";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ valid: false, message: "Invalid token" });
  }
}
