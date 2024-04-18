const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
require("dotenv").config();

const verifyUserJWT = asyncHandler(async (req, res, next) => {
    try {
        const incomingToken = req.header("Authorization")?.replace("Bearer ", "");

        if (!incomingToken) {
            throw new ApiError(400, "Invalid Acess Token");
        }

        const decodedToken = jwt.verify(
            incomingToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id).select("-password");

        if (!user) {
            throw new ApiError(401, "Unauthorized User");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(500, error?.message || "Internal Server Error");
    }
});

module.exports = verifyUserJWT;
