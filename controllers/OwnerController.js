import imagekit from "../config/imagekit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/user.js";
import fs from "fs";

// API to change role to owner
export const changeRoleToOwner = async (req, res) => {
    try {
        const { _id } = req.user;
        await User.findByIdAndUpdate(_id, { role: "owner" });
        res.status(200).json({ success: true, message: "Role changed to owner successfully" });
    } catch (error) {
        console.error("Error in changeRoleToOwner:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// API to add car
export const addCar = async (req, res) => {
    try {
        const { _id } = req.user;
        let car = JSON.parse(req.body.carData);
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ success: false, message: "Image is required" });
        }

        // Upload image to ImageKit
        const fileBuffer = fs.readFileSync(imageFile.path);
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: "/cars"
        });

        // Optimize image
        const optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                { width: "1280" },
                { quality: "auto" },
                { format: "webp" }
            ]
        });

        const image = optimizedImageUrl;

        await Car.create({ ...car, image, owner: _id });

        res.json({ success: true, message: "Car added successfully" });

    } catch (error) {
        console.error("Error in addCar:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// API to get owner's cars
export const getOwnerCars = async (req, res) => {
    try {
        const { _id } = req.user;
        const cars = await Car.find({ owner: _id });
        res.json({ success: true, cars });
    } catch (error) {
        console.error("Error in getOwnerCars:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// API to toggle car availability
export const toggleCarAvailability = async (req, res) => {
    try {
        const { _id } = req.user;
        const { carId } = req.body;

        const car = await Car.findById(carId);

        if (!car) {
            return res.status(404).json({ success: false, message: "Car not found" });
        }

        // Check ownership
        if (car.owner.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        car.isAvailable = !car.isAvailable;
        await car.save();

        res.json({
            success: true,
            message: "Car availability toggled successfully",
            isAvailable: car.isAvailable
        });

    } catch (error) {
        console.error("Error in toggleCarAvailability:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// API to delete car
export const deleteCar = async (req, res) => {
    try {
        const { _id } = req.user;
        const { carId } = req.body;
        const car = await Car.findById(carId)

        // Check if car exists
        if(car.owner.toString() !== _id.toString()){
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        car.owner = null;
        car.isAvailable = false;
        await car.save();

        res.json({ success: true, message: "Car deleted successfully" });
    } catch (error) {
        console.error("Error in deleteCar:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

//API to get Dashboard data
export const getDashboardData = async (req, res) => {
    try {
        const { _id, role} = req.user;

        if(role !== "owner"){
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const cars = await Car.find({ owner: _id });
        const bookings = await Booking.find({ owner: _id }).populate("car").sort({ createdAt: -1 });

        const pendingBookings = await Booking.find({ owner: _id, status: "pending" });
        const confirmedBookings = await Booking.find({ owner: _id, status: "confirmed" });
        const cancelledBookings = await Booking.find({ owner: _id, status: "cancelled" });

        // Calculate monthlyRevenue from confirmed bookings
        const monthlyRevenue = confirmedBookings.reduce((acc, booking) => acc + (booking.price || 0), 0);

        const dashboardData = {
            totalCars: cars.length,
            totalBookings: bookings.length,
            pendingBookings: pendingBookings.length,
            completedBookings: confirmedBookings.length,
            recentBookings: bookings.slice(0, 3),
            monthlyRevenue
        };
        res.json({ success: true, dashboardData });
    } catch (error) {
        console.error("Error in getDashboardData:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

//API to update user image

export const updateUserImage = async (req, res) => {
    try {
        const { _id } = req.user;
        const imageFile = req.file;

         // Upload image to ImageKit
        const fileBuffer = fs.readFileSync(imageFile.path);
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: "/users"
        });

        // Optimize image
        const optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                { width: "400" },
                { quality: "auto" },
                { format: "webp" }
            ]
        });
        const image = optimizedImageUrl;

        await User.findByIdAndUpdate(_id, { image });

        res.json({ success: true, message: "Profile image updated successfully", image });
    }
    catch (error) {
        console.error("Error in updateUserImage:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}