import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
    try {
        let token;

        console.log("🔍 Auth middleware - Checking authorization header...");
        console.log("   Authorization header:", req.headers.authorization);

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
            console.log("❌ No token found");
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token",
            });
        }

        console.log("✅ Token extracted, length:", token.length);
        console.log("   JWT_SECRET set:", !!process.env.JWT_SECRET);

        // ✅ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token verified. Decoded:", decoded);

        // Use decoded.payload.userId as per token structure
        const userId = decoded.payload && decoded.payload.userId ? decoded.payload.userId : null;
        console.log("   Extracted userId:", userId);

        if (!userId) {
            console.log("❌ No userId in token payload");
            return res.status(401).json({
                success: false,
                message: "Not authorized, invalid token payload",
            });
        }
        // ✅ Get user
        const user = await User.findById(userId).select("-password");

        if (!user) {
            console.log("❌ User not found in database");
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        console.log("✅ User authenticated:", user._id);
        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Protect middleware error:", error.message);
        console.error("   Error type:", error.name);
        console.error("   Full error:", error);

        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }
};