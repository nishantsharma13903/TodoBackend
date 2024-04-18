const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        unique : true
    },
    otp : {
        type : String
    },
    expiry : {
        type : String
    }
})

const otpModel = mongoose.model('OTP',otpSchema);

module.exports = otpModel;