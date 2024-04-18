const nodemailer = require('nodemailer');
require('dotenv').config();
const ApiError = require('./ApiError.js')

const transporter = nodemailer.createTransport({
    service : "gmail",
    auth : {
        user : process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
})

const sendMailToUser = async (
    userMail,
    subject,
    text,
) => {
    try {
        const mailOptions = {
            from : process.env.NODEMAILER_USER,
            to : userMail,
            subject : subject,
            html : text
        }
    
        const response = await transporter.sendMail(mailOptions)
        return response
    } catch (error) {
        throw new ApiError(500, "Internal Server Error");
    }
}

module.exports = sendMailToUser