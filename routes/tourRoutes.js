// tourRoutes contiene las rutas para cada dirección y método de 'tour'

// necesitamos express para crear el objeto router
const express = require('express');

// Importamos los controladores que serán la función callback de cada ruta
const {
    getTours,
    createTour,
    getTour,
    updateTour,
    deleteTour,
    topTours,
    getTourStats,
    getMonthlyPlan,
    getToursWithin,
    getDistances,
    uploadTourImages,
    resizeTourImages,
} = require('../controllers/tourController');

// auth controllers
const { protect, restrictTo } = require('../controllers/authController');

// reviewRouter -> mergeParams mounting a router
const reviewRouter = require('./reviewRoutes');

// Route handlers
const router = express.Router();

// Cuando encontremos una url /tourId/reviews usar review router
router.use('/:tourId/reviews', reviewRouter);

// Param middleware (se activan si el request lleva el param indicad)

router.route('/top5').get(topTours, getTours);
router.route('/stats').get(getTourStats);
router
    .route('/get-monthly-plan/:year')
    .get(protect, restrictTo('admin', 'lead-guide'), getMonthlyPlan);

// Buscar tours en un radio
// tours-within/300/center/40,45/unit/km
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(getToursWithin);

// Calcular distancias
// distances/45,-40/unit/km
router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
    .route('/')
    .get(getTours) // se pueden agregar varios middlewares a una ruta
    .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
    .route('/:id')
    .get(getTour)
    .patch(
        protect,
        restrictTo('admin', 'lead-guide'),
        uploadTourImages,
        resizeTourImages,
        updateTour
    )
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

/* Simple Nested Routes (better to use mergeParams)
Importamos reviewController para manejar nested routes -> GET tour/:tourId/reviews/reviewId
const { newReview } = require('../controllers/reviewController');
GET tour/:tourId/reviews/reviewId
router.route('/:tourId/reviews').post(protect, restrictTo('user'), newReview); */

// exportarmos el router
module.exports = router;
