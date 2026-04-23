import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
    try {
        let token;


        // ✅ Extract token (with or without Bearer)
        if (req.headers.authorization) {
            if (req.headers.authorization.startsWith("Bearer ")) {
                token = req.headers.authorization.split(" ")[1];
            } else {
                token = req.headers.authorization;
            }
        }

        // ❌ No token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token",
            });
        }

        // ✅ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Use decoded.payload.userId as per token structure
        const userId = decoded.payload && decoded.payload.userId ? decoded.payload.userId : null;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, invalid token payload",
            });
        }
        // ✅ Get user
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Protect middleware error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }
};