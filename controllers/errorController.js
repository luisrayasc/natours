const AppError = require('../utils/appError');
// Token invalido
const handleJWTError = () => new AppError('Invalid token, please log in', 401);
// Token expirado
const handleTokenExpired = () => new AppError('Your token has expired', 401);
// Error en base de datos
const handleCastErrorDB = (error) => {
    const message = `Invalid ${error.path}: ${error.value}`;
    return new AppError(message, 400);
};
// Valores duplicados
const handleDuplicateFieldsDB = (error) => {
    const message = `Duplicate field value '${
        error.keyValue.name
    }' in field '${Object.keys(error.keyValue)}'. `;
    return new AppError(message, 400);
};
// Error de validación
const handleValidationErrorDB = (error) => {
    const message = `${error.message}`;
    return new AppError(message, 400);
};

const sendErrorDev = (error, req, res) => {
    console.log(error);
    // API
    if (req.originalUrl.startsWith('/api')) {
        res.status(error.statusCode).json({
            status: error.status,
            error: error,
            message: error.message,
            stack: error.stack,
        });
        // Rendered website
    } else {
        console.log(error);
        res.status(error.statusCode).render('error', {
            title: 'Something went wrong',
            message: error.message,
        });
    }
};

const sendErrorProd = (error, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        // Operational trust to client in prod
        if (error.isOperational) {
            return res.status(error.statusCode).json({
                status: error.status,
                message: error.message,
            });
        } // Unexpected programming or unkown error
        else {
            // Log error
            console.log(error);
            console.error('Unexpected error!!!');
            // Send generic message
            return res.status(500).json({
                status: 'error',
                message: 'So sad!',
            });
        }
    }

    // Rendered website
    // Operational trust to client in prod
    if (error.isOperational) {
        res.status(error.statusCode).render('error', {
            title: 'Error',
            message: error.message,
        });
        // Unexpected programming or unkown error
    } else {
        es.status(500).render('error', {
            status: 'error',
            message: 'So sad!',
        });
    }
};
// Global error handler
// Al especificar 4 parámetros indicamos a express que esta funcion es un error handler
module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';
    // Dev/Prod routing
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, req, res);
        // Production error handling
    } else if (process.env.NODE_ENV === 'production') {
        console.log('We are in prod!');
        let errorProd;

        if (error.name === 'JsonWebTokenError') {
            errorProd = handleJWTError();
        } else if (error.name === 'TokenExpiredError') {
            errorProd = handleTokenExpired();
        } else if (error.name === 'CastError') {
            errorProd = handleCastErrorDB(error);
        } else if (error.code === 11000) {
            errorProd = handleDuplicateFieldsDB(error);
        } else if (error.name === 'ValidationError') {
            errorProd = handleValidationErrorDB(error);
        } else {
            errorProd = error;
        }

        sendErrorProd(errorProd, req, res);
    }
};
