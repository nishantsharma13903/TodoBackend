const connectDB = require('./db/index.js');
const app = require('./app.js')

// Connect DB and then initialize app
connectDB()
.then(() => {
    app.on('error',(error)=>{
        console.log("Server Error",error);
        throw error;
    })
    app.listen(process.env.PORT || "8000",()=>{
        console.log("⚙️  Server is running at Port", process.env.PORT);
    })
})
.catch((err)=>{
    console.log("MongoDB Connection Failed", err);
})