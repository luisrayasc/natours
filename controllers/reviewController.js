// 1) Importamos el modelo
const Review = require('../models/reviewModel'); // Modelo Review

// 2) Importamos utils (AppError, catchAsync y handlerFactory)
// const AppError = require('../utils/appError'); // Generar errores
// const catchAsync = require('../utils/catchAsync'); // Handle try-catch en async functions
const factory = require('./handlerFactory'); // Controllers genéricos

// 3) Definimos las funciones
// Antes de crear un nuevo review obtenemos id de tour y id de usuario
exports.setTourAndUser = (req, res, next) => {
    // Obtener id de tour
    if (!req.body.tour) req.body.tour = req.params.tourId;
    // Obtener id usuario
    if (!req.body.user) req.body.user = req.user._id;
    next();
};

// FN para nuevo review
exports.newReview = factory.createOne(Review);
// Obtener un review
exports.getReview = factory.getOne(Review);
// Obtener varios reviews
exports.getReviews = factory.getMany(Review);
// Permiso para borrar reviews propios
exports.valDeleteReview = factory.valDelete(Review);
// Borrar review
exports.deleteReview = factory.deleteOne(Review);
// Actualizar review
exports.updateReview = factory.updateOne(Review);
