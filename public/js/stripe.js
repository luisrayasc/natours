// Client side checkout with stripe
import axios from 'axios';
import { showAlert } from './alerts.js';
const stripe = Stripe(
    'pk_test_51JQZrgGPrqrzLhkZoslM4xWsdRfPFruqtHRpjUgoLytGhlb3R7LPi8R9Dsyuo7ExZRqkx62dEebgYwYS6zfPlrVp00qdxn1S1y'
);

export const bookTour = async (tourId) => {
    try {
        // Get checkoutSession from api endpoint
        const checkoutSession = await axios(
            `/api/bookings/checkout-session/${tourId}`
        );
        console.log(checkoutSession);
        // Pasamos el session id para redireccionar a la página de stripe
        await stripe.redirectToCheckout({
            sessionId: checkoutSession.data.session.id,
        });
    } catch (error) {
        console.log(error);
        showAlert('error', 'Oh no! Something went wrong');
    }
};
