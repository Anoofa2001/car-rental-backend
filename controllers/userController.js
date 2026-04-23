import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


//generate JWT token
const generateToken = (userId) => {
  const payload = { userId };
  return jwt.sign({payload }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

//register user
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
       
        if(!name || !email || !password || password.length < 8) {
            return res.status(400).json({ success:false, message: "Fill all the fields" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success:false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword});
        const token = generateToken(user._id.toString());

        res.status(201).json({ success:true, message: "User registered successfully", token });
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({ success:false, message: "Server error" });
    }
}

//login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success:false, message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success:false, message: "Invalid password" });
        }
        const token = generateToken(user._id.toString());
        res.status(200).json({ success:true, message: "User logged in successfully", token });
    } catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).json({ success:false, message: "Server error" });
    }
}

//get user data using token
export const getUserData = async (req, res) => {
    try {
        const {user} = req;
        res.status(200).json({ success:true, user });
    } catch (error) {
        console.error("Error in getUserData:", error);
        res.status(500).json({ success:false, message: "Server error" });
    }
}