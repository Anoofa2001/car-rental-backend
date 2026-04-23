import Booking from '../models/Booking.js'
import Car from '../models/Car.js';


//function to check availability of car for given dates
const checkAvailability = async (car, pickupDate, returnDate) => {
    const bookings = await Booking.find({ 
        car,
        pickupDate: { $lte: returnDate },
        returnDate: { $gte: pickupDate },
    });

    return bookings.length === 0; // If no bookings, car is available
}

// API to check availability of car for given dates and  location
export const checkCarAvailability = async (req, res) => {
    try {
        const {location, pickupDate, returnDate} = req.body

        //fetch all available cars for the given location
        const cars = await Car.find({ location, isAvailable: true });

        // check car availability for the given range using promise
        const availableCarsPromises = cars.map(async (car) => {
            const isAvailable = await checkAvailability(car._id, pickupDate, returnDate);
            return { ...car._doc, isAvailable: isAvailable }
        })
        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true)
        res.json({ success: true, cars: availableCars });
    } catch (error) {
        console.error("Error in checkCarAvailability:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// API to create booking
export const createBooking = async (req, res) => {
    try {
        const {_id} = req.user;
        const {car, pickupDate, returnDate} = req.body;

        const isAvailable = await checkAvailability(car, pickupDate, returnDate);

        if(!isAvailable){
            return res.status(400).json({ success: false, message: "Car is not available for the selected dates" });
        }

        const carData = await Car.findById(car);
        //calculate price based on the pickup and return date
        const pickedUp = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil((returned - pickedUp) / (1000 * 60 * 60 * 24));
        const price = noOfDays * carData.pricePerDay;

        await Booking.create({car, owner: carData.owner, user: _id, pickupDate, returnDate, price});

        res.json({ success: true, message: "Booking created successfully" });
    } catch (error) {
        console.error("Error in createBooking:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

//API to get user's bookings
export const getUserBookings = async (req, res) => {
    try {
        const {_id} = req.user;
        const bookings = await Booking.find({user: _id}).populate("car").populate("car").sort({createdAt: -1});
        res.json({ success: true, bookings });
    } catch (error) {
        console.error("Error in getUserBookings:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

//API to get owner's bookings
export const getOwnerBookings = async (req, res) => {
    try {
        if(req.user.role !== "owner"){
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const bookings = await Booking.find({owner: req.user._id}).populate("car").populate("user").sort({createdAt: -1});
        res.json({ success: true, bookings });
    } catch (error) {
        console.error("Error in getOwnerBookings:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

//API to change booking status by owner
export const changeBookingStatus = async (req, res) => {
    try {
        const {bookingId, status} = req.body;
        const booking = await Booking.findById(bookingId);

        if(booking.owner.toString() !== req.user._id.toString()){
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        booking.status = status;
        await booking.save();
        res.json({ success: true, message: "Booking status updated successfully" });
    } catch (error) {
        console.error("Error in changeBookingStatus:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};