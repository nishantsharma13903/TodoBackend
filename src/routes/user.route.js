const express = require('express');
const verifyUserJWT = require('../middlewares/authUser.middleware.js');
const { generateOtpForSignup, signUpUser, loginUser, updateUserPassword, generateOtpForForgotPassword, forgotUserPassword, getUserDetails } = require('../controllers/user.controller.js');

const userRouter = express.Router();

// Secondary Route 
userRouter.route('/generate-otp').post(generateOtpForSignup)
userRouter.route('/signup').post(signUpUser);
userRouter.route('/login').post(loginUser);
userRouter.route('/update-password').post(verifyUserJWT ,updateUserPassword);
userRouter.route('/generate-otp-forgot-password').post(generateOtpForForgotPassword)
userRouter.route('/forgot-password').post(forgotUserPassword);
userRouter.route('/user-all-details').get(verifyUserJWT,getUserDetails);

module.exports = userRouter;