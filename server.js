import express from "express";
import cors from "cors";
import "dotenv/config.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import ownerRouter from "./routes/OwnerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";

//initialize express app
const app = express();
//connect database
await connectDB();

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.use('/api/user', userRoutes);
app.use('/api/owner', ownerRouter);
app.use('/api/bookings', bookingRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});