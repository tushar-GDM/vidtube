import jwt from "jsonwebtoken";
import { User } from "../models/users.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        throw new ApiError(401, "Access token is required");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded?._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, `Failed to verify access token: ${error.message}`);
    }
});