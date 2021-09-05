// Importamos librerias
const express = require('express');

// Importamos controladores auth
const { protect, restrictTo } = require('../controllers/authController');
// improtamos contoladores booking
const {
    getCheckoutSession,
    getAllBookings,
    createBooking,
    getBooking,
    updateBooking,
    deleteBooking,
} = require('../controllers/bookingController');

// Hacemos el router
const router = express.Router();

// Solo para usuarios loggeados
router.use(protect);

// Definimos las rutas
router.get('/checkout-session/:tourId', getCheckoutSession);

// Solo para admins
router.use(restrictTo('admin'));

// All bookings and create booking
router.route('/').get(getAllBookings).post(createBooking);
// Get one, update and delete booking
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

// Exporamos el router
module.exports = router;
