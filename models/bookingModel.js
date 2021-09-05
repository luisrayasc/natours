// Modelo para bookings
const mongoose = require('mongoose'); // ODM for mongo DB

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Booking must belong to a tour'],
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a user'],
    },

    price: {
        type: Number,
        required: [true, 'Booking must have a price'],
    },

    createdAt: {
        type: Date,
        default: Date.now(),
    },

    paid: {
        type: Boolean,
        default: true,
    },
});

// Query middleware para poblar (populate) user y tour (campos con referencia a un documento de otro modelo)
bookingSchema.pre(/^find/, function (next) {
    this.lean();
    this.populate('user');
    this.populate({ path: 'tour', select: 'name -guides' });
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
