const asyncHandler = require("../utils/asyncHandler.js");
const ApiResponse = require("../utils/ApiResponse.js");
const ApiError = require("../utils/ApiError.js");
const User = require("../models/user.model.js");
const OTP = require("../models/otp.model.js");
const sendMailToUser = require("../utils/nodemailer.js");

// Utility

// Generate a random otp and its expirys
const getRandomOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    return { otp, expiry };
};

//
const verifyOtp = async (otp, email) => {
    // find the otp documents in which email is present
    const result = await OTP.findOne({ email });
    if (!result) {
        throw new ApiError(400, "OTP does not exist with this email");
    }

    // Check if OTP has expired
    if (Date.now() > result.expiry) {
        // If expired, delete the OTP object
        await OTP.deleteOne({ email });
        throw new ApiError(400, "OTP has been expired");
    }

    // Check if the OTP matches
    if (result.otp !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    await OTP.deleteOne({ email });
    return true;
};

// Controllers

// For Website

const generateOtpForSignup = asyncHandler(async (req, res) => {
    let { email } = req.body;
    const { otp, expiry } = getRandomOtp();

    // Check email is empty or not
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    email = email?.toLowerCase();

    // check if user exist or not
    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        throw new ApiError(400, "Email Already Registered");
    }

    // Check OTP email is already present or not
    const userOtp = await OTP.findOne({ email });

    // If OTP email is already present, then update otp & expiry fields , otherwise create new object
    if (userOtp) {
        const existOtpEmail = userOtp?.email;
        const updatedUserOtp = await OTP.updateOne({
            existOtpEmail,
            $set: {
                otp: otp,
                expiry: expiry,
            },
        });
        if (!updatedUserOtp) {
            throw new ApiError(500, "Unable to update OTP");
        }
    } else {
        // Save OTP in DB
        let newOtpResponse = new OTP({ email, otp, expiry });
        newOtpResponse = await newOtpResponse.save();
        if (!newOtpResponse) {
            throw new ApiError(500, "Unable to Add OTP");
        }
    }

    const response = await sendMailToUser(
        email,
        "OTP Verification",
        `
        <h3>Welcome User</h3>
        <p>Your OTP is ${otp}</p>
        `
    );
    if (!response?.messageId) {
        throw new ApiError(500, "Unable to send otp");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "OTP Sent Successfully"));
});

const signUpUser = asyncHandler(async (req, res, next) => {
    let { email, otp, password } = req.body;

    // Checking any field is empty or not
    /* !field checks whether the field is null or undefined.
    If field is not null or undefined, field.trim() === "" checks whether the trimmed value is an empty string.*/
    /*
    This method tests whether at least one element in the array passes the test implemented by the provided callback function. It returns a boolean value indicating whether the test succeeded for at least one element.
    */
    if (
        [email, otp, password].some(
            (field) => !field || field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All Fields Are Required.");
    }

    email = email?.toLowerCase();

    // User Existed
    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        throw new ApiError(400, "Email Already Registered.");
    }

    if (password.length < 6) {
        throw new ApiError(
            400,
            "Password length must be greater than or equal to 6 digits."
        );
    }

    // Verify OTP
    await verifyOtp(otp, email);

    // Create User
    let user = new User({ email, password });
    user = await user.save();

    if (!user) {
        throw new ApiError(404, "Failed To Create User");
    }

    // Generating Access token
    const accessToken = await user.generatingAccessToken();

    user = user.toObject(); // converting into plain javascript object
    delete user.password; // Deleting password field before sending to frontend

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { user, accessToken },
                "User Created Successfully"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    let { email, password } = req.body;

    // check fields are empty or not
    if ([email, password].some((field) => !field || field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }

    email = email?.toLowerCase();

    // Check User exist or not
    const user = await User.findOne({ email });

    // if user not exist in User DB ,then show that please create new account first
    if (!user) {
        throw new ApiError(401, "User Not Exist. Please Create New Account");
    }

    // Check Whether user account is disabled or enabled
    if (user.accountStatus === "Inactive") {
        throw new ApiError(
            401,
            "Your Account is temporarily disabled by Admin."
        );
    }

    // Validating password
    const isPasswordValidate = await user.isPasswordCorrect(password);

    if (!isPasswordValidate) {
        throw new ApiError(401, "Invalid Password");
    }

    // Generating Access token
    const accessToken = await user.generatingAccessToken();

    if (!accessToken) {
        throw new ApiError(500, "Token Not Generated");
    }

    // Again Fetching the user from DB and removing password from it
    const loggedInUser = await User.findById(user?._id).select("-password");

    // Sending response to user without password field
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
            },
            "Logged In Successfully"
        )
    );
});

const updateUserPassword = asyncHandler(async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;

    if (
        [email, oldPassword, newPassword].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All Fields Are Required.");
    }

    let user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    // Checking his old password is correct or not
    const isPasswordValidate = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValidate) {
        throw new ApiError(400, "Invalid Old Password");
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "Old Password is same as New Password");
    }

    if (newPassword.length < 6) {
        throw new ApiError(
            400,
            "Password length must be greater than or equal to 6 digits"
        );
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    user = user.toObject();
    delete user.password;

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Password Updated Successfully"));
});

const generateOtpForForgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { otp, expiry } = getRandomOtp();

    // Check email is empty or not
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // check if user exist or not
    const isUserExist = await User.findOne({ email });

    if (!isUserExist) {
        throw new ApiError(
            404,
            "User Not Found With The Provided Credentails."
        );
    }

    // Check OTP email is already present or not
    const userOtp = await OTP.findOne({ email });

    // If OTP email is already present, then update otp & expiry fields , otherwise create new object
    if (userOtp) {
        const existOtpEmail = userOtp?.email;
        const updatedUserOtp = await OTP.updateOne({
            existOtpEmail,
            $set: {
                otp: otp,
                expiry: expiry,
            },
        });
        if (!updatedUserOtp) {
            throw new ApiError(500, "Unable to update OTP");
        }
    } else {
        // Save OTP in DB
        let newOtpResponse = new OTP({ email, otp, expiry });
        newOtpResponse = await newOtpResponse.save();
        if (!newOtpResponse) {
            throw new ApiError(500, "Unable to Add OTP");
        }
    }

    const response = await sendMailToUser(
        email,
        "OTP Verification",
        `
        <h3>Welcome User</h3>
        <p>Your OTP is ${otp}</p>
        `
    );
    if (!response?.messageId) {
        throw new ApiError(500, "Unable to send otp");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "OTP Sent Successfully"));
});

const forgotUserPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (
        [email, newPassword, otp].some((field) => !field || field.trim() === "")
    ) {
        throw new ApiError(400, "All Fields Are Required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    if (newPassword.length < 6) {
        throw new ApiError(
            400,
            "Password length must be greater than or equal to 6 digits"
        );
    }

    const isOtpVerified = await verifyOtp(otp, email);

    if (!isOtpVerified) {
        throw new ApiError(400, "Invalid OTP");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Updated Successfully"));
});

const getUserDetails = asyncHandler(async (req, res) => {
    let user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    user = user.toObject();
    delete user.password;

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Data Fetched Successfully"));
});

// Exporting controllers to the routers
module.exports = {
    signUpUser,
    generateOtpForSignup,
    loginUser,
    updateUserPassword,
    generateOtpForForgotPassword,
    forgotUserPassword,
    getUserDetails,
};
