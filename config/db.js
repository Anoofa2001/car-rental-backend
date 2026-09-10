import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  try {
    mongoose.connection.on("connected", () => {
      console.log("Database connected successfully");
    });

    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DATABASE || "car-rental",
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

export default connectDB;