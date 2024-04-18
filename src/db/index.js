const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`mongodb+srv://nishantsharma13903:${process.env.DB_PASSWORD}@cluster0.3tvyuuz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
        console.log("\nMongoDB Connected !! DB HOST:",connectionInstance.connection.host)
    } catch (error) {
        console.log("Mongo Connection Error", error);
        process.exit(1)
    }
}

module.exports = connectDB;