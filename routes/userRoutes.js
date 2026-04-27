import express from "express";
import { getCars, getUserData, loginUser, registerUser } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const userRoutes = express.Router();

userRoutes.post('/register', registerUser);
userRoutes.post('/login', loginUser);
userRoutes.get('/data', protect, getUserData);
userRoutes.get('/cars', getCars);

export default userRoutes;