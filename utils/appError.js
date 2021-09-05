// Con esta función extendemos el objeto error para poder manejarlo con errorController
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Llamamos al constructor de la clase padre
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // errores que nostros construimos

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
