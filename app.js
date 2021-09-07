///////////// NATOURS //////////////////////////////////////////////////////////////////
// Lo usaré como template
// app.js contiene la configuración de nuestra app para middleware y rutas

// Iniciamos cargando las librerias necesarias
const path = require('path'); // Provides utilities for working with file and directory paths
const express = require('express'); // Framework para aplicaciones
const morgan = require('morgan'); // Logger middleware
const rateLimit = require('express-rate-limit'); // Limit requests, prevents DOS attacks
const helmet = require('helmet'); // Send secure http headers
const mongoSanitize = require('express-mongo-sanitize'); // Prevents NO SQL query injection
const xss = require('xss-clean'); // Protection agains XSS attacks
const hpp = require('hpp'); // Prevent parameter pollution
const cookieParser = require('cookie-parser'); // Cookie logger
const compression = require('compression'); //compress response bodies for all request
const cors = require('cors'); // Cross-Origin Resource Sharing

// Error handler
const AppError = require('./utils/appError'); // Módulo que modifica la variable global 'error'
const globalErrorHandler = require('./controllers/errorController'); // Controlador de 'error'

// Módulos de rutas
const tourRouter = require('./routes/tourRoutes'); // Rutas para 'tours'
const userRouter = require('./routes/userRoutes'); // Rutas para 'usuarios'
const reviewRouter = require('./routes/reviewRoutes'); // Rutas para 'reviews'
const viewRouter = require('./routes/viewRoutes'); // // Rutas para 'views'
const bookingRouter = require('./routes/bookingRoutes');

// creamos nuestro objeto app
const app = express();

// Trust proxies (cuando está en deployment heroku hace proxy para cada request)
// https://expressjs.com/en/guide/behind-proxies.html
app.enable('trust proxy');

// Indicar el templating engine que usaremos
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // indicar donde estan los views (pug templates)

// Specific route (for complex requests like delete, patch)
// app.options('api/tours/:id', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

///////////////////////////
// Global Middleware -> todas las funciones que corren entre el req<=>res
// Set secure HTTP headers
app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            'script-src': [
                "'self'",
                'https://js.stripe.com/v3/',
                'https://api.mapbox.com/',
                'blob:',
            ],
            'frame-src': ['https://js.stripe.com/'],
            'connect-src': [
                "'self'",
                'https://api.mapbox.com/',
                'https://events.mapbox.com',
            ],
        },
    })
);

// Implement CORS
app.use(cors());

// Use CORS on complex requests like delete and patch, so our API is available to everyone
app.options('*', cors());

// Usar morgan logger cuando estamos en dev
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // NODE_ENV viene de config.env
}

// Limita la cantidad de requests que pueden venir de una IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api/', limiter);

// Body parser, reading data from the body into req.body
app.use(
    express.json({
        limit: '10kb',
    })
);

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution (like )
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'average',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);

// Custom Middleware -> mediante el método use y se pasan tres parámetros request, response y next (function)
// El middleware se ejecuta en cada req-res cycle y debe estar antes de el route handler para que se ejecute, de lo contrario el ciclo req-res ya habría terminado
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});

// Compression middleware
app.use(compression()); // Improve performance of our app by compresing text requests

// Route handlers
app.use('/', viewRouter);
app.use('/api/users', userRouter);
app.use('/api/tours', tourRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/bookings', bookingRouter);

// Route handlers for undefined paths ( los middleware se ejecutan en orden! )
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find path ${req.originalUrl}`, 404));
});
// Middleware para manejar errores
app.use(globalErrorHandler);

// Exportamos la app para que la consuma server.js
module.exports = app;
