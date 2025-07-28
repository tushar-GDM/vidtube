import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/users.models.js";
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId).select("-password -refreshToken");
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, `Token generation failed: ${error.message}`);
    }
};

const resisterUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;

    // Check empty fields
    if ([username, email, password, fullName].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    // Check existing user
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    // Handle file uploads
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.coverImage?.[0]?.path;

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
    } catch (error) {
        throw new ApiError(500, `Avatar upload failed: ${error.message}`);
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath);
    } catch (error) {
        throw new ApiError(500, `Cover image upload failed: ${error.message}`);
    }

    // Create user
    try {
        const user = await User.create({
            username: username.toLowerCase(),
            email,
            password,
            fullName,
            avatar: avatar?.url || "",
            coverImage: coverImage?.url || ""
        });
    
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
        if (!createdUser) {
            throw new ApiError(500, "User creation failed");
        }
    
        return res.status(201).json(new ApiResponse(201, createdUser, "User created successfully"));
    } catch (error) {
        // Clean up uploaded files if user creation fails
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id);
        }
        throw new ApiError(500, `User creation failed: ${error.message}`);
    }    
});

const loginUser = asyncHandler(async (req, res) => {
    const {email, username, password} = req.body;
    if (!email && !username) {
        throw new ApiError(400, "Email or username is required");
    }
    if (!password) {
        throw new ApiError(400, "Password is required");
    }
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const option = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Login successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };
        const { accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, newRefreshToken }, "Access token refreshed successfully"));

    } catch (error) {
        throw new ApiError(401, `Failed to refresh access token: ${error.message}`);
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
         $set: { refreshToken: undefined } 
        }, { new: true });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };
    return res
        .status(200)
        .clearCookie("accessToken", "", options)
        .clearCookie("refreshToken", "", options)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current and new passwords are required");
    }
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Current password is incorrect");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: true});
    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
    const { username, email, fullName } = req.body;
    if (!username || !email || !fullName) {
        throw new ApiError(400, "Username, email and full name are required");
    }



    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            username: username.toLowerCase(),
            email,
            fullName
        }
    }, { new: true}).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.url) {
        throw new ApiError(500, "Avatar upload failed");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path || req.files?.coverImage?.[0]?.path;
    if (!coverLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }
    const coverImage = await uploadOnCloudinary(coverLocalPath);
    if (!coverImage || !coverImage.url) {
        throw new ApiError(500, "Cover image upload failed");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        { 
            $match: { username: username?.toLowerCase() } 
        },
        // First lookup: subscribers
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // Second lookup: subscribed channels
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedChannels"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                subscribedChannelCount: { $size: "$subscribedChannels" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedChannelCount: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"));
});


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        { $match: { _id: req.user._id } },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    { $lookup: { 
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1 
                                }
                            }
                        ]
                    } },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                watchHistory: 1,
                _id: 0
            }
        }
        ]);
    if (!user?.length) {
        throw new ApiError(404, "User not found");
    }
    if (!user[0]?.watchHistory?.length) {
        return res.status(200).json(new ApiResponse(200, [], "No watch history found"));
    }
    return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"));
});

export { 
    resisterUser , 
    loginUser, 
    refreshAccessToken,
    logoutUser,
    changePassword,
    getCurrentUser,
    updateUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
