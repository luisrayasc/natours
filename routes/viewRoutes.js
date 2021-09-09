const express = require('express');

// View controllers
const {
    getOverview,
    getTour,
    getLoginForm,
    getMe,
    getMyTours,
    alerts,
} = require('../controllers/viewController');
// Booking controllers
// const { createBookingCheckout } = require('../controllers/bookingController');
// Auth controllers
const { isLoggedIn, protect } = require('../controllers/authController');

const router = express.Router();

// Alerts middleware
router.use(alerts);

// Home overviewBox
router.get('/', /*createBookingCheckout*/ isLoggedIn, getOverview);
// Tour details
router.get('/tour/:slug', isLoggedIn, getTour);
// Login
router.get('/login', isLoggedIn, getLoginForm);
// My tours
router.get('/mytours', protect, getMyTours);
// Account pages
router.get('/me', protect, getMe);
module.exports = router;
