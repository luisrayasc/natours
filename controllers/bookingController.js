const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // procesamiento de pagos
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');

exports.createBooking = factory.createOne(Booking);

exports.getBooking = factory.getOne(Booking);

exports.getAllBookings = factory.getMany(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // Obtener el tour (o producto que queramos vender)
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) return next(new AppError('No tour found with that ID'));

    // Create checkout session
    // Creamos la sesión para solicitar stripe checkout
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // prettier-ignore
        // success_url:
        //     `${req.protocol}://${req.get('host')}/?tour=${tour._id}&user=${req.user._id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/mytours?alert=booking`, // mandamos un query param de altert tipo booking
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: `${tour.summary}`,
                images: [
                    `${req.protocol}://${req.get('host')}/img/tours/${
                        tour.imageCover
                    }`,
                ],
                amount: tour.price * 100, // se recibe en centavos
                currency: 'usd',
                quantity: 1,
            },
        ],
    });
    // Enviamos la respuesta que será consumida por nuestro frontend
    res.status(200).json({ status: 'success', session });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     // Temp
//     const { tour, user, price } = req.query;
//     if (!tour || !user || !price) return next();

//     const booking = await Booking.create({ tour, user, price });

//     console.log(booking);

//     res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_details.email }))
        ._id;
    const price = session.amount_total / 100;
    console.log(tour, user, price);
    await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        ); // as a stream 'express.raw' in app
    } catch (err) {
        return res.status(400).send(`webhook error, ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        createBookingCheckout(event.data.object);
    }

    res.status(200).json({ received: true });
};
