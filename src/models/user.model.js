const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        email : {
            type : String,
            unique : [true, "Email Already Exist"],
            required : true
        },
        password : {
            type : String,
            required : true
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function(next){
    if(!(this.isModified("password"))){
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generatingAccessToken = async function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
        },
        process.env.ACCESS_TOKEN_SECRET
    )
}

const userModel = mongoose.model('User',userSchema);

module.exports = userModel;