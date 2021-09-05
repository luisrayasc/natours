const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) get all the tour
    const tours = await Tour.find();

    res.status(200).render('overview', {
        title: 'All tours',
        tours: tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour) return next(new AppError('No tour found', 404));

    res.status(200)
        .set(
            'Content-Security-Policy',
            'connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com http://127.0.0.1:3000'
        )
        .render('tour', {
            title: tour.name,
            tour: tour,
        });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            'connect-src https://cdnjs.cloudflare.com http://127.0.0.1:3000 ws://127.0.0.1:60525'
        )
        .render('login', {
            title: 'Login to natours',
        });
});

exports.getMe = (req, res, next) => {
    res.status(200).render('account', { title: 'Me page', user: req.user });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    const myBookings = await Booking.find({ user: req.user._id });
    // hace un array con los ids de cada tour
    const tourIds = myBookings.map((ele) => ele.tour._id);

    // obtener los tours vinculados a cada id
    const tours = await Tour.find({ _id: { $in: tourIds } });

    // Render tours
    res.status(200).render('overview', {
        title: 'My tours',
        tours: tours,
    });
});
