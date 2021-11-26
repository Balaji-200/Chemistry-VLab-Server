const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB server started at ${connect.connection.host}:${connect.connection.port}`);
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;
