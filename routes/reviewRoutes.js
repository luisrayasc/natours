// 1) necesitamos express para crear el objeto router
const express = require('express');

// 2) Importamos controladores
const { protect, restrictTo } = require('../controllers/authController');
const {
    newReview,
    getReview,
    getReviews,
    deleteReview,
    updateReview,
    setTourAndUser,
    valDeleteReview,
} = require('../controllers/reviewController');

// 3) Creamos el router
// mergeParams-> Preserve the req.params values from the parent router, por ejemplo en este caso viene de tourRoutes '/tour/:tourId/reviews)
const router = express.Router({ mergeParams: true });

// 4) Definimos las rutas y asignamos controladores

router.use(protect);

// prettier-ignore
router.route('/')
    .post(restrictTo('user'), setTourAndUser, newReview)
    .get(getReviews);
// prettier-ignore
router.route('/:id')
    .get(getReview)
    .patch(restrictTo('user', 'admin'), updateReview)
    .delete(restrictTo('user', 'admin'),valDeleteReview,  deleteReview);

// 5) Exportamos el router
module.exports = router;
